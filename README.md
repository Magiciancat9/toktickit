# TokTickIT — IT Service Desk

TokTickIT is a full-stack IT service desk application for managing internal requests across Account and Access, Hardware, Software, and Network categories.

## Technology Stack

- **Frontend:** React, TypeScript, Vite, Bootstrap 5
- **Backend:** Node.js, Express, TypeScript
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Testing:** Vitest, Supertest, React Testing Library
- **Workflow:** Git, GitHub Projects, Feature Branches, Pull Requests

## Project Structure

```text
toktickit/
├── client/          # React + Vite + Bootstrap frontend
├── server/          # Express + Prisma + PostgreSQL backend
│   ├── prisma/      # Prisma schema and seed script
│   ├── src/         # Express server source code
│   └── tests/       # API integration tests (Supertest + Vitest)
├── docs/            # Documentation and engineering records
│   └── lab-01/      # Lab 1 evidence (ai_use.md, reviewer.md, tests.md)
├── .gitignore       # Git ignore rules
└── README.md        # Project setup and usage guide
```

## Setup and Running Instructions

### 1. Prerequisites

- Node.js v18 or higher
- A running PostgreSQL instance

### 2. Environment Configuration

Copy the `.env.example` files into `.env` for both the client and server:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Then open `server/.env` and fill in your PostgreSQL connection details:

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<dbname>?schema=public"
PORT=3000
```

### 3. Install Dependencies

```bash
npm install --prefix client
npm install --prefix server
```

### 4. Database Setup

Apply migrations and load the starter seed data:

```bash
npm --prefix server run prisma:migrate
npm --prefix server run prisma:seed
```

### 5. Start in Development Mode

```bash
# Backend API — http://localhost:3000
npm --prefix server run dev

# Frontend — http://localhost:5173
npm --prefix client run dev
```

### 6. Run Tests

```bash
# Frontend UI tests
npm --prefix client run test

# Backend API tests
npm --prefix server run test
```

---

## Lab 2 — Additional Features and Testing

Lab 2 extends TokTickIT with a complete ticket management system including requester context, ticket creation, ticket listing, ticket detail with attachments, and responsive end-to-end testing.

### New Features in Lab 2

- **Requester Context:** Global requester selection with localStorage persistence
- **Create Ticket:** Form with validation for creating new IT support tickets
- **My Tickets:** Filterable table showing all tickets for the current requester
- **Ticket Detail:** Read-only ticket view with file attachment upload and removal
- **Responsive Design:** Mobile, tablet, and desktop viewport support with E2E screenshot tests

### Database Changes

Lab 2 adds four new models:
- `Requester` — Users who create tickets
- `RelatedSystem` — IT systems that tickets reference (Email, VPN, etc.)
- `Ticket` — The core ticket model with status, priority, and relations
- `Attachment` — Files attached to tickets with soft-delete support

### Running Lab 2 Locally

After completing the Lab 1 setup above, apply the Lab 2 migrations and seed data:

```bash
# Apply Lab 2 database migrations
npm --prefix server run prisma:migrate

# Seed Lab 2 reference data (requesters, related systems, sample tickets)
npm --prefix server run prisma:seed
```

Start both servers as described in step 5 above, then navigate to:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api

### Running End-to-End Tests (Playwright)

Lab 2 includes comprehensive Playwright E2E tests covering the full ticket workflow and responsive layouts across three viewports (desktop, tablet, mobile).

**Prerequisites:**
- Both frontend and backend servers must be running before executing E2E tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npx playwright test

# Run E2E tests for a specific viewport
npx playwright test --project=desktop
npx playwright test --project=tablet
npx playwright test --project=mobile

# Run E2E tests in UI mode (interactive debugging)
npx playwright test --ui

# View the HTML test report
npx playwright show-report artifacts/lab-02/playwright-report
```

### Lab 2 Test Coverage

| Test Suite | Location | Purpose |
|------------|----------|---------|
| API Tests | `server/tests/lab-02/` | Backend endpoint integration tests |
| Component Tests | `client/tests/lab-02/` | React component unit tests |
| E2E Tests | `e2e/lab-02/` | Full user workflow and responsive screenshot tests |

---

## Lab 3 - Authentication, Authorization, and Operations

Lab 3 replaces the temporary Requester selector with session-based authentication and role-based workflows for Requesters, IT Staff, and Administrators.

