# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal

Replace the temporary Development Requester selector with real authentication and role-based authorization. Deliver secure user login with mandatory first-login password change, role-specific navigation and workflows for Requester, IT Staff, and Administrator roles, an operational IT Staff Ticket Queue and Ticket Detail workflow with Public Comments and Internal Notes, and a minimalist Administrator User Management interface — while preserving all Lab 2 Requester functionality and the established Zen Green design system.

---

## 2. Stakeholder Request Interpretation

The temporary Requester selector was useful for development testing but is not viable for production. The system now needs real users who authenticate with email and password. Upon first login with an initial password, users must choose a new password before accessing the application.

Three distinct roles must be supported:
- **Requester** continues to create and manage their own tickets using their authenticated identity
- **IT Staff** need a professional Ticket Queue to find work, claim or reassign tickets, set IT Priority, update ticket status through permitted workflow transitions, communicate with Requesters via Public Comments, and record private operational notes
- **Administrator** need a simple User Management screen to view users, create accounts, assign one role, update basic account information, activate or deactivate accounts, and set new initial passwords

Every API endpoint and screen must be protected according to role and ownership. Hiding a UI control is not sufficient — the backend must enforce authorization. The Zen Green design language and reusable component patterns from Lab 2 must be preserved and extended.

---

## 3. Scope

### 3.1. Included in Lab 3

**Authentication & Authorization:**
- Login with email and password
- Logout and session termination
- Current authenticated user retrieval
- Mandatory first-login password change before normal application access
- Role-based navigation showing only permitted destinations
- Server-side authorization on every protected endpoint
- Three roles: Requester, IT Staff, Administrator

**Requester Workflow:**
- All Lab 2 Requester functionality continues to work
- Remove Development Requester selector
- Use authenticated user identity for ticket ownership
- Add Public Comments on owned tickets
- Indicate that a problem appears resolved (Requester cannot formally resolve/close)

**IT Staff Workflow:**
- IT Staff Ticket Queue with search, filters, sorting, pagination
- Open Ticket Detail from queue
- Claim or reassign ticket ownership
- Set IT Priority (initially copies Requested Priority)
- Update ticket status through permitted transitions
- Post Public Comments
- Create Internal Notes (visible only to IT Staff and Administrator)
- View existing attachments

**Administrator Workflow:**
- User Management screen: list users with search and optional role filter
- Create user with name, email, one role, activation state, initial password
- Edit user: name, email, role, activation state
- Set new initial password (user must change at next login)
- Prevent duplicate email addresses
- Prevent Administrator from deactivating their own account
- Prevent removal or deactivation of last active Administrator
- Use deactivation instead of deletion

**Data Model:**
- User model with role, credentials, activation state, password-change requirement
- Migrate Lab 2 RequesterUser to real User model
- Ticket ownership: add optional IT Staff/Admin ticket owner field
- IT Priority field (separate from Requested Priority)
- Extended ticket status enum: New, Open, In Progress, Waiting for Requester, Resolved, Closed, Reopened, Cancelled
- Public Comments model with author and timestamp
- Internal Notes model with author and timestamp (role-restricted)
- Preserve existing Tickets and Attachments

**Security:**
- Passwords hashed with bcrypt (never stored in plaintext)
- Session or JWT-based authentication
- Authorization checks on every protected operation
- Safe error messages (avoid leaking existence of protected resources)
- CSRF protection considerations

### 3.2. Explicitly Excluded from Lab 3

- Email invitations, password-reset email, multi-factor authentication, social login, SSO
- Self-registration and Requester-created accounts
- Actions Taken by IT Staff (deferred to Lab 4)
- Formal SLA calculation, escalation rules, notification services
- Dashboards and KPI analytics beyond simple queue counts
- Multi-tenant organizations, departments, customer administration
- Production-grade deployment or cloud infrastructure changes
- Multiple roles assigned to one user
- User deletion, bulk user operations, user import/export, account history screens
- Department, organization, profile photo, extended user profile management
- Email delivery of initial passwords or reset links
- Account unlocking, administrator approval workflows, advanced identity management
- Advanced user-list features (mandatory pagination, multi-column sorting, multiple simultaneous filters)

---

## 4. Functional Requirements

### Authentication & Session Management
- **FR-01** Users authenticate by submitting email address and password to a login endpoint.
- **FR-02** Only active users with valid credentials may authenticate.
- **FR-03** Successful authentication establishes a server-managed authenticated session or returns a signed token.
- **FR-04** Users with an initial password (requiresPasswordChange flag set) are redirected to a mandatory Change Password screen before accessing normal application functions.
- **FR-05** The Change Password screen validates new password against defined rules, requires confirmation, and upon success clears the requiresPasswordChange flag and allows normal application access.
- **FR-06** The system provides a current-user endpoint that returns the authenticated user's identity, name, and role.
- **FR-07** The system provides a logout endpoint that invalidates the authenticated session or token.
- **FR-08** Unauthenticated requests to protected endpoints return 401 Unauthorized.
- **FR-09** Authenticated requests to forbidden resources return 403 Forbidden without exposing whether the resource exists.

