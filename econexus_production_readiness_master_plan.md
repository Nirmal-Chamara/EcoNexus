# EcoNexus Production Readiness Master Plan

## User Management, Authentication & RBAC

**Document type:** Technical delivery plan\
**Target outcome:** A secure, scalable, production-ready release of the
User Management, Authentication and Role-Based Access Control (RBAC)
module\
**Source:** User-provided production-readiness checklist\
**Status:** Planning baseline --- implementation status must be verified
against the repository and deployment environment

------------------------------------------------------------------------

## 1. Executive Summary

This plan organizes the supplied checklist into sequenced workstreams
covering:

1.  PostgreSQL database and persistence
2.  Google OAuth 2.0 / OpenID Connect
3.  SMTP and transactional email delivery
4.  Password-reset API and security hardening
5.  API, token and network security
6.  React Native / Expo application release readiness
7.  Production environment configuration
8.  Monitoring, logging and error tracking

The release should proceed through discovery, implementation,
verification, staging and production rollout. Production deployment must
not begin until all security-critical acceptance criteria have been met
and secrets, OAuth credentials, domain records and infrastructure have
been configured for the production environment.

## 2. Goals and Non-Goals

### Goals

-   Use managed PostgreSQL for production persistence.
-   Protect database connections and sensitive authentication data.
-   Enable real Google Sign-In for Web, Android and iOS.
-   Deliver password-reset emails through a dedicated transactional
    email provider.
-   Enforce secure password-reset, session-revocation and rate-limiting
    behavior.
-   Harden API transport, CORS, JWT configuration, security headers and
    distributed rate limiting.
-   Prepare Expo builds and store identifiers for release.
-   Separate development and production environment configuration.
-   Add operational monitoring, health checks and structured logs.

### Non-goals

-   Rebuilding the authentication product from scratch.
-   Replacing existing implementations that are already verified and
    meet the acceptance criteria.
-   Treating a passing unit-test suite as proof that external
    integrations (Google OAuth, SMTP, cloud database, app-store builds)
    work in production.

## 3. Delivery Principles

-   **Verify before changing:** Inspect the current repository and
    deployment configuration before assuming a checklist item is
    missing.
-   **Do not expose secrets:** Never commit `.env` files, OAuth client
    secrets, SMTP credentials, database passwords, JWT secrets or
    production admin passwords.
-   **Separate environments:** Development, preview/staging and
    production must use distinct credentials and configuration.
-   **Fail closed in production:** Mock authentication, development
    reset tokens and permissive CORS must not be available in
    production.
-   **Deploy safely:** Run database migrations as a controlled
    release/deployment step, not as an uncontrolled action in every live
    application process.
-   **Prove integrations end-to-end:** Validate external services in a
    staging environment before production rollout.
-   **Preserve recovery options:** Confirm backups, restore procedures,
    rollback steps and operational ownership before release.

## 4. Workstreams and Implementation Tasks

### Workstream A --- Database & Persistence (PostgreSQL)

**Objective:** Establish reliable, secure, recoverable production
persistence.

  ----------------------------------------------------------------------------------------
  ID                Task              Implementation / evidence          Priority
  ----------------- ----------------- ---------------------------------- -----------------
  DB-01             Select managed    Choose and provision AWS RDS,      Critical
                    PostgreSQL        Supabase, Neon or Railway;         
                                      document environment, region, plan 
                                      and owner.                         

  DB-02             Configure         Set `DATABASE_URL` in the backend  Critical
                    production        production secret store; do not    
                    connection        commit it.                         

  DB-03             Enforce database  In `database.ts`, verify           Critical
                    TLS               production connections use SSL     
                                      with certificate validation, such  
                                      as `rejectUnauthorized: true`.     

  DB-04             Automate          Add a controlled CI/CD             Critical
                    migrations        release-phase migration step (for  
                                      example, `npm run migrate:prod`);  
                                      do not run migrations              
                                      independently in every app         
                                      instance.                          

  DB-05             Configure         Set and load-test pool settings    High
                    connection        appropriate to the deployment,     
                    pooling           using the supplied starting point: 
                                      `max: 20`,                         
                                      `idleTimeoutMillis: 30000`,        
                                      `connectionTimeoutMillis: 5000`.   
                                      Adjust for provider limits and     
                                      instance count.                    

  DB-06             Clean expired     Schedule daily cleanup for expired High
                    tokens            `refresh_tokens` and               
                                      `password_reset_tokens`; validate  
                                      retention and deletion behavior.   

  DB-07             Enable backups    Enable daily snapshots and         Critical
                    and PITR          Point-in-Time Recovery with the    
                                      selected provider; document and    
                                      test restoration.                  
  ----------------------------------------------------------------------------------------

