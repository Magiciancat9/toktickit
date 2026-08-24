# Lab 2 — AI Use and Reflection

**AI tools used:** Kiro IDE Agent (primary implementation and debugging)

I used Kiro IDE Agent to implement all Lab 2 features, including database schema design, API endpoints, React components, form validation, responsive layout, and end-to-end tests. Kiro helped with code generation, debugging test failures, resolving TypeScript errors, and fixing Playwright configuration issues.

I reviewed all generated code, ran tests after each implementation, verified database migrations, and manually tested the UI behavior across different viewports before committing changes.

## Selected Key Prompts

| Prompt Name | Actual Prompt Text |
|-------------|--------------------|
| Initial Lab 2 Planning | **Kiro:** I have Lab 2 requirements for TokTickIT. The lab requires implementing a full ticket creation and management system with requester context, form validation, My Tickets page, Ticket Detail page, and responsive E2E tests. Can you help me understand the dependencies and implementation order?<br><br>**My Reflection:** Kiro analyzed the lab requirements and proposed a logical implementation order starting with database schema, then requester context, then ticket CRUD operations, and finally responsive testing. |
| Database Schema Design | **Kiro:** Implement the Lab 2 database schema with the following models: Requester (id, name, email, department), RelatedSystem (id, name), Ticket (id, title, description, categoryId, relatedSystemId, requesterId, status, priority, createdAt, updatedAt), and Attachment (id, ticketId, fileName, uploadedAt, isRemoved). Include all necessary relations and indexes. Generate the Prisma migration and update the seed script.<br><br>**My Reflection:** Kiro created the complete schema with proper foreign keys, indexes, and cascading deletes. The migration was clean and the seed script was idempotent. |
| Requester Context Implementation | **Kiro:** Implement a global requester context for the React app. Create a RequesterContext that stores the current requester, fetches all requesters from /api/requesters on mount, and provides functions to change the active requester. Add a RequesterSelector component in the nav bar with a dropdown showing requester name and department. Persist the selected requester ID in localStorage.<br><br>**My Reflection:** Kiro implemented the context provider, API integration, and UI component with proper TypeScript types. The localStorage persistence worked correctly across page refreshes. |
| Create Ticket Form | **Kiro:** Build a Create Ticket form with the following fields: Title (required), Category (required dropdown from /api/categories), Related System (required dropdown from /api/related-systems), Priority (required radio: Low/Medium/High), Description (required textarea). Add client-side validation that shows error messages for empty required fields. On submit, POST to /api/tickets with the current requester ID from context. Show success feedback and redirect to My Tickets.<br><br>**My Reflection:** Kiro implemented the form with full validation, API integration, loading states, and error handling. The form worked correctly but initially had some TypeScript type mismatches that Kiro fixed after I pointed them out. |
| My Tickets Page | **Kiro:** Create a My Tickets page that fetches and displays all tickets for the current requester from GET /api/tickets?requesterId=X. Show tickets in a table with columns: ID, Title, Category, Status, Priority, Created. Add a search filter that filters by title or ID. Add status badge styling (Open=primary, In Progress=warning, Resolved=success, Closed=secondary). Make each row clickable to navigate to /ticket/:id.<br><br>**My Reflection:** Kiro implemented the complete page with API integration, search functionality, and navigation. The status badges initially used wrong Bootstrap classes but Kiro corrected them when I ran the tests. |
| Ticket Detail Page | **Kiro:** Build a Ticket Detail page that fetches a single ticket from GET /api/tickets/:id including category, relatedSystem, and requester details. Display all ticket fields as read-only with proper labels. Add an Attachments section that shows existing attachments from the ticket. Implement file upload (POST /api/tickets/:id/attachments with multipart/form-data) and soft-delete (DELETE /api/attachments/:id). Show upload success and handle errors.<br><br>**My Reflection:** Kiro implemented the full page with file upload, soft-delete, and proper API integration. There were several iterations to get the FormData handling correct and to fix the soft-delete UI update. |
| Playwright E2E Tests | **Kiro:** Create Playwright E2E tests for Lab 2 covering: (1) Full ticket creation flow (select requester, fill form, submit, verify in My Tickets), (2) Ticket detail page (verify all fields, upload attachment, remove attachment), (3) Responsive screenshots at 3 viewports (desktop 1280×800, tablet 820×1024, mobile 393×851) for Requester Selector, My Tickets, and Create Ticket in initial and validation states.<br><br>**My Reflection:** Kiro wrote comprehensive E2E tests that covered all requirements. The tests initially had some timeout issues and viewport-specific failures. Kiro debugged these by checking server logs, adjusting timeouts, and reducing parallel workers. |
| Debugging Playwright Timeouts | **Kiro:** The Playwright tests are timing out when loading the Create Ticket form in tablet and mobile viewports. The form loads fine in desktop and when tests run individually, but fails in parallel runs. Can you diagnose the issue?<br><br>**My Reflection:** Kiro identified that the issue was resource contention from running 6 parallel workers overwhelming the database. Kiro updated the Playwright config to reduce workers from 6 to 2 and added retry logic, which fixed the flaky tests. |
| Fix TypeScript Errors in Tests | **Kiro:** I'm getting TypeScript errors in the Playwright test files: "Cannot find name 'test'" and "Cannot find name 'expect'". The tests run fine but the editor shows errors. How do I fix this?<br><br>**My Reflection:** Kiro checked the tsconfig.json and identified that the Playwright types weren't included. Kiro added the proper type references and the errors disappeared. |
| Update README for Lab 2 | **Kiro:** Update the README with Lab 2 setup instructions including how to run migrations, seed the database, start both servers, and run the Playwright E2E tests. Follow the existing README format from Lab 1.<br><br>**My Reflection:** Kiro added a clear Lab 2 section to the README with all necessary commands and explanations. |

## Reflection

Kiro IDE Agent was essential for implementing Lab 2's complex full-stack features. The agent handled database schema design, API development, React component implementation, form validation, responsive layout, and end-to-end testing across multiple viewports.

My prompts were specific and included technical constraints like "use FormData for file uploads", "add client-side validation", and "reduce parallel workers to 2" so that Kiro generated code that matched the project requirements and conventions.

I did not blindly accept generated code. After each implementation, I:
- Ran the relevant tests (Vitest for API, React Testing Library for components, Playwright for E2E)
- Manually tested the UI behavior in the browser
- Checked database migrations and seed data
- Verified TypeScript types and error handling
- Reviewed Git diffs before committing

When tests failed or TypeScript errors appeared, I provided Kiro with specific error messages and logs so it could diagnose and fix the root cause rather than making random changes.

The most challenging part was debugging the Playwright test timeouts. Kiro helped me understand that the issue was resource contention from parallel test execution, not a bug in the application code. Reducing the worker count and adding retries made the test suite stable.

Overall, using Kiro significantly accelerated development while maintaining code quality through proper testing and manual verification.
