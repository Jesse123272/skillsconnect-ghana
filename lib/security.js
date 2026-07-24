function sanitizeText(value) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function sanitizeObject(value) {
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

class RateLimiter {
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

module.exports = { sanitizeText, sanitizeObject, RateLimiter };