**Acceptance criteria** - Production uses a managed PostgreSQL
service. - Production DB connections require verified TLS. - Migrations
run through a controlled deployment step and complete successfully. -
Pool settings are documented and stay within provider connection
limits. - Expired token cleanup runs on schedule and is observable. - A
backup restore/PITR exercise has been completed and recorded.

### Workstream B --- Google OAuth 2.0 / OpenID Connect

**Objective:** Enable real Google Sign-In on Web, Android and iOS, with
backend token validation.

#### B1. Google Cloud configuration

-   Configure the OAuth consent screen in Google Cloud Console.
-   Set the user type to External where appropriate.
-   Set the application name to EcoNexus and provide support and
    developer contact email addresses.
-   Add verified/owned authorized domains, such as `econexus.com`.
-   Request only the required scopes:
    -   `openid`
    -   `.../auth/userinfo.email`
    -   `.../auth/userinfo.profile`
-   Keep the app in testing with designated test users until
    verification and release requirements are satisfied, if applicable.

#### B2. Create separate OAuth client IDs

  -------------------------------------------------------------------------------------------
  Client                  Configuration              Where it is used
  ----------------------- -------------------------- ----------------------------------------
  Web                     Authorized origins include Backend `GOOGLE_CLIENT_ID` and mobile
                          production web domains and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
                          the local development      
                          origin, such as            
                          `http://localhost:8081`.   

  Android                 Package name must match    `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
                          the app configuration      
                          (`com.econexus.app`);      
                          configure the correct      
                          SHA-1 fingerprint from the 
                          EAS/Android signing        
                          keystore.                  

  iOS                     Bundle identifier must     `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
                          match the app              
                          configuration              
                          (`com.econexus.app`).      
  -------------------------------------------------------------------------------------------

Obtain the Android signing fingerprint using the project's EAS
credentials workflow (the supplied checklist references
`eas credentials`). Record which keystore/build profile the fingerprint
belongs to.

#### B3. Backend validation

-   In `google.service.ts`, reject mock tokens in production.
-   Verify the token audience (`aud`) matches the configured backend
    `GOOGLE_CLIENT_ID`.
-   Validate issuer, signature, expiry and other required OIDC claims
    using a trusted Google verification library or documented
    implementation.
-   Ensure errors do not leak tokens or sensitive identity data into
    logs.

**Acceptance criteria** - Separate Web, Android and iOS OAuth clients
exist and match the deployed app identifiers. - Authorized origins,
domains, package name, bundle identifier and Android SHA-1 are
verified. - Real sign-in succeeds on each supported platform in
staging. - Backend rejects invalid, expired, wrong-audience and mock
tokens in production mode. - OAuth credentials are stored in the correct
environment secret stores.

### Workstream C --- SMTP & Transactional Email Delivery

**Objective:** Deliver password-reset and other security emails
reliably.

#### C1. Select provider

Evaluate the providers listed in the source checklist:

-   Resend
-   SendGrid
-   Postmark
-   AWS SES

Choose one based on deliverability, operational needs, cost, region,
domain verification and expected volume. Do not use personal Gmail SMTP
for production delivery.

#### C2. Authenticate the sending domain

Configure the DNS records supplied by the selected provider:

-   SPF TXT record
-   DKIM record(s), commonly CNAME or TXT
-   DMARC TXT record under `_dmarc`

Start with an appropriate DMARC policy and progress the policy based on
domain monitoring and organizational requirements.

#### C3. Implement branded email templates

Update `email.service.ts` to use a branded HTML password-reset email
containing:

-   EcoNexus logo and branding
-   Reset code or secure reset deep link
-   Clear expiry notice (the source checklist specifies 15 minutes)
-   Security notice explaining what to do if the recipient did not
    request a reset

The source checklist gives `econexus://reset-password?token=...` as an
example deep link. Verify the app's actual routing and secure
token-handling behavior before using it.

**Acceptance criteria** - Provider account and sending domain are
verified. - SPF, DKIM and DMARC records pass provider/domain checks. -
Password-reset emails are delivered to representative mailbox
providers. - Template content, expiry, deep link and security notice are
correct. - Delivery failures are logged safely and can be monitored.

### Workstream D --- Password Reset API & Security Hardening

**Objective:** Protect password-reset flows against token theft, abuse
and session persistence.

  ----------------------------------------------------------------------------------------
  ID                Task              Implementation / evidence          Priority
  ----------------- ----------------- ---------------------------------- -----------------
  PW-01             Hash reset tokens Verify `auth.service.ts` stores    Critical
                    at rest           only a cryptographic hash (source  
                                      specifies SHA-256) of reset        
                                      tokens.                            

  PW-02             Enforce token     Verify the reset-token lifetime is Critical
                    expiry            limited to 15 minutes as           
                                      specified.                         

  PW-03             Revoke sessions   Revoke active refresh tokens and   Critical
                    after password    increment `token_version` so       
                    change            previously issued credentials are  
                                      rejected.                          

  PW-04             Rate-limit reset  Limit                              Critical
                    requests          `POST /api/auth/forgot-password`   
                                      to 3 requests per 15 minutes per   
                                      IP or email; consider              
                                      privacy-preserving key handling.   

  PW-05             Sanitize          Ensure `devResetToken` is never    Critical
                    responses         returned when                      
                                      `NODE_ENV === 'production'`.       

  PW-06             Prevent account   Confirm forgot-password responses  High
                    enumeration       do not reveal whether an email     
                                      address belongs to an account.     

  PW-07             Test token        Test valid, expired, reused,       High
                    lifecycle         malformed and revoked reset        
                                      tokens.                            
  ----------------------------------------------------------------------------------------

The supplied checklist marks token hashing, 15-minute expiry, session
revocation and production response guarding as already implemented.
Treat these as **verification tasks first**; only change code if tests
or inspection show a gap.

**Acceptance criteria** - Reset tokens are stored hashed, expire at the
configured limit and cannot be reused. - Password changes invalidate
existing refresh sessions. - The forgot-password endpoint enforces the
agreed rate limit. - Production responses never contain development-only
reset tokens. - Responses do not disclose account existence. - Security
tests cover the complete reset lifecycle.

### Workstream E --- API, Tokens & Network Security

**Objective:** Apply consistent production security controls across the
backend.

-   **HTTPS/TLS:** Serve production endpoints over HTTPS and configure
    the edge/reverse proxy (Cloudflare, Nginx or AWS ALB) with the
    organization's approved TLS policy. The source checklist specifies
    TLS 1.3; verify compatibility and enforce the chosen policy at the
    edge.

-   **CORS:** Restrict allowed origins in `backend/src/app.ts` to
    explicitly approved production origins, such as
    `https://econexus.com` and `https://admin.econexus.com`. Do not use
    wildcard `*` for credentialed production access.

-   **JWT secret:** Generate a cryptographically random secret using a
    secure generator. The source provides this command as an example:

    ``` bash
    node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    ```

    Store it in a production secret manager. Never commit it or reuse
    development secrets.

-   **Helmet:** Confirm `helmet()` is active in Express and that
    required headers (including HSTS, `X-Content-Type-Options` and frame
    protection) are configured correctly for the deployment.

-   **Distributed rate limiting:** Ensure `authLimiter` in
    `rateLimiter.middleware.ts` uses shared Redis-backed storage in
    multi-instance production so counts are not reset per process or
    isolated to one replica.

-   **Operational review:** Confirm proxy trust settings, secure cookies
    (if used), request-size limits and secret redaction are appropriate
    for the deployment.

