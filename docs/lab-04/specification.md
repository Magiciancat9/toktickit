# Lab 4 Sprint Engineering Specification

## 1. Sprint Goal

Complete the TokTickIT IT Service Desk application by adding **Actions Taken** documentation capability for IT Staff, finalizing the ticket resolution workflow, implementing operational dashboards for both Requesters and IT Staff, and conducting comprehensive regression testing to ensure all Labs 1-3 functionality remains intact. This sprint transforms TokTickIT from a ticketing system into a complete service desk solution with full workflow tracking, operational visibility, and production-ready quality.

---

## 2. Stakeholder Request Interpretation

IT Staff need to document the work they perform on tickets through structured **Actions Taken** entries that record what was done, what the result was, and whether follow-up is required. Each action captures the performer, date/time, detailed description, outcome, and any notes about related attachments. This documentation serves as an audit trail, knowledge base, and handoff mechanism when tickets are reassigned.

The ticket workflow needs finalization with clear resolution requirements: a ticket cannot be formally resolved while it has incomplete actions requiring follow-up. Dashboards provide at-a-glance operational metrics for both Requesters (my open tickets, waiting tickets) and IT Staff (unassigned work, my assignments, high-priority items).

This sprint also includes comprehensive regression testing to verify that all authentication, authorization, ticket management, comments, notes, attachments, and user administration features from Labs 1-3 continue to work correctly. The final deliverable is a production-ready application with complete test coverage, accessibility compliance, responsive design, and professional documentation.

---

## 3. Scope

### 3.1. Included in Lab 4

**Actions Taken:**
- IT Staff and Administrator can create Actions Taken on accessible tickets
- IT Staff and Administrator can edit Actions Taken they created
- Requester can view Actions Taken on their own tickets (read-only)
- Each Action Taken records: Action Date/Time, Action Description, Result, Performed By (automatic from session), Follow-Up Required (boolean), Follow-up Note (required if follow-up is true), Attachment Notes
- Actions Taken displayed in chronological order with clear authorship
- Backend enforces authorization: only IT Staff/Admin can create/edit
- Frontend provides create and edit modes with validation

**Ticket Resolution Workflow:**
- Finalize status transition matrix
- Enforce rule: ticket cannot transition to RESOLVED status while any Actions Taken have Follow-Up Required = true and are incomplete
- Backend validation prevents invalid resolution attempts
- Clear error messaging when resolution is blocked
- IT Staff must mark all follow-ups complete before resolving

**Requester Dashboard:**
- Total open tickets (all non-resolved, non-closed, non-cancelled statuses)
- Tickets waiting for Requester (status = WAITING_FOR_REQUESTER)
- Recently updated tickets (last 7 days)
- Recently resolved tickets (last 30 days, status = RESOLVED or CLOSED)
- Backend API calculates metrics using authenticated Requester identity
- Drill-down links to filtered ticket lists
- Loading, empty, and error states

**IT Staff Dashboard:**
- Unassigned tickets count and list preview
- Tickets assigned to current user
- Tickets by status (breakdown)
- Tickets by IT Priority (HIGH, MEDIUM, LOW counts)
- Recently updated tickets (last 7 days)
- High-priority unresolved tickets
- Backend API calculates metrics with proper authorization
- Drill-down to Ticket Queue with filters applied
- Loading, empty, and error states

**Database:**
- New ActionTaken model with foreign key to Ticket
- Indexes on ticketId, performerId, actionDateTime, followUpRequired
- Migration preserving all existing data
- Seed data including realistic Actions Taken scenarios

**REST API:**
- POST /api/staff/tickets/:ticketNumber/actions - Create action
- GET /api/staff/tickets/:ticketNumber/actions - List actions for ticket
- PATCH /api/staff/tickets/:ticketNumber/actions/:id - Update action
- GET /api/dashboards/requester - Requester metrics
- GET /api/dashboards/staff - IT Staff metrics
- Proper authorization on all endpoints
- Validation, conflict handling, safe error messages

**Frontend UI:**
- Actions Taken section in Staff Ticket Detail
- Actions Taken list in Requester Ticket Detail (read-only)
- Create Action form with validation
- Edit Action form (performer can edit their own actions)
- Requester Dashboard page with metrics cards
- IT Staff Dashboard page with metrics cards
- Drill-down navigation from dashboard metrics
- Responsive layouts (desktop, tablet, mobile)
- Accessibility: keyboard navigation, ARIA labels, focus management

**Testing:**
- Backend unit tests for Actions Taken logic
- API integration tests for all new endpoints
- UI component tests for Actions Taken and Dashboards
- E2E tests for complete workflows
- Regression tests verifying Labs 1-3 functionality
- Accessibility tests (axe-core integration)
- Responsive screenshot tests at three viewports

**Documentation:**
- README updated with Lab 4 features and demo instructions
- ai-use.md documenting AI agent usage and key prompts
- reviewer.md documenting peer review process
- Complete API documentation in api-spec.md
- Complete UI documentation in ui-spec.md
- Complete test plan in tests.md

**Final Quality:**
- No console errors or warnings
- No broken links or placeholder content
- All tests passing
- Accessibility compliance (WCAG 2.1 AA baseline)
- Responsive behavior verified
- Safe error handling throughout
- Production-ready code quality

