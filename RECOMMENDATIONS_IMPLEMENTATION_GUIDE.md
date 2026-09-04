# SkillsConnect Ghana Recommendations Implementation Guide

This guide turns the professional recommendations into an execution checklist for this repository. Complete the phases in order. Do not enable a production feature until its release gate passes.

## Current baseline

Already implemented in the application:

- Automatic artisan approval by default, with reversible admin disapproval.
- Verified, Ghana Card, police-check, and trade-certification badge fields with admin controls.
- Guarantor/reference submission, ownership checks, and admin moderation.
- Available/Busy and accepts-emergency artisan controls.
- Public availability, emergency, and verification badges and filters.
- Completed enquiry status with completion metadata.
- Reviews restricted to a specific completed enquiry.
- Paystack payment initialization, server-side verification, signed webhook validation, and idempotent processing.
- Cost estimator, portfolio galleries, reviews, and basic WhatsApp deep links.

Production code and tests are in place, but provider-dependent features require account setup and business decisions described below.

## Phase 0: Project safety and environments

1. Create a feature branch for each phase.
2. Back up the Railway MySQL database before schema changes.
3. Keep `.env.local` and provider secrets out of Git.
4. Use separate sandbox/test credentials and databases for development.
5. Add a preview deployment for every feature branch.
6. Record migrations and rollback steps before changing production.
7. Run the project checks after every phase:

```powershell
npm test
npm run lint
npm run build
```

## Phase 1: Trust and artisan verification

Already added, but this is the operating procedure:

1. An artisan completes their profile and submits guarantor details.
2. The admin opens the artisan moderation page.
3. The admin verifies evidence outside the application using the issuing organization.
4. The admin toggles only the badges that have actually been checked.
5. The admin approves or rejects each guarantor.
6. Only approved guarantors and enabled badges appear publicly.
7. If evidence expires or is withdrawn, the admin disables the corresponding badge.
8. Keep an audit record of who checked the evidence and when. Add an expiry date field before relying on time-limited documents.

Recommended next schema additions for stronger compliance:

- `verification_documents(document_type, storage_key, status, reviewed_by, reviewed_at, expires_at)`.
- Private object storage such as S3, Cloudflare R2, or Cloudinary.
- Never expose Ghana Card numbers, document images, or police records in public API responses.

Release gate: test owner authorization, admin-only moderation, public redaction, expired-document handling, and audit logging.

## Phase 2: Availability and emergency services

Already added:

1. Artisans set `Available` or `Busy` from their profile editor.
2. Artisans opt into emergency requests separately.
3. Customers use the available and emergency filters.
4. Public cards show the current state.

To make emergency dispatch production-ready:

1. Add `emergency_response_minutes`, service hours, and emergency service categories.
2. Add an emergency enquiry type and priority field.
3. Require customer location or a district for emergency requests.
4. Rank artisans by emergency opt-in, availability, distance, and recent response time.
5. Send urgent notifications through email, SMS, or WhatsApp provider.
6. Add an acceptance timeout and fallback to the next artisan.
7. Log all dispatch attempts and customer consent for location sharing.
8. Test unavailable artisans, no-result areas, provider outages, duplicate requests, and late responses.

Release gate: an emergency request either reaches an eligible artisan or produces a clear no-service response; it must never silently disappear.

## Phase 3: Paystack marketplace and true escrow

The current app supports direct Paystack payments. It does not hold or release money as escrow. Do not use the word escrow until this phase is complete.

Account-owner setup:

1. Open a Paystack business account.
2. Complete business verification and KYC.
3. Submit required company, owner, bank, and operating documents.
4. Request or enable Subaccounts/Split Payments for the account.
5. Define the platform commission, artisan settlement timing, refunds, chargebacks, disputes, and tax responsibilities.
6. Create a verified Paystack subaccount for each artisan who will receive settlements.
7. Configure this webhook URL in Paystack:

```text
https://<production-domain>/api/payments/webhook
```

8. Use live keys only after sandbox tests pass.

Application work required:

1. Add `recipient_code` and settlement status to artisan profiles.
2. Add `job_contracts`, `milestones`, `payment_allocations`, `refunds`, and `disputes` tables.
3. Tie every payment to a server-validated enquiry and job contract.
4. Calculate amounts on the server; never trust client commission or recipient values.
5. Initialize payments with Paystack split/subaccount fields only after recipient verification.
6. Verify amount, currency, reference, customer, enquiry, and artisan before settlement.
7. Process `charge.success`, failed, refund, and dispute webhook events idempotently.
8. Add admin controls for pausing settlement and resolving disputes.
9. Add a settlement delay or milestone-release policy approved by legal/accounting.
10. Update terms, privacy policy, invoices, and receipts before launch.

Sandbox tests:

- Successful payment.
- Failed payment.
- Cancelled payment.
- Duplicate callback.
- Duplicate webhook.
- Amount mismatch.
- Currency mismatch.
- Unknown reference.
- Unauthorized verification attempt.
- Refund and dispute event.
- Artisan without a verified recipient account.

Release gate: Paystack confirms the marketplace capability, legal terms are approved, webhook retries are idempotent, and a complete payment/refund/dispute audit can be produced.