**Acceptance criteria** - Production API is reachable only over HTTPS. -
CORS allows only approved origins. - JWT secrets are generated securely
and stored outside source control. - Security headers are verified
against deployed responses. - Rate limits are shared across backend
replicas when horizontally scaled. - Automated security tests and a
production configuration review pass.

### Workstream F --- Mobile Application (React Native / Expo)

**Objective:** Prepare the Expo application for reliable store builds
and secure production API access.

  --------------------------------------------------------------------------------
  ID                Task              Implementation / evidence  Priority
  ----------------- ----------------- -------------------------- -----------------
  MOB-01            Configure EAS     Add/verify `development`,  High
                    profiles          `preview` and `production` 
                                      profiles in                
                                      `mobile/eas.json`.         

  MOB-02            Configure store   Verify Android `.aab` and  High
                    artifacts         iOS `.ipa` build outputs   
                                      for Play Store and App     
                                      Store/TestFlight           
                                      workflows.                 

  MOB-03            Verify app        Confirm package name and   Critical
                    identifiers       bundle identifier are      
                                      `com.econexus.app` where   
                                      intended.                  

  MOB-04            Verify URL scheme Confirm `econexus` is      High
                                      configured and OAuth/reset 
                                      deep links route           
                                      correctly.                 

  MOB-05            Add release       Provide high-resolution    Medium
                    assets            `icon.png`,                
                                      `adaptive-icon.png` and    
                                      `splash.png` at the        
                                      configured asset paths.    

  MOB-06            Configure         Set `EXPO_PUBLIC_API_URL`  Critical
                    production API    to the live HTTPS API base 
                    URLs              URL and                    
                                      `EXPO_PUBLIC_SOCKET_URL`   
                                      to the live secure socket  
                                      endpoint.                  

  MOB-07            Verify            Use standard OS            High
                    certificate       certificate validation;    
                    validation        evaluate certificate       
                                      pinning only if the team   
                                      can safely manage pin      
                                      rotation and recovery.     

  MOB-08            Verify secure     Confirm `tokenStorage.ts`  Critical
                    token storage     uses `expo-secure-store`   
                                      for sensitive tokens on    
                                      supported native           
                                      platforms.                 
  --------------------------------------------------------------------------------

**Acceptance criteria** - EAS profiles build successfully for the
intended environments. - App identifiers and URL scheme match OAuth and
store configuration. - Production builds use production HTTPS API/socket
endpoints. - Sensitive native tokens are stored using the intended
secure storage implementation. - Release assets are present and
correctly referenced. - Preview builds pass authentication, navigation
and API smoke tests.

### Workstream G --- Production Environment Configuration

**Objective:** Define, validate and securely inject production
environment variables.

#### Backend production variables

``` dotenv
NODE_ENV=production
PORT=4000

DATABASE_URL=<managed-production-postgresql-connection-string>

JWT_ACCESS_SECRET=<cryptographically-random-secret>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=14
BCRYPT_ROUNDS=12

GOOGLE_CLIENT_ID=<google-web-client-id>

SMTP_HOST=<transactional-email-smtp-host>
SMTP_PORT=587
SMTP_USER=<smtp-user>
SMTP_PASSWORD=<smtp-api-key>
EMAIL_FROM=<verified-sender-address>

ADMIN_EMAIL=<approved-admin-email>
ADMIN_PASSWORD=<one-time-strong-admin-password>
ADMIN_NAME="System Administrator"
```

#### Mobile production variables

``` dotenv
EXPO_PUBLIC_API_URL=https://api.econexus.com/api
EXPO_PUBLIC_SOCKET_URL=https://api.econexus.com
EXPO_PUBLIC_ENV=production

EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<google-web-client-id>
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<google-ios-client-id>
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<google-android-client-id>
```

**Configuration rules** - These are templates, not real credentials.
Replace placeholders through the deployment secret/configuration
system. - `EXPO_PUBLIC_*` values are bundled into the client application
and must not contain secrets. - Keep backend secrets (database
credentials, JWT secret, SMTP password and admin password) exclusively
in a backend secret manager or protected deployment environment. - Use
separate values for development, preview/staging and production. -
Validate required variables at startup and fail clearly when mandatory
production configuration is missing. - Do not commit `.env.production`
containing real values.

