# Lab 4 UI Specification

## 1. Design System: Zen Green (Continued from Labs 2-3)

Lab 4 extends the Zen Green design language established in Labs 2 and 3. All new screens must be visually consistent with existing interfaces.

### 1.1. Color Palette (No Changes from Lab 3)

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Primary Green | #006B3C | App header background, primary buttons, dashboard accents |
| Secondary Green | #0B7A46 | Active navigation, hover states |
| Pale Green | #EAF6EF | Success backgrounds, selected states |
| Dark Charcoal-Green | #2C3E37 | Body text |
| Warm Ivory | #F9F9F7 | Read-only field backgrounds |
| Light Gray-Green | #E0E6E3 | Borders, disabled states |
| Page Background | #F5F7F6 | Main page background |
| White | #FFFFFF | Card backgrounds, editable fields, dashboard cards |
| Dark Red | #C41E3A | Validation errors, destructive actions, High priority |
| Amber | #F59E0B | Medium priority, warning states, Follow-Up Required badge |
| Blue | #3B82F6 | Info, Low priority |
| Teal | #14B8A6 | Success states, Resolved status |
| Purple | #8B5CF6 | Administrator role, Waiting status |
| Gray | #6B7280 | Closed status, inactive states |

### 1.2. Typography (No Changes from Lab 3)

- **Font Family:** System font stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
- **Headings:** Semi-bold (600), Dark Charcoal-Green
- **Body Text:** Regular (400), 16px base, Dark Charcoal-Green
- **Labels:** Medium (500), 14px, Dark Charcoal-Green
- **Helper Text:** Regular (400), 13px, medium gray
- **Dashboard Card Counts:** Bold (700), 36px, Primary Green

### 1.3. Component Conventions (Extended from Lab 3)

**Buttons:** (No changes from Lab 3)
- **Primary:** Solid Primary Green background, white text, rounded corners (4px), min-height 40px
- **Secondary:** Outlined (2px Secondary Green border), Secondary Green text, white background
- **Destructive:** Solid Dark Red background, white text
- **Disabled:** Light Gray-Green background, muted text, not clickable
- **Busy:** Primary color with spinner/loading text, disabled

**Form Fields:** (No changes from Lab 3)
- **Editable:** White background, 1px Light Gray-Green border, 8px padding, rounded corners (4px)
- **Read-only:** Warm Ivory background, 1px Light Gray-Green border, visually distinct from editable
- **Invalid:** Dark Red 2px border, error message immediately below field in Dark Red
- **Focused:** 2px Secondary Green border, visible focus ring
- **Disabled:** Light Gray-Green background, muted text

**Badges:** (Extended for Lab 4)
- Small rounded pill shape, 6px vertical padding, 12px horizontal padding, semi-bold text
- **Priority Low:** Blue background, white text
- **Priority Medium:** Amber background, white text
- **Priority High:** Dark Red background, white text
- **Status badges:** (same as Lab 3)
- **Role badges:** (same as Lab 3)
- **NEW: Follow-Up Required:** Amber background, white text, warning icon (optional)

**Cards:** (No changes from Lab 3)
- White background, 1px Light Gray-Green border, 8px border-radius, subtle shadow (0 2px 4px rgba(0,0,0,0.05))

**NEW: Dashboard Cards:**
- White background, 1px Light Gray-Green border, 8px border-radius, subtle shadow
- Clickable: cursor pointer, hover state with slight elevation and Secondary Green border
- Padding: 24px
- Header: Primary Green accent bar (4px height) or icon
- Count: Bold 36px, Primary Green, centered
- Label: Regular 16px, Dark Charcoal-Green, centered below count
- Icon (optional): 32px, Primary Green, top-right corner

---

## 2. Application Shell Updates

### 2.1. Updated Top Navigation Bar

**Center Section Navigation Links (Updated):**
- **Requester:** Dashboard | My Tickets | Create Ticket
- **IT Staff:** Dashboard | Ticket Queue
- **Administrator:** Dashboard | Ticket Queue | User Management

**New Additions:**
- "Dashboard" link added as first item for all roles
- Active page styling: underlined with Secondary Green or Pale Green background

All other navigation bar specifications remain unchanged from Lab 3.

---

## 3. Requester Dashboard Screen

### 3.1. Purpose

Provides Requesters with at-a-glance metrics about their tickets.

### 3.2. Layout

