# FRONTEND MASTER PLAN — User Management, Authentication & RBAC (Mobile)

**Project:** EcoNexus — Smart Waste Collection & Recycling Platform (SE5104)
**Module:** User Management, Authentication & RBAC — **React Native client**
**Owner:** Pathum (branch `piyumal-userLogins`)
**Pairs with:** `MASTER_PLAN_AUTH_RBAC.md` (backend) + Figma UI designs
**Stack:** Expo (React Native, TypeScript) · React Navigation · Axios · react-hook-form + zod · expo-secure-store · expo-local-authentication · TanStack Query (optional)

---

## 1. Goals & Guiding Principles

| # | Principle | What it means in practice |
|---|---|---|
| 1 | **Contract first** | Never build a screen before its API endpoint works in Postman/Thunder Client. |
| 2 | **Pixel-faithful to Figma** | Build design tokens + shared components first; screens only compose them. |
| 3 | **Server is the authority** | Client role-gating is *cosmetic*. Real enforcement is the backend `authorize()`. |
| 4 | **Teammates reuse your work** | `AuthContext`, `api` client, `RoleGate`, `RootNavigator` are shared infra; keep their API stable and documented. |
| 5 | **Small vertical chunks** | Each chunk = 1 branch/commit group, runnable, demo-able, with acceptance criteria. |
| 6 | **Secure by default** | Tokens only in SecureStore, never logged, never in AsyncStorage. |

---

## 2. UI Audit — Figma → Feature Map

Screens identified in the shared designs that belong to **your module** (others belong to teammates; you only provide the shell they plug into):

| Figma screen | Feature | Phase | Backend dependency |
|---|---|---|---|
| Splash | Session restore + route decision | F3 / F4 | `POST /auth/refresh` |
| Onboarding (5 slides) | First-launch intro, "seen" flag | F4 | none (local flag) |
| Login & Register (Sign In / Create Account tabs) | Email+password login, registration | F4 | `/auth/login`, `/auth/register` |
| Collector / Facility Partner Portal link | Role-aware registration entry | F4 | `/auth/register` (role + `organizationName`) |
| Pending Verification (collector/center) | Blocked state until approved | F4 / F5 | `GET /users/me` (status) |
| User profile / Edit profile / Settings | Profile CRUD, password change, deactivate | F6 | `/users/me*` |
| Admin dashboard, User management, Verification queue/detail | Admin tools | F7 | `/admin/users`, `/admin/verifications` |
| Role home shells (User / Collector / Center / Admin tabs) | Role navigators | F5 | none |

### ✅ UI ↔ Backend Gap Decisions (RESOLVED — 2026-10-24)

| UI element | Decision | Implementation note |
|---|---|---|
| **Continue with Google / Apple** | ✅ **DESCOPED** | Render as disabled buttons with a "Coming soon" `Toast`. Listed as *future work* in report. Real OAuth requires an extra backend phase + Apple Developer account — out of scope for SE5104. |
| **Forgot password?** link | ✅ **IMPLEMENT** — Backend Chunk 2.5 | Add `POST /auth/forgot-password` (sends email token) + `POST /auth/reset-password` (validates token, sets new password, rotates `token_version`). Requires an email transport (nodemailer + Resend free tier or Gmail SMTP). Frontend: `ForgotPasswordScreen` + `ResetPasswordScreen` added to **Phase F4** (F4.6 + F4.7). |
| **Bio ID** (biometric toggle) | ✅ **KEEP — frontend-only** | Uses `expo-local-authentication` to gate *unlocking the stored refresh token*, not as a replacement for the password login. Biometric setting stored in SecureStore. Gracefully disabled when hardware unavailable or not enrolled. |
| **Keep me signed in** | ✅ **IMPLEMENT** | Checked → refresh token persisted in SecureStore (survives app kill). Unchecked → refresh token kept in memory only (session ends when app is killed). Default = checked. |
| **Email "Valid" tick + password show/hide** | ✅ **PURE UI** | `onChange` zod validation drives the valid tick. `PasswordInput` component wraps `secureTextEntry` toggle. No backend work. |
| **"EcoPoints" / "Active Households" banner** | ✅ **MOCK CARD** | Render as a static/hardcoded card in the relevant role tabs. Wire to teammates' endpoint (e.g., `/api/analytics/summary`) when their module is ready. Document the prop interface now so wiring is a one-liner later. |
| **Phone / address / avatar in profile** | ✅ **ALL COLUMNS EXIST** | Confirmed in `001_auth.sql`: `phone VARCHAR(20) UNIQUE`, `address_text TEXT`, `avatar_url TEXT`. Build all three fields in **F6.2 Edit Profile**. Note: `phone` has a UNIQUE constraint — show inline error if duplicate. `avatar_url` stores a URL string (no file upload in scope; use a placeholder avatar picker or initials fallback). |