**Acceptance criteria** - All required production variables are
documented and configured in the deployment environment. - No real
secrets are committed to the repository or exposed in client bundles. -
Production startup validation catches missing or malformed
configuration. - Staging and production values are demonstrably
separated.

### Workstream H --- Monitoring, Logging & Error Tracking

**Objective:** Detect failures and provide enough safe diagnostic
information to operate the service.

-   Integrate Sentry for the mobile app (`@sentry/react-native`) and
    backend (`@sentry/node`) if selected by the team.
-   Capture unhandled exceptions and Error Boundary events with useful
    release, platform and environment context.
-   Ensure tokens, passwords, reset links, secrets and sensitive
    personal data are scrubbed from events and logs.
-   Provide `GET /api/health` for service health checks and database
    connectivity status as appropriate.
-   Replace unstructured raw console output with structured JSON logs,
    using Winston or Pino as selected.
-   Define log retention, access controls, alert thresholds and on-call
    ownership.

**Acceptance criteria** - Test exceptions appear in the appropriate
monitoring project. - Sensitive values are not present in logs or
telemetry. - Health checks return expected status and are usable by the
hosting/load-balancer platform. - Logs are structured, searchable and
retained according to policy. - Alerts have an owner and a documented
response procedure.

------------------------------------------------------------------------

## 5. Recommended Delivery Sequence

The following order reflects dependencies and release risk.

  -----------------------------------------------------------------------
  Phase                   Work                    Exit condition
  ----------------------- ----------------------- -----------------------
  0\. Discovery & audit   Inspect current code,   Gap register approved;
                          tests, environment      owners and environments
                          variable usage,         identified.
                          deployment target,      
                          existing integrations   
                          and checklist items     
                          marked already          
                          implemented.            

  1\. Production          Provision managed DB,   Infrastructure and
  foundations             secret storage,         recovery baseline
                          DNS/domain ownership,   ready.
                          deployment              
                          environments, backup    
                          policy and CI/CD        
                          migration step.         

  2\. Identity & email    Configure Google OAuth  Staging sign-in and
  integrations            clients, backend token  password-reset email
                          validation,             flows work end-to-end.
                          transactional email     
                          provider and domain     
                          authentication.         

  3\. Authentication      Verify reset-token      Security tests and
  security                lifecycle, session      configuration review
                          revocation, rate        pass.
                          limiting, response      
                          sanitization, JWT,      
                          CORS, Helmet and HTTPS. 

  4\. Expo release        Configure EAS profiles, Preview builds install
  readiness               app identifiers,        and pass smoke tests.
                          scheme, assets, API     
                          endpoints and secure    
                          storage.                

  5\. Observability       Configure error         Test failures are
                          tracking, health        visible without leaking
                          checks, structured logs secrets.
                          and alerts.             

  6\. Release candidate   Run full automated      Release go/no-go
                          tests, integration      approval.
                          tests, build            
                          validation, migration   
                          rehearsal, backup       
                          restore check and       
                          security checklist.     

  7\. Production rollout  Deploy backend, apply   Production health and
                          migrations in release   critical flows
                          phase, deploy           verified.
                          web/mobile artifacts    
                          and run smoke tests.    

  8\. Post-release        Monitor errors, auth    Stabilization period
                          metrics, email          completed and ownership
                          delivery, DB health and handed over.
                          rate-limit behavior;    
                          resolve regressions.    
  -----------------------------------------------------------------------

## 6. Test & Verification Plan

### Automated checks

-   Backend unit and integration test suites.
-   Mobile unit and component test suites.
-   Type checks and lint checks where configured.
-   Database migration tests against a production-like database.
-   Authentication tests for valid and invalid credentials.
-   Google token validation tests: valid, expired, invalid signature,
    wrong audience and mock token in production.
-   Password-reset tests: valid, expired, reused, malformed and revoked
    token.
-   Rate-limit tests across IP/email keys and across multiple backend
    instances where applicable.
-   CORS and security-header tests.
-   Environment validation tests for missing production variables.

### Staging end-to-end checks