### Lab 3 Features

- Session-based login, logout, current-user lookup, and mandatory first-login password change
- Role-based navigation and server-side authorization for `REQUESTER`, `IT_STAFF`, and `ADMINISTRATOR`
- Requester ticket regression using the authenticated user's identity
- IT Staff Ticket Queue with search, filters, sorting, pagination, assignment, and status workflow
- IT Staff Ticket Detail with ownership, IT Priority, status, Public Comments, Internal Notes, and attachments
- Administrator User Management with search, single-role creation, editing, activation, password reset, and safety protections
- PostgreSQL session storage and bcrypt password hashing

### Lab 3 Seed Accounts

All seeded accounts initially use `TempPass123!` and must change their password at first login.

| Role | Email |
| --- | --- |
| Administrator | `admin@example.com` |
| IT Staff | `emma.rodriguez@example.com` |
| IT Staff | `james.chen@example.com` |
| IT Staff | `sofia.martinez@example.com` |
| Requester | `jennifer.anderson@example.com` |
| Requester | `michael.brown@example.com` |

### Running Lab 3 Locally

Start PostgreSQL if necessary, then apply the migration and seed data:

```bash
docker start toktickit-db
npm --prefix server run prisma:migrate
npm --prefix server run prisma:seed
```

Start the backend and frontend in separate terminals:

```bash
# Terminal 1 - Backend API
npm --prefix server run dev

# Terminal 2 - Frontend
npm --prefix client run dev
```

Open the web application at `http://localhost:5173`. The backend API is available at `http://localhost:3000/api`.

If port `3000` or `5173` is already in use, the corresponding service is already running. Do not start a second copy.

### Lab 3 Tests

```bash
# Backend API and unit tests
npm --prefix server run test

# Frontend component tests
npm --prefix client run test

# Playwright E2E tests
npx playwright test

# Lab 3 E2E tests only
npx playwright test e2e/lab-03/

# Run one viewport project
npx playwright test e2e/lab-03/ --project=desktop
npx playwright test e2e/lab-03/ --project=tablet
npx playwright test e2e/lab-03/ --project=mobile
```

---

## Lab 4 - Dashboards, Actions Taken, Status Workflow & UI Polish

Lab 4 adds role-specific dashboards with actionable metrics, a comprehensive Actions Taken system for IT staff to log work and manage follow-ups, a status workflow engine with validation and resolution blocking, and complete UI accessibility polish across all screens.

### Lab 4 Features

**Requester Dashboard:**
- Metric cards: Total Open, Waiting for You, Recently Updated, Recently Resolved
- One-click navigation to filtered ticket lists
- Real-time data from authenticated user context
- Responsive layout (4-col desktop, 2-col tablet, 1-col mobile)

**IT Staff Dashboard:**
- Metric cards: Unassigned, My Assigned, Recently Updated, High Priority
- Breakdown cards: By Status (7 states), By Priority (High/Medium/Low)
- Quick-access navigation to ticket queue with pre-applied filters
- Responsive layout (3-col desktop, 2-col tablet, 1-col mobile)

**Actions Taken System:**
- IT staff can log work performed on tickets (public comments)
- Private Internal Notes for staff-only communication
- Follow-up required flag with visual indicators (badge + icon)
- Create/Edit/View actions with full lifecycle management
- Actions are immutable after creation (edit within modal only)
- Chronological display with timestamps and author attribution

**Status Workflow Engine:**
- Rule-based status transitions enforced server-side via transition matrix
- Resolution blocking when incomplete follow-up actions exist
- IT Staff-only status controls with requester-view restrictions
- Success messaging and automatic ticket refresh after status change
- Comprehensive error handling (403 Forbidden, 400 Invalid Transition, incomplete follow-ups)