### 3.2. Explicitly Excluded from Lab 4

- **Advanced Actions Taken Features:** Bulk action entry, action templates, action categories, action priority, action time tracking, billable hours, action approval workflow
- **Advanced Resolution Features:** Multi-level resolution approval, resolution verification checklist, resolution SLA tracking, customer satisfaction surveys
- **Advanced Dashboards:** Custom dashboard builder, widget configuration, saved dashboard layouts, dashboard sharing, real-time updates via WebSockets, drill-down to action-level details, export to PDF/Excel
- **Notifications:** Email notifications, SMS alerts, push notifications, Slack/Teams integration, notification preferences, notification history
- **SLA Management:** SLA definitions, SLA clocks, SLA breach warnings, SLA reporting, automatic escalation
- **Knowledge Base:** Solution articles, FAQ system, article search, article ratings, related articles
- **Advanced Workflow:** Custom status definitions, workflow rules engine, conditional transitions, automatic assignments, scheduled actions
- **Reporting & Analytics:** Custom report builder, scheduled reports, trend analysis, performance metrics, cost tracking, time-to-resolution statistics
- **Integration:** Ticketing system API for external tools, webhook support, SSO integration, Active Directory sync, LDAP authentication
- **Multi-tenancy:** Organization isolation, department hierarchies, cross-organization tickets
- **Mobile Apps:** Native iOS/Android applications (responsive web UI is included)
- **Advanced Authorization:** Permission groups, custom roles, field-level permissions, record-level security beyond ticket ownership
- **Audit Logging:** Detailed audit trail beyond basic created/updated timestamps, change history, undo functionality
- **File Management:** File versioning for attachments, inline file preview, attachment categories, storage quota management
- **Internationalization:** Multi-language support, localized date/time formats, currency handling
- **Performance:** Caching layer, CDN integration, database optimization beyond indexes, horizontal scaling
- **DevOps:** CI/CD pipeline, container orchestration, monitoring/alerting, backup/restore automation

---

## 4. Functional Requirements

### Actions Taken Core Functionality

**FR-01** IT Staff and Administrator can create an Action Taken entry on any ticket they can access.

**FR-02** The performer (Performed By) is automatically set to the authenticated user; the client cannot override this.

**FR-03** Action Date/Time is automatically set to the current server timestamp when the action is created.

**FR-04** Each Action Taken requires: Action Description (string, 10-2000 characters), Result (string, 10-2000 characters).

**FR-05** Each Action Taken includes optional fields: Follow-Up Required (boolean, default false), Follow-up Note (string, 10-500 characters, required if Follow-Up Required = true), Attachment Notes (string, optional, max 500 characters).

**FR-06** IT Staff and Administrator can edit Actions Taken that they created (cannot edit actions created by others).

**FR-07** Editing an Action Taken updates: Action Description, Result, Follow-Up Required, Follow-up Note, Attachment Notes (performer and action date/time cannot be changed).

**FR-08** Requester can view Actions Taken on tickets they own but cannot create or edit actions.

**FR-09** Actions Taken are displayed in chronological order (oldest first) with performer name, role, and timestamp.

**FR-10** The frontend provides distinct create and edit modes with appropriate validation and error handling.

### Ticket Resolution Workflow

**FR-11** A ticket cannot transition to RESOLVED status while any of its Actions Taken have Follow-Up Required = true.

**FR-12** The backend validates resolution prerequisites before allowing status change to RESOLVED.

**FR-13** When resolution is blocked, the API returns 400 Bad Request with error code INCOMPLETE_ACTIONS and a descriptive message.

**FR-14** The frontend displays a clear error message when resolution is attempted with incomplete follow-ups.

**FR-15** IT Staff must either complete all follow-ups or mark Follow-Up Required = false before resolving.

**FR-16** All Lab 3 status transitions remain valid with the addition of the resolution validation rule.

**FR-17** The status transition matrix from Lab 3 is preserved: NEW → OPEN/CANCELLED, OPEN → IN_PROGRESS/CANCELLED, IN_PROGRESS → WAITING_FOR_REQUESTER/RESOLVED/CANCELLED, WAITING_FOR_REQUESTER → IN_PROGRESS/RESOLVED/CANCELLED, RESOLVED → CLOSED/REOPENED, CLOSED → REOPENED, REOPENED → OPEN/IN_PROGRESS/RESOLVED/CANCELLED, CANCELLED is terminal.

### Requester Dashboard

**FR-18** Requester Dashboard displays metrics calculated for the authenticated Requester only.

**FR-19** Total Open Tickets: count of tickets with status in [NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED].

**FR-20** Tickets Waiting for Requester: count of tickets with status = WAITING_FOR_REQUESTER.

**FR-21** Recently Updated: count and list preview of tickets updated in the last 7 days (excluding CLOSED and CANCELLED).

**FR-22** Recently Resolved: count and list preview of tickets with status = RESOLVED or CLOSED in the last 30 days.

**FR-23** Each metric card includes: count, label, drill-down link to filtered My Tickets page.

**FR-24** Dashboard displays loading state while fetching data, empty state when counts are zero, and error state on API failure.

**FR-25** Dashboard is accessible via navigation link "Dashboard" for Requester role.

