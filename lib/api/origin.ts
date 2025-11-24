import { NextRequest } from 'next/server'

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://eventslist.pl',
  'https://www.eventslist.pl',
  ...(process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://localhost:3001']
    : []),
]

export function isOriginAllowed(request: NextRequest): {
  allowed: boolean
  origin: string | null
} {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return { allowed: true, origin }
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const refererOrigin = refererUrl.origin

      if (ALLOWED_ORIGINS.includes(refererOrigin)) {
        return { allowed: true, origin: refererOrigin }
      }

      const isSubdomain = ALLOWED_ORIGINS.some((allowed) => {
        try {
          const allowedUrl = new URL(allowed)
          return (
            refererUrl.hostname === allowedUrl.hostname ||
            refererUrl.hostname.endsWith('.' + allowedUrl.hostname)
          )
        } catch {
          return false
        }
      })

      if (isSubdomain) {
        return { allowed: true, origin: refererOrigin }
      }
    } catch {
      return { allowed: false, origin: null }
    }
  }

  if (process.env.NODE_ENV === 'development' && !origin) {
    return { allowed: true, origin: null }
  }

  return { allowed: false, origin }
}

