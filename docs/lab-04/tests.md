# Lab 4 Test Plan and Results

## 1. Test Strategy

This plan follows Test-Driven Development (TDD) and Test Design-Driven (Test DD) principles. All planned tests are derived from the Acceptance Criteria and Business Rules in `docs/lab-04/specification.md` **before** implementation begins. Tests are written first (expected to fail), then implementation is done until they pass.

**Test levels used:**
- **Unit** — isolated logic (dashboard calculations, action validation, follow-up requirement checks)
- **API** — Supertest integration tests against Express routes with test database
- **UI Component** — Vitest + React Testing Library for component behavior
- **UI Style** — automated assertions for CSS classes, field states, labels, badges
- **Responsive** — Playwright viewport screenshots at desktop / tablet / mobile
- **E2E** — Playwright full user flows across multiple screens
- **Regression** — Re-run all Lab 1-3 tests to ensure no breaking changes

**Mocking strategy:**
- Server API tests: use real test database with `DATABASE_URL_TEST`
- UI component tests: mock API module functions via `vi.spyOn`
- E2E tests: run against the full stack with seeded test data

---

## 2. Planned Tests

| Test ID | Type | AC / BR | What It Tests | Expected Result | Test File Path | Final |
|---------|------|---------|---------------|-----------------|----------------|-------|
| **ACTIONS TAKEN - UNIT & API** |
| UNIT-01 | Unit | BR-01 | Action description validation: < 10 chars fails | Validation error returned | `server/tests/lab-04/actionValidation.unit.test.ts` | |
| UNIT-02 | Unit | BR-01 | Action description validation: > 2000 chars fails | Validation error returned | `server/tests/lab-04/actionValidation.unit.test.ts` | |
| UNIT-03 | Unit | BR-02 | Action result validation: < 10 chars fails | Validation error returned | `server/tests/lab-04/actionValidation.unit.test.ts` | |
| UNIT-04 | Unit | BR-02 | Action result validation: > 2000 chars fails | Validation error returned | `server/tests/lab-04/actionValidation.unit.test.ts` | |
| UNIT-05 | Unit | BR-03 | Follow-up note validation when followUpRequired=true: missing note fails | Validation error returned | `server/tests/lab-04/actionValidation.unit.test.ts` | |
| UNIT-06 | Unit | BR-03 | Follow-up note validation: < 10 chars fails | Validation error returned | `server/tests/lab-04/actionValidation.unit.test.ts` | |
| UNIT-07 | Unit | BR-03 | Follow-up note validation: > 500 chars fails | Validation error returned | `server/tests/lab-04/actionValidation.unit.test.ts` | |
| UNIT-08 | Unit | BR-04 | Attachment notes validation: > 500 chars fails | Validation error returned | `server/tests/lab-04/actionValidation.unit.test.ts` | |
| API-01 | API | AC-01 | POST /api/staff/tickets/:ticketNumber/actions with valid data | 201; body contains actionId, actionDateTime, performerId | `server/tests/lab-04/actions.api.test.ts` | |
| API-02 | API | AC-02 | POST /api/staff/tickets/:ticketNumber/actions by REQUESTER | 403 Forbidden | `server/tests/lab-04/actions.api.test.ts` | |
| API-03 | API | BR-05 | POST /api/staff/tickets/:ticketNumber/actions with invalid description | 400; error references `actionDescription` | `server/tests/lab-04/actions.api.test.ts` | |
| API-04 | API | BR-06 | POST /api/staff/tickets/:ticketNumber/actions with invalid result | 400; error references `result` | `server/tests/lab-04/actions.api.test.ts` | |
| API-05 | API | BR-07 | POST action with followUpRequired=true but no followupNote | 400; error references `followupNote` | `server/tests/lab-04/actions.api.test.ts` | |
| API-06 | API | AC-03 | GET /api/staff/tickets/:ticketNumber/actions returns all actions for ticket | 200; array of actions in chronological order | `server/tests/lab-04/actions.api.test.ts` | |
| API-07 | API | AC-04 | GET /api/staff/tickets/:ticketNumber/actions by REQUESTER | 403 Forbidden | `server/tests/lab-04/actions.api.test.ts` | |
| API-08 | API | AC-05 | PATCH /api/staff/tickets/:ticketNumber/actions/:actionId by performer | 200; updated action returned | `server/tests/lab-04/actions.api.test.ts` | |
| API-09 | API | AC-06 | PATCH /api/staff/tickets/:ticketNumber/actions/:actionId by different IT Staff | 403 Forbidden | `server/tests/lab-04/actions.api.test.ts` | |
| API-10 | API | BR-08 | PATCH action: cannot edit if > 24 hours old | 403 or 409; error indicates time limit | `server/tests/lab-04/actions.api.test.ts` | |
| API-11 | API | BR-09 | Cannot resolve ticket if any action has followUpRequired=true | 409 Conflict; error references unresolved follow-ups | `server/tests/lab-04/ticket-resolution.api.test.ts` | |
| API-12 | API | BR-10 | Can resolve ticket when all actions have followUpRequired=false | 200; ticket status changes to RESOLVED | `server/tests/lab-04/ticket-resolution.api.test.ts` | |
| **DASHBOARDS - API** |
| API-13 | API | AC-07 | GET /api/dashboards/requester with valid requesterId | 200; all 4 card counts returned | `server/tests/lab-04/requester-dashboard.api.test.ts` | |
| API-14 | API | AC-08 | GET /api/dashboards/requester by non-owner | 403 Forbidden | `server/tests/lab-04/requester-dashboard.api.test.ts` | |
| API-15 | API | BR-11 | Requester dashboard: totalOpen calculation correct | Count matches tickets in OPEN/IN_PROGRESS/WAITING_FOR_REQUESTER | `server/tests/lab-04/requester-dashboard.api.test.ts` | |
| API-16 | API | BR-12 | Requester dashboard: waitingForRequester calculation correct | Count matches tickets in WAITING_FOR_REQUESTER status only | `server/tests/lab-04/requester-dashboard.api.test.ts` | |
| API-17 | API | BR-13 | Requester dashboard: recentlyUpdated calculation (7 days) | Count matches tickets updated in last 7 days | `server/tests/lab-04/requester-dashboard.api.test.ts` | |
| API-18 | API | BR-14 | Requester dashboard: recentlyResolved calculation (30 days) | Count matches RESOLVED tickets resolved in last 30 days | `server/tests/lab-04/requester-dashboard.api.test.ts` | |
| API-19 | API | AC-09 | GET /api/dashboards/staff with IT_STAFF role | 200; all 6 card counts returned | `server/tests/lab-04/staff-dashboard.api.test.ts` | |
| API-20 | API | AC-10 | GET /api/dashboards/staff by REQUESTER role | 403 Forbidden | `server/tests/lab-04/staff-dashboard.api.test.ts` | |
| API-21 | API | BR-15 | Staff dashboard: unassigned calculation correct | Count matches tickets with itStaffId=null | `server/tests/lab-04/staff-dashboard.api.test.ts` | |
| API-22 | API | BR-16 | Staff dashboard: myAssigned calculation correct | Count matches tickets with itStaffId=currentUserId | `server/tests/lab-04/staff-dashboard.api.test.ts` | |
| API-23 | API | BR-17 | Staff dashboard: byStatus breakdown correct | Counts by status sum to total tickets | `server/tests/lab-04/staff-dashboard.api.test.ts` | |
| API-24 | API | BR-18 | Staff dashboard: byPriority breakdown correct | Counts by priority sum to total tickets | `server/tests/lab-04/staff-dashboard.api.test.ts` | |
| API-25 | API | BR-19 | Staff dashboard: recentlyUpdated calculation (7 days) | Count matches tickets updated in last 7 days | `server/tests/lab-04/staff-dashboard.api.test.ts` | |
| API-26 | API | BR-20 | Staff dashboard: highPriorityUnresolved calculation correct | Count matches HIGH priority + status != RESOLVED | `server/tests/lab-04/staff-dashboard.api.test.ts` | |
| **ACTIONS TAKEN - UI COMPONENT** |
| UI-01 | UI | AC-11 | ActionForm: Create mode renders empty form with required fields | All fields present; Submit button labeled "Record Action" | `client/tests/lab-04/ActionForm.test.tsx` | |
| UI-02 | UI | AC-12 | ActionForm: submit with invalid description shows field-level error | Error message below description field; API not called | `client/tests/lab-04/ActionForm.test.tsx` | |
| UI-03 | UI | AC-13 | ActionForm: followUpRequired checkbox toggles followupNote field | Note field appears/disappears based on checkbox | `client/tests/lab-04/ActionForm.test.tsx` | |
| UI-04 | UI | AC-14 | ActionForm: submit with followUpRequired=true but no note shows error | Error message below followupNote field | `client/tests/lab-04/ActionForm.test.tsx` | |
| UI-05 | UI | AC-15 | ActionForm: successful creation shows success message | Success banner displays with action details | `client/tests/lab-04/ActionForm.test.tsx` | |
| UI-06 | UI | AC-16 | ActionForm: Edit mode pre-fills form with existing action data | All fields contain action values; Submit button labeled "Update Action" | `client/tests/lab-04/ActionForm.test.tsx` | |
| UI-07 | UI | AC-17 | ActionForm: Edit mode by non-performer shows read-only view | No editable fields; no Submit button | `client/tests/lab-04/ActionForm.test.tsx` | |
| UI-08 | UI | AC-18 | ActionForm: Edit mode for action > 24 hours old shows disabled form | Fields disabled; message indicates time limit exceeded | `client/tests/lab-04/ActionForm.test.tsx` | |
| UI-09 | UI | AC-19 | ActionsList: displays all actions in chronological order | Actions sorted oldest to newest | `client/tests/lab-04/ActionsList.test.tsx` | |
| UI-10 | UI | AC-20 | ActionsList: clicking Edit action opens edit mode | Form switches to edit mode with pre-filled data | `client/tests/lab-04/ActionsList.test.tsx` | |
| UI-11 | UI | AC-21 | ActionsList: actions with followUpRequired=true show badge | "Follow-Up Required" badge visible | `client/tests/lab-04/ActionsList.test.tsx` | |
| UI-12 | UI | AC-22 | ActionsList: empty state when no actions exist | "No actions recorded yet" message displayed | `client/tests/lab-04/ActionsList.test.tsx` | |
| **DASHBOARDS - UI COMPONENT** |
| UI-13 | UI | AC-23 | RequesterDashboard: renders all 4 cards with correct counts | Cards for Total Open, Waiting For Me, Recently Updated, Recently Resolved | `client/tests/lab-04/RequesterDashboard.test.tsx` | |
| UI-14 | UI | AC-24 | RequesterDashboard: clicking card navigates to filtered My Tickets | Navigation occurs with correct filter parameters | `client/tests/lab-04/RequesterDashboard.test.tsx` | |
| UI-15 | UI | AC-25 | RequesterDashboard: zero counts show "0" with positive message | Cards visible with "0" count; no cards hidden | `client/tests/lab-04/RequesterDashboard.test.tsx` | |
| UI-16 | UI | AC-26 | RequesterDashboard: loading state while fetching data | Loading indicator visible before data loads | `client/tests/lab-04/RequesterDashboard.test.tsx` | |
| UI-17 | UI | AC-27 | RequesterDashboard: error state on API failure | Error message displayed; retry option available | `client/tests/lab-04/RequesterDashboard.test.tsx` | |
| UI-18 | UI | AC-28 | StaffDashboard: renders all 6 cards with correct counts | Cards for Unassigned, My Assigned, By Status, By Priority, Recently Updated, High Priority | `client/tests/lab-04/StaffDashboard.test.tsx` | |
| UI-19 | UI | AC-29 | StaffDashboard: breakdown cards show all categories | Status breakdown shows all statuses; Priority breakdown shows all priorities | `client/tests/lab-04/StaffDashboard.test.tsx` | |
| UI-20 | UI | AC-30 | StaffDashboard: clicking card navigates to filtered Ticket Queue | Navigation occurs with correct filter parameters | `client/tests/lab-04/StaffDashboard.test.tsx` | |
| UI-21 | UI | AC-31 | StaffDashboard: zero counts show "0" with neutral message | Cards visible with "0" count; no cards hidden | `client/tests/lab-04/StaffDashboard.test.tsx` | |
| UI-22 | UI | AC-32 | StaffDashboard: loading state while fetching data | Loading indicator visible before data loads | `client/tests/lab-04/StaffDashboard.test.tsx` | |
| UI-23 | UI | AC-33 | StaffDashboard: error state on API failure | Error message displayed; retry option available | `client/tests/lab-04/StaffDashboard.test.tsx` | |
| **UI STYLE** |
| STYLE-01 | UI Style | UI-BR | ActionForm: editable inputs have correct CSS class | `.zen-input` class present on all inputs | `client/tests/lab-04/ActionForm.test.tsx` | |
| STYLE-02 | UI Style | UI-BR | ActionForm: read-only fields have read-only CSS class | `.zen-readonly` class present when disabled | `client/tests/lab-04/ActionForm.test.tsx` | |
| STYLE-03 | UI Style | UI-BR | ActionForm: required fields show red asterisk | Asterisk element present on required field labels | `client/tests/lab-04/ActionForm.test.tsx` | |
| STYLE-04 | UI Style | UI-BR | ActionsList: Follow-Up Required badge uses warning color | Badge has `.badge-warning` or equivalent | `client/tests/lab-04/ActionsList.test.tsx` | |
| STYLE-05 | UI Style | UI-BR | Dashboard cards use Zen Green accent color | Primary cards use `#006B3C` or `#0B7A46` | `client/tests/lab-04/RequesterDashboard.test.tsx` | |
| **RESPONSIVE** |
| RESP-01 | Responsive | AC-34 | Requester Dashboard at mobile viewport (375 px) — cards stack vertically | Playwright screenshot; no horizontal scroll | `e2e/lab-04/responsive.spec.ts` | |
| RESP-02 | Responsive | AC-34 | Requester Dashboard at tablet viewport (768 px) — 2-column grid | Playwright screenshot; cards in 2 columns | `e2e/lab-04/responsive.spec.ts` | |
| RESP-03 | Responsive | AC-34 | Requester Dashboard at desktop viewport (1280 px) — 4-column grid | Playwright screenshot; cards in 4 columns | `e2e/lab-04/responsive.spec.ts` | |
| RESP-04 | Responsive | AC-35 | Staff Dashboard at mobile viewport (375 px) — cards stack vertically | Playwright screenshot; no horizontal scroll | `e2e/lab-04/responsive.spec.ts` | |
| RESP-05 | Responsive | AC-35 | Staff Dashboard at tablet viewport (768 px) — 2-column grid | Playwright screenshot; cards in 2 columns | `e2e/lab-04/responsive.spec.ts` | |
| RESP-06 | Responsive | AC-35 | Staff Dashboard at desktop viewport (1280 px) — 3-column grid | Playwright screenshot; cards in 3 columns | `e2e/lab-04/responsive.spec.ts` | |
| RESP-07 | Responsive | AC-36 | Action Form at mobile viewport (375 px) — fields stack, buttons full-width | Playwright screenshot; no clipping | `e2e/lab-04/responsive.spec.ts` | |
| RESP-08 | Responsive | AC-36 | Action Form at tablet viewport (768 px) — layout intact | Playwright screenshot; proper spacing | `e2e/lab-04/responsive.spec.ts` | |
| RESP-09 | Responsive | AC-36 | Action Form at desktop viewport (1280 px) — optimal layout | Playwright screenshot; multi-column where appropriate | `e2e/lab-04/responsive.spec.ts` | |
| **E2E - ACTIONS TAKEN** |
| E2E-01 | E2E | AC-01, AC-06 | IT Staff logs in → opens ticket → records action → verifies in list | Action appears in Actions Taken list | `e2e/lab-04/actions-flow.spec.ts` | |
| E2E-02 | E2E | AC-05, AC-06 | IT Staff records action → edits own action → verifies update | Updated action shows new values | `e2e/lab-04/actions-flow.spec.ts` | |
| E2E-03 | E2E | AC-13, BR-09 | IT Staff records action with followUpRequired=true → attempts ticket resolution | Resolution blocked; error message shown | `e2e/lab-04/actions-flow.spec.ts` | |
| E2E-04 | E2E | AC-13, BR-10 | IT Staff edits action → sets followUpRequired=false → resolves ticket | Ticket resolution succeeds | `e2e/lab-04/actions-flow.spec.ts` | |
| E2E-05 | E2E | AC-17 | IT Staff B attempts to edit IT Staff A's action | Edit form shows read-only view | `e2e/lab-04/actions-flow.spec.ts` | |
| **E2E - DASHBOARDS** |
| E2E-06 | E2E | AC-23, AC-24 | Requester logs in → views dashboard → clicks "Waiting For Me" card → verifies filtered list | My Tickets shows only WAITING_FOR_REQUESTER tickets | `e2e/lab-04/requester-dashboard-flow.spec.ts` | |
| E2E-07 | E2E | AC-23, AC-24 | Requester clicks "Recently Updated" card → verifies list shows tickets from last 7 days | All tickets in list have updatedAt within 7 days | `e2e/lab-04/requester-dashboard-flow.spec.ts` | |
| E2E-08 | E2E | AC-28, AC-30 | IT Staff logs in → views dashboard → clicks "Unassigned" card → verifies filtered queue | Ticket Queue shows only unassigned tickets | `e2e/lab-04/staff-dashboard-flow.spec.ts` | |
| E2E-09 | E2E | AC-28, AC-30 | IT Staff clicks "High Priority Unresolved" card → verifies filtered queue | Ticket Queue shows only HIGH priority + non-RESOLVED tickets | `e2e/lab-04/staff-dashboard-flow.spec.ts` | |
| E2E-10 | E2E | AC-29 | IT Staff views "By Status" breakdown → verifies all statuses present | All 7 status categories shown with counts | `e2e/lab-04/staff-dashboard-flow.spec.ts` | |
| **REGRESSION TESTS** |
| REG-01 | Regression | Lab 1 | Re-run all Lab 1 tests | All Lab 1 tests still pass | Lab 1 test files | |
| REG-02 | Regression | Lab 2 | Re-run all Lab 2 tests | All Lab 2 tests still pass | Lab 2 test files | |
| REG-03 | Regression | Lab 3 | Re-run all Lab 3 tests | All Lab 3 tests still pass | Lab 3 test files | |
| REG-04 | Regression | Integration | Requester ticket creation still works end-to-end | Create ticket → appears in My Tickets | `e2e/lab-02/requester-ticket-flow.spec.ts` | |
| REG-05 | Regression | Integration | IT Staff ticket queue and transitions still work | Open queue → claim ticket → change status | `e2e/lab-03/staff-ticket-flow.spec.ts` | |
| REG-06 | Regression | Integration | User administration still works | Admin creates user → assigns role → activates | `e2e/lab-03/user-administration.spec.ts` | |

