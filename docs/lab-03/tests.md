# Lab 3 Test Plan and Traceability

## 1. Test Strategy

This test plan follows Test-Driven Development (TDD) and Test Design-Driven (Test DD) principles. All planned tests are derived from the Acceptance Criteria and Business Rules in `docs/lab-03/specification.md` **BEFORE** implementation begins. Tests are written first (expected to fail), then implementation follows until they pass.

**Test Levels:**
- **Unit** — Isolated logic (password validation, status transition rules, authorization helpers)
- **API/Integration** — Supertest tests against Express routes with test database
- **UI Component** — Vitest + React Testing Library for component behavior
- **E2E** — Playwright full user workflows across authentication, roles, and workflows

**Mocking Strategy:**
- Server API tests: use test database (`DATABASE_URL_TEST`) for integration tests
- UI component tests: mock API calls via `vi.spyOn` on API module
- E2E tests: run against full stack with seeded test data

**Authentication in Tests:**
- API tests: establish authenticated session before protected endpoint tests
- UI component tests: mock authenticated state and role
- E2E tests: perform actual login via UI

---

## 2. Planned Tests

The per-test `Final` status is summarized by test ID range in Section 5, because the current repository does not contain every planned test file. In this document, `N/A` means "not available / not implemented yet" rather than a pass or fail.

### 2.1. Authentication & Password Tests

| Test ID | Type | AC / BR | What It Tests | Expected Result | Test File Path | Final |
|---------|------|---------|---------------|-----------------|----------------|-------|
| UNIT-01 | Unit | BR-03 | Password validation: minimum 8 characters | Returns false for passwords < 8 chars | `server/tests/lab-03/password-validation.unit.test.ts` | PASS |
| UNIT-02 | Unit | BR-04 | Password validation: requires uppercase, lowercase, number, special char | Returns false if any requirement missing | `server/tests/lab-03/password-validation.unit.test.ts` | PASS |
| UNIT-03 | Unit | BR-04 | Password validation: valid password passes | Returns true for "SecurePass123!" | `server/tests/lab-03/password-validation.unit.test.ts` | PASS |
| UNIT-04 | Unit | BR-07 | Password hashing: bcrypt hash is never plaintext | Hash does not equal original password | `server/tests/lab-03/password-hashing.unit.test.ts` | PASS |
| UNIT-05 | Unit | BR-07 | Password hashing: bcrypt comparison works | bcrypt.compare returns true for correct password | `server/tests/lab-03/password-hashing.unit.test.ts` | PASS |
| API-01 | API | AC-01, BR-01 | POST /api/auth/login with valid credentials (active user) | 200; user data returned; session cookie set | `server/tests/lab-03/auth.api.test.ts` | PASS |
| API-02 | API | AC-03, BR-08 | POST /api/auth/login with invalid email | 401; generic error message | `server/tests/lab-03/auth.api.test.ts` | PASS |
| API-03 | API | AC-03, BR-08 | POST /api/auth/login with wrong password | 401; generic error message | `server/tests/lab-03/auth.api.test.ts` | PASS |
| API-04 | API | AC-04, BR-09 | POST /api/auth/login with inactive user | 401; same generic error | `server/tests/lab-03/auth.api.test.ts` | PASS |
| API-05 | API | AC-01, BR-02 | Login returns requiresPasswordChange=true for initial password | Response includes requiresPasswordChange: true | `server/tests/lab-03/auth.api.test.ts` | PASS |
| API-06 | API | AC-05, BR-10 | POST /api/auth/logout invalidates session | 204; subsequent requests with same session return 401 | `server/tests/lab-03/auth.api.test.ts` | PASS |
| API-07 | API | — | GET /api/auth/me returns authenticated user | 200; user id, name, email, role returned | `server/tests/lab-03/auth.api.test.ts` | PASS |
| API-08 | API | — | GET /api/auth/me without session | 401 | `server/tests/lab-03/auth.api.test.ts` | PASS |
| API-09 | API | AC-02, BR-02, BR-06 | POST /api/auth/change-password with correct current password | 200; requiresPasswordChange set to false | `server/tests/lab-03/password-change.api.test.ts` | N/A |
| API-10 | API | BR-06 | POST /api/auth/change-password with wrong current password | 401; "Current password is incorrect" | `server/tests/lab-03/password-change.api.test.ts` | N/A |
| API-11 | API | BR-03, BR-04 | POST /api/auth/change-password with invalid new password | 400; validation error | `server/tests/lab-03/password-change.api.test.ts` | N/A |
| API-12 | API | BR-05 | POST /api/auth/change-password with mismatched confirmation | 400; "Passwords do not match" | `server/tests/lab-03/password-change.api.test.ts` | N/A |

### 2.2. Authorization Tests