### IT Staff Dashboard

**FR-26** IT Staff Dashboard displays metrics calculated across all accessible tickets.

**FR-27** Unassigned Tickets: count of tickets with ownerId = null and status not in [CLOSED, CANCELLED].

**FR-28** My Assigned Tickets: count of tickets owned by authenticated IT Staff user with status not in [CLOSED, CANCELLED].

**FR-29** Tickets by Status: breakdown showing count for each active status (NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, REOPENED).

**FR-30** Tickets by IT Priority: count for HIGH, MEDIUM, LOW priorities (excluding CLOSED and CANCELLED tickets).

**FR-31** Recently Updated: count and preview of tickets updated in the last 7 days.

**FR-32** High Priority Unresolved: count of tickets with itPriority = HIGH and status not in [RESOLVED, CLOSED, CANCELLED].

**FR-33** Each metric card includes: count, label, drill-down link to Ticket Queue with appropriate filter.

**FR-34** Dashboard displays loading, empty, and error states appropriately.

**FR-35** Dashboard is accessible via navigation link "Dashboard" for IT Staff and Administrator roles.

### Database Requirements

**FR-36** Create ActionTaken model with fields: id (PK), ticketId (FK to Ticket), performerId (FK to User), actionDateTime (timestamp), actionDescription (text), result (text), followUpRequired (boolean), followupNote (text, nullable), attachmentNotes (text, nullable), createdAt, updatedAt.

**FR-37** Add indexes on: ticketId, performerId, actionDateTime, followUpRequired.

**FR-38** Establish foreign key constraints with appropriate cascade behavior (restrict deletion of referenced tickets/users).

**FR-39** Migration must preserve all existing data from Labs 1-3.

**FR-40** Seed data includes tickets with: zero actions, one action, multiple actions, actions with follow-up required, completed actions.

### API Requirements

**FR-41** POST /api/staff/tickets/:ticketNumber/actions creates an action (requires IT_STAFF or ADMINISTRATOR role, validates ticket access, sets performer from session).

**FR-42** GET /api/staff/tickets/:ticketNumber/actions lists actions (IT Staff/Admin see all actions, Requester sees actions on owned tickets only).

**FR-43** PATCH /api/staff/tickets/:ticketNumber/actions/:id updates an action (performer can edit their own actions only).

**FR-44** GET /api/dashboards/requester returns Requester metrics (requires REQUESTER role, uses authenticated user identity).

**FR-45** GET /api/dashboards/staff returns IT Staff metrics (requires IT_STAFF or ADMINISTRATOR role).

**FR-46** All endpoints validate authentication, authorization, input data, and return appropriate status codes (200, 201, 400, 401, 403, 404, 409, 500).

**FR-47** Error responses include structured error object with code and message fields.

### UI Requirements

**FR-48** Staff Ticket Detail includes Actions Taken section below Internal Notes with: chronological list, create action button, edit action button (for own actions only).

**FR-49** Requester Ticket Detail includes read-only Actions Taken section showing performer, date, description, result, follow-up status.

**FR-50** Create Action form includes: Action Description (textarea, required, 10-2000 chars), Result (textarea, required, 10-2000 chars), Follow-Up Required (checkbox), Follow-up Note (textarea, conditional required, 10-500 chars), Attachment Notes (textarea, optional, max 500 chars).

**FR-51** Edit Action form pre-populates existing values and uses same validation as create form.

**FR-52** Actions Taken list displays: performer name and role badge, action date/time, action description (truncated with "Read more"), result (truncated), follow-up status indicator, edit button (if performer matches current user).

**FR-53** Requester Dashboard displays: Total Open Tickets, Waiting for Requester, Recently Updated, Recently Resolved cards with counts and drill-down links.

**FR-54** IT Staff Dashboard displays: Unassigned Tickets, My Assigned Tickets, Tickets by Status, Tickets by Priority, Recently Updated, High Priority Unresolved cards.

**FR-55** All dashboard cards use consistent Zen Green styling with metric count, label, description, and drill-down button.

**FR-56** Navigation includes "Dashboard" link for Requester and IT Staff roles (positioned appropriately in nav bar).

### Testing Requirements

**FR-57** Backend unit tests cover: action validation logic, resolution prerequisite checking, dashboard calculation functions.

**FR-58** API integration tests cover: all actions endpoints with authorization scenarios, dashboard endpoints, resolution blocking.

**FR-59** UI component tests cover: ActionsTaken component (create/edit/list modes), RequesterDashboard component, StaffDashboard component.

**FR-60** E2E tests cover: complete action workflow (create, view, edit), resolution blocking scenario, dashboard drill-down navigation.

**FR-61** Regression tests verify: all Lab 3 authentication, all Lab 3 authorization, ticket CRUD, comments, notes, attachments, user management.

**FR-62** Accessibility tests verify: keyboard navigation, ARIA labels, focus management, color contrast, screen reader compatibility.

**FR-63** Responsive tests capture screenshots at desktop (1280px), tablet (768px), and mobile (375px) viewports.

---

## 5. Business Rules

### Actions Taken Authorization

**BR-01** Each Action Taken belongs to exactly one ticket.

**BR-02** Only IT Staff and Administrator can create Actions Taken.

