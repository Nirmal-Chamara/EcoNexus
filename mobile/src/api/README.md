# F2.3 / F2.4 API and storage

Use `authApi` from `auth.api`, `usersApi` from `users.api`, and `adminApi` from
`admin.api`. These typed entry points reuse the existing service implementations
and shared Axios client. Existing service imports remain supported.

- authApi: register, login, refresh, logout, logoutAll, requestPasswordReset,
  resetPassword. Auth results unwrap the message/data envelope; commands return void.
- usersApi: getMe, updateMe return User; changePassword, deactivateMe return message.
- adminApi: getUsers, getVerifications preserve metadata; updateUserStatus returns
  the summary envelope; processVerification returns message.

Storage exports `saveRefresh`, `getRefresh`, and `clear`, both directly and on
`tokenStorage`. Existing saveTokens/getRefreshToken/clearTokens calls still work.
Access tokens stay in memory. Native refresh tokens persist only when keepSignedIn
is true. Web uses memory only, including preferences: refresh/reload signs out.
SecureStore errors propagate; native storage failures do not silently downgrade
to insecure persistent storage. Logout clears in-memory session state even when
secure deletion fails. A failed secure deletion must be retried before claiming
the disk token is removed.

The default keychain service and existing keys are retained for compatibility;
new writes use WHEN_UNLOCKED_THIS_DEVICE_ONLY. Existing biometric gating remains
in AuthContext, rather than enabling additional SecureStore biometric prompts.

## Verification (2026-10-26)

- TypeScript and scoped ESLint pass.
- 21 focused tests pass: endpoint routing/error propagation, response unwrapping,
  simulated storage restart, web guard, deletion failures, and single-flight refresh.
- Jest emits an Expo logger warning while resetting native mocks; assertions pass.
- Started backend dev task; GET http://localhost:4000/api/health returned ok.
- Login probe timed out after 10 seconds. Direct configured PostgreSQL connection
  also timed out after 5 seconds. Live endpoint acceptance is NOT complete.

## Remaining acceptance checks

- [ ] Restore configured database connectivity, then exercise every wrapper using
  disposable user/partner accounts and a test admin. Include login/register/refresh,
  profile read/update/password/deactivate, logout/logout-all, password reset using
  the test mailbox, and admin list/status/verification approval/rejection.
- [ ] Android: sign in with persistence enabled, kill and reopen, confirm restored
  session; log out and restart again, confirm signed out.
- [ ] Repeat with persistence disabled: app kill must end the session.
- [ ] Web: sign in, refresh the page, confirm no persisted session.

Do not run account deactivation/password/status tests on real user accounts.