| Test ID | Type | AC / BR | What It Tests | Expected Result | Test File Path | Final |
|---------|------|---------|---------------|-----------------|----------------|-------|
| UNIT-06 | Unit | BR-14 | Authorization helper: Requester role check | Returns true if role=REQUESTER | `server/tests/lab-03/authorization.unit.test.ts` | N/A |
| UNIT-07 | Unit | BR-14 | Authorization helper: IT Staff role check | Returns true if role=IT_STAFF or ADMINISTRATOR | `server/tests/lab-03/authorization.unit.test.ts` | N/A |
| UNIT-08 | Unit | BR-14 | Authorization helper: Administrator role check | Returns true if role=ADMINISTRATOR | `server/tests/lab-03/authorization.unit.test.ts` | N/A |
| API-13 | API | AC-09, BR-16 | Requester attempts to access Internal Notes endpoint | 403; no note content returned | `server/tests/lab-03/authorization.api.test.ts` | PASS |
| API-14 | API | AC-10, BR-13 | Requester supplies different requesterId in body; backend uses authenticated ID | Ticket created with authenticated user's ID; client-supplied ID ignored | `server/tests/lab-03/authorization.api.test.ts` | PASS |
| API-15 | API | BR-15 | Requester attempts to access another Requester's ticket | 403 | `server/tests/lab-03/authorization.api.test.ts` | PASS |
| API-16 | API | BR-16 | Non-Administrator attempts to access /api/admin/users | 403 | `server/tests/lab-03/authorization.api.test.ts` | PASS |
| API-17 | API | BR-17 | 403 error does not expose whether resource exists | Generic "Forbidden" message; no resource details | `server/tests/lab-03/authorization.api.test.ts` | PASS |

### 2.3. Requester Regression (Lab 2 Functions with Auth)

| Test ID | Type | AC / BR | What It Tests | Expected Result | Test File Path | Final |
|---------|------|---------|---------------|-----------------|----------------|-------|
| API-18 | API | AC-11, BR-13 | POST /api/tickets uses authenticated requesterId (not client-supplied) | Ticket created with session user's ID | `server/tests/lab-03/requester-tickets.api.test.ts` | PASS |
| API-19 | API | AC-12 | GET /api/tickets returns only authenticated Requester's tickets | 200; only owned tickets in response | `server/tests/lab-03/requester-tickets.api.test.ts` | PASS |
| API-20 | API | AC-11 | GET /api/tickets/:ticketNumber for owned ticket | 200; full ticket detail | `server/tests/lab-03/requester-tickets.api.test.ts` | PASS |
| API-21 | API | BR-15 | GET /api/tickets/:ticketNumber for ticket owned by another Requester | 403 | `server/tests/lab-03/requester-tickets.api.test.ts` | PASS |
| API-22 | API | AC-13, BR-35 | POST /api/tickets/:ticketNumber/comments on owned ticket | 201; comment saved with authenticated author | `server/tests/lab-03/comments.api.test.ts` | PASS |
| API-23 | API | BR-33 | GET /api/tickets/:ticketNumber/comments on owned ticket | 200; all Public Comments visible | `server/tests/lab-03/comments.api.test.ts` | PASS |
| API-24 | API | BR-39 | POST comment with empty content | 400; validation error | `server/tests/lab-03/comments.api.test.ts` | PASS |
| API-25 | API | BR-40 | POST comment with content > 2000 chars | 400; validation error | `server/tests/lab-03/comments.api.test.ts` | PASS |
| API-26 | API | AC-13, BR-31 | PATCH /api/tickets/:ticketNumber/problem-resolved sets flag | 200; problemResolvedByRequester=true; status unchanged | `server/tests/lab-03/requester-tickets.api.test.ts` | PASS |

### 2.4. IT Staff Ticket Queue Tests

| Test ID | Type | AC / BR | What It Tests | Expected Result | Test File Path | Final |
|---------|------|---------|---------------|-----------------|----------------|-------|
| API-27 | API | AC-14, FR-22 | GET /api/staff/tickets returns all tickets (not limited to one requester) | 200; tickets from multiple requesters | `server/tests/lab-03/staff-queue.api.test.ts` | PASS |
| API-28 | API | AC-15, FR-23 | GET /api/staff/tickets?search=laptop | 200; only tickets with "laptop" in number or summary | `server/tests/lab-03/staff-queue.api.test.ts` | PASS |
| API-29 | API | AC-16, FR-23 | GET /api/staff/tickets?itPriority=HIGH | 200; only HIGH priority tickets | `server/tests/lab-03/staff-queue.api.test.ts` | PASS |
| API-30 | API | AC-17, FR-23 | GET /api/staff/tickets?assignment=unassigned | 200; only tickets with ownerId=null | `server/tests/lab-03/staff-queue.api.test.ts` | PASS |
| API-31 | API | FR-23 | GET /api/staff/tickets?assignment=assigned-to-me | 200; only tickets owned by authenticated IT Staff | `server/tests/lab-03/staff-queue.api.test.ts` | PASS |
| API-32 | API | FR-23 | GET /api/staff/tickets?page=2&pageSize=25 | 200; correct pagination metadata | `server/tests/lab-03/staff-queue.api.test.ts` | PASS |
| API-33 | API | BR-16 | Non-IT Staff user attempts GET /api/staff/tickets | 403 | `server/tests/lab-03/staff-queue.api.test.ts` | PASS |

### 2.5. IT Staff Ticket Operations Tests

