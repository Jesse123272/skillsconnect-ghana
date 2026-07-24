const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeText, RateLimiter } = require('../lib/security');

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
