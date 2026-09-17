# Lab 3 - AI Use and Reflection

**AI tools used:** GitHub Copilot in VS Code

I used GitHub Copilot to inspect the Lab 3 specifications, existing Lab 2 patterns, authentication flow, role-based navigation, staff ticket components, administrator user management, and Playwright configuration. I reviewed the generated changes, ran focused tests, checked the browser manually, and iterated on failures instead of accepting generated code without verification.

---

| # | Issue | Prompt or task | How AI helped me | My verification |
| --- | --- | --- | --- | --- |
| 1 | Issue 01 - Lab 3 specification, UI spec, and API spec | Read the Lab 3 specification, API specification, UI specification, and test plan. Identify the required authentication, authorization, migration, requester, IT Staff, Administrator, and testing work. | AI summarized the requirements and organized the acceptance criteria, business rules, API contracts, UI states, and test plan before implementation. | I checked the generated documents against the Lab 3 requirements and confirmed they were stored under `docs/lab-03`. |
| 2 | Issue 02 - Authentication and password management | Implement session-based login, logout, current-user retrieval, password validation, and mandatory first-login password change. | AI helped implement the authentication context, login and password-change screens, password hashing, session handling, and protected routes. | I checked valid and invalid credentials, first-login behavior, password requirements, logout, and `/api/auth/me`. |
| 3 | Issue 03 - Database migration | Migrate the Lab 2 requester model to the Lab 3 User model while preserving tickets, attachments, categories, related systems, and ownership relationships. | AI helped translate the migration requirements into Prisma schema changes, migration work, seed data, and compatibility updates. | I reviewed the schema and migration, ran the seed process, and checked that existing ticket data remained accessible. |
| 4 | Issue 04 - Authorization | Add role-based authorization and ownership protection for Requesters, IT Staff, and Administrators. | AI helped implement and test protected API routes, role checks, ticket ownership rules, and safe forbidden responses. | I verified unauthenticated requests, Requester ownership boundaries, staff-only ticket operations, administrator-only user management, and Internal Notes protection. |
| 5 | Issue 05 - Requester regression | Preserve Lab 2 Requester workflows using authenticated identity instead of the temporary Requester selector. | AI helped verify authenticated ticket creation, ticket listing, ticket detail, comments, attachments, and requester-only ownership behavior. | I checked that the Requester identity comes from the session and that existing requester functionality still works after the Lab 3 migration. |
| 6 | Issue 06 - IT Staff Ticket Queue | Implement and test the staff queue with search, filters, sorting, pagination, priorities, statuses, assignment, and ticket opening. | AI helped connect the queue UI to the staff API and create tests for the queue controls and responsive layout. | I tested queue loading, search, priority/status filters, assignment filters, ticket rows, and opening a ticket from the queue. |
| 7 | Issue 07 - IT Staff Ticket Detail | Implement ticket ownership changes, IT Priority updates, valid status transitions, Public Comments, Internal Notes, and attachment display. | AI helped implement the detail workflow and identify the existing selectors for operational fields, comments, notes, and attachments. | I verified claim/reassignment behavior, priority changes, valid transitions, comment posting, yellow Internal Notes styling, and attachment states. |
| 8 | Issue 08 - Administrator User Management | Implement user listing, search, single-role creation, editing, activation changes, password reset, self-deactivation protection, and last-admin protection. | AI helped build and test the User Management screen and its administrator safety constraints. | I verified user search, creation, role selection, editing, active state handling, self-deactivation protection, and last-active-administrator protection. |
| 9 | Issue 09 - Automated Tests | Add and run unit, API, component, and regression tests for the Lab 3 behavior. | AI helped organize the test coverage and align the E2E tests with the existing Vitest, Supertest, and React Testing Library setup. | I ran test discovery and focused authentication, staff workflow, administrator, and browser checks, then used failures to improve selectors and fixture handling. |
| 10 | Issue 10 - E2E and Visual Verification | Create Playwright coverage for authentication, staff workflows, administrator workflows, role boundaries, and screenshots at desktop, tablet, and mobile sizes. | AI added shared Playwright helpers, the three Lab 3 E2E files, and screenshot capture under `artifacts/lab-03/screenshots/`. | I reviewed the screenshots for Zen Green styling, role navigation, badges, Internal Notes distinction, clipping, overlap, and responsive behavior. |

---

## Reflection

GitHub Copilot helped me move from the Lab 3 requirements to a working full-stack verification workflow. The most useful part was having it inspect the existing repository before writing tests, because this project uses state-based navigation rather than URL routes and contains both TypeScript sources and JavaScript runtime files.

The workflow was:

1. Read the Lab 3 requirements and existing implementation.
2. Identify real selectors, seed credentials, routes, and role behavior.
3. Create shared Playwright helpers and focused E2E tests.
4. Run the tests against the live backend, frontend, and seeded PostgreSQL database.
5. Use screenshots and failure output to locate runtime and test-isolation problems.
6. Fix the smallest controlling issue and rerun the focused test.
7. Review the generated documentation and test artifacts.

I verified the generated work by running Playwright test discovery, focused authentication tests, staff workflow tests, administrator tests, browser checks, and screenshot generation. I also manually checked that the frontend is opened at `http://localhost:5173/` while the backend API runs at `http://localhost:3000`.

AI accelerated the implementation, but I remained responsible for checking the actual behavior, handling mutable database state, reviewing failures, and deciding whether a result represented an application defect or a test-fixture problem.