-   Google Sign-In on Web, Android and iOS targets.
-   Forgot-password email delivery to representative mail providers.
-   Password reset from the email link/code through to successful login.
-   Existing sessions rejected after password change.
-   Role-based access checks for permitted and forbidden actions.
-   Mobile preview build uses staging API endpoints.
-   Health endpoint and monitoring events behave as expected.
-   Backup restore/PITR rehearsal is documented.

### Production smoke tests

-   API health endpoint returns healthy status.
-   Database connection and basic persistence operations succeed.
-   Google Sign-In succeeds for an approved test account.
-   Password-reset request and email delivery succeed.
-   Unauthorized and wrong-role requests are rejected.
-   CORS, HTTPS and security headers match the production policy.
-   Monitoring receives a controlled test event.

## 7. RBAC-Specific Verification

The supplied checklist names User Management, Authentication and RBAC as
the module scope, but does not define the actual roles or permission
matrix. Before release:

1.  Inventory all roles currently implemented.
2.  Document each role's allowed actions and resource scope.
3.  Verify authorization is enforced by backend APIs, not only by hiding
    mobile/web UI elements.
4.  Test both allowed and denied access for every sensitive endpoint.
5.  Verify role assignment and privilege changes are audited where
    required.
6.  Confirm admin seeding is secure, repeatable and does not leave a
    default or reusable password.
7.  Confirm users cannot elevate their own roles through
    client-controlled request data.

**Release gate:** The role/permission matrix and negative authorization
tests must be approved before production.

## 8. Risks, Dependencies & Mitigations

  -----------------------------------------------------------------------
  Risk / dependency       Potential impact        Mitigation
  ----------------------- ----------------------- -----------------------
  Incorrect OAuth         Google sign-in fails on Verify each client
  origins, package IDs,   one or more platforms.  configuration against
  bundle IDs or SHA-1                             the actual deployed
                                                  app/build credentials.

  Missing DNS             Password-reset messages Complete SPF/DKIM/DMARC
  authentication          are rejected or sent to setup and provider
                          spam.                   verification before
                                                  release.

  Unmanaged or            Data loss or production Managed DB, automated
  unbacked-up database    outage.                 backups, PITR and
                                                  restore rehearsal.

  Migration failure       Deployment outage or    Rehearse migrations,
                          schema/data             use a release job, back
                          inconsistency.          up before risky changes
                                                  and document rollback.

  Secrets committed or    Account compromise or   Secret scanning, secret
  bundled into app        infrastructure access.  manager, rotation and
                                                  strict separation of
                                                  public `EXPO_PUBLIC_*`
                                                  values.

  In-memory rate limiting Brute-force controls    Shared Redis-backed
  across replicas         can be bypassed across  rate-limit storage.
                          instances.              

  Mock auth or dev reset  Authentication bypass   Production-mode guards
  token enabled in        or sensitive token      and explicit negative
  production              disclosure.             tests.

  Incomplete RBAC         Unauthorized access to  Backend authorization
  enforcement             user or administrative  checks and
                          data.                   role/permission matrix
                                                  tests.

  Unmonitored failures    Longer outage and       Error tracking, health
                          slower incident         checks, structured logs
                          response.               and alert ownership.

  Certificate pinning     App cannot connect      Prefer standard OS
  misconfiguration (if    after certificate       trust unless pinning
  adopted)                rotation.               operations and recovery
                                                  are fully supported.
  -----------------------------------------------------------------------

## 9. Release Go/No-Go Checklist

A production release is **NO-GO** if any Critical item below is
incomplete.

### Infrastructure and data

-   [ ] Managed production PostgreSQL is provisioned.
-   [ ] Database TLS validation is enabled.
-   [ ] Migrations are executed through the release pipeline.
-   [ ] Backups and PITR are enabled and restore-tested.
-   [ ] Connection pool limits are compatible with the provider and
    deployment scale.

### Authentication and authorization

-   [ ] Web, Android and iOS OAuth clients are correctly configured.
-   [ ] Backend validates Google token signature, issuer, expiry and
    audience.
