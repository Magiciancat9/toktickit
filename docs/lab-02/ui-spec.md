# Lab 2 UI Specification — Zen Green Theme

---

## 1. Color Tokens

| Token | Hex Value | Usage |
|-------|-----------|-------|
| `--color-primary` | `#006B3C` | App header background, primary buttons, strong emphasis |
| `--color-secondary` | `#0B7A46` | Active nav tab underline/background, focus accents, links, hover states |
| `--color-pale-green` | `#EAF6EF` | Selected state background, success banners, subtle section emphasis |
| `--color-page-bg` | `#F5F7F6` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, form surfaces, modals |
| `--color-border` | `#D1D9D5` | Default input border, card border |
| `--color-text` | `#1A2E22` | Primary body text (dark charcoal-green, not pure black) |
| `--color-text-muted` | `#5A6E62` | Secondary/helper text, placeholder text |
| `--color-error` | `#B91C1C` | Error text and border |
| `--color-error-bg` | `#FEF2F2` | Error message background |
| `--color-warning` | `#B45309` | Warning text |
| `--color-warning-bg` | `#FFFBEB` | Warning callout background |
| `--color-success-text` | `#065F46` | Success confirmation text |
| `--color-readonly-bg` | `#F0F4F2` | Read-only field background (soft gray-green) |
| `--color-disabled-bg` | `#E5EAE7` | Disabled field background |
| `--color-disabled-text` | `#9AABA3` | Disabled field text |

**Rule:** Color must never be the only indicator of state. Every state must also use a text label, icon, or border change.

---

## 2. Typography

| Element | Font | Weight | Size | Line Height |
|---------|------|--------|------|-------------|
| Page title (h1) | System sans-serif (inherit Bootstrap) | 700 | 1.75 rem | 1.3 |
| Section heading (h2) | System sans-serif | 600 | 1.25 rem | 1.4 |
| Card/group heading (h3) | System sans-serif | 600 | 1.05 rem | 1.4 |
| Body text | System sans-serif | 400 | 1 rem (16 px) | 1.5 |
| Label | System sans-serif | 600 | 0.875 rem | 1.4 |
| Helper/muted text | System sans-serif | 400 | 0.8125 rem | 1.4 |
| Validation message | System sans-serif | 400 | 0.8125 rem | 1.4 |
| Badge | System sans-serif | 600 | 0.75 rem | 1 |
| Button | System sans-serif | 600 | 0.9375 rem | 1 |

---

## 3. Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4 px | Icon gap, tight inline spacing |
| `--space-2` | 8 px | Label-to-input gap, badge padding |
| `--space-3` | 12 px | Input internal padding (vertical) |
| `--space-4` | 16 px | Standard section gap, card padding |
| `--space-5` | 24 px | Group separation |
| `--space-6` | 32 px | Section separation |
| `--space-8` | 48 px | Page-level vertical spacing |

**Input height:** 40 px (consistent for all single-line inputs and selects).
**Textarea (Description):** min-height 120 px, resizable vertically only.

---

## 4. Component States

### 4.1 Editable Field
- Background: `--color-surface` (white)
- Border: 1 px solid `--color-border`
- Text: `--color-text`
- Placeholder: `--color-text-muted`
- Height: 40 px (single-line), 120 px min (textarea)

### 4.2 Read-Only Field
- Background: `--color-readonly-bg` (`#F0F4F2`)
- Border: 1 px solid `--color-border` (same border, different background)
- Text: `--color-text`
- `readonly` attribute set; cursor: default
- Visually distinct from editable but still readable

### 4.3 Invalid Field
- Border: 2 px solid `--color-error` (`#B91C1C`)
- Background: remains white
- Validation message: appears immediately **below** the field in `--color-error` text, font size 0.8125 rem
- `aria-invalid="true"` on the input; message linked via `aria-describedby`
- Red asterisk on label remains; does not replace the message

### 4.4 Disabled Field
- Background: `--color-disabled-bg`
- Text: `--color-disabled-text`
- Border: 1 px solid `--color-border`
- `disabled` attribute set; `cursor: not-allowed`
- Cannot receive focus or be activated

### 4.5 Focused Field
- Outline: 2 px solid `--color-secondary` (`#0B7A46`), offset 2 px
- Always visible — must not be removed for keyboard users
- Applies to inputs, selects, textareas, buttons, and links

### 4.6 Required Field Marker
- Red asterisk (`*`) after the label text, color `--color-error`
- Screen-reader text: `aria-required="true"` on the input
- Asterisk does not replace the validation message

---

## 5. Button Hierarchy