**Page Header:**
- Heading: "My Ticket Dashboard" (H1, Dark Charcoal-Green)
- Subheading (optional): "Quick overview of your support tickets" (14px, medium gray)

**Dashboard Cards Grid:**
- **Desktop (≥ 992px):** 4-column grid (or 2 rows × 2 columns)
- **Tablet (768px – 991px):** 2-column grid (2 rows × 2 columns)
- **Mobile (< 768px):** Single column (4 rows × 1 column)
- Gap between cards: 24px
- Cards have equal height within each row

### 3.3. Dashboard Cards (4 Total)

Each card is clickable and navigates to My Tickets with appropriate filter applied.

#### Card 1: Total Open Tickets
- **Count:** Number of tickets in OPEN, IN_PROGRESS, or WAITING_FOR_REQUESTER status
- **Label:** "Total Open Tickets"
- **Icon (optional):** Ticket or folder icon
- **Click Action:** Navigate to My Tickets with no status filter (default view shows all open)

#### Card 2: Waiting for Me
- **Count:** Number of tickets in WAITING_FOR_REQUESTER status only
- **Label:** "Waiting for Me"
- **Icon (optional):** Clock or alert icon
- **Click Action:** Navigate to My Tickets filtered by status=WAITING_FOR_REQUESTER

#### Card 3: Recently Updated
- **Count:** Number of tickets updated in the last 7 days (any status)
- **Label:** "Recently Updated" with subtitle "(Last 7 Days)"
- **Icon (optional):** Refresh or calendar icon
- **Click Action:** Navigate to My Tickets sorted by updatedAt descending, showing tickets from last 7 days

#### Card 4: Recently Resolved
- **Count:** Number of tickets with status=RESOLVED resolved in the last 30 days
- **Label:** "Recently Resolved" with subtitle "(Last 30 Days)"
- **Icon (optional):** Checkmark or success icon
- **Click Action:** Navigate to My Tickets filtered by status=RESOLVED, showing tickets resolved in last 30 days

### 3.4. States

**Initial / Loading:**
- Skeleton cards with animated loading placeholders
- Card structure visible but counts show "—" or spinner

**Loaded:**
- All 4 cards displayed with actual counts
- Cards are interactive (hover shows elevation)

**Empty State (Zero Counts):**
- Cards remain visible
- Zero counts display as "0" (not hidden)
- Optional friendly message: "No tickets waiting" or "Great! You're all caught up"

**Error State:**
- Error banner at top: "Unable to load dashboard data. Please try again."
- Retry button in banner
- Cards show "—" or error icon

---

## 4. IT Staff Dashboard Screen

### 4.1. Purpose

Provides IT Staff and Administrators with operational metrics and ticket distribution views.

### 4.2. Layout

**Page Header:**
- Heading: "IT Staff Dashboard" (H1, Dark Charcoal-Green)
- Subheading (optional): "Ticket queue overview and metrics" (14px, medium gray)

**Dashboard Cards Grid:**
- **Desktop (≥ 992px):** 3-column grid for first row, 2-column grid for breakdown cards
- **Tablet (768px – 991px):** 2-column grid
- **Mobile (< 768px):** Single column
- Gap between cards: 24px

### 4.3. Dashboard Cards (6 Total)

#### Card 1: Unassigned Tickets
- **Count:** Number of tickets with itStaffId=null (any non-RESOLVED/CLOSED/CANCELLED status)
- **Label:** "Unassigned Tickets"
- **Icon (optional):** User-X or inbox icon
- **Click Action:** Navigate to Ticket Queue filtered by itStaffId=null

#### Card 2: My Assigned Tickets
- **Count:** Number of tickets assigned to current user (itStaffId=currentUserId)
- **Label:** "My Assigned Tickets"
- **Icon (optional):** User-check or assigned icon
- **Click Action:** Navigate to Ticket Queue filtered by itStaffId=currentUserId

#### Card 3: Recently Updated
- **Count:** Number of tickets updated in the last 7 days (all tickets system-wide)
- **Label:** "Recently Updated" with subtitle "(Last 7 Days)"
- **Icon (optional):** Refresh or calendar icon
- **Click Action:** Navigate to Ticket Queue sorted by updatedAt descending, showing tickets from last 7 days

#### Card 4: High Priority Unresolved
- **Count:** Number of tickets with itPriority=HIGH and status not in [RESOLVED, CLOSED, CANCELLED]
- **Label:** "High Priority Unresolved"
- **Icon (optional):** Alert or priority icon
- **Styling:** Optional amber or red accent to indicate urgency
- **Click Action:** Navigate to Ticket Queue filtered by itPriority=HIGH and status not resolved/closed/cancelled

