# Enrollment and management implementation contract

Baseline: `c8dde63ceeb0144de0b3a5fdf64f5ad23924bde4`, 16 November 2026.
Working branch: `feature/ui`. `masterplan.md` is the completion scope.
This document distinguishes current guarantees from proposed contracts. There is
no release completion claim until the master plan acceptance gates pass.

## Public identity and sessions

- Public local and Google enrollment permit USER, COLLECTOR, RECYCLING_CENTER.
  ADMIN remains a valid internal user role, never a public enrollment choice.
- API validation and service entry points must both enforce the public role set.
- Successful login/register/Google responses retain `{ message, data: { user,
  accessToken, refreshToken } }`; user role/status originate from the server.
- Refresh retains `{ message, data: { accessToken, refreshToken } }`.
- Validation failures must not create users, verification requests, or sessions.
- Existing error status/envelope handling remains owned by the shared API client.
  Add stable error codes for new failure cases; never return secrets in errors.
- Local AuthContext is the only mobile session authority; UI role selection
  cannot grant a role or activate an account.

## State transitions and access contract

| State | Target allowed access | Target transition |
|---|---|---|
| Signed out | Public auth/recovery and scoped challenge actions | Prove identity -> restricted or eligible session |
| Incomplete contact/enrollment | Own setup/challenges, profile needed for setup, logout | Required checks pass -> pending partner or eligible USER |
| PENDING_VERIFICATION | Own application/status/profile, permitted uploads, logout | Admin review -> ACTIVE or REJECTED |
| REJECTED | Own actual review note and permitted resubmission, logout | Valid resubmission -> PENDING_VERIFICATION |
| ACTIVE | Role-authorized operations, own account controls | Authorized suspension/deactivation -> SUSPENDED |
| SUSPENDED | No operational access; controlled recovery/support only | Admin review -> prior eligible state, with new authentication |

Email and phone verification are separate timestamps/requirements, not inferred
from ACTIVE. The current implementation does not yet provide these complete
contact-check states. Do not advertise this target table as current behavior.

Every operational HTTP route and socket subscription needs server-side active
eligibility, role, and record-ownership checks. Admin processing is the only
partner approval path; changing generic status must not bypass review. Admin
deactivation must preserve last-active-admin availability.

Password change/reset, suspension, deactivation, logout-all, and privilege
changes must revoke the intended refresh sessions and invalidate old access
tokens atomically. Test rotation races against the real database. Current-device
logout revokes its refresh family; document the remaining access-token lifetime.

## Provider and profile contracts

- Google is identity proof, not permission to link any matching email or to
  choose a higher role. Keep configured provider identity and existing roles.
- Real Google, email, and SMS require actual provider acceptance evidence;
  test fixtures must not become deployable authentication paths.
- The current profile exposes name/phone and user role/status. Organization
  details belong to verification/application data. Do not invent
  `organization_name` on the session type to satisfy a screen compiler error.
- Proposed verification, linking, document, audit and report routes are listed
  in masterplan.md; implement and test them before clients depend on them.

## Baseline execution record

- Review baseline: backend type checking passed; 102 selected backend tests and
  93 mobile tests passed. These are unit/component results, not provider evidence.
- Four mobile type errors identified in the review have been addressed with the
  supported absolute-fill style and the current profile name contract.
- Canonical backend migration source, ledger rules, and existing schema adoption
  are documented in `database/migration-baseline.md`.
- Isolated database compose definition added. Docker Linux engine unavailable
  locally; live migration/transaction/upgrade tests remain unverified.
- Earlier implementation slice results: 165 backend tests (12 suites, excluding the
  existing unsafe live seedAdmin suite) and 93 mobile tests (14 suites) pass.
  Both applications pass type checking. Public enrollment role rejection and
  transactional session revocation have regression tests. This does not close
  the remaining Phase 1 policy, socket, provisioning, or real provider work.

### Access restrictions and mock-auth removal slice

232 backend tests (14 suites, still excluding live seedAdmin) and 102 mobile tests
(15 suites) pass. Both type checks pass. Existing collector/pickup APIs require
ACTIVE; pickup details require ownership/assignment/admin. Shared HTTP/socket
token authentication uses current DB role/status/token_version. Socket connection,
room subscription, and sensitive outgoing delivery enforce authorization.