---

## 3. Acceptance-Criterion Traceability Matrix

| AC ID | Description (short) | Covered By Test IDs |
|-------|---------------------|---------------------|
| AC-01 | IT Staff records action; action saved and appears in list | API-01, UI-05, E2E-01 |
| AC-02 | Requester cannot record actions; 403 returned | API-02 |
| AC-03 | IT Staff retrieves all actions for a ticket | API-06 |
| AC-04 | Requester cannot view actions; 403 returned | API-07 |
| AC-05 | IT Staff edits own action; update succeeds | API-08, E2E-02 |
| AC-06 | IT Staff cannot edit another's action; 403 returned | API-09, E2E-05 |
| AC-07 | Requester views dashboard; all 4 cards displayed | API-13, UI-13 |
| AC-08 | Requester cannot view other's dashboard; 403 returned | API-14 |
| AC-09 | IT Staff views dashboard; all 6 cards displayed | API-19, UI-18 |
| AC-10 | Requester cannot view staff dashboard; 403 returned | API-20 |
| AC-11 | Action form in Create mode renders correctly | UI-01 |
| AC-12 | Invalid action description shows field-level error | UI-02 |
| AC-13 | Follow-up checkbox toggles note field visibility | UI-03, E2E-03 |
| AC-14 | Missing follow-up note when required shows error | UI-04 |
| AC-15 | Successful action creation shows success message | UI-05 |
| AC-16 | Action form in Edit mode pre-fills data | UI-06 |
| AC-17 | Edit mode by non-performer shows read-only | UI-07, E2E-05 |
| AC-18 | Edit disabled for actions > 24 hours old | UI-08 |
| AC-19 | Actions list displays all actions chronologically | UI-09 |
| AC-20 | Clicking Edit opens edit mode | UI-10 |
| AC-21 | Actions with follow-up required show badge | UI-11 |
| AC-22 | Empty actions list shows appropriate message | UI-12 |
| AC-23 | Requester dashboard renders all 4 cards | UI-13, E2E-06 |
| AC-24 | Clicking dashboard card navigates with filter | UI-14, E2E-06, E2E-07 |
| AC-25 | Zero counts show "0" with positive message | UI-15 |
| AC-26 | Dashboard shows loading state | UI-16 |
| AC-27 | Dashboard shows error state on failure | UI-17 |
| AC-28 | Staff dashboard renders all 6 cards | UI-18, E2E-08 |
| AC-29 | Breakdown cards show all categories | UI-19, E2E-10 |
| AC-30 | Clicking staff dashboard card navigates with filter | UI-20, E2E-08, E2E-09 |
| AC-31 | Staff dashboard zero counts show "0" | UI-21 |
| AC-32 | Staff dashboard shows loading state | UI-22 |
| AC-33 | Staff dashboard shows error state | UI-23 |
| AC-34 | Requester dashboard responsive at all viewports | RESP-01, RESP-02, RESP-03 |
| AC-35 | Staff dashboard responsive at all viewports | RESP-04, RESP-05, RESP-06 |
| AC-36 | Action form responsive at all viewports | RESP-07, RESP-08, RESP-09 |

