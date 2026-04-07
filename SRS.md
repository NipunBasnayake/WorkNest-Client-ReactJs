# Software Requirements Specification (SRS)

## 1. Document Control
- Project: WorkNest Client (React)
- Document: Software Requirements Specification
- Version: 1.0
- Date: 2026-04-05
- Prepared by: GitHub Copilot

## 2. Purpose
This SRS defines the functional and non-functional requirements for the WorkNest web client application. It serves as the baseline for implementation, testing, release validation, and future change control.

## 3. Scope
WorkNest is a multi-tenant workforce and operations management platform with two primary interfaces:
- Tenant application area for company-level users (employees, HR, managers, tenant admins)
- Platform application area for platform operators (platform admins/users)

The client provides user authentication, role-based navigation, workspace operations, analytics, notifications, announcements, attendance, leave, projects, tasks, teams, and chat.

## 4. Definitions and Acronyms
- SRS: Software Requirements Specification
- RBAC: Role-Based Access Control
- SPA: Single Page Application
- API: Application Programming Interface
- JWT: JSON Web Token
- NFR: Non-Functional Requirement
- Tenant: A customer workspace/organization in the platform
- Platform User: A user with cross-tenant administration access

## 5. Product Overview
### 5.1 Product Perspective
The system is a browser-based SPA built with React + TypeScript and integrated with backend REST APIs and STOMP/WebSocket realtime endpoints.

### 5.2 User Classes
- Guest: Unauthenticated visitor
- Tenant Employee: End user with self-service and assigned-module access
- Tenant HR: HR operations and communication access
- Tenant Manager: Management-level oversight access
- Tenant Admin / Admin: Workspace administration access
- Platform User / Platform Admin: Platform-level tenant oversight and settings

### 5.3 Operating Environment
- Modern desktop/mobile browser
- Frontend runtime: React 19, TypeScript
- Build: Vite
- HTTP: Axios
- State: Zustand
- Realtime: STOMP over WebSocket

## 6. Assumptions and Dependencies
- Backend services provide required endpoints and stable API contracts.
- API base URL and optional realtime URL are available via environment variables.
- Users have valid credentials and role assignments from backend identity domain.
- Tenant context (tenant key) is required for tenant-scoped APIs.

## 7. Constraints
- Access and refresh tokens are stored in browser local storage.
- Route-level access control is enforced client-side and must align with server-side authorization.
- Network reliability may vary; client must handle offline, timeout, and server failures gracefully.

## 8. Functional Requirements

### 8.1 Authentication and Session
- FR-001: The system shall allow users to sign in using email/password and optional tenant key.
- FR-002: The system shall support both tenant and platform session modes.
- FR-003: The system shall bootstrap existing sessions on app load.
- FR-004: The system shall store access and refresh tokens after successful login.
- FR-005: The system shall refresh expired access tokens using refresh token flow.
- FR-006: The system shall log out users and clear all auth context.
- FR-007: The system shall redirect users to a session-expired route when refresh fails.
- FR-008: The system shall support password-change-required login outcomes.

### 8.2 Authorization and Access Control
- FR-009: The system shall guard tenant routes so only tenant sessions can access them.
- FR-010: The system shall guard platform routes so only platform sessions can access them.
- FR-011: The system shall enforce role-based access for tenant modules.
- FR-012: The system shall redirect unauthorized users to an unauthorized page.
- FR-013: The system shall redirect authenticated users away from guest-only routes.

### 8.3 Public Experience
- FR-014: The system shall provide a public landing page.
- FR-015: The system shall provide login and company registration forms.
- FR-016: The system shall provide not-found and unauthorized pages.

### 8.4 Tenant Core Workspace
- FR-017: The system shall provide tenant dashboard views with role-adapted summaries.
- FR-018: The system shall provide employee listing, detail, create, and edit workflows.
- FR-019: The system shall provide team listing, detail, create, and edit workflows.
- FR-020: The system shall provide project listing, detail, create, and edit workflows.
- FR-021: The system shall provide task listing, board view, detail, create, and edit workflows.
- FR-022: The system shall provide attendance viewing and summaries.
- FR-023: The system shall provide leave request listing, detail, create, and edit workflows.
- FR-024: The system shall provide announcement listing, detail, create, and edit workflows.
- FR-025: The system shall provide notifications listing and read-state behavior.
- FR-026: The system shall provide chat for HR and team conversations.
- FR-027: The system shall provide tenant analytics pages and metric visualizations.
- FR-028: The system shall provide profile and settings subpages.

### 8.5 Platform Area
- FR-029: The system shall provide platform dashboard metrics.
- FR-030: The system shall provide tenant listing and tenant detail pages.
- FR-031: The system shall provide platform analytics and platform settings pages.
- FR-032: The system shall support tenant onboarding/registration API interactions.

### 8.6 Realtime and Messaging
- FR-033: The system shall subscribe to configured realtime chat destinations.
- FR-034: The system shall reconnect to realtime broker on transient disconnect.
- FR-035: The system shall allow sending/receiving conversation messages.
- FR-036: The system shall support read receipt behavior where API supports it.

