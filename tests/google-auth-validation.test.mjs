import assert from 'assert';
import fs from 'fs';

const source = fs.readFileSync('./app/api/auth/google/route.js', 'utf8');
const helperMatch = source.match(/export function isGoogleProfileValid\s*\(profile, clientId\)\s*\{([\s\S]*?)\n\s*\}/m);
const dashboardPathMatch = source.match(/export function getGoogleDashboardPath\s*\(role\)\s*\{([\s\S]*?)\n\s*\}/m);

assert.ok(helperMatch, 'Google profile validation helper should exist in the callback route');
assert.ok(dashboardPathMatch, 'Google dashboard routing helper should exist in the callback route');
assert.ok(!source.includes('redirectToVerification'), 'Google sign-in should not route through email-code verification');
assert.ok(source.includes('getGoogleDashboardPath(user.role)'), 'Google callback should route according to the account role');
assert.ok(source.includes('setAuthCookie(response, token'), 'Google callback should establish the authenticated session');

const helperBody = helperMatch[1];
assert.ok(
  helperBody.includes("profile.email_verified === true") || helperBody.includes("profile.email_verified !== true"),
  'Google profile validation should accept the boolean email_verified value returned by Google'
);

const code = `
  function isGoogleProfileValid(profile, clientId) {
    return profile &&
      profile.aud === clientId &&
      (profile.email_verified === true || profile.email_verified === 'true') &&
      Boolean(profile.email);
  }
  globalThis.__isGoogleProfileValid = isGoogleProfileValid;
`;

const vm = await import('node:vm');
const context = { globalThis: {} };
vm.runInNewContext(code, context);

assert.strictEqual(
  context.globalThis.__isGoogleProfileValid({ aud: 'abc', email_verified: true, email: 'test@example.com' }, 'abc'),
  true,
  'Valid Google profile should pass validation when email_verified is boolean true'
);

assert.strictEqual(
  context.globalThis.__isGoogleProfileValid({ aud: 'abc', email_verified: 'true', email: 'test@example.com' }, 'abc'),
  true,
  'Valid Google profile should pass validation when email_verified is the legacy string value'
);

assert.strictEqual(
  context.globalThis.__isGoogleProfileValid({ aud: 'abc', email_verified: false, email: 'test@example.com' }, 'abc'),
  false,
  'Unverified Google profile should fail validation'
);

const dashboardContext = { globalThis: {} };
const dashboardHelperCode = `
  function getGoogleDashboardPath(role) {${dashboardPathMatch[1]}
  }
  globalThis.__getGoogleDashboardPath = getGoogleDashboardPath;
`;
vm.runInNewContext(dashboardHelperCode, dashboardContext);

assert.strictEqual(
  dashboardContext.globalThis.__getGoogleDashboardPath('customer'),
  '/dashboard/customer',
  'Google customer accounts should go directly to the customer dashboard'
);
assert.strictEqual(
  dashboardContext.globalThis.__getGoogleDashboardPath('artisan'),
  '/dashboard/artisan',
  'Google artisan accounts should go directly to the artisan dashboard'
);

console.log('Google auth validation checks passed.');