---

## 4. Responsive and Visual Checklist

To be completed during visual inspection before final PR:

**Colors (Zen Green consistency)**
- [ ] Dashboard cards use Primary Green `#006B3C` for headers
- [ ] Active dashboard card highlights use Secondary Green `#0B7A46`
- [ ] Card backgrounds are white with subtle `#E5E7EB` borders
- [ ] Page background is `#F5F7F6`
- [ ] Follow-Up Required badge uses amber/warning color
- [ ] Text is dark charcoal-green `#1F2937`, not pure black

**Dashboard Layout — Desktop ≥ 992 px**
- [ ] Requester dashboard: 4-column grid (or 2×2)
- [ ] Staff dashboard: 3-column grid for first row, 2-column for breakdowns
- [ ] Cards have equal height in each row
- [ ] Card counts are large and prominent
- [ ] Card titles are clear and descriptive
- [ ] No clipping or overlapping of card content

**Dashboard Layout — Tablet 768–991 px**
- [ ] Requester dashboard: 2-column grid
- [ ] Staff dashboard: 2-column grid
- [ ] Cards remain readable with adequate padding
- [ ] No horizontal scrollbar

**Dashboard Layout — Mobile < 768 px**
- [ ] All cards stack vertically (single column)
- [ ] Cards remain touch-friendly (min height 120 px)
- [ ] Card counts remain prominently displayed
- [ ] No horizontal scrollbar
- [ ] Tappable card areas are at least 44×44 px

