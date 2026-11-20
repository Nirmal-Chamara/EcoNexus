# F3.1 AuthContext

Wrap the app in AuthProvider and call useAuth from context/AuthContext or hooks/useAuth.

State exposes status (loading/signedOut/signedIn), user, accessToken, and logoutReason.
The access token is memory-only and is exposed as null unless signed in. Storage
notifications keep it synchronized with Axios token rotation.

Actions: login(input, keepSignedIn?), register(input, keepSignedIn?), logout(),
refreshUser(), forceLogout(reason). Reasons are SESSION_EXPIRED or SUSPENDED.
Existing signIn/signUp/signOut names remain aliases; updateUser merges profile edits.

Forced logout clears visible state immediately and propagates secure-storage errors.
Ordinary logout attempts server revocation and clears local state even on failure.
The force-logout subscription is removed on unmount. Session version checks reject
stale profile responses after logout and stale auth responses superseded by logout.

Mocked provider tests cover actions, state transitions, token updates, rejected
login, cleanup failures, and a late profile response. Device session restore,
biometric validation require separate device checks.

## F3.2 / F3.3

Boot keeps the splash visible for at least 1000ms while restoring refresh token,
rotating it through the existing `/auth/refresh-token` route, and fetching
`/users/me`. A failed restore clears partial tokens and ends signed out even if
secure deletion fails. Expired/disabled responses preserve a logout reason.

Axios forwards SESSION_EXPIRED or SUSPENDED through the force-logout subscription.
ACCOUNT_DISABLED is the current backend code for both suspended and rejected
accounts, so the login toast says "suspended or disabled". Ordinary FORBIDDEN
responses and failed login attempts do not force logout. A retried request that
still returns 401 signs out. The raw refresh request has a 15-second timeout.

Login shows a persistent, dismissible toast; dismissLogoutReason clears it.
Successful authentication also clears the previous reason.

Verification: TypeScript, scoped ESLint, and 12 focused context/interceptor tests
passed. Manual acceptance is still pending:

- [ ] Android: log in with Keep me signed in, kill/reopen, verify restored profile.
- [ ] Repeat without persistence and confirm signed out after app kill.
- [ ] Suspend a disposable account in the running backend, make a protected request,
  and verify navigation to login plus the suspension toast.
- [ ] Expire/revoke refresh token and verify session-expired toast; dismiss it.
- [ ] Confirm screen-reader announcement of the toast on the physical device.