**BR-03** Only IT Staff and Administrator can edit Actions Taken.

**BR-04** An action can only be edited by the user who created it (performer).

**BR-05** Requester can view Actions Taken on tickets they own but cannot create or edit.

**BR-06** Attempting to create/edit an action without proper authorization returns 403 Forbidden.

### Actions Taken Data Validation

**BR-07** Action Description is required, minimum 10 characters, maximum 2000 characters after trimming.

**BR-08** Result is required, minimum 10 characters, maximum 2000 characters after trimming.

**BR-09** Follow-Up Required is a boolean, defaults to false.

**BR-10** Follow-up Note is required if Follow-Up Required = true, minimum 10 characters, maximum 500 characters.

**BR-11** Follow-up Note must be empty/null if Follow-Up Required = false.

**BR-12** Attachment Notes is optional, maximum 500 characters after trimming.

**BR-13** Empty or whitespace-only required fields are rejected with 400 Bad Request.

**BR-14** Exceeded character limits are rejected with 400 Bad Request specifying the field and limit.

### Actions Taken Performer and Timestamp

**BR-15** The performer (performerId) is automatically set to the authenticated user's ID; client cannot override.

**BR-16** The performer's name and role are retrieved from the User model for display.

**BR-17** Action Date/Time (actionDateTime) is automatically set to the current server timestamp when created.

**BR-18** Action Date/Time cannot be edited after creation.

**BR-19** Performer cannot be changed after creation.

**BR-20** Created and updated timestamps (createdAt, updatedAt) are managed automatically by the ORM.

### Ticket Resolution Prerequisites

**BR-21** A ticket cannot transition to RESOLVED status if any of its Actions Taken have Follow-Up Required = true.

**BR-22** Before allowing status change to RESOLVED, the backend queries all Actions Taken for the ticket and checks for incomplete follow-ups.

**BR-23** If incomplete follow-ups exist, the status change request is rejected with 400 Bad Request, error code INCOMPLETE_ACTIONS, and message "Cannot resolve ticket: X action(s) require follow-up".

**BR-24** The validation applies only when transitioning TO RESOLVED status; other status changes are not blocked by incomplete actions.

**BR-25** IT Staff can mark Follow-Up Required = false on an action to indicate follow-up is complete, allowing resolution.

**BR-26** All other status transition rules from Lab 3 remain in effect.

### Dashboard Authorization

**BR-27** Requester Dashboard API returns metrics only for the authenticated Requester's tickets.

**BR-28** Requester cannot request another user's dashboard metrics; the backend uses the authenticated user ID.

**BR-29** IT Staff Dashboard API requires IT_STAFF or ADMINISTRATOR role; Requester cannot access.

**BR-30** Non-authenticated requests to dashboard endpoints return 401 Unauthorized.

**BR-31** Dashboard metrics are calculated by backend database queries; the frontend does not calculate metrics from ticket lists.

### Dashboard Metric Definitions

**BR-32** "Open Tickets" includes statuses: NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED.

**BR-33** "Waiting for Requester" is exactly status = WAITING_FOR_REQUESTER.

**BR-34** "Recently Updated" includes tickets updated in the last 7 days with status not in [CLOSED, CANCELLED].

**BR-35** "Recently Resolved" includes tickets with status = RESOLVED or CLOSED, updated in the last 30 days.

**BR-36** "Unassigned Tickets" includes tickets with ownerId = null, status not in [CLOSED, CANCELLED].

**BR-37** "My Assigned Tickets" includes tickets owned by the authenticated user, status not in [CLOSED, CANCELLED].

**BR-38** "Tickets by Status" excludes CLOSED and CANCELLED statuses for conciseness.

**BR-39** "Tickets by Priority" counts are based on itPriority field, exclude CLOSED and CANCELLED tickets.

**BR-40** "High Priority Unresolved" includes tickets with itPriority = HIGH, status not in [RESOLVED, CLOSED, CANCELLED].

### Dashboard Drill-Down

**BR-41** Each dashboard metric includes a drill-down link to the relevant filtered view.

**BR-42** Requester dashboard drill-downs open the My Tickets page with appropriate filters applied.

**BR-43** IT Staff dashboard drill-downs open the Ticket Queue page with appropriate filters applied.

**BR-44** Drill-down links preserve the user's current session and role context.

### Actions Taken Display

**BR-45** Actions Taken are displayed in chronological order (oldest first) based on actionDateTime.

**BR-46** Each action entry displays: performer name, performer role badge, action date/time formatted for readability, action description, result, follow-up status indicator.

**BR-47** Long action descriptions and results are truncated with "Read more" expansion or modal detail view.

**BR-48** Follow-up status is indicated with a visual badge: "Follow-Up Required" (amber) or "Complete" (green).

**BR-49** Edit button appears only for actions where the authenticated user is the performer.

**BR-50** Requester view excludes edit buttons and create action button (read-only).

### Data Integrity and Audit

**BR-51** Actions Taken cannot be deleted; they are permanent audit records.

**BR-52** Editing an action updates the updatedAt timestamp.

**BR-53** Original actionDateTime and performer remain unchanged in edits.

**BR-54** Actions Taken reference the User model; inactive users' actions remain visible with their name at time of creation.

