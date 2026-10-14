# Lab 4: UI Polish and Accessibility Audit Artifacts

This directory contains screenshots and test reports for Lab 4.

## Screenshot Capture

Screenshots demonstrate the responsive design and visual consistency of Lab 4 dashboards and components.

### Prerequisites

Before capturing screenshots, ensure both servers are running:

```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend server
cd client
npm run dev
```

### Running Screenshot Capture

From the project root directory:

```bash
node capture-lab-04-screenshots.mjs
```

### Screenshot Organization

Screenshots are organized by component and viewport:

```
artifacts/lab-04/screenshots/
├── requester-dashboard/
│   ├── loaded-desktop.png    (1280x800)
│   ├── loaded-tablet.png     (768x1024)
│   ├── loaded-mobile.png     (375x667)
│   └── empty-desktop.png     (empty state)
├── staff-dashboard/
│   ├── loaded-desktop.png    (1280x800)
│   ├── loaded-tablet.png     (768x1024)
│   └── loaded-mobile.png     (375x667)
└── actions-taken/
    ├── initial-desktop.png   (1280x800)
    ├── initial-tablet.png    (768x1024)
    ├── initial-mobile.png    (375x667)
    ├── filled-desktop.png
    ├── filled-tablet.png
    └── filled-mobile.png
```

### What's Captured

**Requester Dashboard:**
- Loaded state with metrics (Open Tickets, Waiting for You, Recently Updated, Recently Resolved)
- Empty state (no tickets)
- All three viewports (desktop, tablet, mobile)

**Staff Dashboard:**
- Loaded state with metrics (Unassigned, My Assigned, Recently Updated, High Priority)
- Breakdown cards (By Status, By Priority)
- All three viewports (desktop, tablet, mobile)

**Actions Taken Modal:**
- Initial modal state (empty form)
- Filled form state (with action text and follow-up checkbox)
- All three viewports (desktop, tablet, mobile)

### Verification

After capture, verify:
- ✅ No clipping or overlapping elements
- ✅ No horizontal scroll bars
- ✅ Cards stack appropriately at mobile (single column)
- ✅ Cards display in 2 columns at tablet
- ✅ Cards display in 3-4 columns at desktop
- ✅ Text is readable at all sizes
- ✅ Buttons are appropriately sized for touch on mobile
- ✅ Zen Green color scheme is consistent
- ✅ Focus indicators are visible (if captured during interaction)

## Documentation

See also:
- `/docs/lab-04/accessibility-audit.md` - Comprehensive accessibility audit report
- `/docs/lab-04/ui-accessibility-checklist.md` - Pass/fail checklist for all criteria
- `/client/tests/lab-04/UIStyles.test.tsx` - UI component style tests
- `/client/tests/lab-04/Responsive.test.tsx` - Responsive layout tests