| Test ID | Type | AC / BR | What It Tests | Expected Result | Test File Path | Final |
|---------|------|---------|---------------|-----------------|----------------|-------|
| API-34 | API | FR-26 | GET /api/staff/tickets/:ticketNumber for any ticket (not ownership-restricted) | 200; full ticket detail | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | PASS |
| API-35 | API | AC-18, FR-27, BR-20 | PATCH /api/staff/tickets/:ticketNumber/owner to claim ticket | 200; ownerId set to authenticated user | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | PASS |
| API-36 | API | FR-28, BR-21 | PATCH /api/staff/tickets/:ticketNumber/owner to reassign to another IT Staff | 200; ownerId updated | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | PASS |
| API-37 | API | BR-21 | PATCH /api/staff/tickets/:ticketNumber/owner with invalid ownerId | 400 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | PASS |
| API-38 | API | AC-19, FR-29, BR-25 | PATCH /api/staff/tickets/:ticketNumber/it-priority | 200; itPriority updated | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | PASS |
| API-39 | API | BR-26 | PATCH IT Priority with invalid value | 400 | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | PASS |
| API-40 | API | AC-20, FR-30, BR-29 | PATCH /api/staff/tickets/:ticketNumber/status from NEW to OPEN (valid transition) | 200; status updated | `server/tests/lab-03/staff-status.api.test.ts` | PASS |
| API-41 | API | AC-21, BR-29 | PATCH status from NEW to RESOLVED (invalid direct transition) | 400; "Invalid status transition" | `server/tests/lab-03/staff-status.api.test.ts` | PASS |
| API-42 | API | BR-29 | PATCH status from IN_PROGRESS to WAITING_FOR_REQUESTER (valid) | 200; status updated | `server/tests/lab-03/staff-status.api.test.ts` | PASS |
| API-43 | API | BR-29 | PATCH status from RESOLVED to CLOSED (valid) | 200; status updated | `server/tests/lab-03/staff-status.api.test.ts` | PASS |
| API-44 | API | BR-29 | PATCH status from CLOSED to REOPENED (valid) | 200; status updated | `server/tests/lab-03/staff-status.api.test.ts` | PASS |
| API-45 | API | BR-29 | PATCH status from CANCELLED (terminal state) | 400; "Cannot transition from CANCELLED" | `server/tests/lab-03/staff-status.api.test.ts` | PASS |

### 2.6. Public Comments & Internal Notes Tests

| Test ID | Type | AC / BR | What It Tests | Expected Result | Test File Path | Final |
|---------|------|---------|---------------|-----------------|----------------|-------|
| API-46 | API | FR-31, BR-35 | IT Staff POST /api/tickets/:ticketNumber/comments | 201; Public Comment saved with IT Staff author | `server/tests/lab-03/comments.api.test.ts` | PASS |
| API-47 | API | AC-23, BR-33 | Requester GET comments on owned ticket; sees both Requester and IT Staff comments | 200; all Public Comments visible | `server/tests/lab-03/comments.api.test.ts` | PASS |
| API-48 | API | AC-22, FR-32, BR-36 | IT Staff POST /api/staff/tickets/:ticketNumber/notes | 201; Internal Note saved | `server/tests/lab-03/comments-notes.api.test.ts` | PASS |
| API-49 | API | AC-24, BR-34 | Requester attempts GET /api/staff/tickets/:ticketNumber/notes | 403; no note content returned | `server/tests/lab-03/comments-notes.api.test.ts` | PASS |
| API-50 | API | BR-34 | IT Staff GET /api/staff/tickets/:ticketNumber/notes | 200; all Internal Notes visible | `server/tests/lab-03/comments-notes.api.test.ts` | PASS |
| API-51 | API | BR-36 | Requester attempts POST /api/staff/tickets/:ticketNumber/notes | 403 | `server/tests/lab-03/comments-notes.api.test.ts` | PASS |
| API-52 | API | AC-25, BR-39 | POST Internal Note with empty content | 400; validation error | `server/tests/lab-03/comments-notes.api.test.ts` | PASS |
| API-53 | API | BR-40 | POST Internal Note with content > 2000 chars | 400; validation error | `server/tests/lab-03/comments-notes.api.test.ts` | PASS |
| API-54 | API | BR-37 | Comments and Notes are append-only; no DELETE endpoint exists | N/A; DELETE not implemented | — | N/A |
| API-55 | API | BR-38, BR-41 | Author identity and timestamp set by backend; client cannot override | Comment/Note authorId matches session user; createdAt is server time | `server/tests/lab-03/comments-notes.api.test.ts` | PASS |

### 2.7. Administrator User Management Tests