> **All 7 gaps resolved. No further decisions outstanding before coding begins.**

---

## 3. Target Architecture

### 3.1 Folder structure (inside the team repo's mobile app)

```
mobile/
├─ app.config.ts                # env via EXPO_PUBLIC_API_URL
├─ src/
│  ├─ api/
│  │  ├─ client.ts              # axios instance + interceptors (single-flight refresh)
│  │  ├─ auth.api.ts            # login/register/refresh/logout
│  │  ├─ users.api.ts           # /users/me*
│  │  └─ admin.api.ts           # /admin/*
│  ├─ auth/
│  │  ├─ AuthContext.tsx        # state machine + actions
│  │  ├─ tokenStorage.ts        # SecureStore wrapper
│  │  ├─ biometric.ts           # expo-local-authentication helper
│  │  └─ useAuth.ts
│  ├─ navigation/
│  │  ├─ RootNavigator.tsx
│  │  ├─ AuthStack.tsx
│  │  ├─ UserTabs.tsx / CollectorTabs.tsx / CenterTabs.tsx / AdminTabs.tsx
│  │  └─ types.ts               # typed route params
│  ├─ components/
│  │  ├─ ui/                    # Button, Input, PasswordInput, Card, Chip, Toast, Loader…
│  │  └─ RoleGate.tsx
│  ├─ screens/
│  │  ├─ auth/                  # Splash, Onboarding, Login, Register, Pending
│  │  ├─ profile/               # Profile, EditProfile, ChangePassword
│  │  └─ admin/                 # UserList, UserDetail, VerificationQueue, VerificationDetail
│  ├─ schemas/                  # zod (mirror backend rules)
│  ├─ theme/                    # colors, spacing, typography, shadows
│  ├─ types/                    # API DTOs (shared with teammates)
│  └─ utils/                    # errorMapper, logger (redacts tokens)
└─ __tests__/
```

### 3.2 Auth state machine (the heart of the module)

```
 ┌────────┐  boot   ┌─────────┐ refresh ok  ┌──────────┐
 │ loading├────────▶│ restore ├────────────▶│ signedIn │
 └────────┘         └────┬────┘             └────┬─────┘
                         │ no/failed token       │ logout / 401-after-refresh /
                         ▼                       │ SUSPENDED / token_version bump
                   ┌───────────┐◀────────────────┘
                   │ signedOut │
                   └───────────┘
```

**RootNavigator decision table**

| State | `user.status` | `user.role` | Renders |
|---|---|---|---|
| loading | — | — | `SplashScreen` |
| signedOut | — | — | `OnboardingScreen` (first launch) → `AuthStack` |
| signedIn | `PENDING_VERIFICATION` | COLLECTOR / RECYCLING_CENTER | `PendingVerificationScreen` |
| signedIn | `REJECTED` | any | `RejectedScreen` (reason + logout) |
| signedIn | `SUSPENDED` | any | Force logout + "Account suspended" message |
| signedIn | `ACTIVE` | USER | `UserTabs` |
| signedIn | `ACTIVE` | COLLECTOR | `CollectorTabs` |
| signedIn | `ACTIVE` | RECYCLING_CENTER | `CenterTabs` |
| signedIn | `ACTIVE` | ADMIN | `AdminTabs` |

### 3.3 Token strategy

- **Access token (15m):** memory only (React ref), attached by request interceptor.
- **Refresh token (14d):** SecureStore only if "Keep me signed in" = true.
- **Single-flight refresh:** on `401`, one shared promise refreshes; queued requests replay; if refresh fails → `forceLogout()`.
- **Rotation:** always overwrite stored refresh token with the new one from `/refresh`. A replayed old token = backend revokes the family, so *never* retry refresh twice.
- **Never log** tokens. `logger.ts` redacts `Authorization`, `refreshToken`, `password`.

