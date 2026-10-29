# Lab 4 Submission Checklist

This checklist maps each Answer Part requirement to the specific evidence, files, links, and screenshots needed for submission.

**Submission Deadline:** [INSERT DATE]  
**Student:** Tatchakorn Thamnimitr 67070503415 - GitHub: @Magiciancat9  
**Repository:** https://github.com/Magiciancat9/toktickit

---

## Pre-Submission Verification

- [ ] All code is on branch: `main` or clearly documented feature branches
- [ ] All commits are pushed to GitHub
- [ ] All pull requests are merged (or clearly marked as draft/WIP)
- [ ] Repository is accessible to instructors/TAs
- [ ] No sensitive data (.env files, passwords, API keys) committed
- [ ] README.md is up to date with Lab 4 features and commands

---

## Answer Part 1: Specification Documents

**Requirement:** Engineering specification, API spec, UI spec, and test plan documents written **before** implementation.

### Evidence Checklist

- [ ] **File:** `docs/lab-04/specification.md` exists
  - [ ] Contains Sprint Goal and Scope
  - [ ] Lists Functional Requirements (FR-01, FR-02, etc.)
  - [ ] Lists Business Rules (BR-01, BR-02, etc.)
  - [ ] Lists Acceptance Criteria (AC-01, AC-02, etc.)
  - [ ] Includes Assumptions and Decisions section documenting deviations from original plan
  - [ ] Git commit shows this file was created **before** implementation commits

- [ ] **File:** `docs/lab-04/api-spec.md` exists
  - [ ] Documents all Lab 4 REST endpoints (dashboards, actions-taken, workflow)
  - [ ] Each endpoint has: method, path, authentication, request body schema, response schema, error codes
  - [ ] Includes Assumptions and Decisions section if implementation differs from spec
  - [ ] Git commit shows this file was created **before** implementation commits

- [ ] **File:** `docs/lab-04/ui-spec.md` exists
  - [ ] Documents Requester Dashboard layout and behavior
  - [ ] Documents IT Staff Dashboard layout and behavior
  - [ ] Documents Actions Taken modal UI (Create/Edit modes)
  - [ ] Documents Status Workflow UI controls
  - [ ] Describes Zen Green design system (colors, typography, spacing)
  - [ ] Includes responsive breakpoints (375px, 768px, 1280px)
  - [ ] Git commit shows this file was created **before** implementation commits

- [ ] **File:** `docs/lab-04/tests.md` exists
  - [ ] Contains test plan with Test IDs mapped to AC/BR
  - [ ] Includes Unit, API, UI Component, E2E, Responsive test types
  - [ ] Has "Final" column with ✅ PASS, ❌ FAIL, or ⏸️ NOT RUN status
  - [ ] Includes Acceptance-Criterion Traceability Matrix
  - [ ] Lists test commands for running each suite
  - [ ] Documents final test results summary
  - [ ] Git commit shows this file was created **before** implementation commits

### Action Items

- [ ] Review git log to verify spec files committed before implementation
- [ ] Update "Assumptions and Decisions" sections in specification.md and api-spec.md with any deviations
- [ ] Ensure tests.md Final column is completely filled in with actual test results

---

## Answer Part 2: Database Schema and Migrations

**Requirement:** Prisma schema for ActionsTaken model, status workflow validation, and idempotent seed data.

### Evidence Checklist

- [ ] **File:** `server/prisma/schema.prisma`
  - [ ] Contains `ActionsTaken` model with all required fields
  - [ ] Has foreign keys to `Ticket` and `User` (performer)
  - [ ] Includes indexes for performance (e.g., on ticketId, performerId)
  - [ ] Status workflow constraints documented or enforced

- [ ] **Migrations:**
  - [ ] Migration file exists in `server/prisma/migrations/` for ActionsTaken model
  - [ ] Migration file exists for any status workflow changes
  - [ ] Migration names are descriptive (e.g., `20240915_add_actions_taken`)

