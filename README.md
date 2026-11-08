# EcoNexus — Smart Waste Collection & Recycling Platform

- `mobile/`         Expo (React Native + TypeScript)
- `backend/`        Node.js + Express + TypeScript, PostgreSQL/PostGIS
- `ai-service/`     FastAPI (Python) — waste image classification, Phase 2
- `database/`       migrations + seeds, decoupled from backend so any service can apply them
- `docs/`           architecture, API docs, DB schema, test plan, deployment guide, SRS
- `tests/`          cross-service unit / integration / e2e tests
- `infrastructure/` Dockerfiles + nginx reverse proxy config for prod
- `scripts/`        setup.sh, dev.sh, test.sh, seed.sh

## Quick start — Windows / Expo Go

The shortest path for a new teammate to run the mobile app is:

```powershell
# From the repository root
docker compose up -d db

cd backend
npm install
npm run migrate
npm run dev
```

In a second PowerShell window:

```powershell
cd C:\path\to\EcoNexus\mobile
npm install
# Copy .env.example to .env and use the computer LAN IP for a physical phone.
npm start
```

Install Expo Go on Android, keep the phone and computer on the same reachable Wi-Fi,
and scan the QR code printed by Expo. Verify the API first at
`http://<computer-lan-ip>:4000/api/health`. If the network blocks LAN access, use
`npx expo start --tunnel` for the bundle and expose the backend separately.

For detailed auth/RBAC setup, device smoke testing, and troubleshooting, see
[mobile-auth.md](docs/mobile-auth.md) and [mobile-auth-smoke.md](docs/mobile-auth-smoke.md).

The Bash helpers remain available for macOS/Linux/WSL:

```bash
./scripts/setup.sh
./scripts/dev.sh
```

## Environment files
Every service has its own `.env.example`:
- `mobile/.env.example`      API/socket URLs, Google Maps key, Firebase client config, Cloudinary preset
- `backend/.env.example`     DB connection, JWT secrets, Firebase Admin creds, Cloudinary, Socket.IO, AI service URL
- `ai-service/.env.example`  model path, Cloudinary, internal API key (shared with backend)
- `.env.example` (root)      Postgres container config for docker-compose
