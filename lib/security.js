export function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function sanitizeObject(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeObject(item));
  }

  if (value && typeof value === 'object') {
    const sanitized = {};
    Object.entries(value).forEach(([key, nestedValue]) => {
      sanitized[key] = sanitizeObject(nestedValue);
    });
    return sanitized;
  }

  if (typeof value === 'string') {
    return sanitizeText(value);
  }

  return value;
}

export class RateLimiter {
  constructor(limit = 10, windowMs = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.buckets = new Map();
  }

  allow(key) {
    const now = Date.now();
    const bucket = this.buckets.get(key) || { count: 0, resetAt: now + this.windowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + this.windowMs;
    }

    if (bucket.count >= this.limit) {
      return false;
    }

    bucket.count += 1;
    this.buckets.set(key, bucket);
    return true;
  }
}

export class LoginLockoutManager {
  constructor(failureThreshold = 5, failureWindowMs = 15 * 60 * 1000, blockDurationMs = 30 * 60 * 1000) {
    this.failureThreshold = failureThreshold;
    this.failureWindowMs = failureWindowMs;
    this.blockDurationMs = blockDurationMs;
    this.failures = new Map();
    this.blockedUntil = new Map();
  }

  _cleanup(key) {
    const now = Date.now();
    const blockedTime = this.blockedUntil.get(key);
    if (blockedTime && now > blockedTime) {
      this.blockedUntil.delete(key);
    }

    const failureState = this.failures.get(key);
    if (failureState && now > failureState.resetAt) {
      this.failures.delete(key);
    }
  }

  isBlocked(key) {
    this._cleanup(key);
    return this.blockedUntil.has(key);
  }

  getBlockTimeRemaining(key) {
    this._cleanup(key);
    const blockedTime = this.blockedUntil.get(key);
    if (!blockedTime) return 0;
    return Math.max(0, blockedTime - Date.now());
  }

  recordFailure(key) {
    const now = Date.now();
    if (this.isBlocked(key)) return;

    const state = this.failures.get(key) || { count: 0, resetAt: now + this.failureWindowMs };
    if (now > state.resetAt) {
      state.count = 0;
      state.resetAt = now + this.failureWindowMs;
    }

    state.count += 1;
    if (state.count >= this.failureThreshold) {
      this.blockedUntil.set(key, now + this.blockDurationMs);
      this.failures.delete(key);
      return;
    }

    this.failures.set(key, state);
  }

  recordSuccess(key) {
    this.failures.delete(key);
    this.blockedUntil.delete(key);
  }
}