#### Card 5: Tickets by Status (Breakdown Card)
- **Type:** Multi-value breakdown card
- **Label:** "Tickets by Status"
- **Content:** List of all statuses with counts:
  - NEW: X tickets
  - OPEN: X tickets
  - IN_PROGRESS: X tickets
  - WAITING_FOR_REQUESTER: X tickets
  - RESOLVED: X tickets
  - CLOSED: X tickets
  - REOPENED: X tickets
  - CANCELLED: X tickets
- Each status row is clickable (navigate to Ticket Queue filtered by that status)
- Status badge color displayed next to count

#### Card 6: Tickets by IT Priority (Breakdown Card)
- **Type:** Multi-value breakdown card
- **Label:** "Tickets by IT Priority"
- **Content:** List of all priorities with counts:
  - LOW: X tickets
  - MEDIUM: X tickets
  - HIGH: X tickets
- Each priority row is clickable (navigate to Ticket Queue filtered by that priority)
- Priority badge color displayed next to count

### 4.4. States

**Initial / Loading:**
- Skeleton cards with animated loading placeholders
- Breakdown cards show structure but no counts

**Loaded:**
- All 6 cards displayed with actual counts
- Breakdown cards show all categories even if count is 0

**Empty State (Zero Counts):**
- Cards remain visible
- Zero counts display as "0"
- Breakdown cards show all categories with "0" counts

**Error State:**
- Error banner at top: "Unable to load dashboard data. Please try again."
- Retry button in banner
- Cards show "—" or error icon

---

## 5. Actions Taken Section (Within Ticket Detail)

### 5.1. Purpose

Allows IT Staff to record and view actions taken on a ticket. This section appears **within the existing IT Staff Ticket Detail screen** (from Lab 3), below the ticket fields and above or alongside Comments/Internal Notes.

### 5.2. Location

**IT Staff Ticket Detail Screen:**
- **Tab-based layout (Option A):** Add "Actions Taken" tab alongside "Ticket Details", "Comments", "Internal Notes", "Attachments"
- **Section-based layout (Option B - RECOMMENDED):** Add "Actions Taken" collapsible section below Ticket Details and above Comments
  - Section heading: "Actions Taken" with badge showing action count
  - Collapsible/expandable with arrow icon
  - Default state: expanded

### 5.3. Actions List View

**Layout:**
- Actions displayed in chronological order (oldest first)
- Each action is a card or bordered section

**Action Card/Row Content:**
- **Performer:** IT Staff name and role badge (e.g., "Jane Doe - IT Staff")
- **Action Date/Time:** "2026-09-14 at 10:30 AM" (localized format)
- **Action Description:** Full text, word-wrap enabled
- **Result:** Full text, word-wrap enabled
- **Follow-Up Required:** Badge (amber, "Follow-Up Required") if followUpRequired=true
- **Follow-Up Note:** Displayed below badge if followUpRequired=true
- **Attachment Notes:** Displayed if attachmentNotes is not empty
- **Actions (Buttons):**
  - **Edit** button (Secondary, small) — visible only if:
    - Current user is the performer (performerId = currentUserId)
    - Action was created/updated < 24 hours ago
  - Edit button disabled with tooltip "Cannot edit actions older than 24 hours" if > 24 hours old

**Empty State:**
- Display when no actions exist for the ticket
- Message: "No actions have been recorded for this ticket yet."
- "Record First Action" button (Primary) — opens Create mode

### 5.4. Action Form: Create Mode

**Trigger:**
- "Record Action" button at top of Actions Taken section
- OR "Record First Action" button in empty state

**Layout:**
- Modal dialog (recommended) or inline form above actions list
- Modal: centered, max-width 700px, white background, rounded corners

**Modal/Form Header:**
- Title: "Record Action Taken" (H3)
- Close button (X icon, top-right)

**Form Fields:**

1. **Action Description** (required)
   - Label: "Action Description" with red asterisk
   - Input: Textarea, 4 rows, max 2000 chars
   - Placeholder: "Describe what action was taken to address this ticket..."
   - Validation: 10–2000 characters required
   - Helper text: "Provide a clear description of the action taken (10-2000 characters)"
   - Character counter: "X / 2000 characters"