- [ ] **File:** `server/prisma/seed.ts`
  - [ ] Includes sample ActionsTaken records
  - [ ] Seed script is idempotent (uses `upsert`, safe to run multiple times)
  - [ ] Seed includes follow-up actions for testing resolution blocking

### Screenshots/Evidence Needed

- [ ] **Screenshot:** Prisma Studio showing ActionsTaken table with sample data
  - Save as: `artifacts/lab-04/screenshots/database/actions-taken-table.png`
  - Should show: actionId, ticketId, performerId, followUpRequired fields

- [ ] **Screenshot:** Prisma Studio showing Ticket table with various statuses
  - Save as: `artifacts/lab-04/screenshots/database/tickets-with-statuses.png`
  - Should show: tickets in NEW, OPEN, IN_PROGRESS, RESOLVED, etc.

### Action Items

- [ ] Run `npx prisma studio` and capture ActionsTaken table screenshot
- [ ] Run `npm --prefix server run prisma:seed` twice to verify idempotency (no errors or duplicates)
- [ ] Verify migrations apply cleanly on a fresh database

---

## Answer Part 3: Backend API Implementation

**Requirement:** REST endpoints for dashboards, Actions Taken CRUD, and status workflow with resolution blocking.

### Evidence Checklist

- [ ] **File:** `server/src/routes/dashboards.ts` exists
  - [ ] GET `/api/dashboards/requester` endpoint implemented
  - [ ] GET `/api/dashboards/staff` endpoint implemented
  - [ ] Proper authentication and authorization checks
  - [ ] Returns correct metric calculations

- [ ] **File:** `server/src/routes/actions-taken.ts` exists
  - [ ] POST `/api/staff/tickets/:ticketNumber/actions` endpoint (create)
  - [ ] GET `/api/staff/tickets/:ticketNumber/actions` endpoint (list)
  - [ ] PATCH `/api/staff/tickets/:ticketNumber/actions/:actionId` endpoint (edit)
  - [ ] Validation for actionDescription, result, followupNote
  - [ ] 24-hour edit window enforcement
  - [ ] Performer-only edit authorization

- [ ] **File:** `server/src/routes/workflow.ts` or similar
  - [ ] Status transition validation per transition matrix
  - [ ] Resolution blocking when follow-ups exist
  - [ ] Returns 409 Conflict with list of incomplete actions

- [ ] **API Tests:**
  - [ ] `server/tests/lab-04/requester-dashboard.api.test.ts` - all tests passing
  - [ ] `server/tests/lab-04/staff-dashboard.api.test.ts` - all tests passing
  - [ ] `server/tests/lab-04/actions-taken.api.test.ts` - all tests passing
  - [ ] `server/tests/lab-04/ticket-workflow.api.test.ts` - all tests passing
  - [ ] Run `npm --prefix server run test -- tests/lab-04/` - confirm all pass

### Screenshots/Evidence Needed

- [ ] **Screenshot:** Postman/Insomnia showing GET /api/dashboards/requester response
  - Save as: `artifacts/lab-04/screenshots/api/requester-dashboard-response.png`
  - Should show: JSON with totalOpen, waitingForRequester, recentlyUpdated, recentlyResolved

- [ ] **Screenshot:** Postman/Insomnia showing GET /api/dashboards/staff response
  - Save as: `artifacts/lab-04/screenshots/api/staff-dashboard-response.png`
  - Should show: JSON with unassigned, myAssigned, byStatus, byPriority

- [ ] **Screenshot:** Postman/Insomnia showing POST /api/staff/tickets/:ticketNumber/actions (success)
  - Save as: `artifacts/lab-04/screenshots/api/create-action-success.png`
  - Should show: 201 status, created action with actionId

- [ ] **Screenshot:** Postman/Insomnia showing resolution blocking (409 Conflict)
  - Save as: `artifacts/lab-04/screenshots/api/resolution-blocked.png`
  - Should show: 409 status, error message listing incomplete follow-up actions

