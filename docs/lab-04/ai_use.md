# Lab 4 — AI Use and Reflection

**AI tools used:** Kiro IDE Agent and Claude AI

I used Kiro IDE Agent throughout Lab 4 to implement the Actions Taken feature, Requester and IT Staff Dashboards, and comprehensive regression testing. Claude AI was used to read and understand the Lab 4 requirements and assist in crafting precise prompts for Kiro.

---

| # | Section | Prompt I used | How AI helped me | My verification |
| --- | --- | --- | --- | --- |
| 1 | Sprint Specification & Test Plan | Analyze the existing Lab 1–3 implementation first. Do not modify application code yet. Create the Lab 4 engineering specification based on the Lab 4 requirements and the existing project architecture. Create docs/lab-04/specification.md, docs/lab-04/ui-spec.md, docs/lab-04/api-spec.md, docs/lab-04/tests.md, docs/lab-04/reviewer.md, and docs/lab-04/ai_use.md. Do not invent behavior that conflicts with the existing application. Identify any decisions that need to be made. | AI helped organize the Lab 4 requirements (Actions Taken, Dashboards, Regression Testing) into comprehensive engineering specifications including business rules, acceptance criteria, API contracts, UI specifications, and a detailed test plan covering unit, API, UI, E2E, and regression tests. | I reviewed all 6 generated specification documents against the Lab 4 requirements, verified consistency across documents, checked that business rules aligned with acceptance criteria, confirmed API and UI specs were implementable, and ensured no conflicts with Lab 1-3 functionality. Committed to feature/4-specification branch. |
| 2 | Database Schema & Seed Data | TBD | TBD | TBD |
| 3 | Actions Taken API Endpoints | TBD | TBD | TBD |
| 4 | Dashboards API Endpoints | TBD | TBD | TBD |
| 5 | Actions Taken UI Components | TBD | TBD | TBD |
| 6 | Requester Dashboard UI | TBD | TBD | TBD |
| 7 | IT Staff Dashboard UI | TBD | TBD | TBD |
| 8 | E2E Tests and Visual Verification | TBD | TBD | TBD |
| 9 | Regression Testing (Labs 1-3) | TBD | TBD | TBD |
| 10 | Documentation & Evidence | TBD | TBD | TBD |

---

## Reflection

**Specification Phase (Current):**

Kiro IDE Agent was used to create comprehensive Lab 4 specification documents based on the provided requirements. The AI successfully:
- Read and analyzed the existing Lab 1-3 codebase to understand patterns and conventions
- Parsed the Lab 4 requirements document to extract all features, business rules, and acceptance criteria
- Created 6 specification documents (specification.md, tests.md, ui-spec.md, api-spec.md, reviewer.md, ai_use.md)
- Identified critical design decisions (action editing rules, dashboard calculations, resolution blocking)
- Maintained consistency across all specification documents
- Ensured no conflicts with existing Lab 1-3 functionality

I provided specific guidance on:
- Using the existing Zen Green design system from Labs 2-3
- Following the established API patterns (session-based auth, error response format)
- Maintaining consistency with existing authorization rules (role-based access)
- Ensuring comprehensive test coverage including regression tests

I did not accept the specifications blindly:
- Reviewed all business rules for completeness and consistency
- Verified acceptance criteria were testable and specific
- Checked that API endpoint designs followed RESTful conventions
- Confirmed UI specifications matched the Zen Green design system
- Ensured test plan covered all acceptance criteria with traceability matrix

**Implementation Phase (To Come):**

The workflow for implementation will be:
1. Use Claude AI to analyze specific implementation challenges
2. Craft detailed prompts for Kiro based on the specifications
3. Use Kiro IDE Agent to implement code
4. Verify and test each implementation thoroughly
5. Iterate with Kiro to fix issues

**Key Lessons from Labs 1-3 Applied to Lab 4 Specification:**
- Start with comprehensive specifications before implementation
- Break down complex features into smaller, testable units
- Maintain visual and architectural consistency across labs
- Plan for regression testing from the start
- Document all design decisions and rationale

**Next Steps:**

After specification approval:
1. Create database migration for ActionTaken model
2. Implement and test Actions Taken API endpoints
3. Implement and test Dashboards API endpoints
4. Build Actions Taken UI components
5. Build Dashboard UI components
6. Run E2E and responsive tests
7. Execute full regression test suite (Labs 1-3)
8. Update this file with implementation details

---

## AI Prompts and Conversations

### Specification Phase Prompts