2. **Result** (required)
   - Label: "Result" with red asterisk
   - Input: Textarea, 4 rows, max 2000 chars
   - Placeholder: "Describe the outcome or result of this action..."
   - Validation: 10–2000 characters required
   - Helper text: "Describe the result or outcome of the action (10-2000 characters)"
   - Character counter: "X / 2000 characters"

3. **Follow-Up Required** (optional)
   - Label: "Follow-Up Required"
   - Input: Checkbox
   - Helper text: "Check if this action requires follow-up before ticket can be resolved"
   - Default: unchecked

4. **Follow-Up Note** (conditionally required)
   - Label: "Follow-Up Note" with red asterisk (appears only if Follow-Up Required is checked)
   - Input: Textarea, 3 rows, max 500 chars
   - Placeholder: "Explain what follow-up is needed..."
   - Validation: 10–500 characters required when followUpRequired=true
   - Helper text: "Describe the required follow-up (10-500 characters)"
   - Character counter: "X / 500 characters"
   - Display: Field appears/disappears dynamically when checkbox is toggled

5. **Attachment Notes** (optional)
   - Label: "Attachment Notes"
   - Input: Textarea, 2 rows, max 500 chars
   - Placeholder: "Optional notes about any ticket attachments relevant to this action..."
   - Validation: 0–500 characters
   - Helper text: "Optional notes about ticket attachments (max 500 characters)"
   - Character counter: "X / 500 characters"

**Form Actions:**
- **Record Action** button (Primary) — submits form
  - Busy state: "Recording..." with spinner, disabled
- **Cancel** button (Secondary) — closes form without saving

### 5.5. Action Form: Edit Mode

**Trigger:**
- Clicking "Edit" button on an existing action (only visible to performer within 24 hours)

**Layout:**
- Same as Create mode (modal or inline form)

**Modal/Form Header:**
- Title: "Edit Action" (H3)

**Form Fields:**
- All fields pre-filled with existing action data
- Same validation rules as Create mode

**Form Actions:**
- **Update Action** button (Primary) — submits updated form
  - Busy state: "Updating..." with spinner, disabled
- **Cancel** button (Secondary) — closes form without saving changes

### 5.6. Action Form: Read-Only View (Non-Performer or > 24 Hours)

**Trigger:**
- Clicking "Edit" button as a non-performer, OR
- Attempting to edit an action > 24 hours old

**Layout:**
- Same modal/form structure but all fields are read-only

**Visual Indicators:**
- All fields have Warm Ivory background
- No editable borders
- All fields are disabled
- Message at top: "You cannot edit this action" with explanation:
  - "Only the performer can edit their own actions"
  - OR "Actions cannot be edited after 24 hours"

**Form Actions:**
- **Close** button only (no Save/Update button)

### 5.7. States

**Initial (Create Mode):**
- Empty fields
- Follow-Up Note field hidden
- Record Action button enabled

**Validating:**
- Per-field validation messages appear on blur or submit
- Red border and error message below invalid fields

**Busy (Submitting):**
- Record/Update button shows spinner and disabled
- All form fields disabled

**Success:**
- Success banner: "Action recorded successfully" or "Action updated successfully"
- Form closes (if modal) or clears (if inline)
- Actions list updates to show new/updated action
- Page scrolls to show the new/updated action

**Error:**
- Error banner at top of form: "Unable to record action. Please try again." (with specific error details if available)
- Form fields remain enabled
- Focus returns to first invalid field

### 5.8. Resolution Blocking Indicator

**Location:**
- Near the "Resolve Ticket" button (or status transition dropdown) in IT Staff Ticket Detail screen

**Indicator:**
- When any action has followUpRequired=true:
  - Warning banner (amber background): "This ticket has unresolved follow-up actions. All follow-ups must be completed before the ticket can be resolved."
  - "Resolve" button is disabled
  - Tooltip on disabled button: "Complete all follow-up actions first"
- When all actions have followUpRequired=false:
  - No warning banner
  - "Resolve" button is enabled

---

## 6. Responsive Behavior

### 6.1. Requester Dashboard Responsive Breakpoints

**Desktop (≥ 992px):**
- 4-column grid (or 2×2)
- Cards have fixed max-width to prevent stretching
- Gap: 24px

**Tablet (768px – 991px):**
- 2-column grid (2×2)
- Cards adjust width to fill container
- Gap: 20px

**Mobile (< 768px):**
- Single column (4×1)
- Cards full-width with horizontal padding
- Gap: 16px
- Card counts remain large (36px)

