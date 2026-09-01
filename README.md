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