---

## 4. Execution Phases

> Legend — **Dep** = backend phase that must be working first. **AC** = acceptance criteria (Definition of done for chunk).

### Phase F0 — Setup & Foundations
**Dep:** Backend Phase 0 (`/health`)

| Chunk | Tasks | AC |
|---|---|---|
| **F0.1 Workspace** | Confirm Expo TS app in team repo; add deps: `axios @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context react-hook-form @hookform/resolvers zod expo-secure-store expo-local-authentication @expo/vector-icons expo-linear-gradient`; ESLint + Prettier; path alias `@/` | App boots on phone via Expo Go |
| **F0.2 Env & API base** | `EXPO_PUBLIC_API_URL` in `.env`; use laptop LAN IP (not `localhost`) for physical device; `.env.example` committed | App can `GET /health` and show "Backend connected" on a temp screen |
| **F0.3 Git workflow** | Branch per phase off `piyumal-userLogins`, e.g. `feat/f1-design-system`; Conventional Commits (`feat(auth): ...`); PR/merge to team `develop` after each phase | Commits map cleanly to progress-journal weeks |

### Phase F1 — Design System (from Figma)
**Dep:** none (can run in parallel with backend)

| Chunk | Tasks | AC |
|---|---|---|
| **F1.1 Tokens** | Extract from Figma: primary green (~`#10B981` family), dark green, mint backgrounds, neutral greys, error red, warning amber; font (Plus Jakarta/Inter — check Figma); spacing scale (4/8/12/16/24); radii (12/16/24/pill); shadows | `theme/` file; one preview screen shows all tokens |
| **F1.2 Core components** | `Button` (primary/secondary/ghost/loading/disabled), `Input` (icon, valid tick, error text), `PasswordInput` (eye toggle), `Checkbox`, `SegmentedTabs` (Sign In / Create Account), `Card`, `Chip/Badge` (status colors), `Avatar`, `Toast`, `Loader`, `EmptyState`, `ScreenContainer` (safe area + keyboard avoiding) | Component gallery screen; each has all states |
| **F1.3 Accessibility baseline** | Min 44pt touch targets, `accessibilityLabel`s, contrast ≥ 4.5:1, dynamic font scaling doesn't break layouts | Manual checklist passed |

### Phase F2 — API Layer & Types
**Dep:** Backend Phase 2 (auth endpoints live)

| Chunk | Tasks | AC |
|---|---|---|
| **F2.1 DTO types** | `types/` for `User`, `Role`, `AccountStatus`, `AuthResponse`, `ApiError { message, code? }`, `VerificationRequest` — mirror backend contract exactly | Compiles; no `any` |
| **F2.2 Axios client** | Base URL, 15s timeout, request interceptor (Bearer), response interceptor (single-flight refresh, queue, replay once), `errorMapper` → user-friendly messages by `code`/HTTP status (400 validation, 401, 403, 409 email taken, 429 rate-limit, 5xx, network) | Unit test: 3 parallel 401s → exactly **1** refresh call |
| **F2.3 Endpoint modules** | `auth.api`, `users.api`, `admin.api` typed wrappers | Each function tested against running backend |
| **F2.4 Token storage** | `tokenStorage.ts`: `saveRefresh / getRefresh / clear`; SecureStore options; fallback guard for web | Token survives app restart; cleared on logout |

### Phase F3 — Auth State (AuthContext)
**Dep:** F2

| Chunk | Tasks | AC |
|---|---|---|
| **F3.1 AuthContext** | State `{status: loading\|signedOut\|signedIn, user, accessToken}`; actions `login`, `register`, `logout`, `refreshUser`, `forceLogout(reason)`; `useAuth()` hook | Context unit-tested with mocked API |
| **F3.2 Session restore** | On boot: read refresh token → `/refresh` → `/users/me` → `signedIn`; else `signedOut`; min splash time ~1s to avoid flicker | Kill/reopen app keeps user signed in (when checked) |
| **F3.3 Force-logout bus** | Axios failure handler calls `forceLogout('SESSION_EXPIRED'\|'SUSPENDED')`; show toast on login screen | Suspend user from DB → next request logs them out with message |
| **F3.4 Biometric unlock (Bio ID)** | `biometric.ts`: check hardware/enrolled; if enabled, app boot requires fingerprint/face *before* using stored refresh token; setting stored in SecureStore; graceful fallback to password | Works on real device; denied/unsupported handled without crash |