**BR-55** If a ticket is deleted (not expected in normal operation), cascade behavior should be defined (recommend restrict to prevent accidental data loss).

### Concurrent Update Handling

**BR-56** If two users edit the same action simultaneously, last-write-wins applies (no optimistic locking in Lab 4).

**BR-57** If a ticket's Actions Taken are modified while another user is attempting to resolve the ticket, the resolution attempt uses the current database state.

**BR-58** Stale resolution attempts that succeed despite new incomplete follow-ups are acceptable in Lab 4 (acknowledged technical debt).

### Error Handling and Safe Failures

**BR-59** All validation errors return 400 Bad Request with structured error payload.

**BR-60** Authorization failures return 403 Forbidden without leaking resource existence.

**BR-61** Missing resources return 404 Not Found.

**BR-62** Duplicate/conflict scenarios (e.g., attempting to re-create an action) return 409 Conflict.

**BR-63** Server errors return 500 Internal Server Error with generic message; detailed error logged server-side.

**BR-64** Frontend displays user-friendly error messages; technical details are not exposed to users.

**BR-65** API failures in dashboard loading show error state with retry option; the application remains usable.

### Regression and Preservation

**BR-66** All Lab 1 functionality (categories, related systems, basic ticket listing) continues to work identically.

**BR-67** All Lab 2 functionality (requester ticket creation, my tickets, attachments, ticket detail) continues to work identically.

**BR-68** All Lab 3 functionality (authentication, authorization, IT staff queue, comments, notes, user management) continues to work identically.

**BR-69** Existing data (users, tickets, attachments, comments, notes) is preserved during migration and remains accessible.

**BR-70** No UI regressions: existing screens maintain their Lab 3 appearance and behavior with Lab 4 additions clearly integrated.

---

## 6. Acceptance Criteria

**AC-01** IT Staff can create an Action Taken on any accessible ticket with description, result, and optional follow-up note; the action appears in the Actions Taken list with correct performer and timestamp.

**AC-02** IT Staff can edit their own Actions Taken; edit button appears only for actions they created; edits are saved and reflected immediately.

**AC-03** Requester viewing their own ticket sees Actions Taken list (read-only); no create or edit buttons appear; actions display performer name, role, date, description, result, follow-up status.

**AC-04** Attempting to resolve a ticket with incomplete follow-up actions displays clear error message; resolution is blocked; status remains unchanged.

**AC-05** Marking all follow-ups complete (or Follow-Up Required = false) allows ticket resolution; status changes to RESOLVED successfully.

**AC-06** Requester Dashboard displays correct counts for: Total Open Tickets, Waiting for Requester, Recently Updated, Recently Resolved; counts match database queries.

**AC-07** Clicking a Requester Dashboard metric drill-down opens My Tickets page with correct filter applied (e.g., "Waiting for Requester" shows status=WAITING_FOR_REQUESTER).

**AC-08** IT Staff Dashboard displays correct counts for: Unassigned, My Assigned, Status breakdown, Priority breakdown, Recently Updated, High Priority Unresolved.

**AC-09** Clicking an IT Staff Dashboard metric drill-down opens Ticket Queue with correct filter applied (e.g., "Unassigned" shows ownerId=null).

**AC-10** Dashboard loading state appears while fetching data; empty state appears when all counts are zero; error state appears on API failure with retry option.

**AC-11** Actions Taken section in Staff Ticket Detail shows create button, list of existing actions, edit buttons for own actions, chronological ordering.

**AC-12** Actions Taken section in Requester Ticket Detail shows read-only list with no create/edit buttons.

**AC-13** Create Action form validates: required fields (description, result), conditional required (follow-up note if follow-up required), character limits; displays appropriate error messages.

**AC-14** Edit Action form pre-populates with existing values; validates same rules as create; saves updates successfully; cannot change performer or action date.

**AC-15** Attempting to create/edit action without IT_STAFF or ADMINISTRATOR role returns 403 Forbidden; Requester cannot access action mutation endpoints.

**AC-16** Attempting to edit another user's action returns 403 Forbidden or 404 Not Found (depending on implementation).

**AC-17** Backend dashboard APIs calculate metrics using database queries (not filtering all tickets client-side); metrics match manual SQL query results.

**AC-18** Requester Dashboard API enforces ownership: returns metrics only for authenticated Requester; attempting to access another user's metrics returns 403.

**AC-19** All Lab 3 tests pass after Lab 4 implementation (authentication, authorization, tickets, comments, notes, attachments, user management).

**AC-20** New Lab 4 backend tests pass: actions CRUD, resolution validation, dashboard calculations.

**AC-21** New Lab 4 UI tests pass: ActionsTaken component, RequesterDashboard component, StaffDashboard component.

**AC-22** New Lab 4 E2E tests pass: action workflow, resolution blocking, dashboard navigation.

**AC-23** Accessibility tests pass: keyboard navigation works, ARIA labels present, focus visible, color contrast meets WCAG 2.1 AA.

**AC-24** Responsive tests pass: layouts render correctly at desktop, tablet, mobile viewports; no horizontal scroll; controls remain accessible.

**AC-25** Application has no console errors or warnings in browser developer tools during normal usage.

**AC-26** All navigation links work; no broken routes; no placeholder or "TODO" content visible to users.

