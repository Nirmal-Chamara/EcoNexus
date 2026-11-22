# EcoNexus: Final User Enrollment and User Management Master Plan

Review date: 16 November 2026 (Asia/Colombo)

Module owner: Pathum Piyumal. Review perspective: technical lead.

Status: completion plan based on the current working tree; implementation is not yet production ready.

### Implementation progress — 16 November 2026

The assessment below records the initial review. Completed implementation slices:

- Baseline: resolved all four mobile type errors; backend and mobile type checks pass.
- Added an isolated disposable PostGIS test service and explicit test-database URL safeguards.
- Added a migration ledger with checksums, advisory locking, transactional application, and refusal to guess an existing schema's migration history. Existing database adoption instructions are in `docs/database/migration-baseline.md`.
- Added `docs/auth-completion-contract.md` for role, state, session, and provider boundaries.
- Public local/Google enrollment rejects ADMIN in validation and service entry points. Controllers now receive parsed defaults/normalized values; mobile registration types exclude ADMIN.
- Password change, deactivation, admin status changes/rejection, and logout-all revoke refresh sessions. Login/refresh/logout/reset coordinate through user-row locking. Google-only password attempts avoid null-hash bcrypt failures; refresh replay handling does not roll back an already committed revocation.
- Existing collector and pickup routers now enforce ACTIVE status before controller execution. Pickup creation is restricted to USER/ADMIN; pickup detail retrieval requires ownership, collector assignment, or ADMIN access.
- HTTP and sockets share access-token verification against current database role/status/token_version. Sockets require authentication, ACTIVE status and authorized room ownership. Sensitive delivery rechecks these conditions and drops invalid subscriptions, including after suspension/revocation.
- Removed both preview-login controls and `devLogin`, plus automatic Google demo-account fallback. Mock Google identity assertions are rejected in every environment. Google ID tokens now use the official verification library with a mandatory configured audience allowlist; no configured audience returns an unavailable response.
- Mobile sockets read the current token on each handshake, recover expired tokens through the existing shared API refresh flow, restore intended subscriptions after reconnect, and clear socket subscriptions during sign-out/account changes. Google/recovery API failures do not trigger unrelated session refresh/logout.
- Centralized administrative status/review and self-deactivation decisions in a transaction with a shared governance lock. Generic activation cannot approve a pending/rejected partner; restoration checks the latest same-role application. Only the latest pending application of an eligible partner can be approved, with organization/registration/document details. All generic status changes require a reason; rejected applications retain their real review note.
- Added last-active-admin safeguards, transactional actor privilege rechecks, audit/rollback coverage, and a mobile account-actions flow that requires reasons and trusts server-confirmed status. Email-proof checks now apply; phone-proof checks remain unfinished.
- Provisioning now requires explicit nondefault credentials, operator identity and a reason. It creates and audits new administrators atomically; it never promotes/reactivates a matching ordinary or suspended account, and leaves an existing active administrator unchanged.
- Staging/production startup rejects absent/unsafe secrets, database credentials/TLS overrides, OAuth client configuration, email configuration, CORS origins and numeric settings. Mobile release startup requires an explicit staging/production environment and deployment HTTPS URLs. Updated configuration examples and added `docs/deployment/auth-release-configuration.md`; production deployment settings were not changed.
- Google login now matches only verified subject, preserving server-assigned roles and refusing email-only automatic linking. Added authenticated sign-in capabilities/linking endpoints and Profile -> Sign-in methods. Connecting a matching-email Google identity requires current-password proof, a recent verified Google token and a checked nonce; binding, audit and session revocation are atomic. The user signs in again after linking. Replacing/unlinking identities and Google-only initial password setup remain separate unfinished features.
- First-launch role choice now reaches Register with correct role/partner parameters, persists as a non-sensitive enrollment intent for restart, and clears on login choice/successful authentication. Password and Google entry points share the public-role mapping. This does not persist unfinished form/password/document contents.
- Email verification and recovery: added migration 006, account-bound single-use challenges, encrypted transactional email outbox, bounded worker retries and stable Resend idempotency. Removed console/token-response recovery shortcuts in every environment. Mobile email gates and trusted cold/warm link handling now share server proof state; HTTP/socket eligibility and administrative approval also require email proof. Resend with a verified domain is owner-confirmed; a generated backend-only outbox key was added to ignored local configuration. No mail was sent and migration 006 was not applied. See `docs/email-verification-and-recovery.md`.
- Validation: all 21 backend suites / 358 tests and 21 mobile suites / 150 tests passed; both type checks pass. No backend suite needs exclusion or forceExit. PostgreSQL, transport, provider and actual device/navigation tests still require real acceptance; mocks do not establish deployment readiness. See `docs/mobile-google-linking.md` for implemented contracts and limits.