### 6.2. IT Staff Dashboard Responsive Breakpoints

**Desktop (≥ 992px):**
- First 4 cards: 3-column grid (or 2-2 layout)
- Breakdown cards: 2-column grid below
- Gap: 24px

**Tablet (768px – 991px):**
- 2-column grid throughout
- Breakdown cards stack below metric cards
- Gap: 20px

**Mobile (< 768px):**
- Single column
- All cards full-width
- Breakdown cards expand to show all categories
- Gap: 16px

### 6.3. Action Form Responsive Behavior

**Desktop (≥ 992px):**
- Modal: 700px max-width, centered
- Fields: full-width within modal
- Buttons: inline (Cancel | Record Action)

**Tablet (768px – 991px):**
- Modal: 90% viewport width, centered
- Fields: full-width
- Buttons: inline or stacked if space constrained

**Mobile (< 768px):**
- Modal: full-width with small horizontal padding (or bottom sheet style)
- Fields: full-width, increased touch-friendly spacing
- Buttons: stacked full-width (Record Action above Cancel)
- Textareas: min-height increased for easier typing

---

## 7. Accessibility Requirements

### 7.1. Dashboard Cards

- Each card is keyboard-accessible (Tab to focus, Enter/Space to activate)
- Cards have `role="button"` or are wrapped in `<a>` tags
- Card counts have `aria-label` describing the metric (e.g., "5 tickets waiting for you")
- Hover and focus states are visually distinct

### 7.2. Action Form

- All form fields have associated `<label>` elements
- Required fields have `aria-required="true"`
- Validation error messages have `role="alert"` and `aria-live="polite"`
- Error messages are linked to fields via `aria-describedby`
- Follow-Up Note field appearance/disappearance is announced to screen readers
- Character counters are `aria-live="polite"` regions

### 7.3. Actions List

- Each action card has semantic heading for performer/date (H4 or H5)
- Edit button has accessible label (e.g., "Edit action recorded on September 14")
- Disabled Edit button has tooltip and `aria-label` explaining why

### 7.4. Resolution Blocking Indicator

- Warning banner has `role="alert"` to announce to screen readers
- Disabled Resolve button has `aria-disabled="true"` and tooltip

---

## 8. Visual Design Checklist

**Dashboard Cards:**
- [ ] Cards have white background with Light Gray-Green border
- [ ] Hover state shows slight elevation (shadow) and Secondary Green border
- [ ] Counts are bold 36px Primary Green
- [ ] Labels are 16px Dark Charcoal-Green
- [ ] Icons (if used) are 32px Primary Green
- [ ] Cards maintain equal height within each row

**Action Form:**
- [ ] Editable fields: white background, Light Gray-Green border
- [ ] Read-only fields (Edit mode, non-performer): Warm Ivory background
- [ ] Invalid fields: Dark Red 2px border with error message below
- [ ] Required field labels have red asterisk
- [ ] Character counters update dynamically
- [ ] Follow-Up Note field appears/disappears smoothly (no jarring layout shift)

**Actions List:**
- [ ] Actions displayed in chronological order (oldest first)
- [ ] Performer name and role badge clearly visible
- [ ] Date/time formatted consistently and readably
- [ ] Follow-Up Required badge is amber with white text
- [ ] Edit button only visible to performer within 24 hours
- [ ] Disabled Edit button has muted appearance and tooltip

