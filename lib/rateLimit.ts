/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for single-instance deployments. For multi-instance / serverless
 * at scale, replace the Map with a Redis-backed store.
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

/** Returns true if the request should be blocked. */
export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

/** Call after a successful login to clear the counter for that IP. */
export function resetRateLimit(ip: string): void {
  store.delete(ip);
}