## Phase 4: Local languages

Start with Twi before adding Ga, Ewe, and Hausa.

1. Choose a locale strategy, preferably a locale preference stored in the user profile plus a browser fallback.
2. Create translation catalogs such as `lib/i18n/en.json` and `lib/i18n/tw.json`.
3. Add a shared translation helper/provider around the application shell.
4. Translate shared navigation, authentication, search, filters, dashboard actions, errors, and email templates.
5. Keep database values and API field names in English; translate only presentation text.
6. Add a language selector that persists locally for visitors and to the account for signed-in users.
7. Have native Ghanaian speakers review terminology and service names.
8. Test long and short translations on mobile and desktop.
9. Add automated checks that detect missing translation keys.
10. Repeat the process for Ga, Ewe, and Hausa only after Twi is accepted.

Release gate: no missing keys, no clipped buttons, correct validation messages, persistent selection, and human language review.

## Phase 5: Verified jobs and review incentives

Completed-job tracking and completed-enquiry review eligibility are already added. Build rewards only on top of this foundation.

1. Decide what proves a completed job: both-party confirmation, payment success, or admin resolution.
2. Add a `job_completions` or `rewards` table with unique enquiry and reward identifiers.
3. Allow only one reward claim per completed enquiry and customer.
4. Require a genuine review tied to that completed enquiry.
5. Choose a reward provider: airtime API, coupon system, or platform credit.
6. Store reward status as pending, issued, failed, reversed, or blocked.
7. Add daily limits, abuse detection, duplicate-device checks, and admin review.
8. Do not reward repeated edits or multiple accounts from the same customer.
9. Notify customers clearly that reviews must remain honest and independent.
10. Test provider timeout, retry, duplicate claim, fraud block, and reversal flows.

Release gate: every reward is traceable to one completed enquiry and can be reversed without deleting the review.

## Phase 6: WhatsApp Business integration

The current application has WhatsApp deep links only. A chatbot requires a business account and provider webhooks.

Account-owner setup:

1. Create or verify a Meta Business account.
2. Create a WhatsApp Business number and complete business verification.
3. Choose Meta Cloud API or a provider such as Twilio.
4. Create approved message templates and opt-in language.
5. Record the phone number ID, business account ID, access token, and verify token in the hosting secret manager.

Application work:

1. Add a provider adapter in `lib/whatsapp.js`; keep credentials out of components.
2. Add inbound and delivery-status webhook routes.
3. Verify webhook signatures and provider verification challenges.
4. Add consent records and an opt-out command.
5. Support only a small first flow: trade search, region search, result summary, and enquiry handoff.
6. Link the conversation to a logged-in account or verified phone number.
7. Add retries, idempotency keys, rate limits, and message audit records.
8. Keep the existing web flow as the fallback when the provider is unavailable.

Release gate: opt-in/opt-out works, inbound messages are authenticated, duplicate events are harmless, and the bot never exposes private artisan data.

## Phase 7: USSD

USSD requires a telecom or aggregator provider and a registered shortcode.

Account-owner setup:

1. Select a Ghana USSD provider or aggregator.
2. Apply for a shortcode and complete business/KYC requirements.
3. Obtain the provider callback URL, signing method, and test credentials.
4. Agree on session timeout, per-session cost, and support ownership.

Application work:

1. Add a provider adapter in `lib/ussd.js`.
2. Add a signed callback route such as `/api/ussd/callback`.
3. Store short-lived session state in Redis or another durable store; do not rely on serverless memory.
4. Implement only: search by trade, search by region, show a few results, request callback, and end session.
5. Use strict input validation and short prompts.
6. Add rate limits and a phone/PIN identity policy.
7. Make callback processing idempotent.
8. Log provider responses without storing unnecessary personal data.

Release gate: session timeout, invalid input, provider outage, duplicate callback, and personal-data handling all pass tests on the provider sandbox.

## Phase 8: Production launch checklist

Before announcing any feature:

1. Run `npm test`, `npm run lint`, and `npm run build`.
2. Run the database migration against a backup or staging database.
3. Test the deployed preview with sandbox credentials.
4. Verify all webhook signatures and replay protection.
5. Test mobile layout and slow network behavior.
6. Review legal terms, privacy, KYC, payments, and communications consent.
7. Set alerts for payment failures, webhook failures, email failures, and dispatch failures.
8. Create a rollback plan and document who owns incidents.
9. Deploy to production.
10. Run smoke tests for homepage, artisan search, profile, enquiry, payment, webhook, and admin moderation.
11. Monitor logs for at least one business day before expanding traffic.

## Required production values

Keep these in the hosting provider’s secret manager, never in Git:

```text
PAYSTACK_SECRET_KEY
PAYSTACK_PUBLIC_KEY
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
PAYSTACK webhook URL: https://<production-domain>/api/payments/webhook
WHATSAPP access token and phone-number ID
USSD provider credentials and callback signing secret
AIRTIME provider credentials
REDIS_URL for USSD/session state
```

The repository can provide the code, schema, tests, and deployment wiring. Only the account owner can submit identity/business documents, accept provider contracts, pay provider fees, and obtain approval for Paystack marketplace, WhatsApp, USSD, or airtime services.