### Role-Based Navigation & Authorization
- **FR-10** The application shell displays the authenticated user's name and role.
- **FR-11** Navigation links are shown only for destinations permitted by the user's role.
- **FR-12** Requester role sees: My Tickets, Create Ticket.
- **FR-13** IT Staff role sees: Ticket Queue, (optionally) My Assigned Tickets.
- **FR-14** Administrator role sees: User Management.
- **FR-15** Every protected API endpoint checks the authenticated user's role and ownership before processing the request.

### Requester Workflow (Authenticated Continuation of Lab 2)
- **FR-16** All Lab 2 Requester ticket and attachment functions continue to work using the authenticated Requester identity.
- **FR-17** The authenticated requesterId is derived from the session/token; the client does not supply it.
- **FR-18** Requester can view and manage only tickets they own.
- **FR-19** Requester can post Public Comments on tickets they own.
- **FR-20** Requester can indicate that a reported problem appears resolved; this does not change the ticket status to Resolved.
- **FR-21** Requester cannot formally resolve or close a ticket.

### IT Staff Ticket Queue
- **FR-22** IT Staff can view the Ticket Queue showing all tickets (not limited to one requester).
- **FR-23** The Ticket Queue supports keyword search (Ticket Number, Summary), filters (Category, Requested Priority, IT Priority, Status, Assignment), sorting (Created Date, Last Updated, IT Priority), and pagination.
- **FR-24** Each queue row shows: Ticket Number, Created Date, Summary, Category, Requested Priority, IT Priority, Current Status, Ticket Owner (or "Unassigned"), Last Updated.
- **FR-25** Queue provides an action to open Ticket Detail.

### IT Staff Ticket Detail & Operations
- **FR-26** IT Staff can open any ticket from the queue regardless of ownership.
- **FR-27** IT Staff can claim an unassigned ticket (sets themselves as owner).
- **FR-28** IT Staff can reassign a ticket to another active IT Staff or Administrator user.
- **FR-29** IT Staff can update IT Priority (separate from Requested Priority).
- **FR-30** IT Staff can change ticket status according to permitted transitions.
- **FR-31** IT Staff can post Public Comments visible to Requester, IT Staff, and Administrator.
- **FR-32** IT Staff can create Internal Notes visible only to IT Staff and Administrator.
- **FR-33** IT Staff can view existing attachments but cannot add new attachments (Requester-only in Lab 3).
- **FR-34** All Ticket Detail operational fields are editable only by IT Staff/Administrator; Requester sees them as read-only.

### Public Comments & Internal Notes
- **FR-35** Public Comments are visible to the ticket's Requester, IT Staff, and Administrator.
- **FR-36** Internal Notes are visible only to IT Staff and Administrator; Requester cannot see them.
- **FR-37** Both Comments and Notes are append-only in Lab 3 (no editing or deletion).
- **FR-38** Each entry records its author (name and role) and creation timestamp from the backend.
- **FR-39** Empty or whitespace-only content is rejected.
- **FR-40** Comments and Notes are displayed in chronological order with clear visual distinction.

### Administrator User Management
- **FR-41** Administrator can view a list of all users showing Name, Email, Role, Status (Active/Inactive).
- **FR-42** Administrator can search users by name or email.
- **FR-43** Administrator can optionally filter users by role.
- **FR-44** Administrator can create a new user with: full name, email address, one permitted role (Requester, IT Staff, or Administrator), activation state (active/inactive), and an initial password.
- **FR-45** Duplicate email addresses are rejected.
- **FR-46** Administrator can edit an existing user's name, email address, role, and activation state.
- **FR-47** Administrator can set a new initial password for a user; the user must change it at next login.
- **FR-48** Administrator cannot deactivate their own account.
- **FR-49** The system prevents removal or deactivation of the last active Administrator.
- **FR-50** Users are deactivated (not deleted) to preserve data integrity and audit trail.

---

## 5. Business Rules

### Authentication & Password Rules
- **BR-01** Only an active user (isActive = true) with valid credentials may authenticate.
- **BR-02** A user marked as requiring a password change (requiresPasswordChange = true) cannot enter the normal application until a new valid password is saved.
- **BR-03** Passwords must be at least 8 characters long.
- **BR-04** Passwords must include: at least one uppercase letter, at least one lowercase letter, at least one number, and at least one special character.
- **BR-05** Password confirmation must match the new password exactly.
- **BR-06** Current password must be validated before allowing password change.
- **BR-07** Passwords are hashed using bcrypt with appropriate work factor before storage; plaintext passwords are never stored.
- **BR-08** Failed login attempts return a generic error message ("Invalid email or password") without revealing whether the email exists.
- **BR-09** Inactive users attempting to login receive the same generic error message.
- **BR-10** Logout invalidates the current session or token; subsequent requests with that session/token return 401.

