# Auth configuration and administrative operations

This describes implemented startup checks and account policy, not a completed
deployment. Real database upgrades, provider delivery and device acceptance are
still required in `masterplan.md`. No production settings were changed by this work.

## Server configuration

The server requires an explicit `NODE_ENV`: development, test, staging or
production. Both staging and production enforce release rules. Missing/invalid
settings fail during configuration loading, before the server starts listening.
Errors identify setting names without printing secret values.

For development copy `backend/.env.example` to a local, ignored `.env` and set
your reachable database. Set a dedicated generated JWT secret if sessions must
survive restarts; otherwise development/test generate an ephemeral secret.
Never copy the example database password to a deployed database.

Staging/production require:

- An explicit PostgreSQL `DATABASE_URL` with nondefault credentials. Database
  TLS certificate verification stays enabled. If specifying `sslmode`, use
  `verify-full`; configure an appropriate CA with `DATABASE_SSL_CA` when needed.
  URL overrides for identity/host/SSL files are refused; only `sslmode`,
  `application_name` and `connect_timeout` query settings are accepted. Valid
  `sslmode` is removed internally so pg cannot replace the configured CA/SSL
  object while parsing the connection string.
- A generated `JWT_ACCESS_SECRET` of at least 32 bytes; shared example secrets
  and placeholders are refused. Access-token TTL uses `s`, `m` or `h`, up to one
  hour. Refresh TTL is 1-90 days and bcrypt rounds are 10-15 for release.
- `GOOGLE_CLIENT_ID` with the intended `.apps.googleusercontent.com` client IDs.
  This is an allowlist, not a client secret. Real Google console/native setup
  and secure account linking remain separate unfinished work.
- Resend credentials OR a complete SMTP host/user/password configuration, and
  `EMAIL_FROM` on the owned sending domain. Configuration presence is not proof
  of domain verification or receipt; verify those separately against the provider.
- `EMAIL_OUTBOX_KEY`: a stable generated 32-byte key encoded as 64 hexadecimal
  characters. Keep it in the server secret store and available to every worker.
- `APP_LINK_BASE_URL`: the owned HTTPS app-link base, without credentials,
  query or fragment. Configure the same public base in the mobile app.
- Exact HTTPS `CORS_ORIGIN` entries, comma separated, with no paths/wildcards.
  CORS is a browser restriction, not an authentication boundary.
- Supported numeric ports/cost settings. If temporary `ADMIN_PASSWORD` is
  present, it must meet the provisioning policy. Prefer omitting all provisioning
  credentials from the long-running API environment.

Email delivery requires real provider configuration in every environment. There
is no console delivery or development reset-token response. Resend is preferred
when configured; SMTP is an explicit alternative, with no automatic failover.
Apply migration 006 before starting the updated API. Its email worker starts
after the HTTP listener and processes durable jobs. See
[email verification and recovery](../email-verification-and-recovery.md).

Provision secrets using the deployment secret store. Do not paste them into
committed files, issue reports, CI output or API responses. An example value
being accepted syntactically does not establish that a provider credential works.

## Mobile configuration

Expo bundles the direct `process.env.EXPO_PUBLIC_*` reads in `src/config/env.ts`.
These values are public. Never put backend, SMTP, Resend, signing, or OTP secrets
there. Release app initialization requires `EXPO_PUBLIC_ENV=staging` or
`production`, plus explicit HTTPS API/socket URLs. Development mode, embedded
credentials, loopback/emulator URLs, missing URLs and unknown environment names
are refused by the release configuration loader. A development client pointed
at staging still follows the HTTPS rules.

These are startup safeguards, not a claimed build-time check or proof that a URL
is reachable. Build the intended artifact and verify real login on the target
network/device before release. Each platform needs its own Google configuration.

## Provisioning an administrator

Run the existing `npm run seed:admin` only from the trusted operator environment
after migrations and backup/recovery preparation. Temporarily configure:

- `ADMIN_EMAIL`: the intended new administrator identity.
- `ADMIN_PASSWORD`: a unique password of 12-72 UTF-8 bytes with upper/lowercase
  letters and numbers; defaults/placeholders are refused.
- `ADMIN_NAME`: display name.
- `ADMIN_PROVISIONED_BY`: accountable operator identifier.
- `ADMIN_PROVISION_REASON`: reason for creating this administrator.

The command creates a new active admin and `ADMIN_PROVISIONED` audit entry in one
transaction. Its transaction shares the governance lock with admin management
and self-deactivation. A matching active admin is an unchanged, idempotent result:
the command does not reset that account's password. Any matching ordinary,
partner, rejected or suspended account is a conflict. Provisioning cannot promote
or reactivate it. Resolve existing-account ownership and recovery through the
reviewed account workflow, never by changing the script to bypass the check.

The imported provisioning function releases its connection and leaves the shared
pool open; only CLI termination closes the pool. Tests mock its database and do
not delete application users or skip assertions when PostgreSQL is absent.

## Status and partner-review rules

All generic status changes require a reason. They recheck the administrator's
current role/status inside the locked transaction, invalidate old credentials,
and write an audit record. A user cannot manage their own status through the
admin endpoint. Self-deactivation uses the same governance lock and refuses to
disable the last active administrator.

| Current account | Allowed generic action | Condition |
|---|---|---|
| Active account | Suspend | Reason; last-admin protection |
| Pending/rejected partner | Suspend | Reason; prevents application review from reactivating it |
| Suspended USER/ADMIN | Restore ACTIVE | Reason; current authorized administrator |
| Suspended partner | Restore ACTIVE | Latest application APPROVED for the same role, with required details/document |
| Suspended partner | Restore PENDING_VERIFICATION | Latest application PENDING for the same role |
| Pending/rejected partner | Activate directly | Refused; use application review/resubmission |
| Any account | Generic REJECTED | Refused; rejection belongs to application review |

Only the latest pending application of a PENDING_VERIFICATION partner with the
same requested role can be reviewed. Approval requires organization name,
registration number and an HTTPS supporting-document reference. This reference
check is not a substitute for the upcoming private upload/storage authorization
and actual human document review. A suspended account cannot be activated by an
old pending application. Rejection requires its actual note and revokes sessions.
Approval keeps the same role and permits the restricted session to refresh its
profile; it does not create a role-change shortcut.

Email proof is now required for administrator authority, ACTIVE restoration and
partner approval. Phone-proof gates remain unfinished. Existing applicants missing required fields now need the
unfinished partner-completion flow before approval; never insert fake documents
to make the review succeed.

The mobile account-actions screen requires a reason for restoration/suspension,
uses the server-confirmed status, and directs partner decisions to verification.
The backend remains authoritative when a displayed action is no longer eligible.

## Remaining deployment dependencies

Validate actual PostgreSQL locking, concurrent changes, migration adoption,
certificate trust, verified sender delivery, Google account linking and device
builds. Existing container build/port/proxy/TLS deployment artifacts still need
their release integration audit; this configuration work does not certify them.