**UI Polish & Accessibility:**
- WCAG 2.1 AA compliance (85% compliant, all critical issues fixed)
- Semantic landmarks (`role="main"`, `role="navigation"`)
- Visible focus indicators (2px solid #2c5f4f outline, 2px offset)
- Keyboard-only operation for all features
- Form labels and `aria-describedby` for error messages
- Non-color status cues (icons + text, not color alone)
- High contrast ratios (body text 11.0:1, buttons 6.8:1, errors 7.5:1)
- Responsive design verified at 375px, 768px, 1280px (no clipping, overlap, or horizontal scroll)
- Zen Green design system consistency across all components

### Lab 4 Database Changes

- `ActionsTaken` model: tracks work performed on tickets with optional follow-up flag
- Status workflow constraints: validates state transitions via transition matrix
- Dashboard aggregations: optimized queries for metric calculations

### Lab 4 Seed Accounts

All seeded accounts use the same credentials as Lab 3. All users initially have `TempPass123!` and must change their password on first login.

| Role | Email | Use Case |
| --- | --- | --- |
| Administrator | `admin@example.com` | Full system access, user management |
| IT Staff | `emma.rodriguez@example.com` | Dashboard, ticket queue, actions taken |
| IT Staff | `james.chen@example.com` | Dashboard, ticket queue, actions taken |
| IT Staff | `sofia.martinez@example.com` | Dashboard, ticket queue, actions taken |
| Requester | `jennifer.anderson@example.com` | Dashboard, create tickets, view own tickets |
| Requester | `michael.brown@example.com` | Dashboard, create tickets, view own tickets |
| Requester | `sarah.johnson@example.com` | Dashboard, create tickets, view own tickets |
| Requester | `david.lee@example.com` | Dashboard, create tickets, view own tickets |

### Running Lab 4 Locally

Lab 4 builds on Lab 3. If you have already completed Lab 3 setup, simply apply the new migrations and restart the servers.

```bash
# Apply Lab 4 database migrations
npm --prefix server run prisma:migrate

# Seed data (idempotent - safe to re-run)
npm --prefix server run prisma:seed

# Start backend (Terminal 1)
npm --prefix server run dev

# Start frontend (Terminal 2)
npm --prefix client run dev
```

Open the web application at `http://localhost:5173`. The backend API is available at `http://localhost:3000/api`.

### Lab 4 Demo Script

**As a Requester (jennifer.anderson@example.com):**
1. Login with `TempPass123!` (change password if first login)
2. View Dashboard - see Open Tickets, Waiting for You, Recently Updated, Recently Resolved
3. Click "View All →" on any metric card to navigate to filtered ticket list
4. Create a new ticket from Dashboard action card
5. View "My Tickets" to see all your tickets

**As IT Staff (emma.rodriguez@example.com):**
1. Login with `TempPass123!` (change password if first login)
2. View Dashboard - see Unassigned, My Assigned, Recently Updated, High Priority
3. View breakdown cards - By Status (NEW/OPEN/IN_PROGRESS/etc), By Priority (High/Medium/Low)
4. Click "View All →" to go to Ticket Queue with filters pre-applied
5. Open a ticket detail page
6. Click "Record Action" to log work performed
7. Fill in action text (min 10 chars), optionally check "Follow-Up Required"
8. Submit action and verify it appears in chronological order
9. Try changing ticket status - verify status controls are only visible to IT staff
10. Attempt to RESOLVE a ticket with incomplete follow-ups - verify resolution is blocked with clear error message
11. Mark follow-ups complete, then successfully RESOLVE the ticket

**As Administrator (admin@example.com):**
1. Login and navigate to User Management
2. Dashboard is available to all roles (including Admin)
3. Admin sees aggregated data across all tickets (not role-specific)

### Lab 4 Tests

```bash
# Backend API tests (includes Lab 4 dashboard, actions-taken, workflow tests)
npm --prefix server run test

# Backend Lab 4 tests only
npm --prefix server run test -- tests/lab-04/

# Frontend component tests (includes Lab 4 UI style and responsive tests)
npm --prefix client run test

# Frontend Lab 4 tests only
npm --prefix client run test -- tests/lab-04/

# Playwright E2E tests (includes Lab 4 workflows)
npx playwright test

# Lab 4 E2E tests only
npx playwright test e2e/lab-04/

# Run specific viewport
npx playwright test e2e/lab-04/ --project=desktop
npx playwright test e2e/lab-04/ --project=tablet
npx playwright test e2e/lab-04/ --project=mobile

# Generate Lab 4 screenshots (requires both servers running)
npx playwright test e2e/lab-04-screenshots.spec.ts
# OR
node capture-lab-04-screenshots.mjs
```

### Lab 4 Test Coverage

| Test Suite | Location | Purpose |
|------------|----------|---------|
| Dashboard API | `server/tests/lab-04/requester-dashboard.api.test.ts` | Requester dashboard metrics endpoint |
| Dashboard API | `server/tests/lab-04/staff-dashboard.api.test.ts` | Staff dashboard metrics and breakdowns |
| Actions API | `server/tests/lab-04/actions-taken.api.test.ts` | Actions CRUD, follow-up logic, authz |
| Workflow API | `server/tests/lab-04/ticket-workflow.api.test.ts` | Status transitions, resolution blocking |
| UI Components | `client/tests/lab-04/RequesterDashboard.test.tsx` | Requester dashboard rendering and navigation |
| UI Components | `client/tests/lab-04/StaffDashboard.test.tsx` | Staff dashboard metrics and breakdowns |
| UI Components | `client/tests/lab-04/ActionsTaken.test.tsx` | Actions modal, validation, follow-ups |
| UI Components | `client/tests/lab-04/TicketWorkflow.test.tsx` | Status controls, transitions, error handling |
| UI Styles | `client/tests/lab-04/UIStyles.test.tsx` | CSS classes, badges, buttons, forms, cards |
| Responsive | `client/tests/lab-04/Responsive.test.tsx` | Mobile/tablet/desktop layout verification |
| E2E Workflows | `e2e/lab-04/` | Full user workflows for dashboards and actions |
| Screenshots | `e2e/lab-04-screenshots.spec.ts` | Visual regression screenshots |

### Lab 4 Documentation

Comprehensive Lab 4 documentation is available in `docs/lab-04/`:

- **specification.md** - Functional requirements and business rules
- **api-spec.md** - REST API contract and endpoint documentation
- **ui-spec.md** - UI/UX requirements and Zen Green design system
- **tests.md** - Test plan with Final status for each test
- **accessibility-audit.md** - WCAG 2.1 AA compliance audit
- **ui-accessibility-checklist.md** - Pass/fail checklist for all criteria
- **reviewer.md** - Peer review record with PR links and feedback
- **ai-use.md** - AI assistance log with key prompts and reflection

---

## Environment Variables

### Backend (`server/.env`)

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/toktickit?schema=public"

# Server port (default: 3000)
PORT=3000

# Session secret (required for Lab 3+)
SESSION_SECRET="your-secret-key-here"
```

### Frontend (`client/.env`)

```env
# Backend API base URL
VITE_API_BASE_URL=http://localhost:3000/api
```

**Important:** Never commit `.env` files. Use `.env.example` as a template.

---

## Complete Setup from Clean Clone

These steps verify every command works from a fresh clone:

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd toktickit

# 2. Install dependencies
npm install --prefix server
npm install --prefix client

# 3. Configure environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit server/.env with your PostgreSQL credentials

# 4. Setup database
npm --prefix server run prisma:migrate   # Apply all migrations
npm --prefix server run prisma:seed      # Load seed data (idempotent)

# 5. Verify backend tests
npm --prefix server run test

# 6. Verify frontend tests
npm --prefix client run test

# 7. Start servers (separate terminals)
npm --prefix server run dev              # Terminal 1: Backend on :3000
npm --prefix client run dev              # Terminal 2: Frontend on :5173

# 8. Run E2E tests (requires both servers running)
npx playwright install                   # First time only
npx playwright test

# 9. Open application
# Navigate to http://localhost:5173
# Login with any seeded account (password: TempPass123!)
```

---

## Common Commands Reference

### Database Management

```bash
# Apply migrations
npm --prefix server run prisma:migrate

# Seed data (idempotent - safe to re-run)
npm --prefix server run prisma:seed

# Reset database (WARNING: deletes all data)
npm --prefix server run prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio --schema server/prisma/schema.prisma
```

### Development

```bash
# Start backend dev server (http://localhost:3000)
npm --prefix server run dev

# Start frontend dev server (http://localhost:5173)
npm --prefix client run dev

# Build for production
npm --prefix server run build
npm --prefix client run build

# Run production build
npm --prefix server start
npm --prefix client run preview
```

### Testing

```bash
# Run all backend tests
npm --prefix server run test

# Run all frontend tests
npm --prefix client run test

# Run all E2E tests
npx playwright test

# Run tests for specific lab
npm --prefix server run test -- tests/lab-04/
npm --prefix client run test -- tests/lab-04/
npx playwright test e2e/lab-04/

# Run E2E tests in UI mode (interactive)
npx playwright test --ui

# View Playwright test report
npx playwright show-report artifacts/lab-04/playwright-report
```

---

## Project Structure (Complete)

```text
toktickit/
├── client/                      # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ActionsTaken.tsx        # Actions modal (Lab 4)
│   │   │   ├── AppShell.tsx            # Navigation shell (Labs 1-4)
│   │   │   ├── CategoryList.tsx        # Category list (Lab 1)
│   │   │   ├── ChangePassword.tsx      # Password change (Lab 3)
│   │   │   ├── CreateTicket.tsx        # Ticket creation (Lab 2)
│   │   │   ├── HealthStatus.tsx        # Health check (Lab 1)
│   │   │   ├── Login.tsx               # Authentication (Lab 3)
│   │   │   ├── MyTickets.tsx           # Requester tickets (Lab 2)
│   │   │   ├── RequesterDashboard.tsx  # Requester dashboard (Lab 4)
│   │   │   ├── RequesterSelector.tsx   # Dev requester (Lab 2)
│   │   │   ├── StaffDashboard.tsx      # IT Staff dashboard (Lab 4)
│   │   │   ├── StaffTicketDetail.tsx   # Staff ticket detail (Lab 3)
│   │   │   ├── StaffTicketQueue.tsx    # Staff queue (Lab 3)
│   │   │   ├── TicketDetail.tsx        # Requester detail (Lab 2)
│   │   │   └── UserManagement.tsx      # User CRUD (Lab 3)
│   │   ├── styles/              # CSS modules
│   │   │   ├── ActionsTaken.css        # Actions modal styles
│   │   │   ├── AppShell.css            # Navigation styles
│   │   │   ├── CreateTicket.css        # Ticket form styles
│   │   │   ├── RequesterDashboard.css  # Requester dashboard styles
│   │   │   ├── StaffDashboard.css      # Staff dashboard styles
│   │   │   └── ...                     # Other component styles
│   │   ├── api.ts               # Axios API client
│   │   ├── App.tsx              # React root component
│   │   └── main.tsx             # Vite entry point
│   ├── tests/                   # Vitest + React Testing Library
│   │   ├── lab-01/              # Lab 1 component tests
│   │   ├── lab-02/              # Lab 2 component tests
│   │   ├── lab-03/              # Lab 3 component tests
│   │   └── lab-04/              # Lab 4 component tests
│   │       ├── ActionsTaken.test.tsx
│   │       ├── RequesterDashboard.test.tsx
│   │       ├── StaffDashboard.test.tsx
│   │       ├── TicketWorkflow.test.tsx
│   │       ├── UIStyles.test.tsx
│   │       └── Responsive.test.tsx
│   ├── .env.example             # Frontend env template
│   ├── package.json             # Frontend dependencies
│   └── vite.config.ts           # Vite configuration
│
├── server/                      # Node.js + Express + TypeScript backend
│   ├── prisma/
│   │   ├── migrations/          # Prisma migration history
│   │   ├── schema.prisma        # Database schema (Labs 1-4)
│   │   └── seed.ts              # Idempotent seed script
│   ├── src/
│   │   ├── routes/              # Express route handlers
│   │   │   ├── actions-taken.ts        # Actions CRUD (Lab 4)
│   │   │   ├── attachments.ts          # File upload (Lab 2)
│   │   │   ├── auth.ts                 # Login/logout (Lab 3)
│   │   │   ├── categories.ts           # Category list (Lab 1)
│   │   │   ├── dashboards.ts           # Dashboards (Lab 4)
│   │   │   ├── health.ts               # Health check (Lab 1)
│   │   │   ├── reference-data.ts       # Related systems (Lab 2)
│   │   │   ├── tickets.ts              # Ticket CRUD (Labs 2-4)
│   │   │   ├── users.ts                # User management (Lab 3)
│   │   │   └── workflow.ts             # Status workflow (Lab 4)
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.ts                 # Authentication checks
│   │   │   └── error-handler.ts        # Global error handling
│   │   ├── utils/               # Utility functions
│   │   │   ├── password.ts             # bcrypt password hashing
│   │   │   └── validation.ts           # Input validation
│   │   ├── index.ts             # Express server entry point
│   │   └── prisma.ts            # Prisma client singleton
│   ├── tests/                   # Supertest + Vitest API tests
│   │   ├── lab-01/              # Lab 1 API tests
│   │   ├── lab-02/              # Lab 2 API tests
│   │   ├── lab-03/              # Lab 3 API tests
│   │   └── lab-04/              # Lab 4 API tests
│   │       ├── requester-dashboard.api.test.ts
│   │       ├── staff-dashboard.api.test.ts
│   │       ├── actions-taken.api.test.ts
│   │       └── ticket-workflow.api.test.ts
│   ├── .env.example             # Backend env template
│   └── package.json             # Backend dependencies
│
├── e2e/                         # Playwright E2E tests
│   ├── lab-02/                  # Lab 2 E2E tests
│   ├── lab-03/                  # Lab 3 E2E tests
│   └── lab-04/                  # Lab 4 E2E tests
│       └── ...                  # Dashboard and workflow E2E tests
│
├── docs/                        # Engineering documentation
│   ├── lab-01/                  # Lab 1 evidence
│   │   ├── ai_use.md            # AI assistance log
│   │   ├── reviewer.md          # Peer review record
│   │   └── tests.md             # Test evidence
│   ├── lab-02/                  # Lab 2 evidence
│   │   ├── specification.md     # Functional spec
│   │   ├── api-spec.md          # API contract
│   │   ├── ui-spec.md           # UI requirements
│   │   ├── tests.md             # Test plan and evidence
│   │   ├── ai_use.md            # AI assistance log
│   │   └── reviewer.md          # Peer review record
│   ├── lab-03/                  # Lab 3 evidence
│   │   ├── specification.md     # Functional spec
│   │   ├── api-spec.md          # API contract
│   │   ├── ui-spec.md           # UI requirements
│   │   ├── tests.md             # Test plan and evidence
│   │   ├── ai_use.md            # AI assistance log
│   │   └── reviewer.md          # Peer review record
│   └── lab-04/                  # Lab 4 evidence
│       ├── specification.md     # Functional spec
│       ├── api-spec.md          # API contract
│       ├── ui-spec.md           # UI requirements
│       ├── tests.md             # Test plan and evidence
│       ├── accessibility-audit.md              # WCAG audit
│       ├── ui-accessibility-checklist.md       # Pass/fail checklist
│       ├── ai-use.md            # AI assistance log
│       └── reviewer.md          # Peer review record
│
├── artifacts/                   # Test outputs and screenshots
│   ├── lab-02/
│   │   ├── screenshots/         # Responsive screenshots
│   │   └── playwright-report/   # E2E test report
│   ├── lab-03/
│   │   ├── screenshots/         # Responsive screenshots
│   │   └── playwright-report/   # E2E test report
│   └── lab-04/
│       ├── screenshots/         # Dashboard and workflow screenshots
│       │   ├── requester-dashboard/
│       │   ├── staff-dashboard/
│       │   └── actions-taken/
│       └── playwright-report/   # E2E test report
│
├── .gitignore                   # Git ignore rules
├── playwright.config.ts         # Playwright configuration
├── capture-lab-04-screenshots.mjs  # Lab 4 screenshot script
└── README.md                    # This file
```

---

## Troubleshooting

### Port Already in Use

If you see `EADDRINUSE` errors:
- Backend: Another process is using port 3000
- Frontend: Another process is using port 5173

Solution: Stop the existing process or change the port in `.env`

### Database Connection Failed

If Prisma cannot connect to PostgreSQL:
1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in `server/.env`
3. Ensure database exists: `createdb toktickit`
4. Test connection: `psql <DATABASE_URL>`

### Migration Errors

If migrations fail:
1. Check for uncommitted changes: `git status`
2. Reset database: `npm --prefix server run prisma migrate reset`
3. Re-apply migrations: `npm --prefix server run prisma:migrate`
4. Re-seed data: `npm --prefix server run prisma:seed`

### E2E Tests Fail

If Playwright tests fail:
1. Ensure both servers are running
2. Verify frontend is on `http://localhost:5173`
3. Verify backend is on `http://localhost:3000`
4. Run `npx playwright install` if browsers are missing
5. Check test artifacts: `artifacts/lab-04/playwright-report/`

---

## License

This project is for educational purposes as part of the Web Technology and Web Services course.