### Role & Authorization Rules
- **BR-11** Each user has exactly one role in Lab 3: Requester, IT Staff, or Administrator.
- **BR-12** Role assignment is stored in the User model and returned with the authenticated user payload.
- **BR-13** The authenticated user identity, not a requesterId or userId supplied by the client, determines ownership and permissions.
- **BR-14** Server-side authorization is enforced on every protected endpoint; hiding a UI button is not a security control.
- **BR-15** Attempting to access a resource owned by another user without permission returns 403 Forbidden.
- **BR-16** Attempting to access a role-restricted resource returns 403 Forbidden.
- **BR-17** Error messages for forbidden access do not expose whether the protected resource exists.

### Ticket Ownership & Assignment Rules
- **BR-18** Each ticket has one Requester (the creator) and zero or one IT Staff/Administrator Ticket Owner.
- **BR-19** A ticket may initially be unassigned (Ticket Owner = null).
- **BR-20** Only IT Staff and Administrator can claim or reassign ticket ownership.
- **BR-21** Ticket Owner can be reassigned to any active IT Staff or Administrator user.
- **BR-22** Requester identity (ticket creator) never changes after ticket creation.

### Priority Rules
- **BR-23** Requested Priority is set by the Requester at ticket creation and never changes.
- **BR-24** IT Priority initially copies Requested Priority when the ticket is created.
- **BR-25** IT Priority can be changed only by IT Staff or Administrator.
- **BR-26** Allowed priority values: LOW, MEDIUM, HIGH.

### Ticket Status Workflow Rules
- **BR-27** New tickets are created with status NEW.
- **BR-28** Required statuses: New, Open, In Progress, Waiting for Requester, Resolved, Closed, Reopened, Cancelled.
- **BR-29** Status transitions are governed by a transition matrix (defined below).
- **BR-30** Only IT Staff and Administrator can change ticket status.
- **BR-31** Requester can indicate "Problem Appears Resolved" which is recorded as a flag or comment but does NOT change status to Resolved.
- **BR-32** Formal resolution and closure are IT Staff/Administrator actions only.

**Status Transition Matrix:**

| From Status | Permitted Next Status(es) | Who Can Transition |
|-------------|---------------------------|---------------------|
| New | Open, Cancelled | IT Staff, Administrator |
| Open | In Progress, Cancelled | IT Staff, Administrator |
| In Progress | Waiting for Requester, Resolved, Cancelled | IT Staff, Administrator |
| Waiting for Requester | In Progress, Resolved, Cancelled | IT Staff, Administrator |
| Resolved | Closed, Reopened | IT Staff, Administrator |
| Closed | Reopened | IT Staff, Administrator |
| Reopened | Open, In Progress, Resolved, Cancelled | IT Staff, Administrator |
| Cancelled | (terminal state) | — |

**Note:** Lab 3 does not include Actions Taken, so the Lab 4 rule that blocks resolution while Actions Taken remain incomplete is deferred.

### Public Comments & Internal Notes Rules
- **BR-33** Public Comments are visible to the ticket's Requester, all IT Staff, and all Administrators.
- **BR-34** Internal Notes are visible only to IT Staff and Administrator; Requester cannot read or write them.
- **BR-35** Requester and IT Staff/Administrator can post Public Comments.
- **BR-36** Only IT Staff and Administrator can create Internal Notes.
- **BR-37** Comments and Notes are append-only in Lab 3; editing and deletion are excluded.
- **BR-38** Each Comment or Note records: content, author (User ID and name), author role, creation timestamp.
- **BR-39** Content must not be empty or whitespace-only (minimum 1 character after trimming).
- **BR-40** Maximum content length: 2000 characters.
- **BR-41** Author identity and timestamp are set by the backend from the authenticated session; client cannot override.

### Administrator User Management Rules
- **BR-42** Administrator can create a user with one permitted role: Requester, IT Staff, or Administrator.
- **BR-43** Email addresses must be unique across all users.
- **BR-44** Duplicate email addresses are rejected with 409 Conflict.
- **BR-45** Administrator can update user's name, email address, role, and activation state.
- **BR-46** Administrator cannot deactivate their own account.
- **BR-47** The system must always have at least one active Administrator; attempting to deactivate the last active Administrator is rejected with 409 Conflict.
- **BR-48** Users are deactivated (isActive = false) rather than deleted to preserve referential integrity and audit trail.
- **BR-49** Administrator can set a new initial password for any user; the user's requiresPasswordChange flag is set to true.
- **BR-50** Initial passwords are temporary placeholders; users must change them at next login.
- **BR-51** Non-Administrator users cannot access User Management endpoints; attempts return 403 Forbidden.

### Migration & Regression Rules
- **BR-52** Lab 2 RequesterUser records are migrated to the User model with role = Requester, isActive preserved, and requiresPasswordChange = true.
- **BR-53** Existing Ticket.requesterId foreign keys are updated to reference the migrated User records.
- **BR-54** All existing Lab 2 tickets, attachments, categories, and related systems remain valid and accessible after migration.
- **BR-55** Lab 2 Requester functionality (create ticket, view owned tickets, manage attachments) continues to work identically using authenticated identity.

---

## 6. UI Specification Summary

Full details in `docs/lab-03/ui-spec.md`. Summary below:

### Application Shell (Updated)
- Top navigation bar: TokTickIT logo, role-specific navigation links, authenticated user display (name, role badge), Logout button
- Role-specific navigation:
  - **Requester:** My Tickets, Create Ticket
  - **IT Staff:** Ticket Queue
  - **Administrator:** User Management