-   [ ] Mock tokens are rejected in production.
-   [ ] Password-reset tokens are hashed, expire and cannot be reused.
-   [ ] Password changes revoke active sessions.
-   [ ] Forgot-password rate limiting is enabled.
-   [ ] Production responses never expose `devResetToken`.
-   [ ] RBAC matrix and backend authorization tests are approved.

### Email

-   [ ] Transactional email provider is configured.
-   [ ] Sending domain is verified.
-   [ ] SPF, DKIM and DMARC checks pass.
-   [ ] Password-reset email and link/code flow are tested end-to-end.

### API and secrets

-   [ ] HTTPS and approved TLS policy are enforced.
-   [ ] CORS is restricted to approved origins.
-   [ ] JWT secret is strong, unique and stored securely.
-   [ ] Helmet/security headers are verified.
-   [ ] Redis-backed rate limiting is configured for multi-instance
    deployment.
-   [ ] No production secrets are committed or exposed in client
    bundles.

### Expo application

-   [ ] EAS development, preview and production profiles are configured.
-   [ ] App identifiers and `econexus` scheme are verified.
-   [ ] Production API/socket URLs use secure endpoints.
-   [ ] Secure token storage is verified.
-   [ ] App icons and splash assets are present.
-   [ ] Android and iOS release builds are validated as applicable.

### Operations

-   [ ] Error tracking is configured and tested.
-   [ ] Health endpoint is available.
-   [ ] Structured logs redact sensitive values.
-   [ ] Alerts and incident owners are documented.
-   [ ] Production smoke tests pass.
-   [ ] Rollback and incident procedures are available.

## 10. Required Project Decisions

The source checklist does not specify the following. Confirm them during
Phase 0 rather than assuming:

-   Production hosting provider and region.
-   Managed PostgreSQL provider and connection limits.
-   Redis provider and deployment topology.
-   Transactional email provider and sending domain.
-   Production web and admin domains.
-   CI/CD platform and migration release-job mechanism.
-   Exact RBAC roles, permissions and resource boundaries.
-   Sentry or alternative monitoring provider.
-   App Store / Play Store release owner and signing credentials.
-   Data retention, backup retention and recovery objectives (RPO/RTO).
-   Expected traffic, availability target and operational support model.

## 11. Suggested Ownership

Assign named owners before implementation.

  Area                                Suggested owner
  ----------------------------------- -------------------------------
  Database, migrations, backups       Backend / DevOps
  Google Cloud OAuth setup            Backend + Mobile
  Email provider and DNS records      DevOps / Domain administrator
  Password reset and token security   Backend
  API/network security                Backend / Security
  EAS profiles and store builds       Mobile
  Environment secrets and CI/CD       DevOps
  Monitoring, logging and alerts      DevOps / Backend
  RBAC role and permission approval   Product owner + Backend
  Release go/no-go                    Project/release owner

## 12. Definition of Done

The module is considered production-ready only when:

1.  All Critical release-gate items are complete.
2.  Existing implementations marked as already implemented have been
    independently verified.
3.  Automated tests and staging end-to-end tests pass.
4.  Real Google OAuth and transactional email have been tested with
    production-equivalent configuration.
5.  RBAC behavior is documented and verified on the backend.
6.  Production secrets and environment configuration are securely
    managed.
7.  Database backup restoration and deployment rollback have been
    rehearsed.
8.  Monitoring, alerting and operational ownership are active.
9.  The release owner has recorded a formal go/no-go decision.

------------------------------------------------------------------------

## Appendix A --- Source Checklist Notes

The supplied source checklist explicitly states that the following
password-reset controls are already implemented and should be verified
before modifying them:

-   Reset tokens are stored hashed in `auth.service.ts`.
-   Reset-token expiry is 15 minutes.
-   Password changes revoke active refresh tokens and increment
    `token_version`.
-   `devResetToken` is guarded in `auth.controller.ts` for production.

The source also identifies `tokenStorage.ts` as already using
`expo-secure-store`. Verify the implementation and platform behavior
before treating it as complete.

This plan structures the supplied checklist into an execution sequence
and adds delivery controls, acceptance criteria and release gates. It
does not claim that any task has already been completed.
