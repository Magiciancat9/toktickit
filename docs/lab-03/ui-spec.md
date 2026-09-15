# Lab 3 UI Specification

## 1. Design System: Zen Green (Continued from Lab 2)

Lab 3 extends the Zen Green design language established in Lab 2. All new screens must be visually consistent with existing Lab 2 interfaces.

### 1.1. Color Palette

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Primary Green | #006B3C | App header background, primary buttons |
| Secondary Green | #0B7A46 | Active navigation, hover states |
| Pale Green | #EAF6EF | Success backgrounds, selected states |
| Dark Charcoal-Green | #2C3E37 | Body text |
| Warm Ivory | #F9F9F7 | Read-only field backgrounds |
| Light Gray-Green | #E0E6E3 | Borders, disabled states |
| Page Background | #F5F7F6 | Main page background |
| White | #FFFFFF | Card backgrounds, editable fields |
| Dark Red | #C41E3A | Validation errors, destructive actions |
| Amber | #F59E0B | Medium priority, warning states |
| Blue | #3B82F6 | Info, Low priority |
| Teal | #14B8A6 | Success states, Resolved status |
| Purple | #8B5CF6 | Administrator role, Waiting status |
| Gray | #6B7280 | Closed status, inactive states |

### 1.2. Typography

- **Font Family:** System font stack: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
- **Headings:** Semi-bold (600), Dark Charcoal-Green
- **Body Text:** Regular (400), 16px base, Dark Charcoal-Green
- **Labels:** Medium (500), 14px, Dark Charcoal-Green
- **Helper Text:** Regular (400), 13px, medium gray

### 1.3. Component Conventions

**Buttons:**
- **Primary:** Solid Primary Green background, white text, rounded corners (4px), min-height 40px
- **Secondary:** Outlined (2px Secondary Green border), Secondary Green text, white background
- **Destructive:** Solid Dark Red background, white text
- **Disabled:** Light Gray-Green background, muted text, not clickable
- **Busy:** Primary color with spinner/loading text, disabled

**Form Fields:**
- **Editable:** White background, 1px Light Gray-Green border, 8px padding, rounded corners (4px)
- **Read-only:** Warm Ivory background, 1px Light Gray-Green border, visually distinct from editable
- **Invalid:** Dark Red 2px border, error message immediately below field in Dark Red
- **Focused:** 2px Secondary Green border, visible focus ring
- **Disabled:** Light Gray-Green background, muted text

**Badges:**
- Small rounded pill shape, 6px vertical padding, 12px horizontal padding, semi-bold text
- **Priority Low:** Blue background, white text
- **Priority Medium:** Amber background, white text
- **Priority High:** Dark Red background, white text
- **Status NEW:** Primary Green background, white text
- **Status OPEN:** Blue background, white text
- **Status IN_PROGRESS:** Amber background, white text
- **Status WAITING_FOR_REQUESTER:** Purple background, white text
- **Status RESOLVED:** Teal background, white text
- **Status CLOSED:** Gray background, white text
- **Status REOPENED:** Secondary Green background, white text
- **Status CANCELLED:** Dark Red background, white text
- **Role Requester:** Blue background, white text
- **Role IT Staff:** Primary Green background, white text
- **Role Administrator:** Purple background, white text

**Cards:**
- White background, 1px Light Gray-Green border, 8px border-radius, subtle shadow (0 2px 4px rgba(0,0,0,0.05))

---

## 2. Updated Application Shell

### 2.1. Top Navigation Bar