- [ ] **Terminal screenshot:** Backend test results showing all Lab 4 tests passing
  - Save as: `artifacts/lab-04/screenshots/tests/backend-tests-passing.png`
  - Command: `npm --prefix server run test -- tests/lab-04/`

### Action Items

- [ ] Test each endpoint manually with Postman/Insomnia and capture screenshots
- [ ] Run full backend test suite and capture terminal output
- [ ] Verify regression tests (Labs 1-3) still pass

---

## Answer Part 4: Frontend Dashboard Components

**Requirement:** Requester and IT Staff dashboards with metric cards, navigation, and responsive design.

### Evidence Checklist

- [ ] **File:** `client/src/components/RequesterDashboard.tsx` exists
  - [ ] Displays 4 metric cards (Total Open, Waiting For You, Recently Updated, Recently Resolved)
  - [ ] Cards navigate to My Tickets with filters when clicked
  - [ ] Shows loading state (skeleton or spinner)
  - [ ] Shows error state with retry option
  - [ ] Shows zero counts with positive messaging

- [ ] **File:** `client/src/components/StaffDashboard.tsx` exists
  - [ ] Displays 6 metric cards (Unassigned, My Assigned, Recently Updated, High Priority, By Status, By Priority)
  - [ ] Breakdown cards show all categories with counts
  - [ ] Cards navigate to Ticket Queue with filters when clicked
  - [ ] Shows loading state
  - [ ] Shows error state with retry option

- [ ] **File:** `client/src/styles/RequesterDashboard.css`
  - [ ] Responsive grid: 4-col desktop, 2-col tablet, 1-col mobile
  - [ ] Uses Zen Green color scheme
  - [ ] Cards have proper spacing and hover states

- [ ] **File:** `client/src/styles/StaffDashboard.css`
  - [ ] Responsive grid: 3-col desktop, 2-col tablet, 1-col mobile
  - [ ] Breakdown cards have visual bars or indicators
  - [ ] Uses Zen Green color scheme

- [ ] **UI Tests:**
  - [ ] `client/tests/lab-04/RequesterDashboard.test.tsx` - tests passing
  - [ ] `client/tests/lab-04/StaffDashboard.test.tsx` - tests passing
  - [ ] Run `npm --prefix client run test -- tests/lab-04/` - verify status

### Screenshots Needed

**Requester Dashboard:**
- [ ] `artifacts/lab-04/screenshots/requester-dashboard/loaded-desktop.png` (1280px)
- [ ] `artifacts/lab-04/screenshots/requester-dashboard/loaded-tablet.png` (768px)
- [ ] `artifacts/lab-04/screenshots/requester-dashboard/loaded-mobile.png` (375px)
- [ ] `artifacts/lab-04/screenshots/requester-dashboard/empty-desktop.png` (zero counts)
- [ ] `artifacts/lab-04/screenshots/requester-dashboard/loading-desktop.png` (loading state)
- [ ] `artifacts/lab-04/screenshots/requester-dashboard/error-desktop.png` (error state)

**Staff Dashboard:**
- [ ] `artifacts/lab-04/screenshots/staff-dashboard/loaded-desktop.png` (1280px)
- [ ] `artifacts/lab-04/screenshots/staff-dashboard/loaded-tablet.png` (768px)
- [ ] `artifacts/lab-04/screenshots/staff-dashboard/loaded-mobile.png` (375px)
- [ ] `artifacts/lab-04/screenshots/staff-dashboard/breakdowns-desktop.png` (showing By Status and By Priority)

**Navigation Evidence:**
- [ ] `artifacts/lab-04/screenshots/navigation/dashboard-to-tickets.png` (clicking card navigates with filter)

### Action Items