- Remove Development Requester selector and "Change Requester" action
- Preserve Zen Green design system

### Login Screen
- Email address input (required)
- Password input with show/hide toggle (required)
- "Sign In" button (Primary, shows busy state)
- Field-level validation messages
- Generic error message for invalid credentials or inactive account
- Loading state during authentication request
- No "Forgot Password" link (excluded from Lab 3)

### Change Password Screen (Mandatory First Login)
- Message: "You must change your password to continue"
- Current (temporary) password input
- New password input
- Confirm new password input
- Password requirements displayed:
  - At least 8 characters
  - Include uppercase and lowercase letters
  - Include a number and a special character
- "Continue" button (Primary, disabled until validation passes)
- Field-level validation messages
- Success: redirect to normal application

### Requester Screens (Lab 2 Screens with Minimal Changes)
- **My Tickets:** Remove "Change Requester" button; otherwise identical to Lab 2
- **Create Ticket:** Remove "Change Requester" button; Requester field shows authenticated user (read-only); otherwise identical
- **Ticket Detail:** Add Public Comments section below attachments; add "Problem Appears Resolved" checkbox/button; otherwise read-only as in Lab 2

### IT Staff Ticket Queue
- Page title "Ticket Queue"
- Search bar (Ticket Number, Summary)
- Filters: Category, Requested Priority, IT Priority, Current Status, Assignment (All / Unassigned / Assigned to Me / Other)
- Sort: Created Date, Last Updated, IT Priority (asc/desc toggle)
- Default sort: IT Priority desc, then Created Date desc
- Table columns: Ticket No., Created Date, Summary, Category, Req. Priority, IT Priority, Status, Owner, Last Updated
- Pagination controls
- "Open" action per row
- Loading, empty ("No tickets exist"), no-results ("No tickets match filters"), and error states
- Responsive: table on desktop, cards on tablet/mobile

### IT Staff Ticket Detail
- Breadcrumb: Ticket Queue > Ticket No.
- Ticket information section (read-only): Ticket Number, Ticket Date, Requester Name, Category, Related System, Summary, Description
- Operational section (editable):
  - **Ticket Owner:** Dropdown (Unassigned / active IT Staff & Admin users), Save button
  - **Requested Priority:** Badge (read-only)
  - **IT Priority:** Dropdown (Low/Medium/High), Save button
  - **Current Status:** Dropdown (permitted next statuses based on transition matrix), Save button with confirmation if needed
- **Attachments:** Read-only list with download actions (IT Staff cannot add attachments in Lab 3)
- **Public Comments:** List of comments (author, role badge, timestamp, content); "Add Public Comment" textarea and Post button
- **Internal Notes:** List of notes (author, role badge, timestamp, content) with distinct visual styling (e.g., yellow background); "Add Internal Note" textarea and Post button
- Public Comments and Internal Notes are visually distinct to prevent accidental public posting of private information
- Back to Queue link

### Administrator User Management
- Page title "User Management"
- Search bar (name, email)
- Filter: Role (All / Requester / IT Staff / Administrator)
- "Create User" button (Primary, opens modal or side panel)
- User list table: Name, Email, Role (badge), Status (Active/Inactive badge), Edit action
- **Create User Form:**
  - Full Name (required)
  - Email Address (required, validated format)
  - Role dropdown (Requester / IT Staff / Administrator, required)
  - Active toggle (default: true)
  - Initial Password (required, must meet password rules)
  - "Save User" button
  - Validation messages per field
  - Duplicate email: 409 conflict message
- **Edit User Form:**
  - Full Name (editable)
  - Email Address (editable, validated format)
  - Role dropdown (editable)
  - Active toggle (editable, with safety check for last admin and self-deactivation)
  - "Set New Initial Password" button (opens password input, requires confirmation)
  - "Save Changes" button
  - "Cancel" button
  - Validation messages per field
- No pagination in Lab 3 (simple list, pagination deferred)
- No user deletion action (deactivation only)

### Component States (Extended from Lab 2)
- **Editable fields:** white background, clear border, focusable
- **Read-only fields:** soft gray-green or ivory background, clearly distinct
- **Invalid fields:** red border, error message below
- **Disabled fields:** visually muted, not interactive
- **Busy/loading buttons:** spinner/loading text, disabled
- **Badges:** Status (New=green, Open=blue, In Progress=amber, Waiting=purple, Resolved=teal, Closed=gray, Reopened=orange, Cancelled=red); Priority (Low=blue, Medium=amber, High=red); Role (Requester=blue, IT Staff=green, Administrator=purple)

### Responsive Rules (Same as Lab 2)
- Desktop ≥ 992 px: multi-column layout, table for lists
- Tablet 768–991 px: two-column where practical, table collapses to fewer columns
- Mobile < 768 px: single column, lists become cards, touch-friendly buttons

---

## 7. Data Changes

### 7.1. New User Model (Replaces RequesterUser)