| Style | Appearance | Usage |
|-------|------------|-------|
| **Primary** | Solid `--color-primary` background, white text, no border | One main action per screen (Submit, Continue, Create Ticket) |
| **Secondary** | White background, `--color-primary` border and text | Supporting actions (Cancel, Back, Change Requester) |
| **Tertiary / Ghost** | No border, no background, `--color-secondary` text | Low-emphasis navigation (View Ticket link-style button) |
| **Destructive** | Solid `#B91C1C` background, white text | Irreversible actions (Remove Attachment) |
| **Disabled** | `--color-disabled-bg` background, `--color-disabled-text` text, no border | Any button when action is unavailable |
| **Busy** | Primary style + spinner icon + "Loading…" text, pointer-events none | Submit/upload while request is in flight |

**Rules:**
- Buttons always include visible text. Icons may supplement but must not replace text.
- Every icon-only control requires `aria-label` and `title` tooltip.
- Minimum button touch target: 44 × 44 px on mobile.
- Submit button is disabled and shows busy state from the moment it is clicked until the response arrives.

---

## 6. Application Shell

### Navigation Bar
- Background: `--color-primary` (`#006B3C`)
- Height: 56 px on desktop, 48 px on mobile
- Content (left to right):
  - TokTickIT logo icon + "TokTickIT" text in white, font-weight 700
  - My Tickets nav link (white text)
  - Create Ticket nav link (white text)
  - Right side: current Requester name + "Change" link in white
- Active page link: white text with `--color-pale-green` bottom border (2 px) or background highlight
- Mobile: hamburger icon collapses nav links into a dropdown; Requester name always visible

### Breadcrumb
- Shown on Ticket Detail screen: `My Tickets > TKT-2026-000001`
- Font size: 0.875 rem, color `--color-text-muted`
- Links use `--color-secondary`

---

## 7. Development Requester Selection Screen

### Layout
- Full-page centered card on `--color-page-bg` background
- Card: white, max-width 480 px, padding 32 px, border-radius 8 px, subtle shadow
- Vertically centered on screen

### Elements (top to bottom)
1. TokTickIT logo icon (large, centered)
2. Heading: "Select Development Requester" (h2, `--color-text`)
3. Subtext: "Choose a development requester to simulate the current requester context for Lab 2. This is for testing only and is not a login screen." (`--color-text-muted`, font size 0.875 rem)
4. Info callout: pale green box — "Only active development requesters are shown."
5. Label "Development Requester *" + dropdown select (full width, editable style)
6. Notice box: "Authentication coming in Lab 3 — In Lab 3, this selection will be replaced with secure authentication."
7. Action row: Cancel (Secondary, left) and Continue → (Primary, right)

### States
| State | Behavior |
|-------|----------|
| Loading | Spinner centered in card; dropdown disabled |
| Loaded | Dropdown populated; first option is placeholder "Select a requester…" |
| Empty | Message: "No active requesters found. Please contact your administrator." Continue button disabled |
| Error | Error message in red callout; retry button shown |
| Selected | Continue button enabled |

### After Selection
- App shell displays Requester name (top right)
- "Change" link navigates back to this screen
- All Requester-scoped data reloads on Requester change

---

## 8. Create Ticket Screen

### Layout (Desktop ≥ 992 px)
```
┌─────────────────────────────────────────────────────────────┐
│ Create Ticket                          [Cancel] [Submit →]  │
├──────────────────────┬──────────────────────────────────────┤
│ Ticket No.           │ Ticket Date                          │
│ (Will be assigned)   │ (Will be assigned)                   │
├──────────────────────┼──────────────────────────────────────┤
│ Requester            │ Requested Priority *                 │
│ [Read-only]          │ [ Low | Medium | High ]              │
├──────────────────────┼──────────────────────────────────────┤
│ Category *           │ Related System *                     │
│ [Dropdown]           │ [Dropdown]                           │
├──────────────────────┴──────────────────────────────────────┤
│ Ticket Summary *                                            │
│ [Single-line input, full width]                             │
├─────────────────────────────────────────────────────────────┤
│ Description *                                               │
│ [Textarea, full width, min 120 px]                          │
├─────────────────────────────────────────────────────────────┤
│ Attachments (optional)                                      │
│ [Drop zone / Choose Files button]                           │
│ [File list with remove-before-submit option]                │
├─────────────────────────────────────────────────────────────┤
│                              [Cancel]  [Submit Ticket →]    │
└─────────────────────────────────────────────────────────────┘
```