- [ ] Run screenshot capture script: `node capture-lab-04-screenshots.mjs` OR `npx playwright test e2e/lab-04-screenshots.spec.ts`
- [ ] Manually verify responsive behavior at each breakpoint
- [ ] Test navigation from each metric card (verify filters applied correctly)
- [ ] Run frontend tests and capture results

---

## Answer Part 5: Actions Taken UI Components

**Requirement:** Actions Taken modal with Create/Edit modes, validation, and follow-up management.

### Evidence Checklist

- [ ] **File:** `client/src/components/ActionsTaken.tsx` exists
  - [ ] Create mode: empty form with all fields
  - [ ] Edit mode: pre-fills existing action data
  - [ ] followUpRequired checkbox toggles followupNote field
  - [ ] Field-level validation errors display below each field
  - [ ] Edit disabled if > 24 hours old or non-performer
  - [ ] Shows actions list in chronological order
  - [ ] Follow-up actions show badge indicator

- [ ] **File:** `client/src/styles/ActionsTaken.css`
  - [ ] Modal styling with proper overlay
  - [ ] Form fields use Zen Green design system
  - [ ] Responsive: fields stack on mobile
  - [ ] Follow-up badge uses warning color

- [ ] **UI Tests:**
  - [ ] `client/tests/lab-04/ActionsTaken.test.tsx` - check status in tests.md
  - [ ] Tests cover Create mode, Edit mode, validation, follow-up toggle

### Screenshots Needed

**Actions Taken Modal:**
- [ ] `artifacts/lab-04/screenshots/actions-taken/initial-desktop.png` (empty Create mode)
- [ ] `artifacts/lab-04/screenshots/actions-taken/initial-tablet.png`
- [ ] `artifacts/lab-04/screenshots/actions-taken/initial-mobile.png`
- [ ] `artifacts/lab-04/screenshots/actions-taken/filled-desktop.png` (filled form with followUpRequired checked)
- [ ] `artifacts/lab-04/screenshots/actions-taken/filled-tablet.png`
- [ ] `artifacts/lab-04/screenshots/actions-taken/filled-mobile.png`
- [ ] `artifacts/lab-04/screenshots/actions-taken/validation-errors-desktop.png` (showing field-level errors)
- [ ] `artifacts/lab-04/screenshots/actions-taken/edit-mode-desktop.png` (edit mode with pre-filled data)
- [ ] `artifacts/lab-04/screenshots/actions-taken/readonly-desktop.png` (non-performer view)
- [ ] `artifacts/lab-04/screenshots/actions-taken/actions-list-desktop.png` (chronological list with badges)

### Action Items

- [ ] Capture all modal screenshots (run screenshot script or manually)
- [ ] Test validation by submitting invalid data (capture error states)
- [ ] Test followUpRequired checkbox (verify note field appears/disappears)
- [ ] Test Edit mode as performer and non-performer
- [ ] Verify follow-up badge displays correctly on actions list

---

## Answer Part 6: Status Workflow UI

**Requirement:** IT Staff-only status controls with resolution blocking UI feedback.

### Evidence Checklist

- [ ] **Status controls visible to IT Staff only** (hidden from Requester view)
- [ ] **Resolution blocked UI:**
  - [ ] Shows clear error message when resolution blocked by follow-ups
  - [ ] Lists incomplete follow-up actions
  - [ ] Provides link/button to edit incomplete actions
- [ ] **Successful status change:**
  - [ ] Shows success message
  - [ ] Refreshes ticket detail to show new status
  - [ ] Updates ticket list/queue if visible

- [ ] **UI Tests:**
  - [ ] `client/tests/lab-04/TicketWorkflow.test.tsx` - check status in tests.md

### Screenshots Needed

- [ ] `artifacts/lab-04/screenshots/workflow/status-controls-staff-desktop.png` (IT Staff sees status controls)
- [ ] `artifacts/lab-04/screenshots/workflow/status-controls-requester-desktop.png` (Requester does NOT see controls)
- [ ] `artifacts/lab-04/screenshots/workflow/resolution-blocked-desktop.png` (error message with incomplete actions list)
- [ ] `artifacts/lab-04/screenshots/workflow/resolution-success-desktop.png` (success message after resolution)

