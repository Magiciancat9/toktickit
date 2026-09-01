# Lab 2 Test Plan and Results

## 1. Test Strategy

This plan follows Test-Driven Development (TDD) and Test Design-Driven (Test DD) principles. All planned tests are derived from the Acceptance Criteria and Business Rules in `docs/lab-02/specification.md` **before** implementation begins. Tests are written first (expected to fail), then implementation is done until they pass.

**Test levels used:**
- **Unit** — isolated logic (Ticket Number generator, validation helpers)
- **API** — Supertest integration tests against Express routes with mocked or real DB
- **UI Component** — Vitest + React Testing Library for component behaviour
- **UI Style** — automated assertions for CSS classes, field states, labels, asterisks
- **Responsive** — Playwright viewport screenshots at desktop / tablet / mobile
- **E2E** — Playwright full user flows across multiple screens

**Mocking strategy:**
- Server API tests: use a real test database (separate `DATABASE_URL_TEST`) or vi.mock Prisma client
- UI component tests: mock API module functions via `vi.spyOn`
- E2E tests: run against the full stack with seeded test data

---

## 2. Planned Tests

| Test ID | Type | AC / BR | What It Tests | Expected Result | Test File Path | Final |
|---------|------|---------|---------------|-----------------|----------------|-------|
| UNIT-01 | Unit | BR-01 | Ticket Number generator produces `TKT-YYYY-NNNNNN` format | String matches regex `/^TKT-\d{4}-\d{6}$/` | `server/tests/lab-02/ticketNumber.unit.test.ts` | |
| UNIT-02 | Unit | BR-01 | Two generated Ticket Numbers in the same year differ | Numbers are not equal | `server/tests/lab-02/ticketNumber.unit.test.ts` | |
| UNIT-03 | Unit | BR-05 | Summary trimming: whitespace-only string fails validation | Validation error returned | `server/tests/lab-02/validation.unit.test.ts` | |
| UNIT-04 | Unit | BR-06 | Description below 10 chars fails validation | Validation error returned | `server/tests/lab-02/validation.unit.test.ts` | |
| UNIT-05 | Unit | BR-12 | Attachment MIME type validator rejects `.exe` | Returns false | `server/tests/lab-02/attachmentValidation.unit.test.ts` | |
| UNIT-06 | Unit | BR-12 | Attachment MIME type validator accepts PDF, JPG, PNG, WEBP | Returns true for all | `server/tests/lab-02/attachmentValidation.unit.test.ts` | |
| UNIT-07 | Unit | BR-13 | Attachment size validator rejects file > 5 MB | Returns false | `server/tests/lab-02/attachmentValidation.unit.test.ts` | |
| API-01 | API | AC-01 | POST /api/tickets with valid data | 201; body contains `ticketNumber` matching format | `server/tests/lab-02/create-ticket.api.test.ts` | |
| API-02 | API | AC-04 | POST /api/tickets with blank Summary | 400; error references `summary` field | `server/tests/lab-02/create-ticket.api.test.ts` | |
| API-03 | API | AC-05 | POST /api/tickets with Description < 10 chars | 400; error references `description` field | `server/tests/lab-02/create-ticket.api.test.ts` | |
| API-04 | API | BR-07 | POST /api/tickets with invalid categoryId | 400 | `server/tests/lab-02/create-ticket.api.test.ts` | |
| API-05 | API | BR-09 | POST /api/tickets with invalid requestedPriority | 400 | `server/tests/lab-02/create-ticket.api.test.ts` | |
| API-06 | API | AC-03 | GET /api/tickets/:ticketNumber with wrong requesterId | 403 | `server/tests/lab-02/ticket-detail.api.test.ts` | |
| API-07 | API | AC-20 | GET /api/tickets/:ticketNumber with correct owner | 200; all ticket fields returned | `server/tests/lab-02/ticket-detail.api.test.ts` | |
| API-08 | API | AC-12 | GET /api/tickets?requesterId=X returns only that Requester's tickets | 200; array contains only tickets owned by X | `server/tests/lab-02/my-tickets.api.test.ts` | |
| API-09 | API | AC-13 | GET /api/tickets?requesterId=X&search=laptop returns matching tickets | 200; all returned summaries contain "laptop" (case-insensitive) | `server/tests/lab-02/my-tickets.api.test.ts` | |
| API-10 | API | AC-14 | GET /api/tickets?requesterId=X&category=Hardware filters correctly | 200; all returned tickets have Hardware category | `server/tests/lab-02/my-tickets.api.test.ts` | |
| API-11 | API | AC-15 | GET /api/tickets?requesterId=X&page=2&pageSize=10 returns page 2 | 200; `meta.page === 2`; correct ticket slice | `server/tests/lab-02/my-tickets.api.test.ts` | |
| API-12 | API | AC-16 | GET /api/tickets?requesterId=X&search=xyznonexistent | 200; empty `data` array; `meta.total === 0` | `server/tests/lab-02/my-tickets.api.test.ts` | |
| API-13 | API | AC-09 | POST /api/tickets/:ticketNumber/attachments with valid file | 201; attachment metadata returned | `server/tests/lab-02/attachments.api.test.ts` | |
| API-14 | API | AC-06 | POST /api/tickets/:ticketNumber/attachments with file > 5 MB | 400 | `server/tests/lab-02/attachments.api.test.ts` | |
| API-15 | API | AC-07 | POST /api/tickets/:ticketNumber/attachments with unsupported type | 415 | `server/tests/lab-02/attachments.api.test.ts` | |
| API-16 | API | AC-08 | POST /api/tickets/:ticketNumber/attachments when 5 already active | 409 | `server/tests/lab-02/attachments.api.test.ts` | |
| API-17 | API | AC-10 | PATCH /api/attachments/:id/remove with valid reason | 200; `removedAt` is set; `removalReason` matches | `server/tests/lab-02/attachments.api.test.ts` | |
| API-18 | API | AC-11 | GET /api/attachments/:id/download for removed attachment | 410 Gone | `server/tests/lab-02/attachments.api.test.ts` | |
| API-19 | API | BR-16 | PATCH /api/attachments/:id/remove by non-owner | 403 | `server/tests/lab-02/attachments.api.test.ts` | |
| API-20 | API | BR-17 | PATCH /api/attachments/:id/remove with missing reason | 400 | `server/tests/lab-02/attachments.api.test.ts` | |
| API-21 | API | AC-19 | GET /api/requesters returns only active Requesters | 200; no inactive Requester in array | `server/tests/lab-02/requesters.api.test.ts` | |
| UI-01 | UI | AC-02 | RequesterSelector renders dropdown with active Requesters | Active names visible; Continue button present | `client/tests/lab-02/RequesterSelector.test.tsx` | |
| UI-02 | UI | AC-19 | RequesterSelector shows loading state while fetching | Loading indicator present before resolution | `client/tests/lab-02/RequesterSelector.test.tsx` | |
| UI-03 | UI | AC-19 | RequesterSelector shows error state on API failure | Error message visible | `client/tests/lab-02/RequesterSelector.test.tsx` | |
| UI-04 | UI | AC-04 | CreateTicket: submit without Summary shows field-level message | Error message below Summary field; API not called | `client/tests/lab-02/CreateTicket.test.tsx` | |
| UI-05 | UI | AC-05 | CreateTicket: submit with Description < 10 chars shows message | Error message below Description field | `client/tests/lab-02/CreateTicket.test.tsx` | |
| UI-06 | UI | AC-23 | CreateTicket: Submit button disabled and shows busy during request | Button disabled; loading text/spinner present | `client/tests/lab-02/CreateTicket.test.tsx` | |
| UI-07 | UI | AC-01 | CreateTicket: success state displays Ticket Number | Success banner contains generated Ticket Number | `client/tests/lab-02/CreateTicket.test.tsx` | |
| UI-08 | UI | AC-18 | CreateTicket: API failure preserves form values | Input values unchanged after error | `client/tests/lab-02/CreateTicket.test.tsx` | |
| UI-09 | UI | AC-06 | CreateTicket: oversized file shows attachment error | Error message for file size shown | `client/tests/lab-02/CreateTicket.test.tsx` | |
| UI-10 | UI | AC-07 | CreateTicket: unsupported file type shows error | Error message for file type shown | `client/tests/lab-02/CreateTicket.test.tsx` | |
| UI-11 | UI | AC-12 | MyTickets: renders ticket list for selected Requester | Ticket rows visible with Ticket Numbers | `client/tests/lab-02/MyTickets.test.tsx` | |
| UI-12 | UI | AC-16 | MyTickets: no-results state when search returns empty | "No results" message visible | `client/tests/lab-02/MyTickets.test.tsx` | |
| UI-13 | UI | AC-15 | MyTickets: pagination controls present when > 10 tickets | Page buttons rendered | `client/tests/lab-02/MyTickets.test.tsx` | |
| UI-14 | UI | AC-17 | MyTickets: changing Requester reloads ticket list | New Requester's tickets shown; old ones gone | `client/tests/lab-02/MyTickets.test.tsx` | |
| UI-15 | UI | AC-20 | TicketDetail: all fields displayed as read-only | No editable inputs; values match ticket data | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | |
| UI-16 | UI | AC-10 | TicketDetail: soft-remove shows confirmation modal | Modal appears with reason input | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | |
| UI-17 | UI | AC-10 | TicketDetail: removed attachment shows metadata only | Download button absent; removal reason visible | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | |
| UI-18 | UI | AC-09 | AttachmentSection: upload success shows new attachment row | New row with filename appears | `client/tests/lab-02/AttachmentSection.test.tsx` | |
| UI-19 | UI | AC-22 | CreateTicket: required fields show red asterisk | Asterisk element present on required field labels | `client/tests/lab-02/CreateTicket.test.tsx` | |
| STYLE-01 | UI Style | BR (UI) | CreateTicket: editable inputs have correct CSS class | `.zen-input` or equivalent class present | `client/tests/lab-02/CreateTicket.test.tsx` | |
| STYLE-02 | UI Style | BR (UI) | TicketDetail: read-only fields have read-only CSS class | `.zen-readonly` or equivalent class present | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | |
| STYLE-03 | UI Style | AC-22 | Validation messages rendered with error CSS class | `.zen-error` or equivalent class present | `client/tests/lab-02/CreateTicket.test.tsx` | |
| RESP-01 | Responsive | AC-21 | Create Ticket at mobile viewport (375 px) — no horizontal scroll | Playwright screenshot; no overflow | `e2e/lab-02/responsive.spec.ts` | |
| RESP-02 | Responsive | AC-21 | My Tickets at tablet viewport (768 px) — layout intact | Playwright screenshot; no clipping | `e2e/lab-02/responsive.spec.ts` | |
| RESP-03 | Responsive | AC-21 | Ticket Detail at desktop viewport (1280 px) | Playwright screenshot; multi-column layout | `e2e/lab-02/responsive.spec.ts` | |
| E2E-01 | E2E | AC-01, AC-12 | Requester selects identity → creates ticket → finds it in My Tickets | Ticket Number in list matches created ticket | `e2e/lab-02/requester-ticket-flow.spec.ts` | |
| E2E-02 | E2E | AC-03 | Select Requester B → attempt to open Requester A's ticket URL | 403 error page or redirect shown | `e2e/lab-02/requester-ticket-flow.spec.ts` | |
| E2E-03 | E2E | AC-09, AC-10 | Upload attachment → verify in list → soft-remove with reason → verify metadata only | Attachment row changes to removed state | `e2e/lab-02/requester-ticket-flow.spec.ts` | |
| E2E-04 | E2E | AC-13, AC-14 | Create 2 tickets with different categories → filter by one → verify results | Only matching category tickets shown | `e2e/lab-02/requester-ticket-flow.spec.ts` | |

