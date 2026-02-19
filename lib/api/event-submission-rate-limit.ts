import { get, incr } from '../redis/client'

const LIMIT_PER_DAY = 3
const TTL_SECONDS = 86400 // 24 hours

function getDateKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function sanitizeKeyPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9@._-]/g, '_').slice(0, 200)
}

function getIpKey(ip: string): string {
  const date = getDateKey()
  const safeIp = sanitizeKeyPart(ip)
  return `event_submission:ip:${safeIp}:${date}`
}

function getEmailKey(email: string): string {
  const date = getDateKey()
  const normalized = email.trim().toLowerCase()
  const safeEmail = sanitizeKeyPart(normalized)
  return `event_submission:email:${safeEmail}:${date}`
}

export async function checkEventSubmissionRateLimit(
  ip: string,
  email: string
): Promise<{ allowed: boolean; reason?: string }> {
  const ipKey = getIpKey(ip)
  const emailKey = getEmailKey(email)

  const [ipCountStr, emailCountStr] = await Promise.all([get(ipKey), get(emailKey)])

  const ipCount = parseInt(ipCountStr || '0', 10)
  const emailCount = parseInt(emailCountStr || '0', 10)

  if (ipCount >= LIMIT_PER_DAY) {
    return { allowed: false, reason: 'rate_limit_ip' }
  }
  if (emailCount >= LIMIT_PER_DAY) {
    return { allowed: false, reason: 'rate_limit_email' }
  }

  return { allowed: true }
}

export async function incrementEventSubmissionCounters(ip: string, email: string): Promise<void> {
  const ipKey = getIpKey(ip)
  const emailKey = getEmailKey(email)

  await Promise.all([incr(ipKey, TTL_SECONDS), incr(emailKey, TTL_SECONDS)])
}