### Action Items

- [ ] Login as IT Staff, open ticket, capture status controls screenshot
- [ ] Login as Requester, open same ticket, verify status controls hidden
- [ ] As IT Staff, attempt to resolve ticket with incomplete follow-ups (capture error)
- [ ] Mark follow-ups complete, then successfully resolve (capture success)

---

## Answer Part 7: UI Accessibility and Polish

**Requirement:** WCAG 2.1 AA compliance, responsive design verification, Zen Green consistency.

### Evidence Checklist

- [ ] **File:** `docs/lab-04/accessibility-audit.md` exists
  - [ ] Documents WCAG 2.1 AA compliance level (target: 85%+)
  - [ ] Lists all critical issues found and fixes applied
  - [ ] Lists recommended enhancements (non-blocking)
  - [ ] Documents focus visibility, keyboard navigation, ARIA labels, contrast ratios

- [ ] **File:** `docs/lab-04/ui-accessibility-checklist.md` exists
  - [ ] Pass/fail checklist for each accessibility criterion
  - [ ] Design system consistency checks
  - [ ] Form field states (editable, read-only, error)
  - [ ] Responsive design verification at 375px, 768px, 1280px

- [ ] **AppShell Updates:**
  - [ ] Dashboard navigation link added (required by ui-spec.md)
  - [ ] Semantic landmarks added (`role="main"`, `role="navigation"`)
  - [ ] ARIA labels for navigation

- [ ] **UI Style Tests:**
  - [ ] `client/tests/lab-04/UIStyles.test.tsx` - all tests passing
  - [ ] Tests CSS classes, badges, buttons, form states, cards

- [ ] **Responsive Tests:**
  - [ ] `client/tests/lab-04/Responsive.test.tsx` - all tests passing
  - [ ] Tests layouts at 375px, 768px, 1280px viewports

### Screenshots Needed

**Accessibility Evidence:**
- [ ] `artifacts/lab-04/screenshots/accessibility/focus-indicators.png` (showing visible focus outlines)
- [ ] `artifacts/lab-04/screenshots/accessibility/keyboard-navigation.png` (navigating without mouse)
- [ ] `artifacts/lab-04/screenshots/accessibility/screen-reader-test.png` (optional: screen reader output)
- [ ] `artifacts/lab-04/screenshots/accessibility/contrast-check.png` (browser dev tools showing contrast ratios)

**Responsive Verification:**
- [ ] `artifacts/lab-04/screenshots/responsive/desktop-1280.png` (full page at 1280px)
- [ ] `artifacts/lab-04/screenshots/responsive/tablet-768.png` (full page at 768px)
- [ ] `artifacts/lab-04/screenshots/responsive/mobile-375.png` (full page at 375px)
- [ ] `artifacts/lab-04/screenshots/responsive/no-horizontal-scroll.png` (proving no scroll at 375px)

### Action Items

- [ ] Run accessibility audit checklist manually (keyboard-only navigation, screen reader)
- [ ] Use browser accessibility tools to verify contrast ratios
- [ ] Test responsive layouts at exact breakpoints (375px, 768px, 1280px)
- [ ] Verify no horizontal scroll at any viewport size
- [ ] Run UI style and responsive tests: `npm --prefix client run test -- tests/lab-04/UIStyles.test.tsx tests/lab-04/Responsive.test.tsx`

---

## Answer Part 8: Testing and Regression

**Requirement:** Comprehensive test coverage and passing regression tests for Labs 1-3.

### Evidence Checklist

- [ ] **Backend API Tests (Lab 4):**
  - [ ] All tests in `server/tests/lab-04/` passing
  - [ ] Test coverage includes: dashboards, actions-taken, workflow, validation