### Phase F4 — Auth Screens
**Dep:** F1, F3

| Chunk | Tasks | AC |
|---|---|---|
| **F4.1 Splash & Onboarding** | Splash per Figma; 5-slide onboarding with Skip/Next/Get Started; `hasSeenOnboarding` flag (AsyncStorage OK — non-sensitive) | Shows only on first launch |
| **F4.2 Login screen** | Tabs Sign In/Create Account; email + password (zod, `onChange` valid tick); show/hide password; Keep me signed in; Bio ID chip; loading state; server error banner (invalid creds, rate-limited with retry hint); Google/Apple buttons disabled "Coming soon"; Forgot password → (per decision); "Collector / Facility Partner Portal" link switches register form to partner mode | Can log in as seeded USER & ADMIN; wrong password shows generic message (no email enumeration) |
| **F4.3 Register screen** | Multi-step: (1) choose role *Household / Collector / Recycling Center* → (2) basic details (name, email, phone, password + strength meter + confirm) → (3) org details (`organizationName`, etc. *only for COLLECTOR/CENTER*) → (4) review & submit; zod mirrors backend (8–72 chars, upper/lower/number); **ADMIN never selectable**; handle 409 | USER lands in app; COLLECTOR/CENTER lands on Pending screen |
| **F4.4 Pending / Rejected screens** | Illustration, status text, "Check status" (calls `refreshUser`), "Log out"; rejected shows admin reason | Admin approval + pull-to-refresh moves user into their tabs without re-login |
| **F4.5 Form UX polish** | Keyboard avoidance, focus order, `returnKeyType`, autofill hints (`textContentType`, `autoComplete`), disable double-submit | No layout jump when keyboard opens |

### F4 implementation checkpoint — 2026-10-29

- [x] **F4.1** Splash and five-slide onboarding are wired through `RootNavigator`, with a persisted first-launch flag.
- [x] **F4.2** Login now includes sign-in/create-account tabs, live email validity, password visibility, session persistence, Bio ID preference, generic server errors, disabled Google/Apple placeholders, forgot-password navigation, and partner registration entry.
- [x] **F4.3** Registration now uses role → account → organization → review steps, excludes `ADMIN`, validates password confirmation and 8–72 character strength rules, and maps duplicate email/phone errors.
- [x] **F4.4** Pending and rejected account screens provide status refresh, logout, and an optional backend review-note display.
- [x] **F4.5** Auth forms use keyboard avoidance, focus order, autofill hints, accessible touch targets, and submit loading guards.
- [ ] Manual Android/device acceptance is still required for onboarding persistence, biometric unlock, keyboard layouts, and backend login/registration flows.
- [x] Backend follow-up: `/users/me` now returns the latest rejected verification review note, and rejected verification updates the user to `REJECTED` while invalidating existing sessions.

### Phase F5 — Role-Based Navigation
**Dep:** F3, F4

| Chunk | Tasks | AC |
|---|---|---|
| **F5.1 RootNavigator** | Implement decision table in §3.2; typed navigation; animated transitions between trees | Changing role/status in DB + refresh switches UI |
| **F5.2 Role tab shells** | `UserTabs`, `CollectorTabs`, `CenterTabs`, `AdminTabs` with icons/labels from Figma bottom bars; each tab = placeholder screen **teammates replace** (document the tab-to-teammate ownership) | 4 roles log in → 4 different tab bars |
| **F5.3 `RoleGate`** | `<RoleGate allow={['ADMIN']} fallback={null}>` + `useHasRole()`; cosmetic only | Used in at least one profile/admin menu |
| **F5.4 Integration doc for teammates** | 1-page `docs/mobile-auth.md`: how to call `api` client, `useAuth()`, where to register their screens, how 403 is handled | Teammate can add an authenticated call in <10 min |

### F5 implementation checkpoint — 2026-10-29