**AC-27** Documentation is complete: README updated with Lab 4 features, ai-use.md created, reviewer.md created, API spec complete, UI spec complete, test plan complete.

---

## 7. Definition of Done

### Database
- [ ] ActionTaken model created in Prisma schema with all required fields
- [ ] Foreign keys and indexes defined
- [ ] Migration script created and tested
- [ ] Migration preserves all existing data from Labs 1-3
- [ ] Seed script updated with Actions Taken scenarios
- [ ] Seed is idempotent (can run multiple times safely)

### Backend API
- [ ] POST /api/staff/tickets/:ticketNumber/actions implemented with authorization
- [ ] GET /api/staff/tickets/:ticketNumber/actions implemented with proper filtering
- [ ] PATCH /api/staff/tickets/:ticketNumber/actions/:id implemented with ownership check
- [ ] GET /api/dashboards/requester implemented with correct calculations
- [ ] GET /api/dashboards/staff implemented with correct calculations
- [ ] All endpoints validate input and return structured errors
- [ ] Resolution validation prevents resolving tickets with incomplete follow-ups
- [ ] All endpoints documented in api-spec.md

### Backend Tests
- [ ] Unit tests for action validation logic
- [ ] Unit tests for resolution prerequisite checking
- [ ] Unit tests for dashboard calculation functions
- [ ] API tests for actions endpoints with authorization scenarios
- [ ] API tests for dashboard endpoints
- [ ] API tests for resolution blocking
- [ ] All backend tests pass

### Frontend Components
- [ ] ActionsTaken component created with create/edit/list modes
- [ ] Actions Taken integrated into Staff Ticket Detail
- [ ] Actions Taken integrated into Requester Ticket Detail (read-only)
- [ ] RequesterDashboard component created with metrics cards
- [ ] StaffDashboard component created with metrics cards
- [ ] Dashboard navigation links added to AppShell
- [ ] All components documented in ui-spec.md

### Frontend Tests
- [ ] Component tests for ActionsTaken
- [ ] Component tests for RequesterDashboard
- [ ] Component tests for StaffDashboard
- [ ] All frontend tests pass

### E2E Tests
- [ ] E2E test for complete action workflow (create, view, edit)
- [ ] E2E test for resolution blocking scenario
- [ ] E2E test for dashboard drill-down navigation
- [ ] All E2E tests pass

### Regression
- [ ] All Lab 1 tests pass
- [ ] All Lab 2 tests pass
- [ ] All Lab 3 tests pass
- [ ] Manual verification of existing features: login, ticket creation, comments, notes, attachments, user management
- [ ] No UI regressions or broken layouts

### Accessibility
- [ ] Keyboard navigation works for all new features
- [ ] ARIA labels present on all interactive elements
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Screen reader compatible (tested with NVDA or JAWS)
- [ ] Automated accessibility tests pass (axe-core)

### Responsive Design
- [ ] Desktop layout (1280px) renders correctly
- [ ] Tablet layout (768px) renders correctly
- [ ] Mobile layout (375px) renders correctly
- [ ] No horizontal scroll at any viewport
- [ ] Touch targets meet minimum size (44x44px)
- [ ] Screenshots captured for all viewports

### Code Quality
- [ ] TypeScript compilation with no errors
- [ ] ESLint with no errors (warnings acceptable if documented)
- [ ] Consistent code style with existing codebase
- [ ] No console.log or debugging code remaining
- [ ] No commented-out code blocks
- [ ] Meaningful variable and function names

### Documentation
- [ ] README.md updated with Lab 4 features and demo instructions
- [ ] docs/lab-04/specification.md complete
- [ ] docs/lab-04/api-spec.md complete
- [ ] docs/lab-04/ui-spec.md complete
- [ ] docs/lab-04/tests.md complete
- [ ] docs/lab-04/ai-use.md created with prompts and reflection
- [ ] docs/lab-04/reviewer.md created with review process

### Git Workflow
- [ ] All commits have descriptive messages
- [ ] Feature branches merged into lab4-staging
- [ ] No merge conflicts
- [ ] Clean commit history (no "WIP" or "fix typo" commits in final PR)

### Final Verification
- [ ] Application starts without errors (backend and frontend)
- [ ] Database migration runs successfully
- [ ] Seed data loads correctly
- [ ] No console errors in browser during normal usage
- [ ] All test suites pass (unit, API, UI, E2E)
- [ ] Manual smoke test: login as all three roles, navigate to all pages, perform key actions
- [ ] Peer review completed and approved
- [ ] Ready for demonstration and submission

---

## 8. Open Questions and Design Decisions

### Decision 1: Action Editing Scope
**Question:** Should IT Staff be able to edit any action on a ticket, or only actions they created?  
**Decision:** Only the performer (creator) can edit their own actions. This provides audit trail integrity while allowing correction of typos or clarification of details.  
**Rationale:** Prevents tampering with another user's documented work; maintains accountability; simple authorization rule.

### Decision 2: Action Deletion
**Question:** Should actions be deletable?  
**Decision:** No. Actions Taken are permanent audit records and cannot be deleted.  
**Rationale:** Maintains complete audit trail; prevents information loss; aligns with regulatory compliance expectations for service desk records.