**Initial Prompt:**
> "We will do it right now STEP 1 — feature/4-specification... Analyze the existing Lab 1–3 implementation first. Do not modify application code yet. Create the Lab 4 engineering specification based on the Lab 4 requirements and the existing project architecture. Create docs/lab-04/specification.md, docs/lab-04/ui-spec.md, and docs/lab-04/api-spec.md."

**Follow-up (All 6 Documents):**
> "wait what how about this???? docs/lab-04/ ├── specification.md ├── tests.md ├── ui-spec.md ├── api-spec.md ├── reviewer.md └── ai-use.md"

**AI Response:**
> Created all 6 specification documents following the Lab 1-2 patterns:
> - specification.md: 70+ business rules, 63 functional requirements, 27 acceptance criteria
> - tests.md: Comprehensive test plan with 100+ planned tests including regression
> - ui-spec.md: Detailed UI specifications for Actions Taken section and both Dashboards
> - api-spec.md: Complete API contracts for all 5 new endpoints
> - reviewer.md: Template for peer review tracking
> - ai_use.md: This file, documenting AI usage throughout Lab 4

### Implementation Prompts (To Be Added)

*This section will be populated as implementation progresses through each GitHub Issue.*

---

## Decisions Made with AI Assistance

### 1. Action Editing Rules
**Question:** Should any IT Staff member be able to edit any action, or only the performer?
**AI Recommendation:** Only the performer should edit their own action (maintains audit integrity)
**Decision:** Adopted — only performer can edit, enforced by API

### 2. Action Deletion
**Question:** Should actions be deletable (hard or soft delete)?
**AI Recommendation:** No deletion allowed — actions are permanent audit records
**Decision:** Adopted — no delete endpoint; actions are immutable after 24-hour edit window

### 3. Dashboard Drill-Down Navigation
**Question:** Should dashboard card clicks open filtered list in-place, new tab, or modal?
**AI Recommendation:** Navigate in-place to filtered list (consistent with existing navigation patterns)
**Decision:** Adopted — cards navigate to existing My Tickets / Ticket Queue screens with filters applied

### 4. Concurrent Action Editing
**Question:** How to handle concurrent edits to the same action?
**AI Recommendation:** Last-write-wins (complexity of optimistic locking not justified for rare scenario)
**Decision:** Adopted — no optimistic locking; 24-hour edit window reduces conflict likelihood

### 5. Dashboard Time Windows
**Question:** What time windows for "Recently Updated" and "Recently Resolved"?
**AI Recommendation:** 7 days for "Recently Updated", 30 days for "Recently Resolved"
**Decision:** Adopted — balances operational focus (7 days) with historical context (30 days)

### 6. Dashboard Empty State Behavior
**Question:** Hide cards with zero counts or show "0"?
**AI Recommendation:** Show "0" with positive/neutral message (maintains consistent layout)
**Decision:** Adopted — all cards always visible; zero counts explicitly shown

### 7. Character Limits for Action Fields
**Question:** What are appropriate character limits for action fields?
**AI Recommendation:** 
- actionDescription: 10-2000 chars
- result: 10-2000 chars
- followupNote: 10-500 chars
- attachmentNotes: 0-500 chars
**Rationale:** Balances meaningful content (10 char minimum) with readability (2000 char maximum)
**Decision:** Adopted — enforced in API validation and UI character counters

---

## Reflection on AI Effectiveness

**What Worked Well:**
- Kiro quickly generated comprehensive, consistent specifications across 6 documents
- AI identified design decision points that needed human judgment
- Specifications followed established patterns from Labs 1-3 without explicit instruction
- Test plan with 100+ tests and traceability matrix would have taken hours manually
- UI and API specs were detailed enough to guide implementation without ambiguity

**What Required Human Oversight:**
- Design decisions (action editing rules, deletion policy, time windows) needed human judgment
- Reviewing specifications for completeness — AI doesn't know what it doesn't know
- Ensuring business rules aligned with real-world IT support workflows
- Verifying test coverage was sufficient for all acceptance criteria

**Lessons Learned:**
- Start with specifications, not implementation — saves rework
- AI is excellent at maintaining consistency across related documents
- Human review is essential for catching edge cases and making strategic decisions
- Clear, specific prompts yield better results than vague requests

---

## Final Notes

This document will be updated throughout Lab 4 implementation as each GitHub Issue is completed. The "TBD" entries in the table will be filled in with actual prompts, AI assistance details, and verification steps after each implementation phase.

All AI-generated code will be reviewed, tested, and verified before being committed and merged.