**Resolution Blocking:**
- [ ] Warning banner uses amber background (#F59E0B with opacity)
- [ ] Banner text is Dark Charcoal-Green
- [ ] Disabled Resolve button is visually muted (Light Gray-Green)
- [ ] Tooltip explains why button is disabled

---

## 9. Navigation Flow Diagrams

### 9.1. Requester Navigation Flow

```
Login → Password Change (if required) → Requester Dashboard
  ↓
[Dashboard Cards]
  Total Open → My Tickets (default view)
  Waiting for Me → My Tickets (filtered by status=WAITING_FOR_REQUESTER)
  Recently Updated → My Tickets (sorted by updatedAt, last 7 days)
  Recently Resolved → My Tickets (filtered by status=RESOLVED, last 30 days)

Navigation Bar: Dashboard | My Tickets | Create Ticket
```

### 9.2. IT Staff Navigation Flow

```
Login → Password Change (if required) → IT Staff Dashboard
  ↓
[Dashboard Cards]
  Unassigned → Ticket Queue (filtered by itStaffId=null)
  My Assigned → Ticket Queue (filtered by itStaffId=current user)
  Recently Updated → Ticket Queue (sorted by updatedAt, last 7 days)
  High Priority Unresolved → Ticket Queue (filtered by HIGH + unresolved)
  By Status → Ticket Queue (filtered by selected status)
  By Priority → Ticket Queue (filtered by selected priority)
  ↓
Ticket Queue → Ticket Detail
  ↓
[Actions Taken Section]
  Record Action → Action Form (Create mode) → Actions List updated
  Edit Action (own, < 24 hours) → Action Form (Edit mode) → Actions List updated
  Edit Action (other's or > 24 hours) → Read-only view

Navigation Bar: Dashboard | Ticket Queue
```

### 9.3. Administrator Navigation Flow

```
Same as IT Staff, with additional access:
Navigation Bar: Dashboard | Ticket Queue | User Management
```

---

## 10. Error Messages and Validation Feedback

### 10.1. Action Form Validation Messages

| Field | Condition | Error Message |
|-------|-----------|---------------|
| Action Description | Empty | "Action description is required" |
| Action Description | < 10 chars | "Action description must be at least 10 characters" |
| Action Description | > 2000 chars | "Action description cannot exceed 2000 characters" |
| Result | Empty | "Result is required" |
| Result | < 10 chars | "Result must be at least 10 characters" |
| Result | > 2000 chars | "Result cannot exceed 2000 characters" |
| Follow-Up Note | Empty when followUpRequired=true | "Follow-up note is required when follow-up is needed" |
| Follow-Up Note | < 10 chars when provided | "Follow-up note must be at least 10 characters" |
| Follow-Up Note | > 500 chars | "Follow-up note cannot exceed 500 characters" |
| Attachment Notes | > 500 chars | "Attachment notes cannot exceed 500 characters" |

### 10.2. Action Form API Error Messages

| Error | User-Facing Message |
|-------|---------------------|
| 403 Forbidden (non-IT Staff) | "Only IT Staff can record actions on tickets" |
| 403 Forbidden (editing other's action) | "You can only edit your own actions" |
| 403 Forbidden (editing > 24 hours old) | "Actions cannot be edited after 24 hours" |
| 404 Not Found (ticket) | "Ticket not found. Please refresh and try again." |
| 404 Not Found (action) | "Action not found. It may have been deleted." |
| 409 Conflict (resolution blocked) | "This ticket cannot be resolved because it has unresolved follow-up actions. Please complete all follow-ups first." |
| 500 Server Error | "Unable to record action. Please try again later." |

### 10.3. Dashboard Error Messages

| Error | User-Facing Message |
|-------|---------------------|
| 403 Forbidden (wrong role) | "You do not have permission to view this dashboard" |
| 500 Server Error | "Unable to load dashboard data. Please try again." |
| Network Error | "Unable to connect to the server. Please check your connection and try again." |

---

## 11. Definition of Done for UI Implementation

- [ ] All Lab 4 screens are implemented and visually consistent with Labs 2-3 Zen Green design
- [ ] Requester Dashboard displays all 4 cards correctly at desktop, tablet, mobile viewports
- [ ] IT Staff Dashboard displays all 6 cards correctly at desktop, tablet, mobile viewports
- [ ] Dashboard cards are clickable and navigate to correct filtered views
- [ ] Dashboard cards show loading, loaded, empty (zero counts), and error states correctly
- [ ] Actions Taken section appears in IT Staff Ticket Detail screen
- [ ] Action Form (Create mode) validates all fields correctly
- [ ] Action Form (Edit mode) pre-fills data and validates correctly
- [ ] Action Form shows read-only view for non-performers or > 24 hours old actions
- [ ] Follow-Up Note field appears/disappears dynamically when checkbox is toggled
- [ ] Character counters update in real-time
- [ ] Resolution blocking indicator appears when followUpRequired=true exists
- [ ] Actions list displays all actions in chronological order
- [ ] Edit button is visible only to performer within 24 hours
- [ ] All validation error messages appear below relevant fields
- [ ] All success/error banners display correctly
- [ ] All responsive breakpoints tested and verified via Playwright screenshots
- [ ] All accessibility requirements verified (keyboard navigation, screen reader labels, focus states)
- [ ] All colors, typography, and component styles match Zen Green design system
- [ ] No console errors or warnings in browser developer tools
- [ ] All navigation flows work correctly (dashboard → filtered views → ticket detail → actions)