### Field Specifications
| Field | Type | State | Validation |
|-------|------|-------|------------|
| Ticket Number | Text display | Read-only | "Will be assigned on submission" |
| Ticket Date | Text display | Read-only | "Will be assigned on submission" |
| Requester | Text display | Read-only | Pre-filled from session context |
| Category | Select dropdown | Editable, Required | Must select a valid option |
| Related System | Select dropdown | Editable, Required | Must select a valid option |
| Requested Priority | Select or radio | Editable, Required | LOW / MEDIUM / HIGH |
| Ticket Summary | Text input | Editable, Required | 5–150 chars; trimmed |
| Description | Textarea | Editable, Required | 10–2000 chars; trimmed |
| Attachments | File input | Editable, Optional | JPG/PNG/WEBP/PDF; ≤ 5 MB; ≤ 5 files |

### Screen States
| State | Description |
|-------|-------------|
| Initial | Empty form; read-only fields pre-populated; Submit enabled |
| Validation failure | Per-field error messages below invalid fields; form not submitted |
| Submitting | Submit button busy + disabled; all fields disabled |
| Success | Green success banner: "Ticket TKT-2026-XXXXXX created. [View Ticket]" |
| API failure | Red error banner at top; all form values preserved; Submit re-enabled |
| Invalid attachment | Inline error below file zone; invalid file not added to list |

---

## 9. My Tickets Screen

### Layout (Desktop ≥ 992 px)
```
┌─────────────────────────────────────────────────────────────┐
│ My Tickets                      [⟳ Clear Filters] [+ Create]│
│ View and track all of your support requests.                │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Search by ticket number or summary...]                  │
│ Category [All ▾]  Priority [All ▾]  Status [All ▾]         │
├─────────────────────────────────────────────────────────────┤
│ Ticket No.↑ | Created Date↑ | Summary | Category |         │
│ Priority | Status | Last Updated                            │
├─────────────────────────────────────────────────────────────┤
│ [ticket rows]                                               │
├─────────────────────────────────────────────────────────────┤
│ Showing 1–10 of 42   ← 1 2 3 4 5 … →                      │
└─────────────────────────────────────────────────────────────┘
```

### Table Columns
| Column | Sortable | Notes |
|--------|----------|-------|
| Ticket No. | Yes | Link to Ticket Detail |
| Created Date | Yes (default desc) | Formatted: DD MMM YYYY HH:mm |
| Summary | No | Truncated at 60 chars on desktop |
| Category | No | Plain text |
| Requested Priority | No | Badge |
| Current Status | No | Badge |
| Last Updated | Yes | Formatted: DD MMM YYYY HH:mm |

### Mobile Layout (< 768 px)
- Each ticket is a card showing: Ticket No. (link), Summary, Category, Status badge, Created Date.
- Filters collapse into a "Filters" toggle button.
- Pagination shows Previous / Next buttons only.

### Screen States
| State | Description |
|-------|-------------|
| Loading | Spinner in list area; filters disabled |
| Populated | Table/cards with data |
| Empty | "You have no tickets yet. [+ Create Ticket]" illustration + button |
| No results | "No tickets match your search or filters. [Clear Filters]" |
| Error | Red callout: "Unable to load tickets. Please try again." + Retry button |

### Badge Colours
| Value | Badge Style |
|-------|-------------|
| LOW priority | Grey/blue outline badge |
| MEDIUM priority | Amber filled badge |
| HIGH priority | Red filled badge |
| NEW status | Green filled badge |

---

## 10. Requester Ticket Detail Screen

