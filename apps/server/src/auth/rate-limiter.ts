const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

interface WindowEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private readonly store = new Map<string, WindowEntry>();

  check(key: string): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }

    if (entry.count >= MAX_ATTEMPTS) {
      return false;
    }

    entry.count++;
    return true;
  }
}