### Decision 3: Dashboard Drill-Down Implementation
**Question:** Should drill-downs open filtered lists in-place, new tab, or modal?  
**Decision:** Navigate in-place to the filtered list page (My Tickets for Requester, Ticket Queue for IT Staff) with filter parameters applied.  
**Rationale:** Maintains consistent navigation pattern; avoids modal complexity; preserves browser history for back button; users can bookmark filtered views.

### Decision 4: Concurrent Edit Handling
**Question:** Should we implement optimistic locking for action edits?  
**Decision:** No. Last-write-wins approach is acceptable for Lab 4.  
**Rationale:** Concurrent edits of the same action by different users are extremely rare; optimistic locking adds significant complexity; can be added in future sprints if needed.

### Decision 5: Action Character Limits
**Question:** What are appropriate length limits for action fields?  
**Decision:** Action Description and Result: 10-2000 characters; Follow-up Note: 10-500 characters; Attachment Notes: 0-500 characters.  
**Rationale:** Minimum enforces meaningful content; maximum prevents database bloat and UI display issues; attachment notes are shorter as they're supplementary.

### Decision 6: Dashboard Metrics Time Windows
**Question:** What time windows for "recently updated" and "recently resolved"?  
**Decision:** Recently Updated: 7 days; Recently Resolved: 30 days.  
**Rationale:** 7 days captures current operational tempo; 30 days provides closure tracking without overwhelming with historical data; can be made configurable in future.

### Decision 7: Empty Dashboard State
**Question:** What should dashboards show when all counts are zero?  
**Decision:** Display metrics cards with "0" counts and encouraging message (e.g., "No open tickets - great job!").  
**Rationale:** Shows the dashboard is working; maintains consistent layout; positive messaging for good performance.

### Decision 8: Mobile Dashboard Layout
**Question:** How should multi-column dashboard layouts adapt to mobile?  
**Decision:** Stack metrics cards vertically in single column on mobile; preserve card order; maintain drill-down functionality.  
**Rationale:** Ensures readability; no horizontal scroll; touch targets remain accessible; simple responsive implementation.

### Database Decision 1: actionDateTime vs createdAt
**Question:** Why have both actionDateTime and createdAt on ActionTaken?  
**Decision:** actionDateTime records when the action was actually performed; createdAt records when it was entered into the system.  
**Rationale:** IT Staff may document actions after-the-fact (e.g., recording work done yesterday, documenting a phone call, batch-entering weekend actions on Monday). Separating these timestamps preserves true chronology for audit purposes while maintaining standard createdAt/updatedAt pattern. Queries for "actions timeline" use actionDateTime; system audit uses createdAt.

### Database Decision 2: followupNote Nullable with Business Logic Validation
**Question:** Should followupNote be database-enforced NOT NULL when followUpRequired=true?  
**Decision:** Make followupNote nullable at database level; enforce the conditional requirement via business logic (BR-39) at application layer.  
**Rationale:** Database-level conditional constraints (CHECK constraints with cross-column dependencies) are complex, database-specific, and hard to modify. Application-level validation is portable, testable, easy to adjust, provides better error messages, and is the established pattern from Labs 1-3. Trade-off: relies on application layer for data integrity, but this is acceptable for a non-critical constraint (no financial/security impact if occasionally violated).

### Database Decision 3: performerId References User, Not Separate Actor
**Question:** Should we create a separate Actor table for action performers, or use existing User table?  
**Decision:** Use existing User table with performerId → User(id) foreign key.  
**Rationale:** All IT Staff are already Users with roles. Creating separate Actor table would duplicate data (user info exists in both places), complicate queries (need joins through two tables), break referential integrity (actions performed by deleted "actors" who are still Users), and add no business value. Current design maintains clean audit trail, leverages existing authentication/authorization, and simplifies queries. Constraint: Only IT_STAFF and ADMINISTRATOR should perform actions (enforced by authorization, not FK).

### Database Decision 4: Cascade Behavior for ActionTaken Foreign Keys
**Question:** What should happen to ActionsTaken when a Ticket or User is deleted?  
**Decision:** ON DELETE CASCADE for ticketId; ON DELETE RESTRICT for performerId.  
**Rationale:** 
- **Ticket deletion**: If a ticket is deleted (rare but possible for spam/duplicates), its actions should also be deleted to maintain referential integrity. Actions without their parent ticket are meaningless. CASCADE ensures clean removal.
- **User deletion**: If someone tries to delete a User who has recorded actions, the delete should FAIL (RESTRICT). This prevents loss of audit trail and preserves accountability. Users should be marked isActive=false instead of deleted if they leave the organization.

This asymmetric approach balances data integrity (no orphaned actions) with audit requirements (no accidental action history loss).

### Database Decision 5: resolvedAt Field on Ticket
**Question:** Should we add resolvedAt timestamp to Ticket, or derive it from ActionsTaken?  
**Decision:** Add nullable resolvedAt DateTime column to Ticket.  
**Rationale:** Denormalized data for query performance. Dashboard queries for "Recently Resolved" count need fast filtering on resolvedAt without scanning ActionsTaken join. Alternative (derive from min actionDateTime where status changed to RESOLVED) would require expensive joins and complex query logic. Trade-off: requires application code to maintain resolvedAt when status changes to RESOLVED, but this is acceptable for significant performance gain on dashboard queries. Index on resolvedAt enables efficient range queries.