### Layout (Desktop ≥ 992 px)
```
┌─────────────────────────────────────────────────────────────┐
│ My Tickets > TKT-2026-000001            [← Back to Tickets] │
├──────────────────────┬──────────────────────────────────────┤
│ Ticket No.           │ Ticket Date                          │
│ TKT-2026-000001      │ 15 Aug 2026 10:30 AM                 │
├──────────────────────┼──────────────────────────────────────┤
│ Requester            │ Requested Priority                   │
│ Jennifer Anderson    │ [MEDIUM badge]                       │
├──────────────────────┼──────────────────────────────────────┤
│ Category             │ Related System                       │
│ Hardware             │ Corporate Laptop                     │
├──────────────────────┼──────────────────────────────────────┤
│ Current Status                                              │
│ [NEW badge]                                                 │
├─────────────────────────────────────────────────────────────┤
│ Ticket Summary                                              │
│ Laptop battery drains quickly                               │
├─────────────────────────────────────────────────────────────┤
│ Description                                                 │
│ My laptop battery is draining much faster than usual…       │
├─────────────────────────────────────────────────────────────┤
│ Attachments                              [+ Add Attachment] │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 📄 screenshot.png  1.2 MB  15 Aug 2026  [Download][✕]│   │
│ │ 🗑 report.pdf  REMOVED — "Not relevant" 16 Aug 2026  │   │
│ └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Field States
- All ticket fields (Ticket No., Ticket Date, Requester, Category, Related System, Requested Priority, Status, Summary, Description) are displayed using read-only field styling (`--color-readonly-bg` background).
- No editable inputs are shown for ticket fields.

### Attachment Row States
| State | Display |
|-------|---------|
| Active | Filename, size, upload date, Download button (Secondary), Remove button (Destructive icon) |
| Uploading | Progress bar or spinner; buttons disabled |
| Upload failed | Inline error message; file not added |
| Removed | Greyed-out row; filename struck through or muted; "REMOVED" label; removal reason and date; **no Download button** |

### Remove Attachment Flow
1. Requester clicks Remove (destructive icon button).
2. Confirmation modal appears with: attachment filename, required Reason textarea (min 5 chars), Cancel (Secondary), Confirm Remove (Destructive).
3. On confirm: API call; row updates to removed state.
4. On error: modal stays open; error message shown inside modal.

### Add Attachment Flow
1. Requester clicks "+ Add Attachment".
2. File picker opens (or drag-and-drop zone shown).
3. Client validates type and size before upload.
4. Upload progress shown.
5. On success: new active attachment row appears.
6. On failure: error message shown; no row added.

---

## 11. Responsive Rules

| Viewport | Behavior |
|----------|----------|
| Desktop ≥ 992 px | Multi-column form (2 columns for field groups); max content width 1200 px; centered |
| Tablet 768–991 px | Two-column layout where practical; Summary and Description span full width |
| Mobile < 768 px | Single column; all fields stack vertically; buttons span full width; ticket list as cards; filters collapsible |
| All sizes | No clipped labels; no overlapping messages; no horizontal scrollbar; no hidden buttons; attachment names do not overflow |

---

## 12. Accessibility Rules

- All form inputs must have associated `<label>` elements (not placeholder-only).
- Required fields: `aria-required="true"` on input.
- Invalid fields: `aria-invalid="true"` on input; error message linked via `aria-describedby`.
- All icon-only buttons: `aria-label` attribute and `title` tooltip.
- Focus order must follow visual reading order (top-left to bottom-right).
- Focus indicators must never be suppressed (`outline: none` is not permitted without a visible replacement).
- Modal dialogs must trap focus while open and return focus to the trigger element on close.
- Badges and status indicators must not rely on color alone — text label required.
- Keyboard navigation: Tab through all interactive controls; Enter/Space to activate buttons.
- Pagination buttons must have descriptive `aria-label` (e.g., "Go to page 3", "Next page").

---

## 13. Visual Inspection Checklist and Screenshot Paths

Screenshots are saved to `artifacts/lab-02/screenshots/` after Playwright runs.

| Screen | Desktop Path | Tablet Path | Mobile Path |
|--------|-------------|-------------|-------------|
| Requester Selection | `screenshots/requester-selector/desktop.png` | `screenshots/requester-selector/tablet.png` | `screenshots/requester-selector/mobile.png` |
| Create Ticket (initial) | `screenshots/create-ticket/desktop-initial.png` | `screenshots/create-ticket/tablet-initial.png` | `screenshots/create-ticket/mobile-initial.png` |
| Create Ticket (validation) | `screenshots/create-ticket/desktop-validation.png` | — | `screenshots/create-ticket/mobile-validation.png` |
| Create Ticket (success) | `screenshots/create-ticket/desktop-success.png` | — | — |
| My Tickets (populated) | `screenshots/my-tickets/desktop-populated.png` | `screenshots/my-tickets/tablet-populated.png` | `screenshots/my-tickets/mobile-populated.png` |
| My Tickets (empty) | `screenshots/my-tickets/desktop-empty.png` | — | — |
| My Tickets (no results) | `screenshots/my-tickets/desktop-no-results.png` | — | — |
| Ticket Detail | `screenshots/ticket-detail/desktop.png` | `screenshots/ticket-detail/tablet.png` | `screenshots/ticket-detail/mobile.png` |

**Visual inspection steps before final PR:**
1. Open each screenshot and verify against this spec.
2. Check all items in the Responsive and Visual Checklist in `tests.md` Section 4.
3. Confirm no clipping, overlap, unintended horizontal scroll, or inconsistent field styling.
4. Confirm badge colours and text are consistent across My Tickets and Ticket Detail.
5. Confirm all attachment states are visually distinct.