| Field | Type | Notes |
|-------|------|-------|
| id | Int (autoincrement) | PK |
| name | String | Full name, required |
| email | String | Unique, required |
| passwordHash | String | bcrypt hash, never plaintext |
| role | Enum (REQUESTER, IT_STAFF, ADMINISTRATOR) | Required, exactly one role |
| isActive | Boolean | Default true; inactive users cannot login |
| requiresPasswordChange | Boolean | Default true; set true on initial password or admin reset |
| createdAt | DateTime | Default now() |
| updatedAt | DateTime | Auto-updated |

**Relationships:**
- User → Ticket (as requester): one-to-many via Ticket.requesterId
- User → Ticket (as owner): one-to-many via Ticket.ownerId (nullable)
- User → PublicComment (as author): one-to-many
- User → InternalNote (as author): one-to-many

### 7.2. Updated Ticket Model

**New fields added:**
| Field | Type | Notes |
|-------|------|-------|
| ownerId | Int? | FK → User (IT Staff or Admin who owns this ticket); nullable (unassigned) |
| itPriority | Enum (LOW, MEDIUM, HIGH) | Initially copies requestedPriority; editable by IT Staff/Admin |
| problemResolvedByRequester | Boolean | Default false; set true if Requester indicates problem appears resolved |

**Updated field:**
| Field | Type | Notes |
|-------|------|-------|
| status | Enum | Extended: NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CLOSED, REOPENED, CANCELLED |

**Existing fields preserved:**
- id, ticketNumber, requesterId (now FK to User), categoryId, relatedSystemId, summary, description, requestedPriority, ticketDate, createdAt, updatedAt

**New indexes:**
- `Ticket.ownerId` — index for IT Staff "My Assigned Tickets" queries
- `Ticket.itPriority` — index for queue sorting and filtering
- `Ticket.status` — already indexed; supports filtering

### 7.3. New PublicComment Model

| Field | Type | Notes |
|-------|------|-------|
| id | Int (autoincrement) | PK |
| ticketId | Int | FK → Ticket, required |
| authorId | Int | FK → User, required |
| content | String | 1–2000 chars after trimming |
| createdAt | DateTime | Default now() |

**Relationships:**
- PublicComment → Ticket: many-to-one
- PublicComment → User (author): many-to-one

**Indexes:**
- `PublicComment.ticketId` — index for retrieving all comments on a ticket
- `PublicComment.createdAt` — index for chronological ordering

### 7.4. New InternalNote Model

| Field | Type | Notes |
|-------|------|-------|
| id | Int (autoincrement) | PK |
| ticketId | Int | FK → Ticket, required |
| authorId | Int | FK → User, required |
| content | String | 1–2000 chars after trimming |
| createdAt | DateTime | Default now() |

**Relationships:**
- InternalNote → Ticket: many-to-one
- InternalNote → User (author): many-to-one

**Indexes:**
- `InternalNote.ticketId` — index for retrieving all notes on a ticket
- `InternalNote.createdAt` — index for chronological ordering

### 7.5. Migration from Lab 2 to Lab 3

**Step 1: Rename RequesterUser to User and Add Fields**
- Rename `RequesterUser` model to `User`
- Add `passwordHash` (String, initially empty or placeholder hash)
- Add `role` (Enum, default REQUESTER for all migrated records)
- Add `requiresPasswordChange` (Boolean, default true for all migrated records)
- Preserve `id`, `name`, `email`, `isActive`, `createdAt`, `updatedAt`

**Step 2: Update Ticket Foreign Key**
- `Ticket.requesterId` already references the User model (formerly RequesterUser)
- Add `Ticket.ownerId` (Int?, nullable) default null
- Add `Ticket.itPriority` (Enum, copy from `Ticket.requestedPriority` for existing tickets)
- Add `Ticket.problemResolvedByRequester` (Boolean, default false)
- Update `Ticket.status` enum to include new values

**Step 3: Create New Models**
- Create `PublicComment` table (initially empty)
- Create `InternalNote` table (initially empty)

**Step 4: Seed Initial Users**
- Create at least one active Administrator with known initial password for testing
- Create active IT Staff accounts (at least 3)
- Existing Requester users from Lab 2 migration already exist; ensure they have role=REQUESTER and requiresPasswordChange=true

**Design Decision:**
- Migrated Lab 2 Requesters get `requiresPasswordChange = true` and a placeholder passwordHash. They must set a real password on first login.
- Existing tickets preserve their requesterId; no ticket data is lost.
- `ownerId` starts as null (unassigned) for all existing tickets.

### 7.6. Updated Seed Data for Lab 3

**Users (Idempotent Upsert):**
- **Active Requesters (4):** Migrated from Lab 2, role = REQUESTER, requiresPasswordChange = true
- **Inactive Requester (1):** Migrated from Lab 2, isActive = false
- **Active IT Staff (3):** e.g., Michael Brown (IT Support), Sarah Johnson (IT Support), Kevin Patel (IT Support) with known initial passwords, role = IT_STAFF, requiresPasswordChange = true
- **Inactive IT Staff (1):** e.g., Robert Wilson (inactive), role = IT_STAFF, isActive = false
- **Active Administrator (1):** e.g., Admin User with known initial password, role = ADMINISTRATOR, requiresPasswordChange = true (for first-time login demo)