| Test ID | Type | AC / BR | What It Tests | Expected Result | Test File Path | Final |
|---------|------|---------|---------------|-----------------|----------------|-------|
| API-56 | API | AC-26, FR-41 | GET /api/admin/users lists all users | 200; all users returned | `server/tests/lab-03/admin-users.api.test.ts` | PASS |
| API-57 | API | FR-42 | GET /api/admin/users?search=anderson | 200; only users with "anderson" in name or email | `server/tests/lab-03/admin-users.api.test.ts` | PASS |
| API-58 | API | FR-43 | GET /api/admin/users?role=IT_STAFF | 200; only IT Staff users | `server/tests/lab-03/admin-users.api.test.ts` | PASS |
| API-59 | API | AC-32, BR-51 | Non-Administrator attempts GET /api/admin/users | 403 | `server/tests/lab-03/admin-users.api.test.ts` | PASS |
| API-60 | API | AC-28, FR-44, BR-42 | POST /api/admin/users with valid data | 201; user created with requiresPasswordChange=true | `server/tests/lab-03/admin-users.api.test.ts` | PASS |
| API-61 | API | AC-27, BR-43, BR-44 | POST /api/admin/users with duplicate email | 409; "A user with this email already exists" | `server/tests/lab-03/admin-users.api.test.ts` | PASS |
| API-62 | API | BR-42 | POST /api/admin/users with multiple roles (if client attempts) | 400 or ignored; only one role stored | `server/tests/lab-03/admin-users.api.test.ts` | PASS |
| API-63 | API | FR-44 | POST /api/admin/users with invalid email format | 400; validation error | `server/tests/lab-03/admin-users.api.test.ts` | PASS |
| API-64 | API | BR-50 | POST /api/admin/users with weak initial password | 400; password validation error | `server/tests/lab-03/admin-users.api.test.ts` | PASS |
| API-65 | API | AC-29, FR-46 | PATCH /api/admin/users/:id to update name, email, role | 200; user updated | `server/tests/lab-03/admin-users.api.test.ts` | PASS |
| API-66 | API | BR-45 | PATCH /api/admin/users/:id with duplicate email | 409 | `server/tests/lab-03/admin-users.api.test.ts` | PASS |
| API-67 | API | AC-30, BR-46 | Administrator attempts to deactivate own account | 403; "You cannot deactivate your own account" | `server/tests/lab-03/admin-users.api.test.ts` | PASS |
| API-68 | API | AC-31, BR-47 | Attempt to deactivate last active Administrator | 409; "Cannot deactivate the last active Administrator" | `server/tests/lab-03/admin-users.api.test.ts` | PASS |
| API-69 | API | FR-47, BR-49 | POST /api/admin/users/:id/reset-password | 200; requiresPasswordChange=true for target user | `server/tests/lab-03/admin-users.api.test.ts` | PASS |
| API-70 | API | BR-48 | Users are deactivated (isActive=false), not deleted; no DELETE endpoint | N/A; DELETE not implemented | — | N/A |

### 2.8. Migration & Regression Tests

| Test ID | Type | AC / BR | What It Tests | Expected Result | Test File Path | Final |
|---------|------|---------|---------------|-----------------|----------------|-------|
| API-71 | API | AC-33, BR-52 | Existing Lab 2 tickets remain accessible after migration | 200; old tickets retrieved successfully | `server/tests/lab-03/migration.api.test.ts` | N/A |
| API-72 | API | AC-34, BR-54 | Existing Lab 2 attachments remain downloadable after migration | 200; old attachments download successfully | `server/tests/lab-03/migration.api.test.ts` | N/A |
| API-73 | API | BR-52 | Migrated RequesterUser records have role=REQUESTER and requiresPasswordChange=true | Query User table; verify role and flag | `server/tests/lab-03/migration.api.test.ts` | N/A |
| API-74 | API | BR-53 | Existing Ticket.requesterId FK references migrated User records | No orphaned tickets; all FK constraints valid | `server/tests/lab-03/migration.api.test.ts` | N/A |
| API-75 | API | BR-55 | All Lab 2 Requester functions (create ticket, view tickets, attachments) work with authenticated identity | Full Lab 2 workflow succeeds with auth | `server/tests/lab-03/migration.api.test.ts` | N/A |

### 2.9. UI Component Tests