**Action Form Layout — All Viewports**
- [ ] Desktop: Multi-column layout where appropriate (e.g., checkboxes inline)
- [ ] Tablet: Fields stack; adequate spacing maintained
- [ ] Mobile: All fields full-width; buttons remain touch-friendly
- [ ] No horizontal scrollbar at any viewport
- [ ] Conditional followupNote field appears/disappears smoothly

**Field States (Action Form)**
- [ ] Editable fields: white background, clear neutral border
- [ ] Read-only fields (Edit mode, non-performer): gray-green background
- [ ] Disabled fields (> 24 hours old): visually muted
- [ ] Invalid fields: dark red border and error message below
- [ ] Focused fields: visible focus ring for keyboard users

**Required Fields and Validation (Action Form)**
- [ ] All required fields show red asterisk
- [ ] Validation messages appear below the relevant field
- [ ] Asterisk does not replace the validation message
- [ ] Error messages use `text-danger` or equivalent

**Buttons**
- [ ] Primary button ("Record Action", "Update Action"): solid green, white text
- [ ] Secondary button ("Cancel"): outlined or muted
- [ ] Disabled button: visually muted, not clickable
- [ ] Busy button: shows spinner/loading text, not clickable

**Badges and Icons**
- [ ] Follow-Up Required badge: amber/warning color, clear icon
- [ ] Dashboard card icons: appropriate and consistent
- [ ] Badge text is readable without relying on color alone

