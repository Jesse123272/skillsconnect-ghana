import assert from 'assert';
import { resolveLocale, DEFAULT_LOCALE } from '../lib/locale.js';
import {
  providerStatus,
  getProviderStatus,
  supportedLocales,
  paymentGateway,
} from '../lib/provider-config.js';

assert.strictEqual(DEFAULT_LOCALE, 'en');
assert.strictEqual(resolveLocale('fr'), 'en');
assert.strictEqual(resolveLocale('en'), 'en');
assert.strictEqual(resolveLocale('tw'), 'tw');
assert.ok(Array.isArray(supportedLocales));
assert.ok(providerStatus.paymentGateway === 'paystack');
assert.strictEqual(getProviderStatus('whatsapp').status, 'pending-provider-setup');
assert.strictEqual(paymentGateway, 'paystack');

console.log('Defense readiness checks passed.');