### Database Decision 6: Index Selection
**Question:** Which columns need indexes for ActionTaken?  
**Decision:** Indexes on ticketId, performerId, actionDateTime, followUpRequired (per FR-37). Additionally, index on Ticket.resolvedAt.  
**Rationale:**
- **ticketId**: Nearly all queries fetch actions by ticket (Ticket Detail page). High cardinality, frequently queried.
- **performerId**: Dashboard "my actions" queries, audit queries. Medium cardinality (number of IT Staff).
- **actionDateTime**: Chronological sorting of actions within a ticket. Used in every actions list. Enables efficient ORDER BY.
- **followUpRequired**: Filter actions needing follow-up (potential future dashboard metric). Boolean (low cardinality) but small table makes index worthwhile.
- **resolvedAt**: Dashboard time-range queries (recently resolved count). Nullable but frequently queried in WHERE clause with range operators.

No composite indexes needed - single-column indexes are sufficient for Lab 4 query patterns. Can add composite indexes in future if specific slow queries are identified.

---

## 9. Implementation Notes

### Database Migration and Rollback Strategy

**Migration Approach:**
- Migration adds ActionTaken table and Ticket.resolvedAt column
- All new columns are nullable or have defaults - no data transformation required
- Existing tickets remain valid with zero actions (expected state)
- Foreign keys use standard Prisma naming for consistency

**Data Preservation:**
- Migration is additive-only - no columns dropped, no data modified
- All Labs 1-3 tables, foreign keys, and indexes preserved
- Existing tickets, users, comments, notes, attachments untouched
- Migration tested on both fresh database and database with existing Lab 3 data

**Legacy Behavior:**
- Old tickets (created before Lab 4) start with zero actions - this is correct
- resolvedAt is null for old RESOLVED tickets - dashboard ignores null values in counts
- Application handles zero-actions case gracefully (shows "No actions yet" message)

**Rollback Procedure:**
If Lab 4 must be rolled back:
1. Export critical data if needed: `pg_dump -t ActionTaken toktickit > actions_backup.sql`
2. Run rollback migration (created manually): `DROP TABLE "ActionTaken" CASCADE; ALTER TABLE "Ticket" DROP COLUMN "resolvedAt";`
3. Regenerate Prisma client: `npx prisma generate`
4. Revert application code to Lab 3 state

**Rollback Impact:**
- All ActionsTaken records will be lost (save backup first if needed)
- Tickets remain intact with their original data
- No impact on Users, Categories, RelatedSystems, Attachments, Comments, Notes
- Ticket.resolvedAt removed but status field preserves resolution state

**Recovery from Partial Migration:**
- If migration fails mid-way, Prisma migrations are transactional - database remains in pre-migration state
- Check migration status: `npx prisma migrate status`
- If stuck in "partially applied" state, resolve manually or reset migration with `npx prisma migrate resolve`

### Critical Integration Points
1. **Actions Taken → Ticket Detail:** Integrate Actions Taken section into existing Staff Ticket Detail and Requester Ticket Detail components without disrupting existing sections (comments, notes, attachments).
2. **Resolution Validation → Status Update:** Hook into existing PATCH /api/staff/tickets/:ticketNumber/status endpoint to validate actions before allowing RESOLVED status.
3. **Dashboard → Navigation:** Add "Dashboard" link to AppShell navigation for appropriate roles without disrupting existing nav structure.
4. **Database Migration → Existing Data:** Ensure migration script does not break existing foreign keys or data relationships.

### Recommended Implementation Order
1. Database schema and migration (establishes foundation)
2. Seed data with actions (enables backend testing)
3. Backend API for actions CRUD (core functionality)
4. Backend API for dashboards (independent of actions)
5. Resolution validation logic (builds on actions API)
6. Frontend ActionsTaken component (presents actions)
7. Frontend Dashboard components (presents metrics)
8. Integration into existing Ticket Detail pages
9. Dashboard navigation integration
10. Backend tests (validates logic)
11. Frontend tests (validates components)
12. E2E tests (validates workflows)
13. Regression testing (validates preservation)
14. Accessibility and responsive polish
15. Documentation completion

### Reusable Patterns from Labs 1-3
- **Authorization:** Follow Lab 3 pattern with middleware checking role and ownership
- **Validation:** Use existing validation utility functions for string length, required fields
- **Error Responses:** Use existing error response structure with code and message
- **Form Components:** Extend existing form components with Zen Green styling
- **Dashboard Cards:** Create reusable MetricCard component following Zen Green design
- **List Display:** Use existing table/card list patterns for Actions Taken display

### Zen Green Design Consistency
- Use existing color palette (primary green #006B3C, secondary green #0B7A46, pale green #EAF6EF)
- Follow existing spacing and typography scale
- Reuse existing button styles (primary, secondary, outline)
- Use existing badge styles for status/priority/role indicators
- Maintain existing card component structure
- Follow existing form field styling with labels, validation messages, help text

---

*This specification serves as the authoritative reference for Lab 4 implementation. Any ambiguities or conflicts should be resolved by consulting existing Lab 1-3 specifications and maintaining consistency with established patterns.*