Pending: live PostgreSQL migration/concurrency/upgrade acceptance (Docker Linux engine unavailable), remaining input/uniqueness checks, supported native Google integration and real platform/provider acceptance, real delivery/OTP, partner submission/private-document/resubmission flows, truthful admin dashboard/reporting, and release infrastructure acceptance. Email-proof gates are implemented; phone-proof gates remain pending. Unit tests do not close live database or provider gates. Changes remain local for review.

## 1. Objective and scope

Finish user enrollment, authentication, account recovery, profile management, partner verification, and administrator user management as complete, integrated workflows. A feature is complete only when its UI, API, database changes, authorization, provider integration, failure handling, tests, and operating instructions work together.

“Without patches” means fixing the owning workflow and its contracts rather than adding bypasses, fake successes, copied tokens, hardcoded data, or screen-only workarounds. Test doubles remain appropriate inside automated tests. They must not authenticate real users or replace external delivery in staging or release builds.

Included roles: USER, COLLECTOR, RECYCLING_CENTER, ADMIN. Public enrollment permits only the first three. ADMIN accounts require a controlled administrative process.

This plan treats automated SMS OTP delivery for phone verification as a required remaining feature, based on the owner's request. The current reset flow is an email token flow, not SMS OTP. Do not describe them as the same implementation. SMS provider credentials, sender registration, supported destinations, and delivery testing remain external prerequisites. Phone OTP login and MFA are separate features and are not implied by phone verification.

Operational collection, recycling, rewards, and waste functionality belong to the respective teammates. Their authentication boundaries, shared profile contracts, and integration errors remain release dependencies for this module.

## 2. Evidence and current completion assessment

The existing `docs/project-status-and-roadmap.md` describes authentication as 100% complete. That claim is not supported by the current code or by real provider acceptance evidence. Use this document for this module's remaining work; update the older roadmap when the implementation is signed off.

Status vocabulary:

- **Implemented, acceptance pending:** code exists; deployment and real workflow evidence are still required.
- **Partial:** important parts exist, but a complete workflow is missing or unsafe.
- **Missing:** no complete implementation was found in the inspected module.
- **Release blocker:** must be resolved before the module can be signed off.

| Capability | Current assessment | Evidence and remaining gap |
|---|---|---|
| Email/password enrollment | Partial; release blocker | `backend/src/services/auth.service.ts` registers users transactionally; `backend/src/validators/auth.validator.ts` accepts ADMIN through the public role enum. |
| Partner enrollment | Partial | Local registration collects organization name and creates a verification request. Google enrollment can create a partner request without organization details. Complete document submission and resubmission were not found in the inspected auth/user routes. |
| Login and role navigation | Implemented, acceptance pending | Login, AuthContext, RootNavigator, and role navigators exist. First-launch `RootNavigator.onProceed` receives but does not pass on the selected role. |
| Google authentication | Partial; release blocker | UI hook, endpoint, account creation, and migration exist. Missing client configuration can trigger mock login in development. Backend mock identity assertions are accepted outside production. Real cross-platform acceptance is unproven. |
| Google identity validation | Partial; release blocker | `google.service.ts` uses tokeninfo. Audience validation is conditional on configuration and returned `aud`; no explicit issuer/expiry verification is implemented locally. Replace with a supported verification library and mandatory configuration. |
| Google account linking | Partial | Existing accounts are matched by Google subject OR email and linked automatically. There is no explicit authenticated linking workflow or handling for two different rows matching these identifiers. |
| Email password reset | Partial | Has hashed single-use tokens, 15-minute expiry, session revocation on reset, Resend/SMTP integration, and app deep links. Nonproduction fallback logs the token and returns `devResetToken`, which the mobile screen displays/prefills. Actual delivery is unverified. |
| Phone verification / SMS OTP | Missing | No SMS OTP request/verify routes, challenge lifecycle, SMS sender integration, or complete receiver flow found in the inspected module. A phone field is not verification. |
| Local email ownership verification | Missing | Local USER registration immediately creates ACTIVE accounts; no complete email challenge/verification lifecycle found. |
| Refresh and logout | Implemented with gaps | Token families, rotation, replay detection, logout, and logout-all exist. Atomicity, concurrent refresh, and account-change invalidation need database integration tests. |
| Password change | Partial; release blocker | `UserController.updatePassword` increments token_version but does not revoke refresh tokens; refresh can issue tokens with the current version. Existing sessions may regain access. |
| Google-only password handling | Partial | Google migration allows a null password hash. Password login/change call bcrypt verification without a Google-only account branch. |
| Profile management | Implemented, acceptance pending | Get/edit name and phone, change password, and soft deactivation endpoints exist. Phone normalization/verification and consistent profile fields need completion. |
| Partner access restrictions | Partial; release blocker | Authentication rejects suspended/rejected users but permits pending partners. Collector and pickup routes do not consistently use `requireActive`. Test the server directly, independently of navigation. |
| Rejected account recovery | Partial; contract conflict | Rejection reason is queried by `/users/me`, but authentication rejects REJECTED accounts before that endpoint. UI offers reapplication guidance without a complete authenticated reapplication route. |
| Admin user management | Implemented, acceptance pending | Search/filter/pagination, detail, status changes, self-status protection, and audit writes exist. Activation rules, session revocation, and recovery safeguards need completion. |
| Admin verification | Partial | Queue/review APIs and screens exist. Need genuine private documents, allowed transitions, complete partner information, notifications, and concurrency evidence. |
| Admin dashboard/reporting | Partial; misleading success | Backend inserts minimum counts and sample metrics. Mobile dashboard substitutes mock applicants even for an empty real queue; quick approval skips the API for mock IDs. Reports use timers to claim export success without producing a file. |
| Release configuration | Partial | Backend has fallback JWT/admin credentials; mobile defaults environment to development. Release must fail closed rather than inherit development behavior. |
| Shared settings/legacy files | Unfinished inventory | `screens/shared/SettingsScreen.tsx` and `store/authStore.ts` are empty. Profile stack currently mounts Profile/EditProfile/ChangePassword. Do not count unused empty files as completed features. |