**Accessibility**
- [ ] All dashboard cards have accessible labels
- [ ] Card click areas are keyboard-accessible (Enter key works)
- [ ] Form labels are associated with inputs
- [ ] Error messages linked via `aria-describedby`
- [ ] Focus order is logical in action form
- [ ] Loading states announced to screen readers

**Empty States**
- [ ] Dashboard cards with zero counts show "0" clearly
- [ ] Empty actions list shows friendly "No actions recorded yet" message
- [ ] Error states provide actionable next steps (e.g., "Retry")

---

## 5. Test Commands

```bash
# Run all server unit and API tests (from server/ directory)
npm run test

# Run specific Lab 4 server tests
npm run test tests/lab-04/

# Run all client UI component tests (from client/ directory)
npm run test

# Run specific Lab 4 client tests
npm run test tests/lab-04/

# Run all E2E and responsive tests (from project root, requires running app)
npx playwright test e2e/lab-04/

# Run only responsive screenshot tests
npx playwright test e2e/lab-04/responsive.spec.ts

# Run only Actions Taken E2E flow
npx playwright test e2e/lab-04/actions-flow.spec.ts

# Run only Dashboard E2E flows
npx playwright test e2e/lab-04/requester-dashboard-flow.spec.ts
npx playwright test e2e/lab-04/staff-dashboard-flow.spec.ts

# Run all regression tests (Labs 1-3)
npm run test tests/lab-01/ tests/lab-02/ tests/lab-03/ (from server/)
npm run test tests/lab-01/ tests/lab-02/ tests/lab-03/ (from client/)
npx playwright test e2e/lab-02/ e2e/lab-03/ (from project root)
```

