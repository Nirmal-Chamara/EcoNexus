# EcoNexus mobile auth smoke test

Use this script on a physical Android device with Expo Go. Run the backend and mobile app using the instructions in [mobile-auth.md](./mobile-auth.md), and use a seeded development admin account only in a development environment.

## Preconditions

- The API health endpoint responds from the phone at `http://<computer-lan-ip>:4000/api/health`.
- The phone and computer are on the same reachable network, or the API is exposed through a secure development tunnel.
- The mobile app is started from `mobile/` with `npm start`.
- The onboarding flag is cleared by reinstalling the app or clearing its app data before the first-launch check.
- Prepare three unique test emails: one household user, one collector, and one recycling-center applicant.

## Smoke path

1. Launch the app for the first time. Confirm splash appears, onboarding has five slides, Skip/Next/Get Started work, and restarting does not show onboarding again.
2. Register a household account. Confirm the role picker has Household, Collector, and Recycling Center only; `ADMIN` is never selectable.
3. Confirm the household account lands in the household role tabs. Open Profile, edit the name or phone, save, and confirm the updated value remains after refresh.
4. Log out. Confirm protected screens are not reachable with the Android back button.
5. Sign in as the seeded admin. Open Users, search for the collector applicant, open the detail screen, and confirm profile/activity data loads.
6. Open the verification queue. Confirm Pending, Approved, and Rejected filters, pull-to-refresh, empty state, and applicant organization data.
7. Reject one applicant without a reason and confirm submission is blocked. Enter a reason, reject it, and confirm the success message and queue update.
8. Register the second partner applicant, then approve it from the admin verification detail screen. Confirm the user becomes ACTIVE and the audit activity is recorded.
9. Refresh the approved partner session without logging in again. Confirm it leaves the pending screen and opens the appropriate Collector or Recycling Center tabs.
10. Suspend the partner from Admin Users with a reason. Confirm the session is invalidated and the next protected request signs the user out.

## Edge-case pass

- Disable Wi-Fi while making an authenticated request. Confirm the offline banner appears, no spinner remains stuck, and the banner clears after a successful request.
- Submit login, registration, profile edit, and approval while the network is slow. Confirm buttons show a busy state and repeated taps do not create duplicate requests.
- Expire or revoke the access/refresh token in development. Confirm the app clears local auth state and returns to sign-in with a session-expired message.
- On Android, type into registration step 2, press the hardware Back button, and confirm it returns to the previous registration step before leaving the screen.
- Edit a profile field, press the Android Back button, and confirm the discard dialog appears. Test both Keep editing and Discard.
- Test a narrow device and increased system font size. Confirm fields remain reachable and no action button is clipped.
- Confirm dark status-bar content remains readable on the dark EcoNexus background.

Record the device model, Android version, Expo Go version, API commit, and any failed step in the QA issue or handover evidence pack.