- [x] **F5.1** Root flow decisions are centralized in typed `getRootFlow()` logic, with fade transitions when auth, account status, or role trees change.
- [x] **F5.2** User, Collector, Recycling Center, and Admin tab shells use typed route lists, role colors, accessible Ionicons, keyboard-aware tab bars, and documented ownership.
- [x] **F5.3** `RoleGate` is used for the admin-only Profile presentation and covered by navigation tests; it remains cosmetic only.
- [x] **F5.4** `docs/mobile-auth.md` now includes typed tab ownership, `useAuth()`, `apiClient`, `RoleGate`, and 403-handling examples.
- [ ] Manual acceptance is still required with seeded USER, COLLECTOR, RECYCLING_CENTER, and ADMIN accounts to verify each role tab bar and status/role refresh on a device or simulator.

### Phase F6 — Profile & Account Screens
**Dep:** Backend Phase 4.1

| Chunk | Tasks | AC |
|---|---|---|
| **F6.1 Profile screen** | Avatar/initials, name, role badge, verification badge, email/phone, menu rows (Edit, Change password, Biometric toggle, Logout, Deactivate); pull-to-refresh | Data matches `GET /users/me` |
| **F6.2 Edit profile** | Only whitelisted fields; dirty-state detection; discard confirm; optimistic update then reconcile | `PATCH` succeeds; attempting disallowed fields (role/status) is impossible in UI |
| **F6.3 Change password** | Current / new / confirm; strength meter; on success server bumps `token_version` → app logs out & asks re-login (confirm behaviour with backend) | Old sessions invalid |
| **F6.4 Deactivate account** | Two-step confirm modal (type "DELETE" or re-enter password) → logout | Account cannot log in afterwards |
| **F6.5 Logout** | Calls `/logout` (revoke refresh), clears SecureStore + memory, resets nav | Back button can't return to protected screens |

### F6 implementation checkpoint — 2026-10-29

- [x] **F6.1** Profile renders initials, role and verification badges, contact data, account actions, biometric preference, and pull-to-refresh from `/users/me`.
- [x] **F6.2** Edit Profile limits the UI and payload to name/phone, detects dirty state, confirms discard, applies optimistic updates, rolls back failures, and reconciles successful responses.
- [x] **F6.3** Change Password validates the backend strength rules, displays a live strength meter, and signs out after the server invalidates prior token versions.
- [x] **F6.4** Account deactivation requires typing `DELETE`, soft-suspends the account, and signs the user out; backend login rejects suspended accounts.
- [x] **F6.5** Logout revokes the refresh-token family best-effort, clears local tokens and memory state, and remounts the root navigation tree so protected history is unavailable.
- [ ] Manual Android/device acceptance is still required for biometric toggling, keyboard layouts, back-button discard behavior, password/deactivation flows, and live backend profile calls.

### Phase F7 — Admin Screens
**Dep:** Backend Phase 4.2

| Chunk | Tasks | AC |
|---|---|---|
| **F7.1 Admin user list** | Search (debounced 400ms), filter chips (role, status), infinite scroll/pagination, status badges | Handles 1k+ rows smoothly (`FlatList` tuned) |
| **F7.2 Admin user detail** | Full profile, activity summary, **Suspend / Reactivate** with confirm + reason; can't suspend self (hide + backend guards) | Status changes reflected instantly |
| **F7.3 Verification queue** | Pending list with org name, role, submitted date; filter Pending/Approved/Rejected | Pull-to-refresh; empty state |
| **F7.4 Verification detail** | Applicant + organization info, **Approve** / **Reject (reason required)**; success toast; list auto-updates | Approving moves user to ACTIVE; audit log row created (backend) |

### F7 implementation checkpoint — 2026-10-29

- [x] **F7.1** Admin users support debounced search, role/status filters, capped pagination, pull-to-refresh, focus refresh, tuned `FlatList` rendering, and status badges.
- [x] **F7.2** Admin user detail loads the canonical profile and recent audit activity, supports confirmed status changes, hides self-status actions, and relies on backend self-change guards.
- [x] **F7.3** Verification queue supports all status filters, pending counts, pull-to-refresh, focus refresh, empty states, pagination, and tuned list rendering.
- [x] **F7.4** Verification detail shows applicant/organization data, requires rejection notes, displays an accessible success toast, updates status optimistically, and records processing through the backend audit transaction.
- [ ] Manual seeded-admin/device acceptance is still required for large-list performance, admin status transitions, approval/rejection flows, and backend audit visibility.

