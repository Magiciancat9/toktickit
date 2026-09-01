# Lab 2 — AI Use and Reflection

**AI tools used:** Kiro IDE Agent and cladue AI

I used Kiro IDE Agent throughout Lab 2 to implement the full requester-facing ticketing system including database schema, API endpoints, React components, form validation, responsive design, and end-to-end testing. Cladue AI for read the file lab2 first and use for prompt the word before tell the Kiro ide Agent.

---

| # | Section | Prompt I used | How AI helped me | My verified |
| --- | --- | --- | --- | --- |
| 1 | Sprint Specification & Test Plan | Define the Lab 2 engineering contract and test plan before implementation. This issue covers: Sprint goal and scope, Functional/Business rules, Acceptance criteria, API and UI specification, Data model, Test plan, and Definition of Done. No application feature implementation is included. | AI helped organize the Lab 2 requirements into a clear engineering contract, acceptance criteria, API/UI specifications, and test plan before implementation started. | I reviewed the generated documents against the Lab 2 labsheet, checked scope and excluded features were correct, and verified the documents were committed under docs/lab-02. |
| 2 | Database Schema & Seed Data | Design the database schema and seed data for Lab 2. This issue covers: Requester/Ticket/Attachment/Category/Related System models, relationships and constraints, soft-removal fields, and an idempotent seed script. | AI helped translate the entity relationships from the spec into a Prisma schema and generated an idempotent seed script. | I checked the seed script by running it twice for duplicates, and verified relationships and soft-removal fields matched specification.md before committing. |
| 3 | Development Requester Selector | Implement the Development Requester context. This issue covers: active-Requester API, Selection screen UI, selected Requester context, and Change Requester behavior. Testing mechanism only — no login, sessions, or roles. | AI helped scaffold the active-Requester API, Selection screen with loading/empty/failure states, and context switching logic. | I verified inactive Requesters were excluded, tested switching Requesters reloads data correctly, and confirmed no real auth logic was added. |
| 4 | Create Ticket Flow | Implement the Create Ticket screen and API. This issue covers: Ticket creation endpoint, reference-data endpoints, server-generated Ticket Number, field validation, and attachment upload with type/size/count limits. | AI helped implement the form per ui-spec.md, wired field-level validation, and built the attachment upload checks. | I tested invalid submissions for correct error messages, verified the Ticket Number matched the database, and confirmed form values were preserved on API failure. |
| 5 | My Tickets List | Implement the My Tickets screen. This issue covers: paginated ticket-list API scoped to the selected Requester, search, filters, sorting, and loading/empty/no-results states. | AI helped build the list API with search/filter/sort parameters and the responsive My Tickets UI. | I switched Requesters to confirm no ticket data leaked across ownership, tested each filter/sort option, and checked empty and no-results states. |
| 6 | Ticket Detail & Attachment Lifecycle | Implement the Requester Ticket Detail screen. This issue covers: owned-ticket retrieval with ownership checks, attachment add/download/soft-remove, and read-only ticket fields. | AI helped implement the ownership-checked detail endpoint, soft-removal logic, and the read-only Detail UI. | I attempted cross-Requester access to confirm it was rejected, and tested that removed attachments stayed visible as metadata but blocked download. |
| 7 | Responsive, Visual & E2E Testing | Run responsive, visual, and E2E testing. This issue covers: Playwright screenshots at desktop/tablet/mobile, the visual checklist, and an end-to-end Requester flow test. | AI helped generate the screenshot script and draft the E2E test covering the full Requester flow. | I manually reviewed screenshots against ui-spec.md, ran the E2E test to confirm it passed consistently, and fixed a mobile layout issue AI's draft missed. |
| 8 | fixing | - | - | I would tell that this part was make mistake a select the wrong desination before merge and didn't see it so this part I didn't use ai |
| 9 | Fixing_ui | I tell ai that there a little bit UI that I want to adjust to meet the required specifications.| It make the UI get more look like the requirement|I check the UI and test by try to create ticket. |

---

## Reflection

Kiro IDE Agent was essential for implementing Lab 2's complex full-stack ticketing system. Claude AI was used to read and understand the Lab 2 specification files first, then helped craft precise prompts for Kiro.

The workflow was:
1. Used Claude AI to analyze the specification and break down requirements
2. Crafted specific prompts based on Claude's analysis
3. Used Kiro IDE Agent to implement the code
4. Verified and tested each implementation
5. Iterated with Kiro to fix issues

Kiro handled database schema design with proper relations and indexes, API endpoint development with ownership enforcement, React component implementation with validation and error handling, responsive layout across three viewports, and comprehensive end-to-end testing.

I provided specific prompts to Kiro based on our conversation needs, such as "Can you add the UI for me like this?" (with screenshots), "It still error you need to fix it to me now!" (when things broke), and "Can you just do for this part for me please" (for documentation). This conversational approach worked well because Kiro could understand context and intent even when my requests weren't perfectly structured.

I did not accept generated code without verification. After each implementation, I:
- Ran the relevant test suites (Vitest for API, React Testing Library for components, Playwright for E2E)
- Manually tested UI behavior in the browser across different viewports
- Verified database migrations and seed data integrity
- Reviewed TypeScript types and error handling logic
- Checked Git diffs before committing changes

Overall, the combination of Claude AI for understanding requirements and Kiro IDE Agent for implementation significantly accelerated Lab 2 development while maintaining code quality through systematic testing and verification.

---