### Checks actually run for this review

| Check | Result | What it establishes |
|---|---|---|
| Backend `npx tsc --noEmit` | Passed | Current backend compiles without emitting files. |
| Six selected backend Jest suites | 6 suites / 102 tests passed | Auth validation, Google service, email service, verification controller, password and token tests. These are not real SMS, Google browser, inbox, or database acceptance tests. |
| Mobile `npm test -- --watch=false` | 14 suites / 93 tests passed | Existing automated suite passes; includes mocked authentication/provider behavior. |
| Mobile `npm run type-check` | Failed: four errors | See integration blockers below. |
| Live PostgreSQL workflow tests | Not run | Do not claim migrations, transactions, or authorization flows have passed against a live database. |
| Real Google sign-in / inbox receipt / SMS receipt | Not run | Provider consoles, credentials, device builds, and delivery evidence remain required. |

Mobile type errors observed in the current tree:

1. `mobile/src/screens/collector/RequestDetailsScreen.tsx:545`: `StyleSheet.absoluteFillObject` missing from the installed type definition.
2. `mobile/src/screens/recycling-center/DashboardScreen.tsx:43`: `organization_name` missing from `AuthUser`.
3. `mobile/src/screens/user/CreateWasteListingScreen.tsx:1007`: same StyleSheet error.
4. `mobile/src/screens/user/PickupTrackingScreen.tsx:469`: same StyleSheet error.

Resolve these with the relevant owners using supported styles and an accurate API/profile type. Do not suppress them with `any`, `@ts-ignore`, or invented profile fields. Existing test warnings include Expo module setup and forced Jest exit; clean up test lifecycle where needed.

## 3. Final workflow and authority model

Keep one backend identity system (users and external identity associations), one mobile AuthContext, one authenticated API client, and one session storage contract. Add Google and delivery providers through clear adapters. Do not introduce a parallel login store or unrelated session system.

Identity verification, partner review, and account enforcement are separate facts:

| Fact | Proposed representation | Authority |
|---|---|---|
| Email ownership | `email_verified_at` | Verified challenge or validated provider identity under the account-linking policy |
| Phone ownership | `phone_verified_at`, normalized verified phone | Successful challenge bound to that exact number |
| Partner review | Verification application status and review history | Authorized administrator action |
| Account enforcement | ACTIVE / PENDING_VERIFICATION / REJECTED / SUSPENDED, with documented transitions | Server policy |
| Credential availability | Local password configured; linked provider subject(s) | Server identity records |

An ACTIVE status alone must not bypass a required identity check. Existing accounts need an explicit backfill and transition policy; never mark unverified contact information verified automatically. Use a consistent server eligibility function rather than scattered combinations of role/status checks.

Target journeys:

1. **Local USER:** choose role -> register -> verify email -> verify phone if required by this plan -> complete profile -> eligible USER navigation. Offer only restricted setup access until required checks pass.
2. **Local partner:** choose role -> register -> verify contacts -> complete organization details and private document submission -> submit application -> pending screen -> real administrator decision -> approved operational access or rejection reason and resubmission.
3. **Google user:** real provider sign-in -> server validates Google ID token -> find/create identity safely -> collect missing required contacts/partner data -> verification gates -> eligible role navigation.
4. **Password recovery:** request -> generic acknowledgement -> actual email receipt -> secure link/code -> change password once -> revoke previous sessions -> normal sign-in.
5. **Contact change:** authenticate -> request verification of the proposed contact -> challenge -> atomic update of the verified contact. A typed phone number must not overwrite verified ownership.
6. **Admin management:** real login -> fetch real records -> authorized action with reason -> transaction and audit -> confirmed response -> refresh real state.