### Phase F8 — Hardening, Testing & QA
**Dep:** all above

| Chunk | Tasks | AC |
|---|---|---|
| **F8.1 Unit/component tests** | Jest + React Native Testing Library: zod schemas, `errorMapper`, AuthContext transitions, RoleGate, Login/Register forms | ≥ 70% coverage on `auth/`, `schemas/`, `api/` |
| **F8.2 E2E smoke (manual script or Maestro)** | Register → login → profile edit → logout → admin approve → role switch | Script passes on 1 Android + (if available) 1 iOS |
| **F8.3 Security checklist** | See §6 | All boxes ticked |
| **F8.4 UX edge cases** | Offline banner, slow network spinner, token expiry mid-form, back-button on Android, rotate/small-screen layouts, dark status bar | No crashes; logged defects fixed |

### F8 implementation checkpoint — 2026-10-29

- [x] **F8.1** Jest/RNTL coverage now includes auth schemas, error mapping, AuthContext transitions, RoleGate, API wrappers, Login, Register, network status, and core form/accessibility behavior.
- [x] **F8.2** Added the repeatable physical-device smoke script at `docs/mobile-auth-smoke.md` covering registration, login, profile edit, logout, admin approval, role switching, and suspension.
- [x] **F8.3** Completed a frontend security code audit: auth tokens remain in SecureStore/memory, public registration excludes `ADMIN`, update payloads are whitelisted, generic login errors are used, global refresh/403 handling is active, and HTTPS is enforced outside development.
- [x] **F8.4** Added an API-driven offline banner, preserved submit loading guards, added Android registration Back handling, retained dirty-form discard protection, and set the primary app status bar to light content for the dark theme.
- [ ] Physical Android/device execution, real network interruption, rotation/font-scale, and seeded end-to-end acceptance remain manual QA work.

### Phase F9 — Docs, Demo & Handover
| Chunk | Tasks | AC |
|---|---|---|
| **F9.1 Docs** | `docs/mobile-auth.md`, README run steps, screenshots | New teammate runs app in 15 min |
| **F9.2 Demo script** | Self-register household → collector register → admin approves → collector tabs appear → admin suspends → forced logout | Rehearsed, < 8 min |
| **F9.3 Evidence pack** | Screenshots, test output, commit log, Figma-vs-app side-by-side (for report + progress journals) | Folder ready for submission |

### F9 implementation checkpoint — 2026-10-29

- [x] F9.1 README and docs now include Windows/Expo Go quick start, auth/RBAC integration, device smoke instructions, and handover links.
- [x] F9.2 Added timed demo script under eight minutes at `docs/mobile-demo-script.md`.
- [x] F9.3 Added evidence-pack structure for automated results, commit history, screenshots, and Figma-vs-app comparisons.
- [ ] Real device screenshots, Figma exports/side-by-sides, and final commit-output files remain manual handover capture items.

---

## 5. API Contract Cheat-Sheet (confirm against backend before coding)

| Action | Method & Path | Auth | Success | Key errors → UI behaviour |
|---|---|---|---|---|
| Register | `POST /api/auth/register` | — | 201 + tokens + user | 400 field errors → inline; 409 → "Email already registered" |
| Login | `POST /api/auth/login` | — | 200 + tokens + user | 401 → generic "Invalid email or password"; 403 suspended → message; 429 → "Try again in 15 min" |
| Refresh | `POST /api/auth/refresh` | refresh token | 200 + new pair | 401 → `forceLogout` (never retry) |
| Logout | `POST /api/auth/logout` | refresh token | 204 | ignore errors, always clear local |
| Me | `GET /api/users/me` | Bearer | 200 user | 401 → refresh flow |
| Update me | `PATCH /api/users/me` | Bearer | 200 user | 400 → inline |
| Change pw | `PATCH /api/users/me/password` | Bearer | 204 | 400 wrong current → inline |
| Admin users | `GET /api/admin/users?search&role&status&page` | ADMIN | 200 list | 403 → "Not allowed" |
| Set status | `PATCH /api/admin/users/:id/status` | ADMIN | 200 | — |
| Verifications | `GET /api/admin/verifications?status` | ADMIN | 200 list | — |
| Decide | `PATCH /api/admin/verifications/:id` (approve/reject) | ADMIN | 200 | — |

