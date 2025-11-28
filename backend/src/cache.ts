import { createClient, RedisClientType } from 'redis'
import config from './config'

let redisClient: RedisClientType | null = null
let inMemoryCache: Map<string, { value: any; expiresAt: number }> = new Map()

export async function initializeRedis() {
  try {
    redisClient = createClient({
      url: config.redisUrl,
      socket: {
        reconnectStrategy: false as any,
        connectTimeout: 2000,
      },
    })

    redisClient.on('error', (err) => {
      // Silently ignore connection errors
    })

    await redisClient.connect()
    return redisClient
  } catch (error) {
    // Silently fail - will use in-memory cache instead
    return null
  }
}

export function getRedisClient() {
  return redisClient
}

export async function getFromCache<T>(key: string): Promise<T | null> {
  // Try Redis first
  if (redisClient) {
    try {
      const data = await redisClient.get(key)
      if (data) {
        console.log(`[CACHE] Redis HIT for key: ${key}`)
        return JSON.parse(data) as T
      }
    } catch (error) {
      // Fall through to in-memory cache
    }
  }

  // Fall back to in-memory cache
  const cached = inMemoryCache.get(key)
  if (!cached) {
    console.log(`[CACHE] MISS for key: ${key}`)
    return null
  }
  
  if (cached.expiresAt < Date.now()) {
    console.log(`[CACHE] EXPIRED for key: ${key}`)
    inMemoryCache.delete(key)
    return null
  }
  
  console.log(`[CACHE] In-memory HIT for key: ${key}`)
  return cached.value as T
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 60
): Promise<void> {
  let cached = false

  // Try Redis first
  if (redisClient) {
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value))
      console.log(`[CACHE] Stored in Redis for key: ${key}`)
      cached = true
    } catch (error) {
      // Fall through to in-memory cache
    }
  }

  // Fall back to in-memory cache if Redis failed or not available
  if (!cached) {
    inMemoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
    console.log(`[CACHE] Stored in in-memory cache for key: ${key}`)
  }
}

export async function deleteCache(key: string): Promise<void> {
  // Try Redis first
  if (redisClient) {
    try {
      await redisClient.del(key)
      return
    } catch (error) {
      // Fall through to in-memory cache
    }
  }

  // Fall back to in-memory cache
  inMemoryCache.delete(key)
}

export function clearExpiredCache() {
  const now = Date.now()
  for (const [key, cached] of inMemoryCache.entries()) {
    if (cached.expiresAt < now) {
      inMemoryCache.delete(key)
    }
  }
}

export async function closeRedis() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit()
  }
  inMemoryCache.clear()
}
