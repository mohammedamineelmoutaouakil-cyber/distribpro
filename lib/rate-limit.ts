/**
 * Lightweight in-memory rate limiter for sensitive server actions.
 * Suitable for a single Node process / MVP. For multi-region serverless
 * deployments, swap the store for Upstash Redis or a Postgres table.
 */
type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
const MAX_KEYS = 10_000;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  if (store.size > MAX_KEYS) {
    for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
    if (store.size > MAX_KEYS) store.clear();
  }

  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      success: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return {
    success: true,
    remaining: limit - current.count,
    retryAfterSeconds: 0,
  };
}

export function rateLimitKey(scope: string, identifier: string) {
  return `${scope}:${identifier}`;
}