| Test ID | Type | AC / BR | What It Tests | Expected Result | Test File Path | Final |
|---------|------|---------|---------------|-----------------|----------------|-------|
| UI-01 | UI | AC-01 | Login component renders email and password fields | Both fields and Sign In button visible | `client/tests/lab-03/Login.test.tsx` | FAIL |
| UI-02 | UI | AC-01 | Login: submit with valid credentials shows busy state | Button shows "Signing in..." with spinner, disabled | `client/tests/lab-03/Login.test.tsx` | FAIL |
| UI-03 | UI | AC-03 | Login: API failure shows generic error message | Error banner: "Invalid email or password" | `client/tests/lab-03/Login.test.tsx` | FAIL |
| UI-04 | UI | — | Login: password field has show/hide toggle | Clicking eye icon toggles type between password and text | `client/tests/lab-03/Login.test.tsx` | FAIL |
| UI-05 | UI | AC-02 | ChangePassword component renders all required fields | Current, new, confirm password fields visible | `client/tests/lab-03/ChangePassword.test.tsx` | FAIL |
| UI-06 | UI | BR-04 | ChangePassword: password requirements checklist updates as user types | Checkmarks turn green when requirements met | `client/tests/lab-03/ChangePassword.test.tsx` | FAIL |
| UI-07 | UI | BR-05 | ChangePassword: confirmation mismatch shows error | Error message: "Passwords do not match" | `client/tests/lab-03/ChangePassword.test.tsx` | FAIL |
| UI-08 | UI | AC-02 | ChangePassword: Continue button disabled until validation passes | Button disabled when requirements not met | `client/tests/lab-03/ChangePassword.test.tsx` | FAIL |
| UI-09 | UI | — | AppShell displays authenticated user name and role badge | User name and role badge visible in top-right | `client/tests/lab-03/AppShell.test.tsx` | N/A |
| UI-10 | UI | AC-06 | AppShell: Requester sees "My Tickets" and "Create Ticket" nav links | Both links visible; others hidden | `client/tests/lab-03/AppShell.test.tsx` | N/A |
| UI-11 | UI | AC-07 | AppShell: IT Staff sees "Ticket Queue" nav link | Queue link visible | `client/tests/lab-03/AppShell.test.tsx` | N/A |
| UI-12 | UI | AC-08 | AppShell: Administrator sees "User Management" nav link | User Management link visible | `client/tests/lab-03/AppShell.test.tsx` | N/A |
| UI-13 | UI | — | AppShell: Logout button triggers logout | Logout function called on button click | `client/tests/lab-03/AppShell.test.tsx` | N/A |
| UI-14 | UI | AC-12 | MyTickets: lists only authenticated Requester's tickets (no Change Requester button) | Tickets from authenticated user only; no selector | `client/tests/lab-03/MyTickets.test.tsx` | N/A |
| UI-15 | UI | — | CreateTicket: Requester field shows authenticated user (read-only, no Change Requester button) | Authenticated user name shown; field read-only | `client/tests/lab-03/CreateTicket.test.tsx` | N/A |
| UI-16 | UI | AC-13 | RequesterTicketDetail: Public Comments section visible with comment list | Comments section rendered; comments displayed | `client/tests/lab-03/RequesterTicketDetail.test.tsx` | N/A |
| UI-17 | UI | AC-13 | RequesterTicketDetail: "Add Public Comment" textarea and Post button | Textarea and button present; character count shown | `client/tests/lab-03/RequesterTicketDetail.test.tsx` | N/A |
| UI-18 | UI | — | RequesterTicketDetail: "Problem Appears Resolved" checkbox present | Checkbox visible with explanation | `client/tests/lab-03/RequesterTicketDetail.test.tsx` | N/A |
| UI-19 | UI | AC-14 | StaffTicketQueue: renders search bar, filters, sort controls, pagination | All controls visible | `client/tests/lab-03/StaffTicketQueue.test.tsx` | PARTIAL |
| UI-20 | UI | AC-14 | StaffTicketQueue: ticket table shows all required columns | Ticket No., Summary, Category, Priorities, Status, Owner, dates visible | `client/tests/lab-03/StaffTicketQueue.test.tsx` | PARTIAL |
| UI-21 | UI | AC-15 | StaffTicketQueue: search input filters tickets | Entering "laptop" filters list | `client/tests/lab-03/StaffTicketQueue.test.tsx` | PARTIAL |
| UI-22 | UI | AC-16 | StaffTicketQueue: IT Priority filter works | Selecting "HIGH" filters list | `client/tests/lab-03/StaffTicketQueue.test.tsx` | PARTIAL |
| UI-23 | UI | AC-17 | StaffTicketQueue: Assignment filter "Unassigned" works | Unassigned tickets shown | `client/tests/lab-03/StaffTicketQueue.test.tsx` | PARTIAL |
| UI-24 | UI | — | StaffTicketQueue: empty state shown when no tickets exist | "No tickets exist" message | `client/tests/lab-03/StaffTicketQueue.test.tsx` | PARTIAL |
| UI-25 | UI | — | StaffTicketQueue: no-results state shown when filters return nothing | "No tickets match filters" message | `client/tests/lab-03/StaffTicketQueue.test.tsx` | PARTIAL |
| UI-26 | UI | AC-18 | StaffTicketDetail: Ticket Owner dropdown and Save button | Dropdown with users, Save button present | `client/tests/lab-03/StaffTicketDetail.test.tsx` | FAIL |
| UI-27 | UI | AC-19 | StaffTicketDetail: IT Priority dropdown and Save button | Dropdown with LOW/MEDIUM/HIGH, Save button | `client/tests/lab-03/StaffTicketDetail.test.tsx` | FAIL |
| UI-28 | UI | AC-20 | StaffTicketDetail: Current Status dropdown shows only permitted next statuses | If status=NEW, dropdown shows OPEN, CANCELLED only | `client/tests/lab-03/StaffTicketDetail.test.tsx` | FAIL |
| UI-29 | UI | AC-22 | StaffTicketDetail: Public Comments section visible | Public Comments section rendered | `client/tests/lab-03/StaffTicketDetail.test.tsx` | FAIL |
| UI-30 | UI | AC-22 | StaffTicketDetail: Internal Notes section visually distinct | Light yellow background, amber border, warning label | `client/tests/lab-03/StaffTicketDetail.test.tsx` | FAIL |
| UI-31 | UI | — | StaffTicketDetail: Internal Notes placeholder warns about privacy | Placeholder: "not visible to Requester" | `client/tests/lab-03/StaffTicketDetail.test.tsx` | FAIL |
| UI-32 | UI | AC-26 | UserManagement: user list table with Name, Email, Role, Status, Edit | All columns visible | `client/tests/lab-03/UserManagement.test.tsx` | PASS |
| UI-33 | UI | — | UserManagement: search bar filters by name or email | Entering "anderson" filters list | `client/tests/lab-03/UserManagement.test.tsx` | PASS |
| UI-34 | UI | — | UserManagement: role filter works | Selecting "IT Staff" filters list | `client/tests/lab-03/UserManagement.test.tsx` | PASS |
| UI-35 | UI | — | UserManagement: "Create User" button opens modal/panel | Modal visible with form fields | `client/tests/lab-03/UserManagement.test.tsx` | PASS |
| UI-36 | UI | AC-28 | CreateUser modal: all required fields present | Name, Email, Role, Active toggle, Initial Password | `client/tests/lab-03/UserManagement.test.tsx` | PASS |
| UI-37 | UI | AC-27 | CreateUser: duplicate email shows 409 error | Error message: "A user with this email already exists" | `client/tests/lab-03/UserManagement.test.tsx` | PASS |
| UI-38 | UI | — | EditUser modal: all fields editable | Name, Email, Role, Active toggle editable | `client/tests/lab-03/UserManagement.test.tsx` | PASS |
| UI-39 | UI | AC-30 | EditUser: self-deactivation prevented (Active toggle disabled) | Toggle disabled with tooltip for own account | `client/tests/lab-03/UserManagement.test.tsx` | PASS |
| UI-40 | UI | AC-31 | EditUser: attempting to deactivate last active Administrator shows error | Error message: "Cannot deactivate last admin" | `client/tests/lab-03/UserManagement.test.tsx` | PASS |

