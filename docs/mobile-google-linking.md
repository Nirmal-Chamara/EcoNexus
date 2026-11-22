# Google identity linking and enrollment navigation

Implemented slice: signed-in account linking and enrollment-role continuity.
This is not a claim that Google console setup, native provider integration or
real device sign-in has passed. Follow `masterplan.md` for remaining gates.

## Identity rules

Google login now looks up only the verified Google subject (`sub`). It does not
attach Google to an account because the emails match. Existing linked accounts
keep their current server role/status regardless of the enrollment role selected
in the UI. If no subject exists but the email is registered, login returns
`409 GOOGLE_LINK_REQUIRED` without creating a session or changing the account.
Concurrent email/subject uniqueness collisions produce a controlled conflict.

New Google identities can still enroll under the existing public role policy;
partners remain pending. Google partner application completion and contact
verification remain unfinished. Existing historical links are preserved; their
ownership/provisioning history should be included in the pre-release account audit.

This policy follows Google's recommendation to identify Google accounts by
verified subject rather than a mutable email. Verification still uses the
official library and intended audience allowlist. See
[Google backend authentication](https://developers.google.com/identity/sign-in/web/backend-auth).

## Connect Google to an existing password account

1. Sign into the existing EcoNexus account using its password.
2. Open Profile -> Sign-in methods. The screen loads actual credential
   capabilities from the backend, rather than inferring them from local state.
3. Enter the current password, then choose the Google identity with the same
   email. The provider callback goes to the authenticated linking endpoint;
   it does not call login or replace the signed-in user with another account.
4. The server verifies the Google token/nonce, requires a token issued within
   five minutes (with at most 30 seconds of future clock skew), locks the current
   user and checks current status, password, email and identity ownership.
5. Binding, access-token version change, refresh-token revocation and the
   `GOOGLE_IDENTITY_LINKED` audit record commit together. Failure rolls back.
6. The app clears the current session and shows a sign-in message. Sign in again
   with the connected Google identity or the existing password.

Passwords and provider proof remain transient request data; neither is persisted
in preferences/audit metadata or printed by this feature. The password capability
is retained. Replacing an existing Google identity, unlinking providers and
creating an initial password for Google-only accounts are not offered by this
screen. A Google-only account displays its actual connected state.

## API contract

Both routes use the normal bearer authentication middleware. The POST also uses
the authentication rate limiter and a strict request schema. Current user ID
comes from the authenticated request; clients cannot choose another target or role.

| Route | Request | Successful data |
|---|---|---|
| GET `/api/users/me/sign-in-methods` | Bearer only | `{ hasPassword: boolean, googleLinked: boolean }` |
| POST `/api/users/me/google-link` | `{ idToken, currentPassword, nonce }` | `{ googleLinked: true, signInRequired: true }` |

The response uses the existing `{ message, data }` envelope. Capabilities never
include hashes, raw provider IDs or session tokens. The link operation checks
account state again inside the transaction and refuses suspended/rejected users.
An invalid Google proof is HTTP 400 here, distinguishing form proof failure from
an expired EcoNexus bearer token. It must not refresh or clear an unrelated
session. A true expired bearer token still uses normal shared API refresh.

Important codes: `GOOGLE_LINK_REQUIRED`, `GOOGLE_EMAIL_MISMATCH`,
`GOOGLE_IDENTITY_CONFLICT`, `INVALID_PASSWORD`, `GOOGLE_REAUTH_REQUIRED`,
`INVALID_GOOGLE_NONCE`, and `PASSWORD_NOT_CONFIGURED`. Mobile maps these to
specific corrective messages and never reports successful linking on an error.

The existing browser hook now uses a cryptographically generated request nonce,
passes it with the provider exchange and checks the signed token's nonce on the
server. Linking requires this nonce; the ordinary login API keeps it optional
for compatibility with token-producing clients. Future platform adapters must
honor their provider's nonce/state requirements. This is not a server-issued
one-time challenge protocol or a claim of completed native SDK integration.

## Enrollment navigation

First-launch role selection saves a non-sensitive intent (`user`, `collector`
or `center`) before completing onboarding. RootNavigator passes it to
AuthNavigator, which opens Register with the matching role/partner parameters.
Register and role selection use the same public-role mapping for password and
Google enrollment.

On restart, the saved role resumes the matching registration screen. Choosing
existing-account login clears the intent. Successful authentication clears it
and marks onboarding seen, so a later logout opens Login. Unknown/privileged
stored values are ignored; the backend remains the authority for actual roles.
This persists only the selected role, not unfinished passwords, form contents
or partner documents. If preference storage is unavailable, the current
in-memory selection can continue but restart restoration is unavailable.

## Verification and remaining acceptance

333 backend tests (19 suites), 140 mobile tests (20 suites), and both type checks
passed for this slice. Coverage includes collisions, wrong password/email,
stale/future proof, replaced identities, audit rollback, current account state,
provider cancellation, nonce propagation, sign-out semantics and first-launch/
restart role routing. Provider/database/navigation test doubles are used where
appropriate; these results do not establish real delivery or device acceptance.

No new migration is needed for this slice beyond the existing Google columns
and unique constraint in `003_google_auth.sql`. Actual migration state and
concurrent transactions still need PostgreSQL acceptance. Verify real Google
console client/redirect configuration, cancellation, matching nonce, linking and
post-link login on web and each supported native build. Expo recommends a
provider-specific library where available; see
[Expo AuthSession guidance](https://docs.expo.dev/versions/latest/sdk/auth-session/).
The existing browser hook is not a substitute for the pending native integration
and release-build tests.

Email ownership now has a separate server/mobile gate. New authoritative Gmail
or verified hosted-domain Google identities can satisfy email proof at creation;
other Google addresses receive the durable mailbox challenge. Existing accounts
are not automatically backfilled by linking. See
[email verification and recovery](email-verification-and-recovery.md).