Mobile disconnects and clears subscriptions when accounts change or sign out,
restores desired subscriptions after reconnect, and uses the ordinary API refresh
flow once on token expiry. Public Google/recovery failures do not refresh or clear
an existing unrelated session.

Google's library now verifies ID tokens against required configured audiences;
development/mock identity authentication and preview-login controls are removed.
Actual provider configuration, secure account linking, real device/socket transport
acceptance, contact checks, and admin activation/provisioning safeguards remain
required. Google verification test doubles do not prove real provider sign-in.

References: [Google backend token verification](https://developers.google.com/identity/sign-in/web/backend-auth)
and [Socket.IO server API](https://socket.io/docs/v4/server-api/).
- Android is the first native verification target and web is the browser target.
  iOS acceptance still requires an available signed build/device before any iOS
  support claim. Provider setup and platform acceptance remain open work.

### Administrative policy and release-configuration slice

All 312 backend tests (18 suites) and 119 mobile tests (17 suites) pass; both type
checks pass. No backend suite needs exclusion, and Jest exits normally without
forceExit. The old seed test that touched the application database has been
replaced with isolated provisioning tests.

Status/review changes, provisioning and self-deactivation use the same
transactional governance lock. Current administrator authority is rechecked in
the transaction. Generic status changes require reasons; they cannot approve or
reject partner applications. Latest-application rules, required organization/
registration/document information, last-active-admin protection, durable audit
and rollback behavior have service and HTTP coverage. The mobile account screen
collects reasons and preserves server-confirmed status on denied actions.

Provisioning requires explicit credentials, operator identity and reason. It
creates and audits a new administrator or leaves a matching active administrator
unchanged; it never promotes an ordinary identity or reactivates a suspended one.

Staging/production settings now fail closed at server initialization; release
mobile settings are validated at app startup. Database URL overrides cannot
disable verified TLS or replace the intended connection identity. Development
configuration does not serve as a release default. See
[auth release configuration](deployment/auth-release-configuration.md) for exact
requirements, operating steps, and remaining acceptance gates.

Actual contact-proof eligibility, real private documents, delivery, PostgreSQL
locking/concurrency and deployed infrastructure/provider/device acceptance remain
unfinished. These results do not certify the module for production.

### Explicit Google linking and enrollment-role continuity

Google login now matches by verified subject only. Email collisions return a
linking-required conflict rather than granting access or attaching an identity.
Authenticated GET `/users/me/sign-in-methods` returns capability flags, and POST
`/users/me/google-link` requires current-password proof, same-email Google proof,
recent issuance and nonce validation. The account is locked and rechecked before
binding; audit and old-session revocation commit together. Linking cannot choose
another target/role or replace another Google identity. Invalid provider proof
is a form error and does not refresh/end the existing account session.

Profile -> Sign-in methods exposes this workflow. Completion signs out with a
specific return-to-login message. First-launch role intent is now passed to
Register, persisted for restart, and cleared after authentication/login choice.
No passwords/form contents/documents are stored in that preference.

All 333 backend tests (19 suites), 140 mobile tests (20 suites), and both type
checks pass. See [Google linking and enrollment navigation](mobile-google-linking.md)
for exact contracts, test limits, provider references and remaining native/live
acceptance work. Full partner submission and real provider/device integration
remain unfinished.

### Email verification and durable recovery delivery

Migration 006 adds email proof, account-bound verification challenges and an
AES-256-GCM encrypted transactional email outbox. Local signup and delivery
scheduling commit together. The API worker claims leased jobs with SKIP LOCKED,
rechecks challenge validity, retries transient errors within bounded limits, and
uses frozen message contents and stable Resend idempotency keys. Terminal jobs
erase payloads. Provider acceptance is recorded separately from actual delivery.

Verification is required by operational HTTP/socket eligibility and by admin
authority, account restoration and partner approval. The mobile root follows the
same proof flag and preserves trusted credential links across login/first launch.
Forgot-password never exposes developer credentials; known and unknown addresses
receive generic acknowledgements. Reset proves email ownership, consumes old
challenges and revokes sessions without changing account status or role.

All 358 backend tests (21 suites), 150 mobile tests (21 suites) and both type
checks pass. Resend and a verified domain were owner-confirmed, and a backend-only
outbox key was generated in ignored local configuration. Migration 006, live
PostgreSQL concurrency, actual inbox receipt, signed delivery/bounce events and
owned HTTPS/device link acceptance remain open. No email was sent. See
[email verification and recovery](email-verification-and-recovery.md).
