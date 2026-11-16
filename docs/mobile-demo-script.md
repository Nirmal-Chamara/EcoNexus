# EcoNexus mobile demo script

Target duration: **under 8 minutes**. Use two reachable app sessions: a collector phone or emulator and an admin phone, emulator, or simulator. Use development-only test accounts and never display real passwords in a recording.

## Before starting

- API, database, migrations, and Expo are running.
- Onboarding is already completed on both sessions, except when the demo explicitly shows it.
- Have unique test emails ready for the household and collector accounts.
- Have the seeded development admin credentials available privately.
- Keep the admin session on the verification queue and the collector session on the pending screen.

## Timed walkthrough

| Time | Action | Evidence to capture |
|---|---|---|
| 0:00–0:45 | On the collector session, show the five-slide onboarding, then choose Household and register a household account. | Household role is active and the household tab bar appears. |
| 0:45–1:30 | Open Profile, edit the phone or name, save, refresh, then log out. | Updated profile data and protected navigation cleared after logout. |
| 1:30–2:30 | Register a Collector account with organization details. | Collector account lands on the Pending Verification screen. |
| 2:30–3:45 | On the admin session, sign in, open Users, then Verification Queue. Open the collector request. | Applicant, organization, role, and submitted date are visible. |
| 3:45–4:30 | Approve the collector request. | Success toast appears; the request leaves Pending. |
| 4:30–5:15 | On the collector session, tap Check status or pull to refresh. | The pending screen changes to Collector tabs without a new login. |
| 5:15–6:15 | On admin, search for the collector, open the detail, and suspend with a reason. | Status badge changes immediately and the activity entry is visible. |
| 6:15–7:00 | Make an authenticated request on the collector session. | The suspended session is forced to sign in again with a generic account-state message. |
| 7:00–7:45 | Briefly show the role/status decision: household active, collector approved then suspended, admin protected. | Final role-based navigation and security behavior are clear. |

## Presenter notes

- Explain that the UI `RoleGate` is cosmetic; the backend still enforces every admin operation.
- Mention that approval updates the user role/status and writes an audit row transactionally.
- If a registration email is already used, switch to the prepared unique email rather than spending demo time recovering it.
- If Wi-Fi isolates the devices, use a development API tunnel and keep the Expo bundle connection separate from the API URL.
