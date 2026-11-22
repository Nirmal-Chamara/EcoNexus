# Phone input and SMS verification readiness

Status: phone input/profile foundation implemented; automated SMS OTP is not yet
implemented. Provider selection is pending. Resend is the email provider and is
not assumed to supply SMS verification.

## Current contract

Backend registration and profile validation and the mobile signup/profile forms
use `libphonenumber-js/max`, pinned to the same version in both packages. New
numbers require an explicit `+` country calling code. Spaces, parentheses and
hyphens are removed before checking full numbering-plan metadata. There is no
default country guess, text extraction, extension support or silent trunk-prefix
repair. For example, `+94 77 123 4567` becomes `+94771234567`; `0771234567` needs
an explicit country code. Validation does not establish allocation, reachability,
SMS capability or ownership. Refresh pinned metadata deliberately as plans change.

Optional blank signup phones are stored as NULL. PATCH `/api/users/me` omits a
phone to leave it unchanged and accepts NULL/blank to clear it. The app sends only
changed fields, sends explicit NULL to remove a phone and updates account state
only after server success. An unchanged legacy phone does not block a name edit.
New/edited names are trimmed before minimum-length validation.

Existing unique phone semantics are retained. Migration 007 adds an expression
index so common formatting aliases cannot occupy separate accounts. Existing
rows are preserved. Collisions fail the migration transaction instead of choosing
an owner, deleting data or marking any phone verified. Both database phone
constraints return `PHONE_EXISTS` to signup/profile clients. Concurrent signup
email collisions return `EMAIL_EXISTS` when the database constraint wins the race.

## Existing-data rollout

1. Back up the database and follow the audited migration-ledger adoption process.
2. Run `npm run audit:phones` in backend (or `audit:phones:prod` after building).
   This reads phone values and prints aggregate counts only. It does not print
   names, account IDs or phone numbers, modify rows, infer countries or send SMS.
   Invalid/ambiguous values or canonical collisions cause a nonzero exit status.
3. Resolve collisions and invalid values through a reviewed account-owner process
   with access-controlled tooling. An aggregate report does not identify which
   user owns a number. Do not arbitrarily keep one account or add a country code.
4. Apply migration 007 after 006 using the migration runner. Test formatted aliases,
   NULL clears and concurrent duplicates on isolated PostgreSQL. The index remains
   the final authority if the audit and migration observe concurrent writes.
5. Verify signup/profile editing on actual supported builds. Existing native dependency ranges in `package.json` are preserved. Installing
   the phone library also aligned stale lock entries for safe-area-context and
   screens with those declared ranges; actual device acceptance remains required.

Neither the audit nor migration 007 was executed against a live database during
implementation. No existing phone values were rewritten and no SMS was sent.

## Remaining OTP workflow

Select the actual SMS/managed verification provider, supported Sri Lankan
destinations, sender registration and budget. Then implement account/destination/
purpose-bound challenges, expiry, bounded attempts, resend invalidation, durable
provider jobs, distributed send/verify/spend limits and delivery ingestion.

Verification must commit the verified number only after proof. Replacing a
verified number must preserve the old one until success and require appropriate
reauthentication. Ordinary profile updates must not overwrite verified ownership
when that schema lands. No phone-proof access gate is enabled before users have
a real verification workflow. Password recovery and phone login/MFA remain
separate purposes.

Automated tests cover canonical inputs, invalid/ambiguous values, NULL clearing,
profile failures, unchanged legacy phones, duplicate constraint mapping and
aggregate audit reporting. They do not prove live PostgreSQL index semantics or
actual SMS delivery. See the open Phase 4 gates in `masterplan.md`.

References: [library documentation](https://github.com/catamphetamine/libphonenumber-js)
and [ITU E.164 numbering plan](https://www.itu.int/rec/T-REC-E.164-202602-I).