**Tickets:**
- Existing Lab 2 tickets preserved
- Add variety: some assigned to IT Staff, some unassigned, various statuses, various IT Priorities

**Public Comments & Internal Notes:**
- Seed a few example comments and notes on existing tickets for UI testing

**Categories, Related Systems, Attachments:**
- Unchanged from Lab 2

---

## 8. API Contract Summary

Full details in `docs/lab-03/api-spec.md`. Summary of endpoints:

### Authentication Endpoints

| Method | Path | Purpose | Auth Required |
|--------|------|---------|---------------|
| POST | /api/auth/login | Authenticate with email/password; establish session or return token | No |
| POST | /api/auth/logout | Invalidate current session/token | Yes |
| GET | /api/auth/me | Get current authenticated user (id, name, email, role) | Yes |
| POST | /api/auth/change-password | Change password (requires current password, validates new password) | Yes |

### Requester Endpoints (Lab 2 APIs with Auth)

| Method | Path | Purpose | Auth Required | Role |
|--------|------|---------|---------------|------|
| GET | /api/categories | List active Categories | Yes | All |
| GET | /api/related-systems | List active Related Systems | Yes | All |
| POST | /api/tickets | Create Ticket (requesterId from auth) | Yes | Requester |
| GET | /api/tickets?search=&category=&priority=&status=&sort=&order=&page=&pageSize= | List authenticated user's tickets | Yes | Requester |
| GET | /api/tickets/:ticketNumber | Get one owned Ticket | Yes | Requester (owner only) |
| POST | /api/tickets/:ticketNumber/attachments | Upload Attachment | Yes | Requester (owner only) |
| GET | /api/tickets/:ticketNumber/attachments | List Attachments | Yes | Owner or IT Staff/Admin |
| GET | /api/attachments/:id/download | Download Attachment | Yes | Owner or IT Staff/Admin |
| PATCH | /api/attachments/:id/remove | Soft-remove Attachment | Yes | Requester (owner only) |
| POST | /api/tickets/:ticketNumber/comments | Post Public Comment | Yes | Owner or IT Staff/Admin |
| GET | /api/tickets/:ticketNumber/comments | List Public Comments | Yes | Owner or IT Staff/Admin |

### IT Staff Endpoints

| Method | Path | Purpose | Auth Required | Role |
|--------|------|---------|---------------|------|
| GET | /api/staff/tickets?search=&category=&reqPriority=&itPriority=&status=&assignment=&sort=&order=&page=&pageSize= | IT Staff Ticket Queue | Yes | IT Staff, Administrator |
| GET | /api/staff/tickets/:ticketNumber | Get Ticket Detail (any ticket) | Yes | IT Staff, Administrator |
| PATCH | /api/staff/tickets/:ticketNumber/owner | Claim or reassign ticket ownership | Yes | IT Staff, Administrator |
| PATCH | /api/staff/tickets/:ticketNumber/it-priority | Update IT Priority | Yes | IT Staff, Administrator |
| PATCH | /api/staff/tickets/:ticketNumber/status | Update ticket status (with transition validation) | Yes | IT Staff, Administrator |
| POST | /api/staff/tickets/:ticketNumber/notes | Create Internal Note | Yes | IT Staff, Administrator |
| GET | /api/staff/tickets/:ticketNumber/notes | List Internal Notes | Yes | IT Staff, Administrator |

### Administrator Endpoints

| Method | Path | Purpose | Auth Required | Role |
|--------|------|---------|---------------|------|
| GET | /api/admin/users?search=&role= | List users with optional search and role filter | Yes | Administrator |
| POST | /api/admin/users | Create user | Yes | Administrator |
| GET | /api/admin/users/:id | Get one user | Yes | Administrator |
| PATCH | /api/admin/users/:id | Update user (name, email, role, isActive) | Yes | Administrator |
| POST | /api/admin/users/:id/reset-password | Set new initial password | Yes | Administrator |

---

## 9. Acceptance Criteria

### Authentication & First Login
- **AC-01** Given an active user with valid credentials, when the user logs in, then the backend establishes authenticated access and returns the permitted user identity and role.
- **AC-02** Given a user who must change the initial password, when login succeeds, then normal application screens remain unavailable until a valid new password is saved.
- **AC-03** Given invalid credentials, when the user attempts login, then the API returns 401 and a generic error message without exposing whether the email exists.
- **AC-04** Given an inactive user with correct credentials, when the user attempts login, then the API returns 401 and the same generic error message.
- **AC-05** Given an authenticated user, when the logout endpoint is called, then the session/token is invalidated and subsequent requests return 401.

### Role-Based Navigation & Authorization
- **AC-06** Given an authenticated Requester, when the application shell loads, then only "My Tickets" and "Create Ticket" navigation links are shown.
- **AC-07** Given an authenticated IT Staff user, when the application shell loads, then "Ticket Queue" navigation link is shown.
- **AC-08** Given an authenticated Administrator, when the application shell loads, then "User Management" navigation link is shown.
- **AC-09** Given an authenticated Requester, when an Internal Note endpoint is requested, then the operation is rejected with 403 without exposing note content.
- **AC-10** Given an authenticated Requester, when the client supplies another requesterId, then the backend still applies the authenticated identity and does not return another Requester's data.

