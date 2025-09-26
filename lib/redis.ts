import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create Redis clients only if environment variables are configured
export const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

export const lockerRedisClient = process.env.UPSTASH_REDIS_REST_LOCKER_URL && process.env.UPSTASH_REDIS_REST_LOCKER_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_LOCKER_URL,
      token: process.env.UPSTASH_REDIS_REST_LOCKER_TOKEN,
    })
  : null;

// Create a new ratelimiter, that allows 10 requests per 10 seconds by default
export const ratelimit = (
  requests: number = 10,
  seconds:
    | `${number} ms`
    | `${number} s`
    | `${number} m`
    | `${number} h`
    | `${number} d` = "10 s",
) => {
  // Return null if Redis is not configured (for self-hosted without Redis)
  if (!redis) {
    return null;
  }

  return new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(requests, seconds),
    analytics: true,
    prefix: "papermark",
  });
};