**Layout:**
- Full-width horizontal bar
- Background: Primary Green (#006B3C)
- Height: 64px
- Fixed position (stays at top on scroll)

**Left Section:**
- TokTickIT logo/icon (white)
- "TokTickIT" title text (white, semi-bold, 20px)

**Center Section (Desktop):**
- Role-specific navigation links (white text, 16px)
- Active page: underlined with Secondary Green or Pale Green background
- Hover: Secondary Green background

**Navigation by Role:**
- **Requester:** My Tickets | Create Ticket
- **IT Staff:** Ticket Queue
- **Administrator:** User Management

**Right Section:**
- Authenticated user display:
  - User name (white text, 14px, semi-bold)
  - Role badge (small, inline)
- Logout button (Secondary button style with white text/border)

**Mobile (< 768px):**
- Hamburger menu icon (white) replaces center navigation
- Drawer opens with navigation links stacked vertically
- User info and Logout at bottom of drawer

### 2.2. Remove Development Requester Selector

- **Lab 2 Behavior (REMOVED):** RequesterSelector screen, "Change Requester" button in app shell
- **Lab 3 Behavior:** No Requester selection. Authenticated user identity is used automatically.

---

## 3. Login Screen

### 3.1. Layout

**Desktop:**
- Centered card on Pale Green (#EAF6EF) full-page background
- Card: max-width 400px, white background, rounded corners, shadow

**Tablet/Mobile:**
- Same centered card, full viewport width on mobile with horizontal padding

### 3.2. Content

**Card Header:**
- TokTickIT logo/icon (Primary Green)
- "Sign in to your account" heading (H2, Dark Charcoal-Green)

**Form Fields:**
- **Email Address** (required)
  - Label: "Email address"
  - Input type: email
  - Placeholder: "name@example.com"
  - Validation: required, valid email format
- **Password** (required)
  - Label: "Password"
  - Input type: password
  - Placeholder: "••••••••"
  - Show/hide password toggle icon (eye icon)
  - Validation: required

**Actions:**
- **Sign In button** (Primary, full-width)
  - Default: "Sign In"
  - Busy state: "Signing in..." with spinner, disabled
- (No "Forgot Password" link — excluded from Lab 3)

### 3.3. States

**Initial:**
- Empty fields
- Sign In button enabled

**Validating:**
- Per-field validation messages appear on blur or submit attempt
- "Email address is required"
- "Password is required"
- "Please enter a valid email address"

**Busy (Submitting):**
- Sign In button shows spinner and "Signing in...", disabled
- Form fields disabled

**Error (Invalid Credentials or Inactive Account):**
- Error banner at top of card: "Invalid email or password. Please try again."
- Banner: soft red background, dark red border, dark red text
- Form fields remain enabled
- Error is generic (does not reveal whether email exists or account is inactive)

**Success:**
- Brief success message (optional) or immediate redirect to appropriate landing page based on role

---

## 4. Change Password Screen (Mandatory First Login)

### 4.1. Layout

**Desktop:**
- Centered card on Pale Green background
- Card: max-width 500px, white background

**Tablet/Mobile:**
- Same centered card, responsive width

### 4.2. Content

**Card Header:**
- "Change Your Password" heading (H2)
- Explanatory text: "You must change your password to continue." (14px, medium gray)

**Form Fields:**
- **Current (temporary) password** (required)
  - Label: "Current (temporary) password"
  - Input type: password with show/hide toggle
- **New password** (required)
  - Label: "New password"
  - Input type: password with show/hide toggle
- **Confirm new password** (required)
  - Label: "Confirm new password"
  - Input type: password with show/hide toggle

**Password Requirements Display:**
- Checklist shown below New password field:
  - ✓ At least 8 characters
  - ✓ Include upper and lower case letters
  - ✓ Include a number and a special character
- Checkmarks turn green as requirements are met; remain gray if not met

**Actions:**
- **Continue button** (Primary, full-width)
  - Disabled until all validation passes
  - Busy state: "Saving..." with spinner

### 4.3. States

**Initial:**
- Empty fields
- Requirements checklist gray
- Continue button disabled

**Validating:**
- Real-time validation as user types in New password field
- Requirements checklist updates (gray → green checkmarks)
- Per-field validation messages:
  - "Current password is required"
  - "New password does not meet requirements"
  - "Passwords do not match"

**Busy:**
- Continue button shows spinner, disabled
- Fields disabled

**Error:**
- "Current password is incorrect" if validation fails
- Generic API error: "Unable to change password. Please try again."

**Success:**
- Brief success message: "Password changed successfully."
- Automatic redirect to normal application (role-appropriate landing page)

---

## 5. Requester Screens (Updated from Lab 2)

### 5.1. My Tickets Screen

**Changes from Lab 2:**
- Remove "Change Requester" button
- Otherwise identical to Lab 2: search, filter (Category, Requested Priority, Status), sort, pagination, table/cards

**Preserved Lab 2 Behavior:**
- Ticket list shows only authenticated Requester's tickets
- Search by Ticket Number and Summary (case-insensitive)
- Filter dropdowns for Category, Requested Priority, Current Status
- Sort by Created Date, Last Updated (asc/desc toggle)
- Pagination (10/25/50 per page)
- Loading, empty ("No tickets yet"), no-results ("No tickets match filters"), error states
- Responsive: table on desktop, cards on tablet/mobile

### 5.2. Create Ticket Screen

**Changes from Lab 2:**
- Remove "Change Requester" button
- Requester field: read-only, shows authenticated user's name and role badge

**Preserved Lab 2 Behavior:**
- System fields: Ticket Number (placeholder "Will be assigned"), Ticket Date (placeholder "Will be set on submission")
- Classification: Category (dropdown), Related System (dropdown), Requested Priority (dropdown)
- Ticket Summary (single-line text, required, 5–150 chars)
- Description (textarea, required, 10–2000 chars)
- Attachments section: file upload (max 5 MB, allowed types: JPG, PNG, WEBP, PDF)
- Submit button (Primary, shows busy state)
- Cancel/Reset button (Secondary)
- Success state: green banner with Ticket Number and "View Ticket" link
- Field-level validation messages below relevant fields

### 5.3. Requester Ticket Detail Screen

**Changes from Lab 3:**
- Add **Public Comments section** below Attachments
- Add **"Problem Appears Resolved" checkbox/button**

**Public Comments Section:**
- Heading: "Public Comments" (H4)
- List of comments in chronological order (oldest first or newest first — consistent with design choice)
- Each comment card:
  - Author name and role badge (e.g., "Jennifer Anderson" with blue "Requester" badge or "Michael Brown" with green "IT Staff" badge)
  - Timestamp (e.g., "May 13, 2025 10:30 AM")
  - Comment content (text, up to 2000 chars, line breaks preserved)
- **Add Public Comment:**
  - Textarea (placeholder: "Type your comment here...")
  - Character count indicator (e.g., "0 / 2000")
  - "Post Comment" button (Primary)
  - Validation: non-empty, max 2000 chars
  - Busy state: "Posting..." with spinner
  - Success: new comment appears in list
- Empty state: "No comments yet."

**Problem Appears Resolved:**
- Checkbox or toggle: "I believe this problem is resolved"
- Explanation text: "This will notify IT Staff, but does not formally close the ticket."
- On check: API call sets `problemResolvedByRequester = true`
- Visual indicator if already checked (e.g., green checkmark icon)

**Preserved Lab 2 Behavior:**
- All ticket fields displayed as read-only: Ticket Number, Ticket Date, Requester, Category, Related System, Requested Priority, Current Status, Summary, Description
- Attachments section: list active attachments with Download button; show removed attachments as grayed metadata with removal reason
- Add Attachment button (Secondary)
- Remove Attachment button per active attachment (Destructive), requires reason in modal

**Note:** Requester does NOT see Internal Notes section. If Requester somehow calls the Internal Notes endpoint, the backend returns 403.

---

## 6. IT Staff Ticket Queue Screen

### 6.1. Layout

**Desktop:**
- Page title: "Ticket Queue" (H2, top left)
- Search bar (top center/right)
- Filter row below title/search
- Ticket table
- Pagination controls at bottom

**Tablet:**
- Same layout, filters may wrap to multiple rows

**Mobile:**
- Title, search, filters stack vertically
- Table becomes card layout

### 6.2. Search & Filters

**Search Bar:**
- Placeholder: "Search by ticket number or summary..."
- Magnifying glass icon
- Clears filters when search is active (or search combines with filters — design choice)

**Filter Row:**
- **Category** dropdown (All / Account and Access / Hardware / Software / Network)
- **Requested Priority** dropdown (All / Low / Medium / High)
- **IT Priority** dropdown (All / Low / Medium / High)
- **Current Status** dropdown (All / New / Open / In Progress / Waiting for Requester / Resolved / Closed / Reopened / Cancelled)
- **Assignment** dropdown:
  - All
  - Unassigned
  - Assigned to Me
  - Assigned to Others
- **Clear Filters** link (Secondary text button)

**Sort Controls:**
- Sort by dropdown: Created Date / Last Updated / IT Priority
- Sort order toggle: Ascending / Descending
- Default: IT Priority descending, then Created Date descending

### 6.3. Ticket Table (Desktop)

**Columns:**
1. Ticket No. (link, Primary Green)
2. Created Date (short format: "May 13, 2025")
3. Summary (truncated to ~50 chars with ellipsis)
4. Category (text or small badge)
5. Req. Priority (badge: Low/Medium/High)
6. IT Priority (badge: Low/Medium/High)
7. Status (badge: New/Open/In Progress/etc.)
8. Owner (name or "Unassigned", small text)
9. Last Updated (short format)
10. Action: "Open" button (Secondary, small)

**Table Styling:**
- Header row: Light Gray-Green background, semi-bold text
- Row hover: Pale Green background
- Alternating row colors (optional, light striping)

### 6.4. Ticket Cards (Tablet/Mobile)

**Card per ticket:**
- **Top row:** Ticket Number (bold, Primary Green link) | Status badge
- **Second row:** Summary (truncated, 2 lines max)
- **Third row:** Category | Req. Priority badge | IT Priority badge
- **Fourth row:** Owner: [name or Unassigned] | Created: [date]
- **Bottom:** "Open" button (Secondary, small)

### 6.5. Pagination

- "Showing 1 to 10 of 87 tickets"
- Page buttons: Previous | 1 | 2 | 3 | ... | 9 | Next
- Current page highlighted in Primary Green
- Page size dropdown: 10 / 25 / 50

### 6.6. States

**Loading:**
- Spinner or skeleton rows

**Empty (No Tickets Exist):**
- Illustration or icon
- Message: "No tickets have been created yet."

**No Results (Filters/Search Return Nothing):**
- Message: "No tickets match your search and filters."
- "Clear Filters" button

**Error:**
- Safe error message: "Unable to load tickets. Please try again."

---

## 7. IT Staff Ticket Detail Screen

### 7.1. Layout

**Breadcrumb:**
- "Ticket Queue > TKT-2026-000042" (links to queue)

**Three Main Sections:**
1. **Ticket Information** (read-only)
2. **Operational Controls** (editable by IT Staff/Admin)
3. **Communications** (Public Comments and Internal Notes)

### 7.2. Ticket Information Section (Read-Only)

**Display as read-only fields with Warm Ivory background:**
- Ticket Number
- Ticket Date
- Requester (name with Requester role badge)
- Category
- Related System
- Requested Priority (badge, read-only)
- Summary
- Description (multiline, preserved line breaks)

### 7.3. Operational Controls Section (Editable)

**Displayed in a distinct card or bordered section:**

**Ticket Owner:**
- Label: "Ticket Owner"
- Dropdown: "Unassigned" / [list of active IT Staff and Administrator users]
- "Save" button (Primary, small) next to dropdown
- Current value highlighted
- On save: API call updates ownerId
- Busy state: "Saving..." on button

**IT Priority:**
- Label: "IT Priority"
- Dropdown: Low / Medium / High
- "Save" button next to dropdown
- Badges for visual clarity
- On save: API call updates itPriority

**Current Status:**
- Label: "Current Status"
- Dropdown: shows only permitted next statuses based on transition matrix (e.g., if current status is NEW, dropdown shows: Open, Cancelled)
- "Change Status" button (Primary, small)
- Confirmation modal for certain transitions (e.g., Resolved, Closed, Cancelled): "Are you sure you want to change status to Resolved?"
- On confirm: API call updates status
- Error if invalid transition attempted (should not happen if dropdown is correctly filtered, but backend validates)

### 7.4. Attachments Section

**Same as Requester view but read-only for IT Staff:**
- List active attachments: filename, size, upload date, Download button
- Show removed attachments as grayed metadata with removal reason
- **No "Add Attachment" button** (IT Staff cannot add attachments in Lab 3)

### 7.5. Public Comments Section

**Heading:** "Public Comments" (H4)
- Explanation: "Visible to the Requester, IT Staff, and Administrator."
- List of comments (chronological order)
- Each comment card:
  - Author name and role badge
  - Timestamp
  - Content
- **Add Public Comment:**
  - Textarea
  - Character count: "0 / 2000"
  - "Post Comment" button (Primary)
  - Validation: non-empty, max 2000 chars
  - Success: new comment appears

### 7.6. Internal Notes Section

**Heading:** "Internal Notes" (H4, distinct styling — e.g., yellow/amber icon or background hint)
- Explanation: "Visible only to IT Staff and Administrator. Not visible to Requester."
- Visual distinction: light yellow background tint on section, or amber border
- List of notes (chronological order)
- Each note card:
  - Author name and role badge (IT Staff or Administrator)
  - Timestamp
  - Content
  - **Important:** Distinct card styling (e.g., light yellow background, amber left border) to prevent accidental confusion with Public Comments
- **Add Internal Note:**
  - Textarea with distinct placeholder: "Add a private internal note (not visible to Requester)..."
  - Character count: "0 / 2000"
  - "Post Internal Note" button (Secondary or distinct color)
  - Validation: non-empty, max 2000 chars
  - Success: new note appears

**Warning Label:**
- "⚠️ Internal Notes are private. Requesters cannot see these notes."

### 7.7. Actions

**Bottom of page:**
- "Back to Queue" link (Secondary button or text link)

---

## 8. Administrator User Management Screen

### 8.1. Layout

**Desktop:**
- Page title: "User Management" (H2, top left)
- "Create User" button (Primary, top right)
- Search bar and Role filter below title
- User list table
- (No pagination in Lab 3 — all users loaded)

**Tablet/Mobile:**
- Title, button, search, filter stack vertically
- Table becomes card layout

### 8.2. Search & Filter

**Search Bar:**
- Placeholder: "Search by name or email..."
- Magnifying glass icon

**Role Filter:**
- Dropdown: All / Requester / IT Staff / Administrator

### 8.3. User Table (Desktop)

**Columns:**
1. Name (text, semi-bold)
2. Email (text)
3. Role (badge: Requester/IT Staff/Administrator)
4. Status (badge: Active=green "Active" / Inactive=gray "Inactive")
5. Edit (button: "Edit", Secondary, small)

**Table Styling:**
- Same as Ticket Queue table

### 8.4. User Cards (Tablet/Mobile)

**Card per user:**
- **Top row:** Name (bold) | Status badge
- **Second row:** Email
- **Third row:** Role badge
- **Bottom:** "Edit" button (Secondary, small)

### 8.5. Create User (Modal or Side Panel)

**Trigger:** "Create User" button

**Modal/Panel Content:**
- Heading: "Create New User"
- **Full Name** (text input, required)
- **Email Address** (email input, required, validated format)
- **Role** (dropdown: Requester / IT Staff / Administrator, required)
- **Active** (toggle switch, default: ON)
- **Initial Password** (password input with show/hide toggle, required)
  - Validation: must meet password rules (8+ chars, upper/lower/number/special)
  - Confirmation: "User will be required to change this password on first login."
- **Actions:**
  - "Save User" button (Primary)
  - "Cancel" button (Secondary)

**States:**
- **Validating:** Per-field validation messages below fields
- **Busy:** "Saving..." spinner on Save button
- **Error (Duplicate Email):** Error message: "A user with this email already exists."
- **Error (General):** "Unable to create user. Please try again."
- **Success:** Modal closes, user list refreshes, success toast: "User [name] created successfully."

### 8.6. Edit User (Modal or Side Panel)

**Trigger:** "Edit" button on user row

**Modal/Panel Content:**
- Heading: "Edit User: [Name]"
- **Full Name** (text input, editable)
- **Email Address** (email input, editable)
- **Role** (dropdown: Requester / IT Staff / Administrator, editable)
- **Active** (toggle switch, editable with safety checks)
  - If user tries to deactivate their own account: disabled with tooltip "You cannot deactivate your own account."
  - If user tries to deactivate the last active Administrator: error on save "Cannot deactivate the last active Administrator."
- **Set New Initial Password** section:
  - Button: "Set New Initial Password" (Secondary)
  - Clicking opens password input field below
  - New password input (password type, validated)
  - Confirmation text: "User will be required to change this password on next login."
  - "Save New Password" button (Primary, small)
- **Actions:**
  - "Save Changes" button (Primary)
  - "Cancel" button (Secondary)

**States:**
- **Validating:** Per-field validation
- **Busy:** "Saving..." spinner
- **Error (Duplicate Email):** "This email is already in use by another user."
- **Error (Last Admin):** "Cannot deactivate the last active Administrator."
- **Error (Self-Deactivation):** "You cannot deactivate your own account."
- **Success:** Modal closes, user list refreshes, success toast: "User [name] updated successfully."

---

## 9. Component State Reference

### 9.1. Form Field States

| State | Background | Border | Text | Cursor | Example |
|-------|------------|--------|------|--------|---------|
| Editable (default) | White | 1px Light Gray-Green | Dark Charcoal-Green | text | Normal input |
| Focused | White | 2px Secondary Green | Dark Charcoal-Green | text | Active input |
| Read-only | Warm Ivory | 1px Light Gray-Green | Dark Charcoal-Green | default | Ticket Number on detail |
| Invalid | White | 2px Dark Red | Dark Charcoal-Green | text | Required field left blank |
| Disabled | Light Gray-Green | 1px Light Gray-Green | Medium Gray | not-allowed | Disabled button |

### 9.2. Button States

| State | Background | Text Color | Border | Cursor | Example |
|-------|------------|------------|--------|--------|---------|
| Primary (default) | Primary Green | White | None | pointer | Submit, Save |
| Primary (hover) | Secondary Green | White | None | pointer | — |
| Primary (busy) | Primary Green (opacity 80%) | White | None | not-allowed | "Saving..." with spinner |
| Secondary (default) | White | Secondary Green | 2px Secondary Green | pointer | Cancel, Back |
| Secondary (hover) | Pale Green | Secondary Green | 2px Secondary Green | pointer | — |
| Destructive (default) | Dark Red | White | None | pointer | Remove Attachment |
| Destructive (hover) | Darker Red | White | None | pointer | — |
| Disabled | Light Gray-Green | Medium Gray | None | not-allowed | Grayed-out button |

### 9.3. Screen States

| State | Visual | Example |
|-------|--------|---------|
| Loading | Spinner or skeleton elements | Ticket Queue loading |
| Empty (Initial) | Illustration, message, call-to-action | "No tickets yet. Create your first ticket." |
| No Results (After Filter/Search) | Message, "Clear Filters" link | "No tickets match your filters." |
| Error (API Failure) | Error icon, safe generic message, "Try Again" button | "Unable to load tickets. Please try again." |
| Success (After Action) | Green banner or toast, success icon | "Ticket created successfully! TKT-2026-000042" |
| Forbidden (403) | "Access Denied" message | "You do not have permission to view this page." |

---

## 10. Responsive Behavior

### 10.1. Breakpoints

- **Desktop:** ≥ 992px
- **Tablet:** 768px – 991px
- **Mobile:** < 768px

### 10.2. Layout Rules

**Desktop:**
- Multi-column layouts where appropriate
- Tables for lists (Ticket Queue, My Tickets, User Management)
- Centered content with max-width 1200px

**Tablet:**
- Two-column layouts where practical
- Tables may reduce columns (hide less critical columns like Last Updated)
- Forms remain two-column if space allows

**Mobile:**
- Single-column stack for all forms
- Lists become cards (Ticket Queue, My Tickets, User Management)
- Navigation collapses to hamburger menu
- Buttons full-width or stacked vertically
- Min touch target: 44px height

### 10.3. Specific Screen Adaptations

**Login / Change Password:**
- Card is full-width with horizontal padding on mobile

**My Tickets / Ticket Queue:**
- Table → Card layout on mobile
- Filters stack vertically
- Search bar full-width

**Ticket Detail:**
- All sections stack vertically
- Operational controls (Owner, Priority, Status) stack
- Comments/Notes remain single column

**User Management:**
- Table → Card layout on mobile
- Create/Edit User modal becomes full-screen on mobile

---

## 11. Accessibility Requirements

- **Keyboard Navigation:** All interactive elements must be keyboard-accessible (Tab, Enter, Escape)
- **Focus Indicators:** Visible focus ring (2px Secondary Green outline) on all focusable elements
- **Labels:** All form inputs have associated `<label>` elements
- **ARIA Attributes:**
  - Error messages linked via `aria-describedby`
  - Live regions for dynamic content (e.g., `aria-live="polite"` for success toasts)
  - Modal dialogs use `role="dialog"` and `aria-modal="true"`
  - Buttons with only icons have `aria-label`
- **Color Contrast:** All text meets WCAG AA contrast requirements (4.5:1 for normal text, 3:1 for large text)
- **Alt Text:** All informational images have descriptive alt text; decorative images use `alt=""`
- **Screen Reader Announcements:** Status changes, form validation errors, and success messages are announced

---

## 12. Visual Checklist for Lab 3

To be completed during implementation and visual inspection:

**Authentication Screens:**
- [ ] Login and Change Password screens use Zen Green color palette
- [ ] Password fields have show/hide toggle
- [ ] Validation messages appear below relevant fields in Dark Red
- [ ] Buttons show busy state with spinner during API calls
- [ ] Error messages are safe and generic ("Invalid email or password")

**Application Shell:**
- [ ] Authenticated user name and role badge displayed in top-right
- [ ] Role-specific navigation links shown (Requester: My Tickets, Create Ticket; IT Staff: Ticket Queue; Admin: User Management)
- [ ] Active page highlighted with Secondary Green
- [ ] Logout button visible and functional
- [ ] Mobile: hamburger menu, drawer with navigation

**Requester Screens:**
- [ ] Development Requester selector removed
- [ ] My Tickets and Create Ticket work identically to Lab 2 with authenticated identity
- [ ] Requester Ticket Detail includes Public Comments section
- [ ] Public Comments visually distinct with author, role badge, timestamp
- [ ] "Problem Appears Resolved" checkbox/button present

**IT Staff Ticket Queue:**
- [ ] Search, filters (Category, Req. Priority, IT Priority, Status, Assignment), sort, pagination all functional
- [ ] Table on desktop with all required columns
- [ ] Cards on mobile with essential info
- [ ] Badges for Priority and Status use correct colors
- [ ] "Unassigned" shown clearly for tickets without owner
- [ ] Loading, empty, no-results, error states present

**IT Staff Ticket Detail:**
- [ ] Ticket Information section read-only with Warm Ivory background
- [ ] Operational Controls section distinct (Owner, IT Priority, Status dropdowns with Save buttons)
- [ ] Status dropdown shows only permitted next statuses
- [ ] Public Comments section same as Requester view
- [ ] Internal Notes section visually distinct (light yellow background, amber border, warning label)
- [ ] Internal Notes placeholder makes privacy clear ("not visible to Requester")
- [ ] Attachments section read-only (no Add Attachment button for IT Staff)

**Administrator User Management:**
- [ ] User list table on desktop, cards on mobile
- [ ] Role badges (Requester=blue, IT Staff=green, Administrator=purple)
- [ ] Status badges (Active=green, Inactive=gray)
- [ ] Create User modal/panel with all required fields
- [ ] Edit User modal/panel with safety checks (self-deactivation disabled, last admin check)
- [ ] Password input meets password rules, shows validation
- [ ] Duplicate email error shown as 409 Conflict message
- [ ] Success toasts after create/edit

**Responsive:**
- [ ] All screens work at desktop (≥ 992px), tablet (768–991px), mobile (< 768px)
- [ ] No horizontal scroll on mobile
- [ ] Touch targets ≥ 44px on mobile
- [ ] Tables convert to cards on mobile

**Accessibility:**
- [ ] All form inputs have labels
- [ ] Focus indicators visible on all interactive elements
- [ ] Error messages linked to fields via `aria-describedby`
- [ ] Color contrast meets WCAG AA
- [ ] Modals have `role="dialog"` and `aria-modal="true"`

**Consistency:**
- [ ] All new screens use Zen Green color palette
- [ ] Badges, buttons, cards follow established conventions from Lab 2
- [ ] No visual inconsistencies between old and new screens