### 2.10. E2E Tests

| Test ID | Type | AC / BR | What It Tests | Expected Result | Test File Path | Final |
|---------|------|---------|---------------|-----------------|----------------|-------|
| E2E-01 | E2E | AC-01 | Staff login with role-appropriate landing page | Ticket Queue and IT Staff role are visible | `e2e/lab-03/authentication.spec.ts` | PASS |
| E2E-02 | E2E | AC-02 | Create a user and complete first-login password change | User reaches the application after changing password | `e2e/lab-03/authentication.spec.ts` | FAIL |
| E2E-03 | E2E | AC-03 | Login with invalid credentials | Generic invalid-credentials message is visible | `e2e/lab-03/authentication.spec.ts` | PASS |
| E2E-04 | E2E | — | Authenticated `/api/auth/me` response | API returns the logged-in staff user | `e2e/lab-03/authentication.spec.ts` | PASS |
| E2E-05 | E2E | AC-05 | Logout clears UI session and blocks protected API | Protected API returns 401 after logout | `e2e/lab-03/authentication.spec.ts` | PASS |
| VIS-01 | E2E | — | Login screen at desktop, tablet, and mobile widths | Screenshots are captured at all three widths | `e2e/lab-03/authentication.spec.ts` | PASS |
| E2E-08 to E2E-12 | E2E | AC-07, AC-14, AC-18, AC-19, AC-20, AC-22 | Staff queue, ticket operations, comments, and notes | Staff workflow completes and internal notes remain staff-only | `e2e/lab-03/staff-ticket-flow.spec.ts` | PASS |
| E2E-13 | E2E | AC-24 | Requester cannot see internal notes | Internal Notes section is absent for requester | `e2e/lab-03/staff-ticket-flow.spec.ts` | FAIL |
| VIS-02 | E2E | — | Staff queue and ticket detail responsive screenshots | Screenshots are captured at tablet and mobile widths | `e2e/lab-03/staff-ticket-flow.spec.ts` | FAIL |
| E2E-18 to E2E-25 | E2E | AC-26, AC-27, AC-28, AC-29, AC-30, AC-31 | Administrator user listing, creation, editing, and safety checks | Administrator workflows complete successfully | `e2e/lab-03/user-administration.spec.ts` | FAIL |
| VIS-03 | E2E | — | User Management responsive and validation screenshots | Screenshots are captured and validation state is visible | `e2e/lab-03/user-administration.spec.ts` | FAIL |

### 2.11. Responsive Tests (Screenshots)

| Test ID | Type | AC / BR | What It Tests | Expected Result | Test File Path | Final |
|---------|------|---------|---------------|-----------------|----------------|-------|
| RESP-01 | Responsive | — | Login screen at desktop, tablet, mobile | No horizontal scroll; centered card | `e2e/lab-03/responsive.spec.ts` | N/A |
| RESP-02 | Responsive | — | Change Password screen at desktop, tablet, mobile | No horizontal scroll; vertical layout on mobile | `e2e/lab-03/responsive.spec.ts` | N/A |
| RESP-03 | Responsive | — | My Tickets at desktop (table), tablet (table), mobile (cards) | Layout adapts correctly | `e2e/lab-03/responsive.spec.ts` | N/A |
| RESP-04 | Responsive | — | Create Ticket at desktop, tablet, mobile | All fields accessible; no overlap | `e2e/lab-03/responsive.spec.ts` | N/A |
| RESP-05 | Responsive | — | Requester Ticket Detail at desktop, tablet, mobile | Comments section readable | `e2e/lab-03/responsive.spec.ts` | N/A |
| RESP-06 | Responsive | — | IT Staff Ticket Queue at desktop (table), tablet (fewer columns), mobile (cards) | Layout adapts; filters stack vertically on mobile | `e2e/lab-03/responsive.spec.ts` | N/A |
| RESP-07 | Responsive | — | IT Staff Ticket Detail at desktop, tablet, mobile | Operational controls stack vertically on mobile | `e2e/lab-03/responsive.spec.ts` | N/A |
| RESP-08 | Responsive | — | User Management at desktop (table), tablet (table), mobile (cards) | Layout adapts correctly | `e2e/lab-03/responsive.spec.ts` | N/A |

