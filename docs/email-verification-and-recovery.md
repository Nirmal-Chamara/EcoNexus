# Email verification and password recovery

Implementation status: code and automated tests complete for this slice; live
database, inbox receipt and deployed link acceptance remain open.

## Configuration and migration

The owner confirmed Resend with a verified domain. The ignored local backend
environment contains a Resend key and sender; this check did not validate the
credentials or send mail. A generated `EMAIL_OUTBOX_KEY` was added there without
printing it. No production settings were changed. The hosted HTTPS app URL is
still required; it has not been invented from the sender domain.

Apply `006_email_verification_delivery.sql` through the migration runner after
the existing-schema adoption checks in `database/migration-baseline.md`. It was
not applied during implementation. It adds nullable email proof, hashed
verification tokens and a durable encrypted outbox. It invalidates outstanding
legacy reset tokens because earlier development paths exposed them. Existing
accounts are not silently marked verified: their next operational access needs
email proof. Plan this transition before deploying to existing users/admins.

Set `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_OUTBOX_KEY` and `APP_LINK_BASE_URL` on
the backend. The encryption key must be 64 hexadecimal characters, generated
once, backed up securely, and shared across API processes. Changing it makes
existing queued payloads unreadable; drain or deliberately cancel/reissue those
jobs before rotation. Never copy the key into Expo public settings.

Release requires an owned HTTPS link base. Set the matching public
`EXPO_PUBLIC_APP_LINK_BASE_URL` in the mobile build. Development may use
`econexus://`. Native domain association, HTTPS hosting and browser fallback
must still be implemented/verified on the deployment. Inbox code entry remains
available if a link cannot open the installed app.

## Account workflow

- Local registration commits the user, hashed challenge, encrypted delivery job
  and restricted session together. Queue failure rolls back registration.
- Authenticated POST `/api/auth/email-verification/request` resends with a
  server-enforced 60-second cooldown. POST `/api/auth/email-verification/confirm`
  accepts a 64-character token bound to the signed-in account and current email.
  Challenges expire after 15 minutes; successful confirmation consumes them.
- The app gates unverified accounts, prefills trusted link tokens without
  consuming them automatically, and refreshes server profile state after proof.
  Server HTTP and socket eligibility also require proof; navigation is not the
  enforcement boundary. Admin actions and partner approval check email proof.
- New Google accounts use authoritative Gmail/verified hosted-domain ownership
  proof; other addresses require the email challenge. Existing accounts are not
  backfilled merely because a Google identity is linked. Roles and partner
  approval remain separate requirements.
- Forgot-password returns the same generic 202 for known/unknown addresses and
  per-account enqueue errors. Globally missing provider configuration returns
  an unavailable response uniformly. No raw token is returned or logged.
  Recovery only applies to accounts with an existing local password; it cannot
  add an initial password to a Google-only account.
- Reset replaces the password, proves email ownership, consumes outstanding
  challenges, cancels queued messages and revokes existing sessions atomically.
  It does not restore suspended/rejected accounts or change their role.
- Trusted cold/warm reset links open recovery before first-launch onboarding,
  including while signed in. Verification links received before login remain
  transient until the account gate mounts. Tokens are not stored in preferences.

## Delivery worker and failure handling

The API starts the worker after its HTTP listener. Job claims use PostgreSQL
`FOR UPDATE SKIP LOCKED`, two-minute leases, a maximum of five attempts and
bounded exponential backoff. Jobs expire with their challenge. Retries recheck
current challenge validity and destination before sending. A provider request
already in flight can still deliver an invalidated old message; its token fails.

AES-256-GCM payloads contain the destination, token, link and frozen sender/body.
Only hashes identify challenges outside that envelope. Completion, expiry,
cancellation and terminal failure erase the encrypted payload. Diagnostic errors
use sanitized codes rather than provider bodies or credentials.

Resend retries reuse a stable job idempotency key and frozen content. There is no
automatic SMTP fallback. Explicit SMTP configuration uses TLS and a stable
Message-ID, but SMTP cannot guarantee exactly-once delivery after an ambiguous
receipt. Successful sends store provider message IDs. `SENT` means provider
acceptance; it does not mean recipient-server delivery or inbox placement.

The worker stops claiming work during graceful shutdown and awaits its current
batch. Database failure leaves work recoverable through leases. Terminal rows
and expired hashed challenges still need a scheduled retention/cleanup policy.

## Acceptance still required

1. Run migration/upgrade, queue crash/restart and concurrent issuance/confirmation
   tests against isolated PostgreSQL. Current automated service tests mock it.
2. Validate real Resend acceptance and recipient-confirmed inbox receipt using an
   explicitly authorized test recipient. No live email was sent during this work.
3. Implement signed delivery/bounce webhook ingestion and operational alerts;
   provider acceptance alone must not be reported as delivered.
4. Deploy owned HTTPS links, browser fallback and native associations; verify
   cold/warm/first-launch flows on actual supported builds.
5. Verify password reuse rejection, old-session denial and new-password login
   end to end, including existing-account/admin verification transition.

Provider references: [Resend send API](https://resend.com/docs/api-reference/emails/send-email),
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys),
and [Nodemailer SMTP](https://nodemailer.com/smtp).
