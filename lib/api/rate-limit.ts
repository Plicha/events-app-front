import { NextRequest } from 'next/server'
import { get, incr, expire } from '../redis/client'
import { RateLimitError } from './errors'

const RATE_LIMIT = 100
const RATE_LIMIT_WINDOW = 60

export async function checkRateLimit(
  request: NextRequest
): Promise<{ allowed: boolean; info: { limit: number; remaining: number; reset: number } }> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const now = Math.floor(Date.now() / 1000)
  const windowStart = Math.floor(now / RATE_LIMIT_WINDOW) * RATE_LIMIT_WINDOW
  const key = `rate_limit:${ip}:${windowStart}`

  const count = await incr(key)
  await expire(key, RATE_LIMIT_WINDOW)

  const remaining = Math.max(0, RATE_LIMIT - count)
  const reset = windowStart + RATE_LIMIT_WINDOW

  if (count > RATE_LIMIT) {
    throw new RateLimitError(reset - now)
  }

  return {
    allowed: true,
    info: {
      limit: RATE_LIMIT,
      remaining,
      reset,
    },
  }
}

