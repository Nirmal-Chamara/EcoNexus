# 🌱 EcoNexus — Project Status & Development Roadmap

**Document Version:** 1.0  
**Generated Date:** October 25, 2026  
**Project:** EcoNexus — Smart Waste Collection & Recycling Platform  
**Target Roles:** Household Users, Waste Collectors, Recycling Centers, System Administrators  

---

## 📌 Executive Summary

**EcoNexus** is an end-to-end smart waste collection, recycling, and sustainability platform designed to modernize municipal and private waste management. The platform features:
- **Mobile Client:** Built with React Native & Expo (TypeScript), with role-based navigation and dark-mode eco aesthetic.
- **Backend API:** Node.js, Express, TypeScript, and PostgreSQL with PostGIS for spatial queries.
- **Real-Time Engine:** Socket.IO for live driver location tracking and instant status notifications.
- **AI Microservice:** Python FastAPI service for AI-powered automated waste classification (Phase 2).

This document outlines the current development progress, component breakdown, completed implementations, and the technical roadmap of what remains to be completed.

---

## 📊 High-Level Completion Matrix

| Module / Layer | Status | Progress | Key Deliverables Completed |
| :--- | :---: | :---: | :--- |
| **Authentication & Security** | Completed | `100%` | JWT, bcrypt, refresh rotation, password reset, role gate |
| **Admin Portal** | Near Complete | `90%` | Verification queue, user audits, account suspension |
| **Collection & Collector (Kanishka's Part)** | In Progress | `85%` | PostGIS queries, atomic allocations, socket engine, mobile UI |
| **Database & Migrations** | Advanced | `80%` | PostGIS setup, schemas for users, collections, and flags |
| **Shared Mobile Design System** | Completed | `100%` | Typography, dark theme, button/input/spinner components |
| **Waste Management** | In Progress | `50%` | Categories, basic listing schema, category selector screen |
| **Citizen / User Pickup Flow** | In Progress | `30%` | Bottom tab navigation, profile; pending request form & tracking |
| **Recycling Center Flow** | Early Stage | `20%` | Navigation configured; placeholder screens created |
| **Impact & Rewards** | Early Stage | `15%` | Database tables defined; calculations & UI pending |
| **AI Classification Service** | Phase 2 | `25%` | FastAPI project structure, Dockerfile; inference pipeline pending |

---

## ✅ Part 1: What Has Been Done

### 1. Authentication, Security & Authorization (`100%`)
* **Backend Services:**
  - Secure registration, login, and token refresh mechanisms.
  - Password hashing via `bcrypt` and token revocation versioning.
  - Forgot password / reset password workflow via `nodemailer` and temporary secure reset tokens (`002_password_reset.sql`).
  - Middleware: `authenticate` (validates JWT) and `authorize(...roles)` for route-level access control.
* **Mobile Client:**
  - Complete authentication screens: `LoginScreen`, `RegisterScreen`, `ForgotPasswordScreen`, `ResetPasswordScreen`, `PendingVerificationScreen`, `RejectedAccountScreen`, and `SplashScreen`.
  - Secure key-value storage using `expo-secure-store` with interceptor for automatic single-flight token refresh (`api.ts`).
  - `RoleGate` component dynamically directing users into their respective role navigators upon login.

### 2. Administrator Management (`90%`)
* **Backend:**
  - Administrative endpoints for user management (`/api/admin/users`) and pending identity verifications (`/api/admin/verifications/:id`).
* **Mobile:**
  - `VerificationQueueScreen` & `VerificationDetailScreen`: Review government IDs, licenses, and business registrations for new collectors and recycling centers.
  - `UserListScreen` & `UserDetailScreen`: Audit platform users, view activity, and suspend/reactivate accounts.

### 3. Collection Management & Collector Flow (Kanishka's Module) (`85%`)
* **Database & PostGIS (`backend/migrations/002_collections.sql`):**
  - `collector_profiles`: Tracks vehicle type, maximum payload capacity, PostGIS Point `current_location` (SRID 4326) with GIST spatial index, service area Polygon, availability toggle, and ratings.
  - `pickup_requests`: Stores waste collection orders with spatial coordinates (`pickup_location`), human-readable address, waste type, estimated weights, notes, and photos.
  - `pickup_allocations`: Links accepted pickups to specific collectors.
* **Backend Services & API:**
  - PostGIS geospatial query `ST_DWithin` and `ST_DistanceSphere` to calculate distance between collector and pickup requests in meters.
  - Atomic database transactions (`BEGIN / COMMIT / ROLLBACK`) for claiming pickups (`PENDING` $\rightarrow$ `ACCEPTED`) preventing double-booking.
  - Status transition state machine: `PENDING` $\rightarrow$ `ACCEPTED` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `COMPLETED` / `CANCELLED`.
  - Endpoints mounted:
    - `/api/pickup/request` (Create pickup)
    - `/api/pickup/nearby` (Radius search)
    - `/api/pickup/:id/accept` (Claim request)
    - `/api/pickup/:id/status` (Update lifecycle)
    - `/api/collector/location` (Live GPS ping)
    - `/api/collector/profile` & `/api/collector/pickups`
* **Real-Time WebSockets (`backend/src/sockets/pickup.socket.ts`):**
  - Room subscriptions: `pickup:{id}`, `collector:{id}`, and `collectors_available`.
  - Broadcast events: `new_pickup_request`, `pickup_status_changed`, `collector_location_updated`.
* **Mobile Collector Application:**
  - `DashboardScreen`: Toggle online/offline status, view trip metrics, active assignment card with **Start Trip** and **Complete Collection** actions, and GPS synchronization button.
  - `RequestsScreen`: Dual-tab view for discovering nearby unassigned waste with live distance in km, and viewing history of assigned collections.
  - `ServiceAreaScreen`: Configure fleet vehicle (Truck, Van, Pickup, Three-Wheeler, Bicycle) and max payload capacity.

### 4. Architecture & Mobile Design System (`100%`)
* **Theme & Styling:** Curated dark-mode palette (`colors.background: #0A0F0D`, `colors.primary: #22C55E`, role badges: Collector `#F59E0B`, Admin `#A855F7`, Center `#3B82F6`).
* **Components:** Reusable `Button`, `FormInput`, `LoadingSpinner`, and navigation stacks.
* **Navigation Architecture:** `RootNavigator` $\rightarrow$ `RoleGate` $\rightarrow$ `UserNavigator` / `CollectorNavigator` / `AdminNavigator` / `RecyclingCenterNavigator`.

---

## 🚀 Part 2: What Still Needs to Be Done (Roadmap)

### Milestone 1: Household / Citizen User Experience (Immediate Priority)
- [ ] **Create Waste Listing Screen (`CreateWasteListingScreen.tsx`):**
  - Implement photo capture/gallery upload using `expo-image-picker`.
  - Geolocation picker or address search for pickup spot.
  - Category and weight selector connecting to `pickupService.createPickup(...)`.
- [ ] **Real-Time Pickup Tracking Screen (`PickupTrackingScreen.tsx`):**
  - Integrate `react-native-maps` showing the pickup origin marker and live moving collector marker.
  - Connect to Socket.IO (`pickup.socket.ts`) to stream collector GPS coordinates in real-time.
- [ ] **My Listings & History (`MyListingsScreen.tsx`):**
  - Active and historical listing status tracking.

### Milestone 2: Recycling Center Management Portal
- [ ] **Backend Endpoints (`/api/recycling`):**
  - Log received material batches from collectors.
  - Track material inventory and conversion rates (e.g., input plastic weight vs output flakes).
- [ ] **Mobile Screens:**
  - `IncomingMaterialsScreen.tsx`: Accept and scan delivered loads from collectors.
  - `ProcessingScreen.tsx`: Record processing stages (sorting, shredding, baling).
  - `CapacityScreen.tsx`: Configure accepted materials and current warehouse capacity.

### Milestone 3: Environmental Impact & Gamified Rewards
- [ ] **Impact Engine (`impact.service.ts`):**
  - Calculate metric tons of $CO_2$ avoided, trees saved, and water preserved based on weight of recycled plastic, glass, and paper.
- [ ] **Rewards System (`reward.service.ts`):**
  - Award eco-points per kilogram of verified collected waste.
  - `RewardsScreen.tsx`: Display points balance and partner discount vouchers.
- [ ] **Impact Dashboard (`ImpactDashboardScreen.tsx`):**
  - Visual charts showing personal and municipal environmental contributions.

### Milestone 4: AI Waste Classifier Microservice (Phase 2)
- [ ] Train/fine-tune lightweight CNN (MobileNetV3 or YOLOv8-cls) for waste category inference.
- [ ] Implement inference endpoint in `ai-service/app/api/routes/classification.py`.
- [ ] Connect mobile camera to AI endpoint to suggest waste classification automatically upon photo capture.

### Milestone 5: Testing, CI/CD & Production Deployment
- [ ] Automated Jest unit and integration tests in `backend/tests/` for pickup and collector endpoints.
- [ ] End-to-end API test suites using `supertest`.
- [ ] Docker Compose orchestration validation (`docker-compose.yml` for DB, Backend, and AI Service).

---

## 👥 Module Ownership & Team Responsibilities

| Contributor | Focus Area | Responsibilities |
| :--- | :--- | :--- |
| **Kanishka Liyanage** | **Collection Management** | PostGIS spatial queries, Pickup lifecycle state machine, Collector profile & fleet management, WebSocket tracking, Collector mobile screens |
| **Pathum Piyumal** | **Auth & Administration** | User authentication, JWT & security, verification queue, Admin management screens |
| **Nirmal Chamara** | **Waste & Database Core** | Core database schema, seed runners, waste categories, recycling center integration |

---

## 🏁 Recommended Immediate Next Step

1. **Commit and push** current collector frontend changes on branch `Kanishka` to GitHub.
2. Build the **User Pickup Tracking Screen (`PickupTrackingScreen.tsx`)** to complete the circular interaction between citizens and collectors.