- [ ] **Frontend Component Tests (Lab 4):**
  - [ ] Tests in `client/tests/lab-04/` - check Final status in tests.md
  - [ ] Test coverage includes: dashboards, actions modal, workflow UI

- [ ] **Regression Tests (Labs 1-3):**
  - [ ] All Lab 1 backend tests still passing
  - [ ] All Lab 2 backend tests still passing (or documented skips)
  - [ ] All Lab 3 backend tests still passing
  - [ ] Frontend regression tests status documented in tests.md

- [ ] **File:** `docs/lab-04/regression-report.md` (if exists)
  - [ ] Documents any bugs found during regression
  - [ ] Shows fixes applied or workarounds
  - [ ] Security audit results

### Screenshots Needed

- [ ] `artifacts/lab-04/screenshots/tests/server-lab04-passing.png` (Lab 4 backend tests)
- [ ] `artifacts/lab-04/screenshots/tests/server-regression-passing.png` (Labs 1-3 backend tests)
- [ ] `artifacts/lab-04/screenshots/tests/client-lab04-results.png` (Lab 4 frontend tests)
- [ ] `artifacts/lab-04/screenshots/tests/client-regression-results.png` (Labs 1-3 frontend tests)

### Action Items

- [ ] Run all backend tests: `npm --prefix server run test`
- [ ] Run all frontend tests: `npm --prefix client run test`
- [ ] Capture terminal output showing test results
- [ ] Document any skipped/failing tests in tests.md with justification
- [ ] Verify regression-report.md exists and is complete

---

## Answer Part 9: Pull Requests and Peer Review

**Requirement:** Feature branch workflow with peer code reviews documented.

### Evidence Checklist

- [ ] **Feature branches created for each major feature:**
  - [ ] feature/4-specification
  - [ ] feature/4-database-and-tests
  - [ ] feature/4-actions-api
  - [ ] feature/4-dashboards-api
  - [ ] feature/4-actions-ui
  - [ ] feature/4-dashboards-ui
  - [ ] feature/4-workflow-ui
  - [ ] feature/4-regression-testing
  - [ ] feature/4-accessibility-polish (or feature10/lab4-accessibility-polish)
  - [ ] feature/4-documentation (or feature11/lab4-documentation)

- [ ] **Pull Requests created and merged:**
  - [ ] Each feature branch has a corresponding merged PR
  - [ ] PR titles are descriptive (e.g., "feat: implement IT Staff dashboard API endpoints")
  - [ ] PR descriptions explain what was implemented
  - [ ] PRs show green checkmarks (all tests passing before merge)

- [ ] **File:** `docs/lab-04/reviewer.md` filled in
  - [ ] Lists all PRs I authored with links and reviewer verdicts
  - [ ] Documents review comments I received and my responses
  - [ ] Lists all PRs I reviewed for partner with my verdicts
  - [ ] Documents my review comments and partner's responses

- [ ] **Peer reviewer confirmed:**
  - [ ] Reviewer actually left comments on PRs (not just "LGTM")
  - [ ] Reviewer is the same partner as Labs 1-3 (if applicable)
  - [ ] All PRs show "Approved" status before merge

### Screenshots Needed

- [ ] `artifacts/lab-04/screenshots/github/pr-list.png` (list of all Lab 4 PRs)
- [ ] `artifacts/lab-04/screenshots/github/pr-example-review.png` (example PR showing review comments)
- [ ] `artifacts/lab-04/screenshots/github/pr-example-approval.png` (example PR showing approval)
- [ ] `artifacts/lab-04/screenshots/github/branch-protection.png` (if branch protection enabled)

### Action Items

- [ ] Ensure all feature branches have corresponding PRs
- [ ] Update reviewer.md with actual PR numbers (replace TBD)
- [ ] Fill in review comments and responses in reviewer.md
- [ ] Capture GitHub screenshots showing PR workflow
- [ ] Verify all PRs are merged to main branch