Proposed restricted access for rejected applicants must use a documented capability/session policy: allow own review status, resubmission, and logout, while denying operational routes. Suspended accounts remain blocked. Implement this centrally; do not broadly remove status enforcement to make the rejection screen work.

## 4. Ordered implementation work

### Phase 0 — Establish a reproducible baseline

- [ ] Create a focused module branch from the agreed integration branch; preserve existing work and coordinate changes to shared navigation and role types.
- [ ] Capture the commit SHA, current test results, environment names, supported platforms, and module requirements in the implementation PR.
- [ ] Define endpoint request/response/error contracts and account-state transitions before changing screens.
- [x] Resolve the four mobile type errors using the supported style and current profile contract.
- [ ] Establish an isolated PostgreSQL/PostGIS test database. Do not let integration helpers fall back to a developer or production database.
- [x] Review both migration directories and document `backend/migrations` as the runtime migration source; cross-module schema reconciliation remains an integration dependency.
- [x] Replace unconditional SQL replay with recorded migrations and checksums/locking; retain full historical filenames and document safe existing-schema adoption. Live migration verification remains open.

Exit gate: a reproducible build/test baseline, agreed API contract, and migration strategy.

### Phase 1 — Close authentication and authorization blockers

- [x] Introduce a dedicated public enrollment role schema and service checks; reject ADMIN and privileged aliases through HTTP validation and direct service entry points.
- [x] Replace the ineffective ADMIN validator assertion and add HTTP/service regression tests.
- [x] Remove `devLogin`, both “Instant Look” controls, automatic mock Google fallback, and backend mock-token authentication. Keep provider doubles in tests.
- [x] Validate secrets, provider configuration, URLs, environment names and provisioning inputs at startup; reject default credentials and unsafe release settings. Mobile validation runs at app startup; dedicated build/deployment acceptance remains open.
- [ ] Make password change, reset, suspension, deactivation, relevant role changes, and logout-all invalidate the intended sessions atomically: bump token_version AND revoke refresh tokens as appropriate.
- [ ] Ensure suspension/reactivation cannot resurrect old refresh sessions. Define current-device logout versus logout-all semantics explicitly.
- [ ] Google-only password attempts now avoid null-hash bcrypt calls with regression coverage. Complete the separate initial-password setup flow using fresh identity proof before closing this item.
- [ ] ACTIVE-state checks now cover existing collector/pickup routers; waste/admin already enforce ACTIVE. Pickup details and socket rooms/delivery enforce ownership. Complete contact-verification eligibility and live integration acceptance; add the same policy to future recycling routes when implemented.
- [x] Implement status/review rules so generic activation cannot approve partners; require latest same-role review and complete organization/registration/document information for approval/restoration. Email proof is enforced; add phone proof with its workflow.
- [x] Protect admin self-management and last-active-admin availability with a shared transactional lock; audit management/provisioning/deactivation actions. Verify races against live PostgreSQL before release.
- [ ] Review refresh replay handling so committed family revocation remains durable, rollback is not attempted after commit, and concurrent requests have a tested policy.
- [ ] Normalize inputs and map database uniqueness errors to stable API errors, including concurrent registration and phone collisions.

Exit gate: direct API and socket tests prove that role/status/contact bypasses fail, and revoked credentials cannot regain access through refresh.

### Phase 2 — Finish genuine Google authentication

