import { NextRequest, NextResponse } from 'next/server'
import { isOriginAllowed } from '@/lib/api/origin'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { getCachedResponse, setCachedResponse } from '@/lib/api/cache'
import { ApiClient } from '@/lib/api/client'
import { OriginNotAllowedError, BackendError, NetworkError } from '@/lib/api/errors'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:3000/api'
const apiClient = new ApiClient(BACKEND_URL)

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const apiPath = `/${path.join('/')}`

  const originCheck = isOriginAllowed(request)
  if (!originCheck.allowed) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403 }
    )
  }

  try {
    await checkRateLimit(request)
  } catch (error) {
    if (error instanceof Error && 'retryAfter' in error) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String((error as { retryAfter: number }).retryAfter),
          },
        }
      )
    }
    throw error
  }

  const cachedResponse = await getCachedResponse(request)
  if (cachedResponse) {
    const response = NextResponse.json(await cachedResponse.json())
    if (originCheck.origin) {
      response.headers.set('Access-Control-Allow-Origin', originCheck.origin)
    }
    response.headers.set('X-Cache', 'HIT')
    return response
  }

  const headers: Record<string, string> = {}
  const locale = request.headers.get('x-locale')
  if (locale) {
    headers['x-locale'] = locale
  }

  try {
    
    const params: Record<string, string> = {}
    request.nextUrl.searchParams.forEach((value, key) => {
      params[key] = value
    })

    const data = await apiClient.get(apiPath, {
      params,
      headers,
    })

    const response = NextResponse.json(data)
    response.headers.set('X-Cache', 'MISS')

    if (originCheck.origin) {
      response.headers.set('Access-Control-Allow-Origin', originCheck.origin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, x-locale'
      )
    }

    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')

    await setCachedResponse(request, response.clone())

    return response
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    if (error instanceof NetworkError) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  const originCheck = isOriginAllowed(request)

  if (!originCheck.allowed) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403 }
    )
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': originCheck.origin || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-locale',
      'Access-Control-Max-Age': '86400',
    },
  })
}