---

## 3. Acceptance-Criterion Traceability Matrix

| AC ID | Description (short) | Covered By Test IDs |
|-------|---------------------|---------------------|
| AC-01 | Valid ticket created; Ticket Number returned and displayed | API-01, UI-07, E2E-01 |
| AC-02 | No Requester selected → Selector screen shown | UI-01 |
| AC-03 | Cross-requester ticket access returns 403 | API-06, E2E-02 |
| AC-04 | Blank Summary → field-level validation message | API-02, UI-04 |
| AC-05 | Description < 10 chars → field-level validation message | API-03, UI-05 |
| AC-06 | File > 5 MB → error message, not uploaded | API-14, UI-09 |
| AC-07 | Unsupported file type → error message, not uploaded | API-15, UI-10 |
| AC-08 | 6th attachment rejected with 409 | API-16 |
| AC-09 | Valid attachment upload → appears in list | API-13, UI-18, E2E-03 |
| AC-10 | Soft-remove with reason → metadata only, no download | API-17, UI-16, UI-17, E2E-03 |
| AC-11 | Download removed attachment → 410 Gone | API-18 |
| AC-12 | My Tickets shows only owner's tickets in default order | API-08, UI-11, E2E-01 |
| AC-13 | Keyword search filters by Summary | API-09, E2E-04 |
| AC-14 | Category filter works correctly | API-10, E2E-04 |
| AC-15 | Pagination controls present and functional | API-11, UI-13 |
| AC-16 | No-results state distinct from empty state | API-12, UI-12 |
| AC-17 | Changing Requester reloads ticket list | UI-14 |
| AC-18 | Backend failure preserves form values | UI-08 |
| AC-19 | Selector shows only active Requesters; loading/error states | API-21, UI-01, UI-02, UI-03 |
| AC-20 | Ticket Detail fields are read-only | UI-15 |
| AC-21 | Mobile layout: vertical stack, no horizontal scroll | RESP-01, RESP-02, RESP-03 |
| AC-22 | Required field asterisk + per-field validation message | UI-19, STYLE-03 |
| AC-23 | Submit button busy and disabled during request | UI-06 |