### Requester Regression (Lab 2 Functions with Auth)
- **AC-11** Given an authenticated Requester, when they create a ticket, then the requesterId is derived from the authenticated session (not supplied by client).
- **AC-12** Given an authenticated Requester, when they view My Tickets, then only their own tickets are listed.
- **AC-13** Given an authenticated Requester, when they post a Public Comment on their ticket, then the comment is saved with author identity from session and is visible in the comment list.

### IT Staff Ticket Queue
- **AC-14** Given an authenticated IT Staff user, when they view the Ticket Queue, then all tickets are shown (not limited to one requester) with search, filter, sort, and pagination.
- **AC-15** Given an IT Staff user, when they search by keyword in the queue, then only tickets matching Ticket Number or Summary are shown.
- **AC-16** Given an IT Staff user, when they filter by IT Priority, then only tickets with that priority are shown.
- **AC-17** Given an IT Staff user, when they filter by Assignment = "Unassigned", then only tickets with ownerId = null are shown.

### IT Staff Ticket Detail & Operations
- **AC-18** Given an IT Staff user, when they open an unassigned ticket and claim it, then the ticket's ownerId is set to their user ID.
- **AC-19** Given an IT Staff user, when they update IT Priority, then the change is saved and reflected in the queue and detail views.
- **AC-20** Given a ticket with status NEW, when IT Staff changes status to OPEN, then the change is saved (valid transition).
- **AC-21** Given a ticket with status NEW, when IT Staff attempts to change status to RESOLVED (invalid direct transition), then the API rejects the request with 400.
- **AC-22** Given an IT Staff user, when they post an Internal Note, then the note is saved with author identity and is visible only to IT Staff and Administrator.

### Public Comments & Internal Notes
- **AC-23** Given a Requester, when they view their ticket detail, then all Public Comments are visible with author names and timestamps.
- **AC-24** Given a Requester, when they view their ticket detail, then Internal Notes are not shown (403 if endpoint is called).
- **AC-25** Given empty or whitespace-only comment content, when a user attempts to post, then the API returns 400 validation error.

### Administrator User Management
- **AC-26** Given an Administrator, when they view the User Management screen, then all users are listed with Name, Email, Role, and Status.
- **AC-27** Given an Administrator, when they create a user with a duplicate email, then the API returns 409 Conflict.
- **AC-28** Given an Administrator, when they create a user with a valid initial password, then the user is saved with requiresPasswordChange = true.
- **AC-29** Given an Administrator, when they edit a user and change the role, then the role is updated and takes effect on the user's next login.
- **AC-30** Given an Administrator, when they attempt to deactivate their own account, then the API returns 403 Forbidden.
- **AC-31** Given only one active Administrator exists, when any attempt is made to deactivate that Administrator, then the API returns 409 Conflict.
- **AC-32** Given a non-Administrator user, when they attempt to access /api/admin/users, then the API returns 403 Forbidden.

### Migration & Regression
- **AC-33** Given existing Lab 2 tickets, when the migration runs, then all tickets remain accessible with their original requester identity intact.
- **AC-34** Given existing Lab 2 attachments, when the migration runs, then all attachments remain downloadable by the ticket owner.

---

## 10. Definition of Done

### Part 1: Product Completion
- [ ] All FRs (FR-01 through FR-50) are implemented and verifiable.
- [ ] All ACs (AC-01 through AC-34) have at least one passing automated test.
- [ ] All backend API tests pass (`server/tests/lab-03/`).
- [ ] All frontend UI component tests pass (`client/tests/lab-03/`).
- [ ] All E2E tests pass (`e2e/lab-03/`).
- [ ] No tests are skipped, disabled, or commented out.
- [ ] Authentication and logout work correctly; sessions/tokens are invalidated.
- [ ] Mandatory first-login password change enforces password rules and blocks access until completed.
- [ ] Role-based navigation shows only permitted links.
- [ ] All protected API endpoints enforce server-side authorization; forbidden attempts return 403.
- [ ] Requester cannot access Internal Notes (403 if endpoint called).
- [ ] IT Staff Ticket Queue shows all tickets with working search, filter, sort, pagination.
- [ ] IT Staff can claim, reassign, update IT Priority, change status (with transition validation), post Public Comments and Internal Notes.
- [ ] Public Comments are visible to Requester, IT Staff, Administrator; Internal Notes visible only to IT Staff and Administrator.
- [ ] Administrator User Management works: list, search, filter, create, edit, set initial password, prevent duplicate email, prevent self-deactivation, prevent last admin removal.
- [ ] All Lab 2 Requester functions work identically using authenticated identity (no Development Requester selector).
- [ ] Migration preserves all existing tickets, attachments, categories, and related systems.
- [ ] Zen Green theme is consistent across all new screens.
- [ ] All screens are responsive at desktop, tablet, and mobile viewports.
- [ ] README is updated with Lab 3 setup, migration, seed data, and test commands.
- [ ] `docs/lab-03/specification.md`, `tests.md`, `ui-spec.md`, `api-spec.md` are complete and internally consistent.

