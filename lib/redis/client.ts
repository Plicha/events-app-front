import Redis from 'ioredis'

let redisClient: Redis | null = null
let memoryStore: Map<string, { value: any; expiresAt: number }> = new Map()

function createRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    return null
  }

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          return null
        }
        return Math.min(times * 50, 2000)
      },
    })

    client.on('error', (error) => {
      console.error('Redis connection error:', error)
    })

    return client
  } catch (error) {
    console.error('Failed to create Redis client:', error)
    return null
  }
}

export function getRedisClient(): Redis | null {
  if (redisClient === null) {
    redisClient = createRedisClient()
  }
  return redisClient
}

export async function get(key: string): Promise<string | null> {
  const client = getRedisClient()

  if (client) {
    try {
      return await client.get(key)
    } catch (error) {
      console.error('Redis get error:', error)
      return getFromMemory(key)
    }
  }

  return getFromMemory(key)
}

export async function set(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<void> {
  const client = getRedisClient()

  if (client) {
    try {
      if (ttlSeconds) {
        await client.setex(key, ttlSeconds, value)
      } else {
        await client.set(key, value)
      }
      return
    } catch (error) {
      console.error('Redis set error:', error)
    }
  }

  setInMemory(key, value, ttlSeconds)
}

export async function incr(key: string, ttlSeconds?: number): Promise<number> {
  const client = getRedisClient()

  if (client) {
    try {
      const result = await client.incr(key)
      // Set TTL if provided and key is new (count = 1)
      if (ttlSeconds && result === 1) {
        await client.expire(key, ttlSeconds)
      }
      return result
    } catch (error) {
      console.error('Redis incr error:', error)
      return incrInMemory(key, ttlSeconds)
    }
  }

  return incrInMemory(key, ttlSeconds)
}

export async function expire(key: string, seconds: number): Promise<void> {
  const client = getRedisClient()

  if (client) {
    try {
      await client.expire(key, seconds)
      return
    } catch (error) {
      console.error('Redis expire error:', error)
    }
  }

  const item = memoryStore.get(key)
  if (item) {
    item.expiresAt = Date.now() + seconds * 1000
  }
}

function getFromMemory(key: string): string | null {
  const item = memoryStore.get(key)

  if (!item) {
    return null
  }

  if (item.expiresAt && item.expiresAt < Date.now()) {
    memoryStore.delete(key)
    return null
  }

  return item.value
}

function setInMemory(key: string, value: string, ttlSeconds?: number): void {
  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0
  memoryStore.set(key, { value, expiresAt })
}

function incrInMemory(key: string, ttlSeconds?: number): number {
  const item = memoryStore.get(key)
  const currentValue = item ? parseInt(item.value, 10) || 0 : 0
  const newValue = currentValue + 1
  
  let expiresAt = item?.expiresAt || 0
  if (!item && ttlSeconds) {
    expiresAt = Date.now() + ttlSeconds * 1000
  }
  
  memoryStore.set(key, { value: String(newValue), expiresAt })
  return newValue
}

setInterval(() => {
  const now = Date.now()
  for (const [key, item] of memoryStore.entries()) {
    if (item.expiresAt && item.expiresAt < now) {
      memoryStore.delete(key)
    }
  }
}, 60000)