> Exact paths/payloads: copy from backend `docs/auth.md` once Phase 9.1 of backend is done; until then, treat this table as **provisional**.

---

## 6. Frontend Security Checklist (F8.3)

- [ ] Tokens stored **only** in SecureStore / memory; zero in AsyncStorage
- [ ] No tokens, passwords, or full API payloads in `console.log` (release build strips logs)
- [ ] Password fields: `secureTextEntry`, `autoCapitalize="none"`, `autoCorrect={false}`
- [ ] Generic login error (no "email not found" leak)
- [ ] Refresh failure → full local wipe + nav reset
- [ ] 403/401 handled globally, no stuck spinners
- [ ] Client never sends `role` or `status` in update payloads
- [ ] Public register cannot choose `ADMIN`
- [ ] HTTPS enforced for non-dev builds
- [ ] Biometric is a *local unlock*, not an auth bypass
- [ ] Screens with sensitive data hidden in app-switcher (optional `expo-screen-capture`)

---

## 7. Timeline (relative sprints — adjust to your real deadline)

Assuming ~4 weeks of work from today (**Oct 24**):

| Sprint | Focus | Phases | Demo-able output |
|---|---|---|---|
| **S1 (Week 1)** | Foundations + auth core | F0, F1, F2, F3 | App talks to backend; login works via test screen |
| **S2 (Week 2)** | User-facing flows | F4, F5 | Register/Login/Pending + 4 role navigators |
| **S3 (Week 3)** | Profile + Admin | F6, F7 | Full feature set |
| **S4 (Week 4)** | Quality & handover | F8, F9 | Tested, documented, demo-ready |

**Critical path:** Backend Phases 2–3 → F2 → F3 → F4 → F5. Everything else can float.
**If time gets tight, cut in this order:** (1) Bio ID → (2) Deactivate account → (3) Onboarding polish → (4) Admin user detail extras. **Never cut:** login, register, refresh, RootNavigator, verification approve/reject.

---

## 8. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Backend not ready when frontend needs it | Blocks F2+ | Build against a mock server (MSW / simple Express stub) using the contract table; swap base URL later |
| Physical device can't reach `localhost` | Wasted hours | Use LAN IP, same Wi-Fi; or `npx expo start --tunnel` + ngrok for backend |
| Teammates change `api` client / context | Auth breaks | Own these files via `CODEOWNERS`; announce changes in team chat |
| Figma has features backend lacks (Google, forgot password) | Scope creep | Decisions in §2 made up-front |
| Late start (no commits before Oct 2) | Schedule pressure | Strict sprint plan; commit small and often; vertical slices |
| Merge conflicts in shared navigator | Rework | Keep role tab files separate; teammates only edit their own tab stacks |

---

## 9. Definition of Done (per chunk)

1. Works on a real device (Android minimum)
2. TypeScript clean (`tsc --noEmit`), ESLint clean
3. Matches Figma (spacing, colors, states: loading / empty / error)
4. Error paths handled (network, 4xx, 5xx)
5. No secrets/log leaks
6. Committed with a meaningful message; merged to team branch
7. Short note added to progress journal (date + what changed)

---

## 10. Immediate Next Steps (this week)

1. ✅ All gap decisions resolved (see §2) — no open questions
2. **Add Backend Chunk 2.5** to `MASTER_PLAN_AUTH_RBAC.md` — forgot-password email flow (nodemailer/Resend); ensure it's complete before F4.6
3. Run `GET /health` from your phone (F0.2) — use LAN IP, same Wi-Fi
4. Extract Figma tokens → build `theme/` + component gallery (F1)
5. Verify the backend auth endpoints in Postman, then start F2.2 (Axios single-flight refresh) — it's the riskiest piece, do it early
6. Post the integration contract (`useAuth`, `api`, tab ownership + EcoPoints mock prop interface) to teammates
7. In F6.2, remember `phone` is UNIQUE in DB — wire the 409 error to an inline field message

---

*Companion to `MASTER_PLAN_AUTH_RBAC.md`. Update the checkbox lists and timeline as chunks complete.*