### Part 2: Course Delivery
- [ ] All work is on feature branches merged into `lab3-staging` via peer-reviewed PRs.
- [ ] `lab3-staging` is merged to `main` via one release PR after full integration testing.
- [ ] All GitHub Issues are in Done on the Kanban board.
- [ ] `docs/lab-03/reviewer.md` is complete with PR links, reviewer identity, comments, and responses.
- [ ] `docs/lab-03/ai-use.md` is complete with LLM name, 6–10 key prompts, and reflection on specification and coding agent use.
- [ ] PDF submission includes all required Answer Parts 1–9 with working links and readable screenshots.

---

## 11. Assumptions and Decisions

### Authentication Mechanism
- **Decision:** Use HTTP-only session cookies with express-session and a PostgreSQL session store OR JWT tokens stored in HTTP-only cookies. Session cookies are preferred for simplicity and automatic CSRF protection in same-origin scenarios. If JWT is used, implement short expiration and refresh token strategy.
- **Justification:** Session cookies are easier to invalidate on logout and are secure against XSS if HTTP-only flag is set. JWT can be used if stateless authentication is desired, but requires careful handling of token revocation.

### Password Hashing
- **Decision:** Use bcrypt with work factor 10–12 for password hashing.
- **Justification:** bcrypt is industry-standard, resistant to rainbow table attacks, and appropriately slow to mitigate brute-force attempts.

### Initial Passwords for Migrated Users
- **Decision:** Migrated Lab 2 Requesters are assigned a placeholder passwordHash and `requiresPasswordChange = true`. Administrators manually set their initial passwords via the User Management interface or seed script.
- **Justification:** Lab 3 excludes email delivery of initial passwords. This approach allows testing without email infrastructure while preserving the requirement for first-login password change.

### requesterId Derivation
- **Decision:** The `requesterId` for ticket creation and ownership queries is always derived from the authenticated session user ID; the client never supplies it in the request body.
- **Justification:** This prevents privilege escalation where a client could impersonate another user by sending a different requesterId.

### IT Priority Initialization
- **Decision:** When a ticket is created, `itPriority` is automatically set to match `requestedPriority`. IT Staff can change it later.
- **Justification:** Provides a sensible default while allowing IT Staff to adjust based on operational knowledge.

### Ticket Owner (ownerId) Nullability
- **Decision:** `Ticket.ownerId` is nullable. Null means unassigned; non-null references an active IT Staff or Administrator user.
- **Justification:** Tickets can enter the queue unassigned and be claimed later. This is a common IT ticketing workflow.

### Status Transition Validation
- **Decision:** Backend enforces a transition matrix. Invalid transitions (e.g., NEW → RESOLVED directly) return 400 Bad Request.
- **Justification:** Prevents illogical workflow jumps and ensures consistent ticket lifecycle.

### Public Comments vs Internal Notes Separation
- **Decision:** Two separate models (`PublicComment` and `InternalNote`) rather than one model with a visibility flag.
- **Justification:** Clear separation at the data layer reduces risk of accidentally exposing Internal Notes to Requesters. Separate endpoints and authorization checks are clearer.

### Administrator Self-Deactivation and Last Admin Protection
- **Decision:** Backend checks enforce: (1) Administrator cannot set their own `isActive = false`, (2) Cannot deactivate the last active Administrator.
- **Justification:** Prevents accidental lockout from the system.

### User Deletion vs Deactivation
- **Decision:** Users are deactivated (isActive = false) rather than deleted.
- **Justification:** Preserves referential integrity (tickets, comments, notes reference user IDs). Maintains audit trail. Deletion would require cascading logic or orphaned references.

### No Pagination on User Management in Lab 3
- **Decision:** User Management list is not paginated in Lab 3. All users are loaded in one request.
- **Justification:** Lab 3 is a course assignment with a small number of test users (< 20). Pagination is deferred to a later lab or real-world deployment.

### Authentication Secret Management
- **Decision:** Session secret or JWT signing key is stored in `server/.env` and never committed to the repository.
- **Justification:** Standard security practice; secrets must not be in source control.

### CSRF Protection
- **Decision:** If using session cookies, CSRF protection is provided by SameSite=Strict or Lax cookie attribute. If using custom headers (e.g., X-Requested-With), CSRF risk is mitigated.
- **Justification:** Modern browsers with SameSite cookies reduce CSRF risk significantly. For Lab 3, this is acceptable. Production systems may require CSRF tokens.

### Logout Behavior
- **Decision:** Logout endpoint deletes the server-side session (if session-based) or adds the token to a blacklist (if JWT-based, though JWT blacklist is complex and may be deferred).
- **Justification:** Ensures the user cannot use the same session/token after logout.

### Error Message Safety
- **Decision:** Login errors return generic "Invalid email or password" without revealing whether the email exists. 403 errors for protected resources return generic "Forbidden" without confirming resource existence.
- **Justification:** Prevents user enumeration and information leakage.