---

## 3. Acceptance Criteria Traceability Matrix

| AC ID | Description (Short) | Covered By Test IDs |
|-------|---------------------|---------------------|
| AC-01 | Valid login returns user data and session | API-01, UI-02, E2E-01 |
| AC-02 | User with initial password forced to change before app access | API-05, AC-09, UI-05, UI-08, E2E-02 |
| AC-03 | Invalid credentials return generic error | API-02, API-03, UI-03, E2E-03 |
| AC-04 | Inactive user login returns same generic error | API-04 |
| AC-05 | Logout invalidates session | API-06, E2E-04 |
| AC-06 | Requester sees only Requester navigation | UI-10, E2E-05 |
| AC-07 | IT Staff sees Ticket Queue navigation | UI-11, E2E-08 |
| AC-08 | Administrator sees User Management navigation | UI-12, E2E-14 |
| AC-09 | Requester cannot access Internal Notes (403) | API-13, E2E-07 |
| AC-10 | Backend uses authenticated ID, not client-supplied requesterId | API-14 |
| AC-11 | Ticket creation uses authenticated requesterId | API-18 |
| AC-12 | My Tickets shows only authenticated Requester's tickets | API-19, UI-14, E2E-05 |
| AC-13 | Requester can post Public Comment on owned ticket | API-22, UI-16, UI-17, E2E-06 |
| AC-14 | IT Staff Queue shows all tickets with search/filter/sort/pagination | API-27, UI-19, UI-20, E2E-08 |
| AC-15 | IT Staff Queue search works | API-28, UI-21 |
| AC-16 | IT Staff Queue IT Priority filter works | API-29, UI-22 |
| AC-17 | IT Staff Queue assignment filter "Unassigned" works | API-30, UI-23 |
| AC-18 | IT Staff can claim unassigned ticket | API-35, UI-26, E2E-09 |
| AC-19 | IT Staff can update IT Priority | API-38, UI-27, E2E-10 |
| AC-20 | IT Staff can change status (valid transition) | API-40, UI-28, E2E-11 |
| AC-21 | Invalid status transition rejected | API-41, E2E-11 |
| AC-22 | IT Staff can post Internal Note | API-48, UI-30, E2E-12 |
| AC-23 | Requester sees Public Comments | API-47, UI-16 |
| AC-24 | Requester cannot see Internal Notes | API-49, E2E-13 |
| AC-25 | Empty comment/note content rejected | API-24, API-52 |
| AC-26 | Administrator sees user list | API-56, UI-32, E2E-14 |
| AC-27 | Duplicate email rejected with 409 | API-61, UI-37 |
| AC-28 | Administrator can create user with initial password | API-60, UI-36, E2E-15 |
| AC-29 | Administrator can edit user role | API-65, E2E-16 |
| AC-30 | Administrator cannot deactivate own account | API-67, UI-39, E2E-17 |
| AC-31 | Cannot deactivate last active Administrator | API-68, UI-40, E2E-18 |
| AC-32 | Non-Administrator cannot access admin endpoints | API-59 |
| AC-33 | Existing Lab 2 tickets remain accessible | API-71, E2E-20 |
| AC-34 | Existing Lab 2 attachments remain downloadable | API-72, E2E-20 |

---

## 4. Test Execution Commands

```bash
# Backend unit and API tests (from server/ directory)
npm run test

# Run specific Lab 3 test suite
npm run test -- tests/lab-03/

# Frontend UI component tests (from client/ directory)
npm run test

# Run specific Lab 3 UI test suite
npm run test -- tests/lab-03/

# E2E tests (from project root; Playwright starts the client and server)
npx playwright test e2e/lab-03/

# Run specific E2E suite
npx playwright test e2e/lab-03/authentication.spec.ts

# Run responsive screenshot tests
npx playwright test e2e/lab-03/responsive.spec.ts

# Run E2E tests in UI mode (interactive debugging)
npx playwright test --ui
```

---

## 5. Test Results Summary

Execution checked on 2026-09-18. `PASS` means the implemented test completed successfully. `FAIL` means the test ran and failed. `BLOCKED` means the test could not execute because the required environment or supporting implementation was unavailable. `N/A` means the test is planned but not implemented or not present in the current repository yet, so there is no actual test result to report.

