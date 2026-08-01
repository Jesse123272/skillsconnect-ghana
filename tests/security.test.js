const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeText, RateLimiter, LoginLockoutManager } = require('../lib/security');

test('sanitizeText trims and escapes unsafe input', () => {
  const result = sanitizeText('  <script>alert(1)</script>  ');
  assert.equal(result, '&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('RateLimiter blocks requests after the configured threshold', () => {
  const limiter = new RateLimiter(2, 1000);
  assert.equal(limiter.allow('user-1'), true);
  assert.equal(limiter.allow('user-1'), true);
  assert.equal(limiter.allow('user-1'), false);
});

test('LoginLockoutManager blocks after repeated failures and resets on success', () => {
  const lockout = new LoginLockoutManager(3, 1000, 2000);
  const key = '192.168.0.1';

  assert.equal(lockout.isBlocked(key), false);
  lockout.recordFailure(key);
  assert.equal(lockout.isBlocked(key), false);
  lockout.recordFailure(key);
  assert.equal(lockout.isBlocked(key), false);
  lockout.recordFailure(key);
  assert.equal(lockout.isBlocked(key), true);

  const remaining = lockout.getBlockTimeRemaining(key);
  assert.ok(remaining > 0);

  lockout.recordSuccess(key);
  assert.equal(lockout.isBlocked(key), false);
});
