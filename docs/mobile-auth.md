# Mobile authentication and RBAC integration

## Run the app

1. Start PostgreSQL and the backend, then apply migrations with `cd backend && npm run migrate`.
2. Copy `mobile/.env.example` to `mobile/.env`. Set `EXPO_PUBLIC_API_URL` to the reachable backend `/api` URL:
   - Android emulator: `http://10.0.2.2:4000/api`
   - iOS simulator: `http://localhost:4000/api`
   - Physical device: `http://<computer-LAN-IP>:4000/api` on the same network.
3. For password recovery, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `EMAIL_FROM` in `backend/.env`.
4. Run `cd mobile && npm install && npm start`, then launch on a device or simulator.

## Auth state and API usage

`AuthProvider` wraps the app and exposes `useAuth()` from `mobile/src/context/AuthContext.tsx`:

```tsx
const { user, status, signIn, signUp, signOut, refreshUser, updateUser } = useAuth();
```

`status` is `loading`, `signedOut`, or `signedIn`. Register/login set the session; `refreshUser()` reloads `GET /api/users/me`; `signOut()` revokes the current refresh-token family when possible and always clears local tokens. Do not duplicate tokens in feature state or log request payloads.

Use the shared `apiClient` from `mobile/src/services/api.ts` for authenticated requests:

```ts
const response = await apiClient.get('/your/endpoint');
```

It adds the in-memory access token and handles a single in-flight refresh against
`POST /api/auth/refresh-token`. Endpoint responses follow the backend `{ message, data }` envelope.
403 responses are not a reason to bypass authorization; show a permission message in the feature UI.
The backend remains the authorization authority.

## Navigation and role ownership

`RootNavigator` selects the auth flow, pending/rejected account screens, or the role navigator.
Feature screens belong to their existing role tab navigator:

| Role | Owned tab screens |
|---|---|
| `USER` | `mobile/src/screens/user/` |
| `COLLECTOR` | `mobile/src/screens/collector/` |
| `RECYCLING_CENTER` | `mobile/src/screens/recycling-center/` |
| `ADMIN` | `mobile/src/screens/admin/` |

Register nested screens in the matching role navigator or its stack. Keep shared profile routes in
`ProfileStackNavigator`. `RoleGate` and `useHasRole()` may hide role-specific controls, but they are
presentation helpers only; sensitive API operations still require backend authorization.

Public registration supports `USER`, `COLLECTOR`, and `RECYCLING_CENTER`; never expose `ADMIN`.
Partner registration must include `organizationName` and creates a pending verification request.
Admins process these from the verification queue; approval activates the requested role.

## Token and recovery behavior

- Access tokens remain in memory. Refresh tokens are in SecureStore only when “Keep me signed in”
  is enabled; otherwise they remain in memory and are lost when the process exits.
- Biometric authentication gates restoration of a persisted refresh token. It is a local unlock,
  never a replacement for backend authentication.
- A temporary network failure during startup restoration does not delete the persisted refresh token;
  an unauthorized refresh response does. If offline, reconnect and restart the app to retry restoration.
- Password reset requests always return a generic response to avoid account enumeration. Reset codes
  are single-use, expire after 15 minutes, and revoke existing sessions when consumed.
- Do not store credentials in AsyncStorage or include secrets in logs.

## Screen ownership note

The current role navigators already mount operational role screens and shared profile stacks. Teammates
should add new feature screens only to their role's stack and leave `AuthContext`, `apiClient`,
`RootNavigator`, and the token storage contract unchanged unless coordinated with the auth owner.
