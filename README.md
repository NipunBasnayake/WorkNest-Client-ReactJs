# WorkNest Client (React + TypeScript)

WorkNest is a multi-tenant SaaS workspace platform UI built with React, TypeScript, Vite, Tailwind CSS v4, Zustand, Axios, and STOMP realtime messaging.

This client serves two major product areas:

- Public experience (landing, authentication, account recovery flow)
- Tenant workspace (employees, teams, projects, tasks, attendance, leave, announcements, chat, notifications, analytics, settings)
- Platform console (tenant management, analytics, platform settings)

The design system is token-driven with light/dark theme support and a unified purple brand language.

## Table of Contents

- Project Highlights
- Tech Stack
- Architecture Overview
- Module Coverage
- Authentication and Session Lifecycle
- Realtime Messaging
- Project Structure
- Environment Variables
- Getting Started
- Available Scripts
- Routing Map
- UI and Design System
- Testing
- Build and Deployment
- Troubleshooting
- Contribution Guide
- License

## Project Highlights

- React 19 + TypeScript strict mode
- Vite build pipeline with vendor chunk splitting
- Tailwind CSS v4 and custom design tokens
- Stateful auth/session management via Zustand
- API client with refresh-token retry flow and session-expiration fallback
- Role-based route guards for tenant and platform boundaries
- STOMP realtime subscriptions for chat and notifications
- Theme-aware, responsive UI from public landing through app dashboards

## Tech Stack

### Core

- React 19
- TypeScript 5
- Vite 8
- React Router 7

### Styling and UX

- Tailwind CSS v4
- Token-based CSS variables in src/index.css
- Lucide icons

### Data, Networking, and State

- Axios
- Zustand
- STOMP over WebSocket using @stomp/stompjs

### Quality and Tooling

- ESLint 9
- Vitest
- Testing Library
- jsdom test environment

## Architecture Overview

WorkNest client follows a modular, domain-first architecture.

- App shell and providers are initialized in src/App.tsx
- Routing is centralized in src/app/router/index.tsx
- Feature logic is split by business domain under src/modules
- Shared API, HTTP and realtime infrastructure lives under src/services
- Auth and network state are managed by centralized Zustand stores

High-level flow:

1. ThemeProvider applies initial and persisted theme
2. NetworkProvider tracks browser connectivity state
3. AuthProvider bootstraps session using stored tokens
4. Router enforces guest, tenant, platform, and role guards

## Module Coverage

Current client modules include:

- Analytics
- Announcements
- Attendance
- Auth
- Chat
- Employees
- Leave
- Notifications
- Platform
- Projects
- Settings
- Tasks
- Teams

## Authentication and Session Lifecycle

The auth system supports both platform and tenant sessions.

Key behavior:

- Access and refresh tokens are stored in local storage
- Tenant context and session type are persisted
- Access token expiration is handled by automatic refresh
- Refresh failure triggers hard logout to session-expired route
- Password-change-required flow is handled at login boundary
- Route guards block unauthorized role or area access

## Realtime Messaging

Realtime functionality is implemented via STOMP over WebSocket.

Capabilities:

- Auto broker URL resolution from API base URL
- Optional explicit WS URL via env variable
- Reconnect with heartbeats
- Destination subscription management with cleanup
- Tenant and auth headers attached when available
- Config-driven destination lists for chat and notifications

## Project Structure

~~~text
src/
  app/
    guards/
    layouts/
    providers/
    router/
  components/
    auth/
    common/
    navigation/
    sections/
  constants/
  hooks/
  modules/
    analytics/
    announcements/
    attendance/
    auth/
    chat/
    employees/
    leave/
    notifications/
    platform/
    projects/
    settings/
    tasks/
    teams/
  pages/
    app/
    platform/
    public/
  services/
    api/
    http/
    realtime/
  store/
  test/
  types/
  utils/
~~~

## Environment Variables

Create a local env file in project root.

Suggested file:

~~~bash
.env.local
~~~

Recommended variables:

~~~env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws

# Optional
VITE_REALTIME_DISABLED=false
VITE_CHAT_TOPICS=/topic/chat.global,/user/queue/chat
VITE_NOTIFICATIONS_TOPICS=/topic/notifications.global,/user/queue/notifications
~~~

Notes:

- If VITE_WS_URL is not provided, WS URL is derived from VITE_API_BASE_URL
- If VITE_REALTIME_DISABLED is true, websocket client remains inactive
- Topic variables accept comma-separated destination strings

## Getting Started

### Prerequisites

- Node.js 20+ (recommended)
- npm 10+

### Install

~~~bash
npm install
~~~

### Run Development Server

~~~bash
npm run dev
~~~

### Build Production

~~~bash
npm run build
~~~

### Preview Production Build

~~~bash
npm run preview
~~~

## Available Scripts

- npm run dev: Start Vite dev server
- npm run build: Type-check and build production bundle
- npm run lint: Run ESLint
- npm run preview: Preview production build locally
- npm run test: Run Vitest in watch mode
- npm run test:run: Run Vitest once

## Routing Map

Public area:

- /
- /login
- /register and /register-company
- /force-password-change
- /session-expired
- /unauthorized

Tenant area:

- /app/dashboard
- /app/employees, /app/teams, /app/projects, /app/tasks
- /app/attendance, /app/leave
- /app/announcements, /app/notifications, /app/chat
- /app/analytics, /app/profile, /app/settings

Platform area:

- /platform/dashboard
- /platform/tenants
- /platform/analytics
- /platform/settings
- /platform/profile

Guarding model:

- GuestGuard for auth routes
- TenantGuard for tenant workspace
- PlatformGuard for platform console
- TenantRoleGuard for role-specific module access

## UI and Design System

Design is driven by tokenized CSS variables in src/index.css.

System characteristics:

- Light and dark palettes
- Brand primary and accent scales
- Surface, text, border, and glow tokens
- Reusable shadow scale
- Shared motion utilities (fade-up, pulse-glow, float)
- Consistent spacing and typography across public and app shells

## Testing

Testing stack:

- Vitest
- @testing-library/react
- @testing-library/jest-dom
- jsdom environment

Current setup file:

- src/test/setup.ts

Run tests:

~~~bash
npm run test
~~~

Run once:

~~~bash
npm run test:run
~~~

## Build and Deployment

Production build command:

~~~bash
npm run build
~~~

Build output:

- dist directory

Vite config includes manual chunk grouping for:

- react
- router
- network
- state
- icons

## Troubleshooting

### Dev server exits with code 1

Try:

1. Ensure dependencies are installed: npm install
2. Validate env values in .env.local
3. Ensure API endpoint is reachable if app relies on live backend
4. Run lint and build to isolate compile vs runtime issues

Helpful checks:

~~~bash
npm run lint
npm run build
~~~

### Realtime not connecting

Checklist:

1. Confirm WS endpoint is correct
2. Verify backend websocket endpoint is enabled
3. Confirm VITE_REALTIME_DISABLED is not true
4. Check auth token and tenant context availability

### Session keeps expiring

Checklist:

1. Ensure refresh endpoint is implemented and reachable
2. Verify refresh token is returned and stored
3. Validate backend CORS and token validity settings

## Contribution Guide

Recommended workflow:

1. Create feature branch
2. Implement and keep module boundaries clean
3. Run lint, tests, and build
4. Submit PR with clear summary and screenshots for UI changes

Quality gate before merge:

- npm run lint passes
- npm run test:run passes
- npm run build passes

## License

This project is licensed under the MIT License.

- See LICENSE for full text.