---

## 4. Responsive and Visual Checklist

To be completed during visual inspection before final PR:

**Colors**
- [ ] App header uses Primary Green `#006B3C`
- [ ] Active nav link uses Secondary Green `#0B7A46`
- [ ] Selected/success states use Pale Green `#EAF6EF`
- [ ] Page background is `#F5F7F6` or equivalent near-white
- [ ] Cards/surfaces are white with subtle border and shadow
- [ ] Text is dark charcoal-green, not pure black

**Field States**
- [ ] Editable fields: white background, clear neutral border
- [ ] Read-only fields: soft gray-green or warm ivory background, clearly distinct
- [ ] Invalid fields: dark red border and error message immediately below
- [ ] Disabled fields: visually distinct, cannot be activated
- [ ] Focused fields: visible focus ring for keyboard users

**Required Fields and Validation**
- [ ] All required fields show a red asterisk
- [ ] Validation messages appear below the relevant field, not only at the top
- [ ] Asterisk does not replace the validation message

**Buttons**
- [ ] Primary button: solid green, white text, used for main action only
- [ ] Secondary button: outlined or muted, used for cancel/back
- [ ] Destructive button: red, used for remove attachment only
- [ ] Disabled button: visually muted, not clickable
- [ ] Busy button: shows spinner/loading text, not clickable

