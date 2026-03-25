import { Redis } from '@upstash/redis';
import { env } from '../config/env';

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await redis.get<string>(key);
    if (!raw) return null;

    // We store JSON values as strings.
    // If parsing fails, fall back to returning the raw value.
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as any as T;
    }
  },

  async set(key: string, value: any, ttl: number = 60 * 60 * 24): Promise<void> {
    const toStore = typeof value === 'string' ? value : JSON.stringify(value);
    await redis.set(key, toStore, { ex: ttl });
  }
};
