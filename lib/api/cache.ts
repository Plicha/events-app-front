import { NextRequest } from 'next/server'
import { get, set } from '../redis/client'
import crypto from 'crypto'

const DEFAULT_TTL = 300

function generateCacheKey(
  url: string,
  headers: Record<string, string | null>
): string {
  const relevantHeaders = {
    'x-locale': headers['x-locale'],
  }

  const keyData = `${url}:${JSON.stringify(relevantHeaders)}`
  return `cache:${crypto.createHash('sha256').update(keyData).digest('hex')}`
}

export async function getCachedResponse(
  request: NextRequest
): Promise<Response | null> {
  const url = request.nextUrl.toString()
  const headers: Record<string, string | null> = {
    'x-locale': request.headers.get('x-locale'),
  }

  const cacheKey = generateCacheKey(url, headers)
  const cached = await get(cacheKey)

  if (!cached) {
    return null
  }

  try {
    const { body, headers: cachedHeaders, status } = JSON.parse(cached)
    return new Response(JSON.stringify(body), {
      status,
      headers: cachedHeaders,
    })
  } catch {
    return null
  }
}

export async function setCachedResponse(
  request: NextRequest,
  response: Response,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  if (request.method !== 'GET') {
    return
  }

  const url = request.nextUrl.toString()
  const headers: Record<string, string | null> = {
    'x-locale': request.headers.get('x-locale'),
  }

  const cacheKey = generateCacheKey(url, headers)

  try {
    const body = await response.clone().json()
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    const cacheData = JSON.stringify({
      body,
      headers: responseHeaders,
      status: response.status,
    })

    await set(cacheKey, cacheData, ttl)
  } catch {
    return
  }
}