### 8.7 Network and Error Handling
- FR-037: The system shall detect browser online/offline transitions.
- FR-038: The system shall map HTTP/network errors to user-friendly messages.
- FR-039: The system shall surface network issues in UI banners/alerts.
- FR-040: The system shall clear transient network issues when API health recovers.

### 8.8 Navigation and UX
- FR-041: The system shall provide responsive layout with sidebar/topbar navigation.
- FR-042: The system shall provide breadcrumb and page title metadata support.
- FR-043: The system shall provide fallback “Coming Soon” pages for unimplemented routes.

## 9. External Interface Requirements

### 9.1 User Interface
- The UI shall support desktop and mobile responsive layouts.
- The UI shall render role-appropriate modules and actions.
- The UI shall expose consistent card/table/form interaction patterns.

### 9.2 Software Interfaces
- REST endpoints:
  - Auth endpoints (login, refresh, me, logout, forgot/reset password)
  - Tenant and platform module endpoints for CRUD and analytics
- Realtime endpoints:
  - STOMP broker URL for chat topics/queues

### 9.3 Communications Interfaces
- HTTP/HTTPS for REST API calls
- WS/WSS for realtime messaging

## 10. Data Requirements

### 10.1 Core Data Entities
- User, Role, SessionType
- Tenant/Workspace
- Employee
- Team
- Project
- Task, TaskComment
- AttendanceRecord
- LeaveRequest
- Announcement
- Notification
- ChatConversation, ChatMessage, ChatReadReceipt

### 10.2 Data Integrity Rules
- All domain records shall carry stable unique IDs.
- Role values shall be normalized for access checks.
- Tenant-scoped calls shall include tenant context where required.
- Date/time values shall be normalized to ISO-compatible formats for display and sorting.

## 11. Non-Functional Requirements

### 11.1 Security
- NFR-001: The system shall include bearer tokens for protected API requests.
- NFR-002: The system shall clear all local auth context on hard logout/session expiry.
- NFR-003: The system shall not expose unauthorized routes to users without proper roles.

### 11.2 Performance
- NFR-004: Typical route transitions should feel immediate under normal network conditions.
- NFR-005: API timeouts should be bounded (configured timeout present in client).
- NFR-006: Vendor chunking should optimize initial bundle load and caching behavior.

### 11.3 Reliability and Availability
- NFR-007: The system shall recover from expired access tokens via refresh flow when possible.
- NFR-008: The system shall degrade gracefully during network/server failures.
- NFR-009: Realtime chat subscriptions shall auto-reconnect after disruptions.

### 11.4 Maintainability
- NFR-010: The codebase shall remain modular by domain and shared services.
- NFR-011: TypeScript typing shall be used for public service interfaces and core models.
- NFR-012: Linting and unit tests shall be runnable via npm scripts.

### 11.5 Usability
- NFR-013: Forms shall provide clear validation/error feedback.
- NFR-014: Key dashboards shall provide concise summary metrics and quick actions.
- NFR-015: The system shall provide clear unauthorized and not-found states.

## 12. Business Rules
- BR-001: A user can only access modules allowed by their role.
- BR-002: Tenant users cannot access platform routes.
- BR-003: Platform users cannot access tenant routes unless backend session is tenant.
- BR-004: TENANT_ADMIN and ADMIN are treated as equivalent for tenant admin-level checks.
- BR-005: Employee-facing views may be filtered to self-assigned/self-related data.

## 13. Validation and Acceptance Criteria

### 13.1 Authentication Acceptance
- Login success stores tokens and opens correct dashboard by session type.
- Refresh flow retries failed 401 requests and preserves user continuity.
- Failed refresh redirects to session-expired and clears auth state.

### 13.2 Authorization Acceptance
- Accessing restricted routes without permission redirects to unauthorized/login as applicable.
- Guest routes are inaccessible to already authenticated users.

### 13.3 Module Acceptance
- Each major module (Employees, Teams, Projects, Tasks, Attendance, Leave, Announcements, Notifications, Chat, Analytics, Settings) has navigable pages and successful API data rendering.
- Platform dashboard and tenant management pages render platform metrics and tenant data.

### 13.4 Reliability Acceptance
- Offline mode displays network issue indicators.
- Recovering connectivity clears non-offline transient issue states.
- Realtime chat reconnects after broker interruption.

## 14. Out of Scope (Current Baseline)
- Native mobile applications
- Offline-first persistent queueing/sync
- Advanced audit/compliance workflow engine in frontend
- Multi-language localization implementation

## 15. Risks and Open Items
- Limited automated test coverage versus system breadth.
- Some settings workflows currently use local persistence/simulated latency and require backend parity review.
- Final API contract freeze is required for long-term backward compatibility.

## 16. Traceability Matrix (High Level)
- Authentication: FR-001 to FR-008
- Authorization: FR-009 to FR-013, BR-001 to BR-004
- Tenant Features: FR-017 to FR-028
- Platform Features: FR-029 to FR-032
- Realtime: FR-033 to FR-036
- Network/Error Handling: FR-037 to FR-040
- UX/Layout: FR-041 to FR-043

## 17. Revision History
- v1.0 (2026-04-05): Initial SRS baseline for current WorkNest client implementation.
