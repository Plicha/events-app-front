import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import {
  checkEventSubmissionRateLimit,
  incrementEventSubmissionCounters,
} from '@/lib/api/event-submission-rate-limit'

const PHOTO_MAX_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const EventSubmissionSchema = z.object({
  email: z.string().email().max(254),
  title: z.string().min(2).max(200),
  description: z.string().min(1).max(1500),
  categoryId: z.string().min(1),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }).optional(),
  venue: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  sourceLink: z
    .string()
    .max(500)
    .optional()
    .refine((v) => !v || v.startsWith('http'), { message: 'Invalid URL' }),
  priceType: z.enum(['free', 'paid']).optional(),
  priceAmount: z.string().optional(),
  contentRights: z.string().transform((v) => v === 'true'),
  termsAccepted: z.string().transform((v) => v === 'true'),
})

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function buildEmailHtml(data: z.infer<typeof EventSubmissionSchema>): string {
  const rows = [
    ['Email', data.email],
    ['Tytuł', data.title],
    ['Data od', data.startsAt],
    ['Data do', data.endsAt || '-'],
    ['Opis', data.description],
    ['Miejsce', data.venue || '-'],
    ['Miejscowość', data.city || '-'],
    ['Kategoria ID', data.categoryId],
    ['Link źródłowy', data.sourceLink || '-'],
    ['Cena', data.priceType === 'paid' ? `${data.priceAmount || '-'} PLN` : 'Bezpłatne'],
  ]
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 20px;">
  <h2>Nowe zgłoszenie wydarzenia</h2>
  <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
    ${rows
      .map(
        ([label, value]) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 150px;">${escapeHtml(label)}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(String(value))}</td>
    </tr>`
      )
      .join('')}
  </table>
</body>
</html>
  `.trim()
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const FORM_FIELDS = [
  { key: 'email', default: '' },
  { key: 'title', default: '' },
  { key: 'description', default: '' },
  { key: 'categoryId', default: '' },
  { key: 'startsAt', default: '' },
  { key: 'endsAt', default: undefined as string | undefined },
  { key: 'venue', default: undefined as string | undefined },
  { key: 'city', default: undefined as string | undefined },
  { key: 'sourceLink', default: undefined as string | undefined },
  { key: 'priceType', default: 'free' as const },
  { key: 'priceAmount', default: undefined as string | undefined },
  { key: 'contentRights', default: 'false' },
  { key: 'termsAccepted', default: 'false' },
] as const

function extractFormData(formData: FormData): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {}
  for (const { key, default: defaultValue } of FORM_FIELDS) {
    const raw = formData.get(key)
    const value = raw == null || String(raw).trim() === '' ? defaultValue : String(raw)
    result[key] = value
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const fax = formData.get('fax') as string | null
    if (fax && String(fax).trim().length > 0) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
    }

    const rawData = extractFormData(formData)

    const parseResult = EventSubmissionSchema.safeParse(rawData)
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]
      const errorMessage = firstIssue?.message || 'Validation failed'
      if (process.env.NODE_ENV === 'development') {
        console.error('[event-submission] Validation failed:', parseResult.error.issues, 'rawData:', rawData)
      }
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    if (!parseResult.data.contentRights || !parseResult.data.termsAccepted) {
      return NextResponse.json({ error: 'Required consents not given' }, { status: 400 })
    }

    const ip = getClientIP(request)

    const rateLimitResult = await checkEventSubmissionRateLimit(ip, parseResult.data.email)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    const photo = formData.get('photo') as File | null
    if (photo && photo.size > 0) {
      if (photo.size > PHOTO_MAX_SIZE_BYTES) {
        return NextResponse.json(
          { error: `Photo must be under ${PHOTO_MAX_SIZE_BYTES / 1024 / 1024} MB` },
          { status: 400 }
        )
      }
      if (!ALLOWED_IMAGE_TYPES.includes(photo.type)) {
        return NextResponse.json(
          { error: 'Invalid image type. Use JPEG, PNG or WebP.' },
          { status: 400 }
        )
      }
    }

    const resendApiKey = process.env.RESEND_API_KEY
    const toEmail = process.env.EVENT_SUBMISSION_EMAIL
    const fromEmail = process.env.EVENT_SUBMISSION_FROM || 'onboarding@resend.dev'

    if (!resendApiKey || !toEmail) {
      console.error('RESEND_API_KEY or EVENT_SUBMISSION_EMAIL not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    const resend = new Resend(resendApiKey)

    const attachments =
      photo && photo.size > 0
        ? [
            {
              filename: photo.name || 'photo.jpg',
              content: Buffer.from(await photo.arrayBuffer()),
            },
          ]
        : undefined

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `[Zgłoszenie] ${parseResult.data.title}`,
      html: buildEmailHtml(parseResult.data),
      attachments,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    await incrementEventSubmissionCounters(ip, parseResult.data.email)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Event submission error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
