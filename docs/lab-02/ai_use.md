# Lab 2 — AI Use and Reflection

**AI tools used:** Kiro IDE Agent

I used Kiro IDE Agent throughout Lab 2 to implement the full requester-facing ticketing system including database schema, API endpoints, React components, form validation, responsive design, and end-to-end testing.

---

## Example Coding Agent Prompts

| Prompt Name | Example Prompt |
|-------------|----------------|
| Review Contract | Read docs/lab-02/specification.md, tests.md, ui-spec.md, and api-spec.md. List ambiguities, conflicts, dependencies, and the proposed implementation order. Do not write code yet. |
| Create Failing API Tests | Implement the planned API tests for the current Issue first. Confirm they fail for the expected reason before implementing the endpoints. Do not write implementation code yet. |
| Implement UI Increment | Implement only the Create Ticket screen and reusable Zen Green form components required by the current Issue. Preserve the API contract and do not implement My Tickets or Ticket Detail until later Issues are available. |
| Completion Review | Audit the implementation against every acceptance criterion and planned test. Report missing evidence, skipped tests, untested failure states, and UI-spec deviations. Do not claim completion until corrected. |
| Implement My Tickets | Read the My Tickets requirements, API contract, acceptance criteria, and planned tests. Implement only the Requester-owned paginated ticket list, search, filters, sorting, loading, empty, no-results, and failure states. Do not add authentication or IT Staff workflow. |
| Implement Requester Ticket Detail | Implement the Requester Ticket Detail and Attachment lifecycle described in the contract. Ticket header fields are read-only. Enforce ownership in the backend. Support adding, downloading, and soft-removing permitted attachments. Do not add comments, internal notes, Actions Taken, or status changes. |
| Implement Development Requester Context | Read the Development Requester requirements, business rules, acceptance criteria, UI specification, API contract, and planned tests. Implement the temporary Lab 2 Requester model, Requester API, active Requester seed data, Development Requester Selection screen, selected Requester context, and Change Requester behavior. Clearly label this as a testing mechanism, not authentication. Do not add passwords, login, sessions, roles, or Lab 3 functionality. |
| Implement E2E Responsive Tests | Implement end-to-end Playwright tests covering the full requester ticket creation flow, ticket detail page with attachments, and responsive screenshot tests at three viewports (desktop 1280×800, tablet 820×1024, mobile 393×851) for Requester Selector, My Tickets, and Create Ticket in initial and validation states. |
| Debug Playwright Timeout Issues | The Playwright tests are timing out when loading the Create Ticket form in tablet and mobile viewports. Tests pass individually but fail when run in parallel. Diagnose the root cause and fix the configuration. |
| Fix TypeScript Errors in Tests | I'm getting TypeScript errors in the Playwright test files: "Cannot find name 'test'" and "Cannot find name 'expect'". The tests run fine but the editor shows errors. Fix the type configuration. |

---

## Reflection

Kiro IDE Agent was essential for implementing Lab 2's complex full-stack ticketing system. The agent handled database schema design with proper relations and indexes, API endpoint development with ownership enforcement, React component implementation with validation and error handling, responsive layout across three viewports, and comprehensive end-to-end testing.

I provided specific prompts that included technical constraints such as "enforce ownership in the backend," "use FormData for file uploads," "implement soft-removal with removedAt timestamp," and "reduce parallel workers to avoid database contention" so that Kiro generated code matching the specification requirements.

I did not accept generated code without verification. After each implementation, I:
- Ran the relevant test suites (Vitest for API, React Testing Library for components, Playwright for E2E)
- Manually tested UI behavior in the browser across different viewports
- Verified database migrations and seed data integrity
- Reviewed TypeScript types and error handling logic
- Checked Git diffs before committing changes

When tests failed or errors appeared, I provided Kiro with complete error messages, stack traces, and relevant logs so it could diagnose root causes rather than applying superficial patches. For example, when Playwright tests timed out in parallel execution, Kiro identified database resource contention as the root cause and reduced worker count from 6 to 2 with retry logic, which stabilized the test suite.

The most challenging aspects were:
1. **Debugging Playwright timeouts** - Required understanding that parallel test execution was overwhelming the database, not a bug in application code
2. **Form validation UX** - Balancing client-side validation with backend error handling while preserving user input on failure
3. **Attachment lifecycle** - Implementing soft-delete with proper ownership enforcement and 410 Gone responses for removed files
4. **Responsive design testing** - Ensuring consistent behavior across desktop, tablet, and mobile viewports with proper screenshot comparison

Overall, using Kiro significantly accelerated Lab 2 development while maintaining code quality through systematic testing and manual verification of each feature against acceptance criteria.