**Layout — Desktop ≥ 992 px**
- [ ] Multi-column layout; max content width ≤ 1200 px
- [ ] No clipped labels or overlapping messages
- [ ] Ticket list shown as table with all columns readable

**Layout — Tablet 768–991 px**
- [ ] Two-column layout where practical
- [ ] Summary and Description have sufficient width
- [ ] No horizontal scrollbar

**Layout — Mobile < 768 px**
- [ ] All fields stack vertically
- [ ] Buttons remain touch-friendly (min height 44 px)
- [ ] No horizontal scrollbar
- [ ] Ticket list switches to card layout

**Badges**
- [ ] Requested Priority badges: LOW (blue/grey), MEDIUM (amber), HIGH (red) — consistent across screens
- [ ] Current Status badge: NEW shown in green
- [ ] Badge text is readable without relying on color alone

**Attachment States**
- [ ] Active attachment: filename, size, upload date, Download button visible
- [ ] Removed attachment: greyed-out row, removal reason and date shown, no Download button
- [ ] Upload in progress: progress indicator or spinner visible

**Accessibility**
- [ ] All icon-only controls have accessible labels and tooltips
- [ ] Focus order is logical on all screens
- [ ] Form labels are associated with their inputs
- [ ] Error messages are linked to their fields via `aria-describedby`

---

## 5. Test Commands

```bash
# Run all server unit and API tests (from server/ directory)
npm run test

# Run all client UI component tests (from client/ directory)
npm run test

# Run E2E and responsive tests (from project root, requires running app)
npx playwright test e2e/lab-02/

# Run only responsive screenshot tests
npx playwright test e2e/lab-02/responsive.spec.ts

# Run only the full requester ticket flow E2E
npx playwright test e2e/lab-02/requester-ticket-flow.spec.ts
```

---

## 6. Final Results

> To be filled in after implementation is complete.

| Suite | Total Tests | Passed | Failed | Skipped |
|-------|-------------|--------|--------|---------|
| Server (Unit + API) | | | | |
| Client (UI Component + Style) | | | | |
| E2E + Responsive | | | | |
| **Total** | | | | |

---

## 7. Known Limitations or Deferred Tests

- Playwright E2E tests require a running backend and seeded database; they are not run in CI without a test database container.
- Visual screenshot comparison (pixel-diff) is deferred; manual checklist in Section 4 is the primary visual verification method for Lab 2.
- Load and performance testing are out of scope for Lab 2.