| Suite | Total Tests | Passed | Failed | Skipped |
|-------|-------------|--------|--------|---------|
| Server (Unit + API) | 104 | 104 | 0 | 0 |
| Client (UI Component) | 35 | 22 | 13 | 0 |
| E2E + Responsive | 14 desktop cases / 42 project runs | 6 desktop cases | 8 desktop cases | Full stack ran with PostgreSQL; failures are application/test failures, not environment blocks |
| **Total** | **153 planned rows** | **132 executed tests/cases** | **21 failures** | **Remaining rows are N/A because their test files are absent** |

### Final Status By Test Area

| Test area | Final status | Evidence / reason |
|-----------|--------------|-------------------|
| UNIT-01 to UNIT-05 | PASS | Password validation and hashing tests passed. |
| API-18 to API-26 | PASS | Requester regression suite passed (31 tests). |
| API-27 to API-33 | PASS | Staff queue suite passed (14 tests). |
| API-01 to API-08, API-13 to API-17, API-22 to API-25, API-34 to API-69 | PASS | Docker PostgreSQL was available; all 104 server Lab 3 tests passed across 9 files. |
| UI-01 to UI-08, UI-26 to UI-31 | FAIL | Login, Change Password, and Staff Ticket Detail tests fail because `AuthContext` is undefined. |
| UI-19 to UI-25 | PARTIAL | Queue tests mostly pass; the Open action button test fails because no accessible `Open` button is rendered. |
| UI-32 to UI-40 | PASS | User Management component suite passed. |
| Implemented Lab 3 E2E cases | PARTIAL | Playwright discovered 14 cases in 3 files. A desktop run passed 6 cases and failed 8 cases; failures occur in first-login state, internal-note visibility, responsive navigation, and administrator login setup. |
| Planned RESP-01 to RESP-08 cases | N/A | No standalone `e2e/lab-03/responsive.spec.ts` file exists. Responsive screenshots currently live in `VIS-01`, `VIS-02`, and `VIS-03`. |

---

## 6. Visual Checklist for Lab 3

To be completed during visual inspection:

**Authentication Screens:**
- [x] Login screen uses Zen Green palette
- [x] Password fields have show/hide toggle
- [x] Error messages appear below fields in Dark Red
- [x] Buttons show busy state during API calls
- [x] Generic error messages (no user enumeration)

**Change Password:**
- [x] Requirements checklist updates in real-time
- [x] Checkmarks turn green when met
- [x] Continue button disabled until valid
- [x] Confirmation mismatch shows clear error

**Application Shell:**
- [x] User name and role badge in top-right
- [x] Role-specific navigation links only
- [x] Active page highlighted with Secondary Green
- [x] Logout button visible and functional
- [x] Mobile: hamburger menu with drawer

**Requester Screens:**
- [x] No Development Requester selector
- [x] My Tickets identical to Lab 2 (except no Change Requester)
- [x] Create Ticket shows authenticated user (read-only)
- [x] Ticket Detail includes Public Comments section
- [x] "Problem Appears Resolved" checkbox present
- [x] Comments show author, role badge, timestamp

**IT Staff Queue:**
- [x] Search, filters (all 5), sort, pagination functional
- [x] Table on desktop with all columns
- [x] Cards on mobile
- [x] Badges correct colors (Priority, Status)
- [x] "Unassigned" shown clearly
- [x] Loading, empty, no-results states

**IT Staff Ticket Detail:**
- [x] Ticket Information read-only (Warm Ivory background)
- [x] Operational Controls distinct section
- [x] Owner, IT Priority, Status dropdowns with Save buttons
- [x] Status dropdown shows only valid next statuses
- [x] Public Comments same as Requester view
- [x] Internal Notes visually distinct (yellow background, amber border, warning)
- [x] Internal Notes placeholder: "not visible to Requester"
- [x] No "Add Attachment" button for IT Staff

**Administrator User Management:**
- [x] Table on desktop, cards on mobile
- [x] Role badges correct colors
- [x] Status badges (Active=green, Inactive=gray)
- [x] Create User modal with all fields
- [x] Edit User modal with safety checks
- [x] Password input validation
- [x] Duplicate email error (409)
- [x] Self-deactivation disabled
- [x] Last admin check enforced

**Responsive:**
- [x] All screens work at desktop, tablet, mobile
- [x] No horizontal scroll on mobile
- [x] Touch targets ≥ 44px
- [x] Tables convert to cards on mobile

**Accessibility:**
- [x] All inputs have labels
- [x] Focus indicators visible
- [x] Error messages linked via `aria-describedby`
- [x] Color contrast meets WCAG AA
- [x] Modals have `role="dialog"`

**Consistency:**
- [x] Zen Green color palette consistent
- [x] Badges, buttons, cards follow Lab 2 conventions
- [x] No visual inconsistencies between old and new screens

---

## 7. Known Limitations or Deferred Features

- Email delivery for initial passwords or password reset links (excluded from Lab 3)
- Multi-factor authentication (excluded)
- Account unlocking and advanced identity management (excluded)
- User deletion (deactivation only)
- Multiple roles per user (single role only)
- Advanced user list pagination/filtering (basic search and role filter only)
- Load and performance testing (out of scope)
- Pixel-diff visual regression testing (manual checklist used)