- [ ] Retain the existing backend `/api/auth/google` session exchange; integrate supported platform sign-in adapters rather than maintaining hand-built implicit-flow workarounds.
- [ ] Select and pin an Expo-compatible native Google integration for Android/iOS; configure its app plugin and use a development build for native acceptance. Use the supported Google web flow on web. Check compatibility against this repository's installed SDK before implementation. [Expo Google authentication guidance](https://docs.expo.dev/guides/google-authentication/) explains the native build requirement.
- [ ] Configure the owned Google Cloud project, consent screen, approved test users/publishing status, platform client IDs, package/bundle identifiers, Android signing fingerprints, and web origins/redirects. Record actual configuration identifiers without secrets.
- [x] Replace tokeninfo with the official server verification library and a mandatory intended audience allowlist. Verify identity claims/email verification after library validation; use `sub` as provider identity. Real provider acceptance remains open. [Google backend authentication guidance](https://developers.google.com/identity/sign-in/web/backend-auth) describes these verification requirements.
- [ ] If an authorization-code flow is selected, use the provider-supported state/PKCE handling and keep any client secret on the server. Validate nonce wherever the selected ID-token flow requires it; do not generate and discard an unvalidated nonce.
- [x] Remove fallback from missing Android/iOS configuration to a web client ID. Missing configuration produces an unavailable state, never a demo identity.
- [x] Make linking explicit through authenticated Profile -> Sign-in methods, current-password proof, matching-email Google proof, recent token/nonce validation, ownership constraints, audit and session revocation. Email-only account attachment is removed. Live provider/database acceptance is still required.
- [x] Pass and check the browser request nonce in Google exchanges; use a CSPRNG and a separate linking callback that cannot silently switch users. Complete provider-specific native integration and its nonce/state requirements before native sign-off.
- [ ] Google subject/email uniqueness failures now return controlled conflicts, and subject lookup preserves existing server roles. Verify actual concurrent first sign-in and linking against PostgreSQL before closing this item.
- [ ] Require partner details after Google identity proof; keep incomplete applications restricted and resumable after restart.
- [x] Include Google and recovery endpoints in shared public-auth error handling; regression tests prove failures do not refresh or clear an unrelated session.
- [ ] Verify successful sign-in, cancellation, provider failure, wrong audience, expired token, unverified email, duplicate identity, partner approval gating, and session restoration on each supported release platform.

Exit gate: a real Google account signs in on the deployed backend and supported builds, with no mock identity path and no administrative role escalation.

### Phase 3 — Finish email delivery and account recovery

- [x] Implement the transactional email adapter: Resend primary when configured, SMTP an explicitly selected alternative; no automatic failover.
- [ ] Owner confirms Resend with a verified domain; independently validate sender/DNS and real receipt before closing deployment acceptance. Do not use a development sender as release evidence. [Resend domain documentation](https://resend.com/docs/dashboard/domains/introduction) covers verified sending domains.
- [x] Remove reset token logging, `devResetToken` responses/types and ForgotPassword developer-token display/prefill. Users can enter only credentials received through their mailbox.
- [x] Keep reset acknowledgements generic for known/unknown addresses and per-account enqueue errors; expose only uniform global configuration unavailability. Real timing/abuse acceptance remains open.
- [x] Add email ownership verification for local enrollment with request/resend/confirm endpoints, expiry, single use, and server/mobile restrictions until completion.
- [x] Retain 256-bit random password-reset credentials and database hashes; encrypt raw credentials only inside the durable delivery payload.
- [ ] Issuance now serializes through the user row and invalidates prior challenges transactionally; prove real concurrent PostgreSQL behavior: issue challenges transactionally, invalidate the intended prior challenges, and test concurrent requests and duplicate confirmations.
- [x] Add the encrypted transactional outbox and worker with bounded retries, expiry checks, stable Resend idempotency, lease recovery and sanitized failures. Live database acceptance remains open.
- [ ] Track provider message IDs and verified delivery webhooks. Distinguish queued, provider accepted, recipient-server delivered, bounced, and failed. A delivered event alone does not prove inbox placement; include recipient confirmation in acceptance. [Resend events](https://resend.com/docs/webhooks/event-types) distinguish sent and delivered events.
- [ ] Provider timeouts and sanitized errors are implemented; configure alerts on repeated provider failures without changing the generic public response.
- [ ] Mock navigation tests cover cold/warm/first-launch reset links and verification intent retention. Validate real builds and browser fallback. Use an owned HTTPS domain and verified app links/universal links where supported; do not rely solely on a custom scheme.
- [ ] Service tests cover reset/session invalidation and consumed-token rejection; validate real database/device reset, old-session denial and new/old password login end to end.

Exit gate: account verification and recovery complete from a real mailbox without developer assistance or exposed secrets.

### Phase 4 — Implement automated SMS OTP phone verification

Proposed baseline policy: six digits, five-minute validity, at most five verification attempts per challenge, and a 60-second resend cooldown. Treat these as initial product settings to validate against abuse tests and provider constraints, not existing behavior.

- [ ] Select a transactional SMS provider that supports the target Sri Lankan destinations and required sender registration. Confirm actual credentials, quotas, costs, and delivery behavior before choosing the final integration; no vendor is assumed configured.
- [ ] Implement a provider adapter, durable sending jobs, timeout/retry policy, delivery status ingestion, and server-held credentials. Use a managed verification service if selected; otherwise implement challenge generation/verification on the backend.
- [ ] Normalize numbers consistently to E.164 and validate them on both client and server. Clarify whether phone uniqueness is required and migrate duplicate/invalid existing numbers safely.
- [ ] Add challenge records containing opaque ID, account/enrollment binding, purpose, destination binding, expiry, failed attempts, consumed timestamp, resend/send metadata, and provider reference.
- [ ] Generate codes using a cryptographically secure generator. Store a keyed digest with a server-held key for low-entropy numeric codes; never store or log plaintext OTPs.
- [ ] Enforce account/destination/IP send and verify limits, resend cooldown, daily spend limits, and atomic failed-attempt counting. UI timers are display only; the server controls eligibility and expiry.
- [ ] Define resend semantics: a new successful issuance invalidates the prior code; duplicate delivery jobs must not create extra valid challenges or unbounded SMS sends.
- [ ] Bind confirmation to the same account, destination, and purpose. Email verification, phone changes, password recovery, and login must not accept each other's codes.
- [ ] Add request/verify UI with masked destination, resend state, paste/autofill support where available, attempt/expiry errors, edit-number action, offline handling, and accessible focus behavior.
- [ ] Apply verified phone updates atomically after proof; retain the previous verified contact until replacement succeeds. Reauthenticate sensitive contact changes.
- [ ] Verify genuine delivery to test devices on target networks, including delayed/out-of-order messages. Do not auto-read arbitrary SMS inboxes or require unnecessary SMS permissions.
- [ ] Test wrong/expired/replayed code, exhausted attempts, simultaneous verification, cross-account/code substitution, resend abuse, provider outage, and app restart.

Exit gate: a real phone receives the SMS automatically and the server confirms ownership with no manually supplied backend code.

### Phase 5 — Complete partner enrollment and profile management

- [x] Preserve the selected role through AuthNavigator/Register using one public-role mapping; persist/restore the role intent and clear it on successful authentication or login choice. Actual platform navigation acceptance remains open.
- [ ] Build resumable partner enrollment for organization name, registration details, required contact verification, and required documents for each partner role.
- [ ] Add authorized document upload/storage for identity materials. Validate actual file content, size and permitted formats; use private storage with short-lived authorized access rather than public waste-image URLs.
- [ ] Expose own-application status and submission/resubmission endpoints under the restricted account policy. Preserve review history; prevent multiple concurrent pending applications.
- [ ] Fix rejected-account access consistently across login/refresh/middleware/UI. Show the actual review note, never an invented reason. Define how a rejected applicant receives a restricted session and how suspension overrides it.
- [ ] Make approve/reject operations atomic with application, eligibility, audit, and notification scheduling. Repeated and concurrent reviews must have deterministic outcomes.
- [ ] Notify applicants through actual delivery on submission, approval, rejection, suspension, and reactivation where appropriate. Admin review itself remains a legitimate human action; manually changing database status does not count as the review workflow.
- [ ] Ensure GET/PATCH profile and login responses share accurate types and provider/password capability fields. Return organization information only from its authoritative model.
- [ ] Reconcile phone edits with verification; implement name validation, dirty-form handling, duplicate errors, and server-confirmed state refresh after edits.
- [ ] Define deactivation separately from administrative suspension in user-facing behavior, even if initially sharing a storage state. Require suitable reauthentication and prevent admin reactivation from skipping other eligibility checks.
- [ ] Decide email-change and account-erasure scope explicitly. If included, require new-email ownership proof and define data retention; do not claim soft suspension deletes personal data.
- [ ] Inventory settings and duplicate/empty files. Implement required account controls in the mounted shared profile flow or remove unreachable controls; do not create another authentication store.

Exit gate: every role completes enrollment and profile maintenance without database edits; pending/rejected users have only their documented restricted capabilities.

### Phase 6 — Finish honest administrator management

- [ ] Remove mock applicants, minimum metric counts, fabricated vehicle/license details, static compliance claims, and invented notice data from normal dashboard responses and UI defaults.
- [ ] Show genuine zero/empty/loading/error states. Offline or failed retrieval must never display sample applicants as pending real work.
- [ ] Quick approve must always call the real authorized review API for a real application, satisfy the same review requirements as the detail screen, and confirm persistence before success.
- [ ] Verify search/filter/pagination, stable ordering, user details, status reasons, audit writes, refresh behavior, and concurrent updates using actual database records.
- [ ] Add authorized audit history retrieval/UI for management actions; redact credentials and document secrets from audit metadata.
- [ ] Implement user/verification reports from real queries with a real generated/downloaded artifact and tested access control. Operational reports require the corresponding teammate's data contracts.
- [ ] Persist any offered notification/digest setting and implement its delivery scheduler. If a report/control is outside the signed module scope, remove its success behavior and clearly document the excluded scope before sign-off.
- [x] Keep provisioning separate from public registration; remove default credentials, refuse promotion/reactivation of existing identities, require operator attribution and a reason, and audit new admins atomically. Isolated provisioning tests replace the former unsafe application-database test.

Exit gate: every displayed management action has a real persisted result; empty databases produce honest empty views.

## 5. Proposed API and schema additions

These are target contracts to agree during Phase 0, not endpoints that already exist. Keep response envelopes and stable error codes consistent with the existing API.

| Contract | Purpose / access |
|---|---|
| POST `/api/auth/email-verification/request` and `/confirm` | Bound enrollment/email ownership challenge; restricted session or scoped enrollment proof |
| POST `/api/auth/phone-verification/request` and `/confirm` | Bound phone challenge; rate limited and purpose specific |
| POST `/api/users/me/google-link` | Authenticated linking after fresh identity proof; Google login remains `/api/auth/google` |
| GET/PUT `/api/users/me/verification` | Own draft/application details; permitted restricted states only |
| POST `/api/users/me/verification/documents` | Authorized private credential submission |
| POST `/api/users/me/verification/submit` and `/resubmit` | Complete application transitions with history and concurrency protection |
| GET `/api/admin/audit-logs` | Paginated, authorized management history |
| GET `/api/admin/reports/users` | Real report artifact or a documented asynchronous export job |
| POST `/api/webhooks/email` and `/sms` | Signed provider events; not end-user authenticated routes; replay/idempotency protection required |

Schema work: verified contact timestamps; normalized contact fields; scoped challenges; identity associations if replacing `google_id`; delivery outbox/events; application history/private document references; audit indexes; migration ledger. Add only the fields needed by the agreed workflows. Use foreign keys, unique constraints, appropriate pending-application uniqueness, and expiry indexes.

Migration acceptance: empty database -> current schema; previous deployed schema -> upgraded schema; no existing user loss; repeat runner does not replay completed migrations; application versions remain compatible during rollout. Record backfill decisions and a tested rollback/recovery approach. Do not edit historical SQL as the only upgrade mechanism.

## 6. Acceptance test matrix

Each row requires automated coverage at the relevant layer plus real device/provider evidence where specified. Mock-based tests are useful, but cannot close a real-provider row.

| ID | Scenario | Required result |
|---|---|---|
| ENR-01 | Local USER signup, duplicate signup, concurrent signup | Correct identity/contact state; one user record; stable conflict response |
| ENR-02 | Submit ADMIN via local and Google public APIs | Rejected before an administrative account/session can be created |
| ENR-03 | First-launch role selection and app restart | Selected role preserved; incomplete enrollment resumes correctly |
| ENR-04 | Partner missing required fields/documents | Cannot submit/activate; useful field errors; no orphan application |
| GGL-01 | Real Google login on each supported platform | Provider identity -> verified backend session -> correct server role |
| GGL-02 | Cancel/invalid signature/wrong audience/expired token | No new session or profile mutation; clear failure/cancel state |
| GGL-03 | Existing local account, conflicting Google subject, parallel signup | Explicit secure linking; no account takeover or duplicate identities |
| GGL-04 | Missing configuration or mock identity assertion | Unavailable/rejected; no fake session |
| OTP-01 | Real SMS request and verification | Automatically received code verifies exact destination/purpose |
| OTP-02 | Wrong/expired/replayed/cross-user code | Rejected; atomic attempt count; no contact state change |
| OTP-03 | Resend, concurrent confirmation, send spam, outage | Policy enforced server-side; no duplicate consumption/unbounded spend |
| EML-01 | Local email verification | Real receipt; single use; required access gates lifted only on proof |
| REC-01 | Known and unknown email reset requests | Generic acknowledgement; no response/log token exposure |
| REC-02 | Real recovery email and cold/warm app links | User finishes reset without developer console/API assistance |
| REC-03 | Reset twice, expiry, resends and concurrent reset | Only permitted challenge succeeds; all affected old sessions revoked |
| SES-01 | Login, rotation, concurrent expired requests, replay | One client refresh flight; deterministic server policy; durable family revocation |
| SES-02 | Password change, suspension, deactivation, reactivation | Prior access/refresh tokens cannot regain access |
| SES-03 | Google-only password login/change | Supported credential flow; no null-hash crash |
| SES-04 | Remember-me off/on, biometric cancel, offline restore | Correct persistence and state; no credential loss from temporary network failure |
| RBAC-01 | Pending/rejected/suspended operational HTTP and socket access | Denied by server regardless of manipulated navigation |
| RBAC-02 | Rejected applicant retrieves reason and resubmits | Restricted own-application flow works; operational access remains denied |
| PRF-01 | Edit name/contact, contact collision, restart | Server-confirmed persistence; unverified replacement not trusted |
| ADM-01 | Admin search/filter/page/detail and direct nonadmin calls | Accurate database results; unauthorized calls denied |
| ADM-02 | Approve/reject/status change, duplicate clicks and races | Allowed transition only; atomic audit and durable outcome |
| ADM-03 | Empty/offline dashboard and real export | Honest state; no fake approval; actual authorized downloadable report |
| ADM-04 | Self/last-admin changes and provisioning | Availability safeguards; no public or silent privilege escalation |
| REL-01 | Missing secrets/provider config, staging and release builds | Startup/build fails safely for required misconfiguration; no development auth bypass |
| REL-02 | Fresh/upgrade migration and backup recovery | Repeatable deployment, no data loss, documented recovery evidence |

Required test layers: service unit tests, API contract/RBAC tests through middleware, database integration tests with transaction/concurrency cases, mobile navigation/session tests, and real provider/device acceptance. Add tests for behavior and failure boundaries rather than mirroring functions. CI must not silently skip required database tests when its database is unavailable.

## 7. Delivery order, ownership, and external dependencies

| Milestone | Owner | Depends on | Evidence required to close |
|---|---|---|---|
| M0: baseline and contracts | Module owner + technical lead + affected teammates | Current integration branch | Clean type baseline, test DB, agreed transitions/contracts |
| M1: security blockers | Module owner; route/socket owners integrate gates | M0 | Negative API/RBAC tests, session revocation tests |
| M2: Google sign-in | Module owner; account owner configures console | M1 and real Google project/build identities | Real sign-in matrix and invalid-token tests |
| M3: email verification/recovery | Module owner; domain/provider account owner | M1, verified sender, delivery worker | Inbox/device proof, delivery/replay tests |
| M4: SMS verification | Module owner; provider account owner | M1, registered sender/credentials and test numbers | Genuine SMS receipt and abuse/failure tests |
| M5: partner/profile completion | Module owner; storage and role module owners | M2-M4 and private document storage | Each partner's submit/review/resubmit journey |
| M6: truthful admin workflows | Module owner; reporting data owners | M1, M5 | Real actions/audit/export, zero-data and outage tests |
| M7: release and handover | Technical lead + module owner + reviewer | All required milestones | Signed acceptance matrix and reproducible deployment |

Parallel development of independent provider adapters is possible after contracts are settled, but shared session/eligibility changes should land in a coordinated sequence. Estimate dates only after M0 and provider setup; this review cannot establish an honest fixed completion date or percentage.

External setup register: Google project/client registrations; Android/iOS build/signing configuration; owned email/link domain and DNS; transactional email credentials; SMS provider and registered sender; private document storage; isolated CI database; staging backend/HTTPS; target devices/accounts/numbers. Record accountable owners and completion evidence. No credentials or secret values belong in this document or Git.

## 8. Release operation and final sign-off

- [ ] Document all required environment variable names in examples with placeholders. Public mobile configuration contains only public identifiers/URLs; private API keys and OTP/JWT secrets stay on the backend.
- [ ] Use one pinned dependency/lockfile baseline; verify selected provider libraries against the actual Expo SDK and target builds.
- [ ] Run CI type checks, existing tests, new API/database/security suites, and application build/export checks. No required skipped tests; investigate open handles rather than relying on forced exit indefinitely.
- [ ] Deploy migrations and delivery workers reproducibly; record migration version, commit, provider configuration version, and rollback plan.
- [ ] Monitor sign-in failures, invalid token spikes, OTP send/verify limits, provider failures, delivery queue age, verification backlog, and administrative action errors. Logs must not contain passwords, raw tokens, OTPs, or private document URLs.
- [ ] Schedule expiry cleanup for challenges, reset/refresh tokens, delivery jobs, and private documents according to the agreed retention policy.
- [ ] Verify real account journeys on staging, then smoke test the release artifact with agreed test identities. Keep acceptance evidence redacted.
- [ ] Update module documentation and the old roadmap with actual evidence; remove percentage claims that are not supported by completed acceptance rows.
- [ ] Have a second reviewer check public role restrictions, identity linking, restricted-account access, secret handling, and session invalidation.

Final sign-off record:

| Field | Required value |
|---|---|
| Candidate commit / build | To be recorded |
| Deployed migration version | To be recorded |
| Supported platforms tested | To be recorded |
| Automated test report | To be recorded |
| Real Google/email/SMS evidence | To be recorded |
| Full enrollment/admin acceptance report | To be recorded |
| Unresolved blockers | Must be zero |
| Explicit exclusions agreed before release | To be recorded; no hidden fake-success controls |
| Module owner / independent reviewer / technical lead | Names and sign-off date to be recorded |

The module is complete when a new user or partner can enroll, prove required identity/contact ownership, receive genuine messages, obtain the correct access, recover an account, maintain a profile, and be managed through real administrator workflows without manual database edits, fabricated sessions, or success messages standing in for persisted operations.