---

## Additional Submission Requirements

### Demo Video (if required)

- [ ] Record demo showing:
  - [ ] Requester logs in, views dashboard, clicks card, navigates to filtered tickets
  - [ ] IT Staff logs in, views dashboard with breakdowns, navigates to queue
  - [ ] IT Staff opens ticket, records action with follow-up required
  - [ ] IT Staff attempts to resolve ticket → blocked by incomplete follow-up
  - [ ] IT Staff marks follow-up complete, then successfully resolves ticket
  - [ ] Responsive behavior at mobile/tablet/desktop viewports

- [ ] Demo video uploaded to: [INSERT LINK]
- [ ] Demo video duration: 5-7 minutes (recommended)

### Repository Health

- [ ] No merge conflicts in main branch
- [ ] All dependencies in package.json are up to date (or documented if intentionally pinned)
- [ ] No compiler warnings in backend or frontend
- [ ] No console errors when running application
- [ ] Database seeds successfully on fresh install
- [ ] Application starts successfully on fresh clone (verify with clean clone test)

### Documentation Completeness

- [ ] README.md includes Lab 4 setup instructions
- [ ] README.md includes demo accounts and demo script
- [ ] README.md includes all test commands
- [ ] All code comments are clear and helpful (not excessive)
- [ ] Complex business logic has inline comments explaining "why"

---

## Final Pre-Submission Checklist

### Files to Submit (if manual upload required)

- [ ] `docs/lab-04/specification.md`
- [ ] `docs/lab-04/api-spec.md`
- [ ] `docs/lab-04/ui-spec.md`
- [ ] `docs/lab-04/tests.md`
- [ ] `docs/lab-04/accessibility-audit.md`
- [ ] `docs/lab-04/ui-accessibility-checklist.md`
- [ ] `docs/lab-04/reviewer.md`
- [ ] `docs/lab-04/ai-use.md`
- [ ] `artifacts/lab-04/screenshots/` (entire directory)

### GitHub Submission

- [ ] Repository URL submitted to course portal
- [ ] Main branch is the default branch
- [ ] Repository is public or accessible to instructors
- [ ] Latest commit includes all Lab 4 features

### Self-Assessment

- [ ] I have tested all features end-to-end as a user
- [ ] I have verified all test commands in README.md work
- [ ] I have reviewed all documentation for clarity and completeness
- [ ] I am confident this submission meets Lab 4 requirements
- [ ] I have addressed or documented all known issues

---

## Grading Rubric Cross-Reference

| Answer Part | Evidence Location | Self-Score (0-10) |
|-------------|-------------------|-------------------|
| 1. Specification Documents | `docs/lab-04/*.md`, git log | ___ / 10 |
| 2. Database Schema | `server/prisma/schema.prisma`, migrations, seed | ___ / 10 |
| 3. Backend API | `server/src/routes/`, API tests passing | ___ / 15 |
| 4. Dashboards UI | `client/src/components/*Dashboard.tsx`, screenshots | ___ / 15 |
| 5. Actions Taken UI | `client/src/components/ActionsTaken.tsx`, screenshots | ___ / 15 |
| 6. Status Workflow UI | Workflow screenshots, resolution blocking | ___ / 10 |
| 7. Accessibility & Polish | Accessibility docs, responsive tests, screenshots | ___ / 10 |
| 8. Testing & Regression | Test results, regression passing | ___ / 10 |
| 9. PRs & Peer Review | GitHub PRs, `reviewer.md` filled in | ___ / 5 |
| **Total** | | ___ / 100 |

---

## Notes

- This checklist is comprehensive but may not cover every edge case
- Use your judgment to add additional evidence if it strengthens your submission
- Document any deviations from requirements in "Assumptions and Decisions" sections
- If a feature is incomplete, document what works and what doesn't in tests.md

**Good luck with your Lab 4 submission!**