---

## 6. Final Results

All tests have been executed and results are recorded below.

| Suite | Total Tests | Passed | Failed | Skipped |
|-------|-------------|--------|--------|---------|
| Server (Unit + API) | TBD | TBD | TBD | TBD |
| Client (UI Component + Style) | TBD | TBD | TBD | TBD |
| E2E + Responsive | TBD | TBD | TBD | TBD |
| Regression (Labs 1-3) | TBD | TBD | TBD | TBD |
| **Total** | **TBD** | **TBD** | **TBD** | **TBD** |

**Test Execution Details:**

*To be filled in after test execution.*

**Server Tests:**
- `tests/lab-04/actionValidation.unit.test.ts`: TBD
- `tests/lab-04/actions.api.test.ts`: TBD
- `tests/lab-04/ticket-resolution.api.test.ts`: TBD
- `tests/lab-04/requester-dashboard.api.test.ts`: TBD
- `tests/lab-04/staff-dashboard.api.test.ts`: TBD

**Client Tests:**
- `tests/lab-04/ActionForm.test.tsx`: TBD
- `tests/lab-04/ActionsList.test.tsx`: TBD
- `tests/lab-04/RequesterDashboard.test.tsx`: TBD
- `tests/lab-04/StaffDashboard.test.tsx`: TBD

**E2E + Responsive Tests:**
- `e2e/lab-04/responsive.spec.ts`: TBD
- `e2e/lab-04/actions-flow.spec.ts`: TBD
- `e2e/lab-04/requester-dashboard-flow.spec.ts`: TBD
- `e2e/lab-04/staff-dashboard-flow.spec.ts`: TBD

**Regression Tests:**
- All Lab 1 tests: TBD
- All Lab 2 tests: TBD
- All Lab 3 tests: TBD

**Notes:**
- Regression test results to confirm no breaking changes from Lab 4 implementation

---

## 7. Known Limitations or Deferred Tests

- Playwright E2E tests require a running backend and seeded database
- Visual screenshot pixel-diff comparison is deferred; manual checklist in Section 4 is the primary visual verification method
- Load and performance testing are out of scope for Lab 4
- Dashboard real-time updates (if implemented) would require additional WebSocket or polling tests
- Timezone handling in "Recently Updated" and "Recently Resolved" calculations should be verified manually across timezones
