# Mobile authentication and RBAC integration

## Run the app

1. Start PostgreSQL and the backend, then apply migrations with `cd backend && npm run migrate`.
2. Copy `mobile/.env.example` to `mobile/.env`. Set `EXPO_PUBLIC_API_URL` to the reachable backend `/api` URL:
   - Android emulator: `http://10.0.2.2:4000/api`
   - iOS simulator: `http://localhost:4000/api`
   - Physical device: `http://<computer-LAN-IP>:4000/api` on the same network.
3. For password recovery, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `EMAIL_FROM` in `backend/.env`.
4. Run `cd mobile && npm install && npm start`, then launch on a device or simulator.

For the complete physical-device acceptance path, follow [mobile-auth-smoke.md](./mobile-auth-smoke.md).
For the timed presentation flow, follow [mobile-demo-script.md](./mobile-demo-script.md).

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
Handle feature-level 403 responses as a permission state and keep the request behind the normal
loading/error boundary:

```ts
try {
  const { data } = await apiClient.get<ApiEnvelope<FeatureData>>('/your/endpoint');
  setData(data.data);
} catch (error) {
  setError(mapApiError(error, 'You cannot access this feature.'));
}
```

Do not retry a 403 by changing the role locally. The backend remains the authorization authority;
the global client only refreshes once for a 401 and signs out when that refresh fails.

## Navigation and role ownership

`RootNavigator` selects the auth flow, pending/rejected account screens, or the role navigator.
It re-evaluates the decision table whenever `useAuth().user` changes, so a successful
`refreshUser()` moves an approved partner from the pending screen into the correct role tabs.
The root flow fades between auth, restricted-account, and role trees; each nested stack/tab
navigator keeps its own typed route parameter list.

Feature screens belong to their existing role tab navigator:

| Role | Navigator | Tabs / owned screens |
|---|---|---|
| `USER` | `UserNavigator` | Home, Rewards, Profile |
| `COLLECTOR` | `CollectorNavigator` | Dashboard, Requests, Area, Profile |
| `RECYCLING_CENTER` | `RecyclingCenterNavigator` | Dashboard, Incoming, Processing, Profile |
| `ADMIN` | `AdminNavigator` | Dashboard, Users, Verify, Reports, Profile |

Add a screen to the matching navigator and its typed `*TabParamList`; do not edit another
role's navigator. Add nested profile routes to `ProfileStackNavigator` only when the screen
is shared by all roles.

For presentation-only controls, use `RoleGate`:

```tsx
import RoleGate from '../navigation/RoleGate';

<RoleGate allow={['ADMIN']} fallback={null}>
  <AdminOnlyMenuRow />
</RoleGate>;
```

`RoleGate` and `useHasRole()` improve the UI but are not security boundaries. The backend must
still authorize every protected operation.

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
- API requests without a response raise the global offline banner; the next successful API response
  clears it. Submit buttons remain disabled while their request is in flight.
- Registration handles the Android hardware Back button by returning to the previous form step before
  leaving the auth flow. Dirty profile edits use the navigation discard confirmation.
- Password reset requests always return a generic response to avoid account enumeration. Reset codes
  are single-use, expire after 15 minutes, and revoke existing sessions when consumed.
- Do not store credentials in AsyncStorage or include secrets in logs.

## Screen ownership note

The current role navigators already mount operational role screens and shared profile stacks. Teammates
should add new feature screens only to their role's stack and leave `AuthContext`, `apiClient`,
`RootNavigator`, and the token storage contract unchanged unless coordinated with the auth owner.
