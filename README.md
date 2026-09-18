# EcoNexus — Smart Waste Collection & Recycling Platform

- `mobile/`         Expo (React Native + TypeScript)
- `backend/`        Node.js + Express + TypeScript, PostgreSQL/PostGIS
- `ai-service/`     FastAPI (Python) — waste image classification, Phase 2
- `database/`       migrations + seeds, decoupled from backend so any service can apply them
- `docs/`           architecture, API docs, DB schema, test plan, deployment guide, SRS
- `tests/`          cross-service unit / integration / e2e tests
- `infrastructure/` Dockerfiles + nginx reverse proxy config for prod
- `scripts/`        setup.sh, dev.sh, test.sh, seed.sh

## Quick start
```
./scripts/setup.sh   # copies all .env.example files, installs dependencies
# fill in mobile/.env, backend/.env, ai-service/.env with real keys
./scripts/dev.sh      # starts db + backend + ai-service in Docker
cd mobile && npm start
```

## Environment files
Every service has its own `.env.example`:
- `mobile/.env.example`      API/socket URLs, Google Maps key, Firebase client config, Cloudinary preset
- `backend/.env.example`     DB connection, JWT secrets, Firebase Admin creds, Cloudinary, Socket.IO, AI service URL
- `ai-service/.env.example`  model path, Cloudinary, internal API key (shared with backend)
- `.env.example` (root)      Postgres container config for docker-compose
