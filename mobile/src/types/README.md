# F2.1 backend DTOs

Import public DTOs from this directory's index. Existing user and admin-service
type imports remain compatible through aliases/re-exports.

| Type | Backend source |
| --- | --- |
| UserSummary / AuthResponse | auth.service.ts explicit auth response; auth.controller.ts wraps it in message/data |
| User | user.controller.ts GET/PATCH /users/me SELECT/RETURNING fields |
| AdminUser | admin.controller.ts getUsers SELECT |
| VerificationRequest | admin.controller.ts getVerifications SELECT and migrations/001_auth.sql nullability |
| ApiError | middleware/errorHandler.ts message and optional code |
| PaginatedMeta | admin.controller.ts response metadata |

User has required nullable phone and required timestamp strings. Address, avatar,
and last-login fields exist in the database but are not returned by these profile
endpoints, so they are not promised by the DTO. AuthUser is local session state,
not an endpoint DTO: profile fields are optional until a profile is fetched.

Verification organization_name is nullable in the database, even though current
partner registration requires it. requested_role is constrained to partner roles.
Admin status updates return only UserSummary, not a complete AdminUser.

Current query validation discards parsed/coerced values: pagination page/limit
can be strings when supplied and numbers when defaulted. DTOs preserve this
wire behavior rather than pretending the backend always serializes numbers.

This is a source-level contract audit, not live endpoint validation. TypeScript
types do not validate untrusted JSON at runtime. Backend implementations remain
the authority; update these DTOs when the corresponding response changes.
