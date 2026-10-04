# Lab 4 API Specification

## 1. Authentication and Authorization (Unchanged from Lab 3)

### 1.1. Authentication Mechanism

Session-based authentication with HTTP-only cookies (unchanged from Lab 3):
- Backend uses `express-session` with PostgreSQL session store
- Session cookie: `toktickit.sid`
- Cookie attributes: `HttpOnly`, `Secure` (production), `SameSite=Lax`
- Session expiration: 24 hours of inactivity

### 1.2. Authorization Rules

All Lab 4 endpoints require authentication. Role-based access control:
- **Actions Taken endpoints:** IT_STAFF and ADMINISTRATOR only
- **Requester Dashboard endpoint:** REQUESTER role only (must be viewing own dashboard)
- **IT Staff Dashboard endpoint:** IT_STAFF and ADMINISTRATOR only

---

## 2. Common Response Patterns (Unchanged from Lab 3)

### 2.1. Success Responses

**200 OK** — Successful GET, PATCH operations
```json
{
  "data": { ... }
}
```

**201 Created** — Successful POST (resource created)
```json
{
  "data": { ... }
}
```

**204 No Content** — Successful DELETE or operation with no response body

### 2.2. Error Responses

**400 Bad Request** — Validation errors
```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      { "field": "actionDescription", "message": "Action description must be between 10 and 2000 characters" }
    ]
  }
}
```

**401 Unauthorized** — Authentication required
```json
{
  "error": {
    "message": "Authentication required"
  }
}
```

**403 Forbidden** — Authenticated but not authorized
```json
{
  "error": {
    "message": "You do not have permission to access this resource"
  }
}
```

**404 Not Found** — Resource does not exist
```json
{
  "error": {
    "message": "Resource not found"
  }
}
```

**409 Conflict** — Invalid operation due to state conflict
```json
{
  "error": {
    "message": "Cannot resolve ticket: unresolved follow-up actions exist"
  }
}
```

**500 Internal Server Error** — Unexpected error
```json
{
  "error": {
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

---

## 3. Actions Taken Endpoints

### 3.1. POST /api/staff/tickets/:ticketNumber/actions

**Purpose:** Record a new action taken on a ticket

**Authorization:**
- Requires IT_STAFF or ADMINISTRATOR role
- REQUESTER role returns 403 Forbidden

**Path Parameters:**
- `ticketNumber` (string, required): Ticket number (e.g., "TKT-2026-000001")

**Request Body:**
```json
{
  "actionDescription": "Ran diagnostics on user's laptop. Found corrupted system files due to incomplete Windows update.",
  "result": "Repaired system files using SFC and DISM commands. System is now stable and all updates installed successfully.",
  "followUpRequired": true,
  "followupNote": "Check with user in 2 days to confirm no further issues after system repair.",
  "attachmentNotes": "See screenshot in ticket attachments showing SFC scan results."
}
```

**Request Body Schema:**
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| actionDescription | string | Yes | 10-2000 chars | Description of action taken |
| result | string | Yes | 10-2000 chars | Outcome or result of the action |
| followUpRequired | boolean | No | Default: false | Whether follow-up is needed |
| followupNote | string | Conditional | 10-500 chars | Required if followUpRequired=true; must be 10-500 chars |
| attachmentNotes | string | No | 0-500 chars | Optional notes about ticket attachments |

**Validation Rules:**
- actionDescription: required, 10-2000 characters, trimmed
- result: required, 10-2000 characters, trimmed
- followUpRequired: boolean, default false
- followupNote: required if followUpRequired=true; must be 10-500 characters when provided
- attachmentNotes: optional, 0-500 characters

**Success Response (201 Created):**
```json
{
  "data": {
    "id": 42,
    "ticketId": 15,
    "ticketNumber": "TKT-2026-000001",
    "performerId": 5,
    "performerName": "Jennifer Anderson",
    "performerRole": "IT_STAFF",
    "actionDateTime": "2026-09-14T10:30:00.000Z",
    "actionDescription": "Ran diagnostics on user's laptop. Found corrupted system files due to incomplete Windows update.",
    "result": "Repaired system files using SFC and DISM commands. System is now stable and all updates installed successfully.",
    "followUpRequired": true,
    "followupNote": "Check with user in 2 days to confirm no further issues after system repair.",
    "attachmentNotes": "See screenshot in ticket attachments showing SFC scan results.",
    "createdAt": "2026-09-14T10:30:00.000Z",
    "updatedAt": "2026-09-14T10:30:00.000Z"
  }
}
```

**Error Responses:**

| Status | Condition | Error Message |
|--------|-----------|---------------|
| 400 | actionDescription missing or invalid | "Action description must be between 10 and 2000 characters" |
| 400 | result missing or invalid | "Result must be between 10 and 2000 characters" |
| 400 | followUpRequired=true but followupNote missing | "Follow-up note is required when follow-up is needed" |
| 400 | followupNote invalid length | "Follow-up note must be between 10 and 500 characters" |
| 400 | attachmentNotes > 500 chars | "Attachment notes cannot exceed 500 characters" |
| 401 | Not authenticated | "Authentication required" |
| 403 | REQUESTER role | "Only IT Staff can record actions on tickets" |
| 404 | Ticket not found | "Ticket not found" |
| 500 | Database error | "An unexpected error occurred. Please try again later." |

---

### 3.2. GET /api/staff/tickets/:ticketNumber/actions

**Purpose:** Retrieve all actions taken on a ticket

**Authorization:**
- Requires IT_STAFF or ADMINISTRATOR role
- REQUESTER role returns 403 Forbidden

**Path Parameters:**
- `ticketNumber` (string, required): Ticket number

**Query Parameters:** None

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 42,
      "ticketId": 15,
      "ticketNumber": "TKT-2026-000001",
      "performerId": 5,
      "performerName": "Jennifer Anderson",
      "performerRole": "IT_STAFF",
      "actionDateTime": "2026-09-14T10:30:00.000Z",
      "actionDescription": "Ran diagnostics on user's laptop. Found corrupted system files.",
      "result": "Repaired system files using SFC and DISM commands. System is now stable.",
      "followUpRequired": true,
      "followupNote": "Check with user in 2 days to confirm no further issues.",
      "attachmentNotes": "See screenshot in attachments.",
      "createdAt": "2026-09-14T10:30:00.000Z",
      "updatedAt": "2026-09-14T10:30:00.000Z"
    },
    {
      "id": 45,
      "ticketId": 15,
      "ticketNumber": "TKT-2026-000001",
      "performerId": 6,
      "performerName": "William Martinez",
      "performerRole": "IT_STAFF",
      "actionDateTime": "2026-09-16T14:15:00.000Z",
      "actionDescription": "Followed up with user via email. User confirmed laptop is working normally.",
      "result": "No further issues reported. User satisfied with resolution.",
      "followUpRequired": false,
      "followupNote": null,
      "attachmentNotes": null,
      "createdAt": "2026-09-16T14:15:00.000Z",
      "updatedAt": "2026-09-16T14:16:00.000Z"
    }
  ]
}
```

**Response Notes:**
- Actions are returned in chronological order (oldest first, sorted by actionDateTime ASC)
- Empty array returned if no actions exist for the ticket

**Error Responses:**

| Status | Condition | Error Message |
|--------|-----------|---------------|
| 401 | Not authenticated | "Authentication required" |
| 403 | REQUESTER role | "You do not have permission to view actions" |
| 404 | Ticket not found | "Ticket not found" |
| 500 | Database error | "An unexpected error occurred. Please try again later." |

---

### 3.3. PATCH /api/staff/tickets/:ticketNumber/actions/:actionId

**Purpose:** Update an existing action (edit own action within 24 hours)

**Authorization:**
- Requires IT_STAFF or ADMINISTRATOR role
- Only the performer (action creator) can edit their own action
- Action must be less than 24 hours old (based on createdAt or updatedAt)

**Path Parameters:**
- `ticketNumber` (string, required): Ticket number
- `actionId` (integer, required): Action ID

**Request Body:**
```json
{
  "actionDescription": "Updated description of the action taken.",
  "result": "Updated result of the action.",
  "followUpRequired": false,
  "followupNote": null,
  "attachmentNotes": "Updated attachment notes."
}
```

**Request Body Schema:**
Same as POST /api/staff/tickets/:ticketNumber/actions (all fields can be updated)

**Validation Rules:**
- Same as POST endpoint
- Additionally: action must be < 24 hours old
- Additionally: current user must be the performer

**Success Response (200 OK):**
```json
{
  "data": {
    "id": 42,
    "ticketId": 15,
    "ticketNumber": "TKT-2026-000001",
    "performerId": 5,
    "performerName": "Jennifer Anderson",
    "performerRole": "IT_STAFF",
    "actionDateTime": "2026-09-14T10:30:00.000Z",
    "actionDescription": "Updated description of the action taken.",
    "result": "Updated result of the action.",
    "followUpRequired": false,
    "followupNote": null,
    "attachmentNotes": "Updated attachment notes.",
    "createdAt": "2026-09-14T10:30:00.000Z",
    "updatedAt": "2026-09-14T11:45:00.000Z"
  }
}
```

**Error Responses:**

| Status | Condition | Error Message |
|--------|-----------|---------------|
| 400 | Validation errors | Same as POST endpoint |
| 401 | Not authenticated | "Authentication required" |
| 403 | Current user is not performer | "You can only edit your own actions" |
| 403 | Action > 24 hours old | "Actions cannot be edited after 24 hours" |
| 403 | REQUESTER role | "Only IT Staff can edit actions" |
| 404 | Action not found | "Action not found" |
| 500 | Database error | "An unexpected error occurred. Please try again later." |

---

## 4. Ticket Resolution Validation (Updated for Lab 4)

### 4.1. Updated: PATCH /api/staff/tickets/:ticketNumber (Status Transition)

**Lab 4 Addition:** When transitioning a ticket to RESOLVED status, the API must validate that no actions have `followUpRequired=true`.

**Existing Endpoint:** PATCH /api/staff/tickets/:ticketNumber (from Lab 3)

**New Validation Rule:**
- Before allowing status transition to RESOLVED:
  - Query all ActionsTaken for the ticket
  - If any action has followUpRequired=true, return 409 Conflict
  - If all actions have followUpRequired=false (or no actions exist), allow RESOLVED transition

**Error Response (409 Conflict) — New for Lab 4:**
```json
{
  "error": {
    "message": "Cannot resolve ticket: unresolved follow-up actions exist",
    "details": [
      {
        "actionId": 42,
        "followupNote": "Check with user in 2 days to confirm no further issues after system repair."
      }
    ]
  }
}
```

**Success Response (200 OK):**
Same as Lab 3 — ticket status updated to RESOLVED

---

## 5. Dashboard Endpoints

### 5.1. GET /api/dashboards/requester

**Purpose:** Retrieve dashboard metrics for a Requester

**Authorization:**
- Requires REQUESTER role
- User can only view their own dashboard (enforced by session userId)

**Query Parameters:**
- `requesterId` (integer, optional): If provided, must match authenticated user's ID; otherwise, 403 Forbidden

**Implementation Note:**
- Backend uses authenticated user's ID from session (req.session.userId)
- If query parameter requesterId is provided and doesn't match session userId, return 403
- If query parameter is omitted, use session userId

**Success Response (200 OK):**
```json
{
  "data": {
    "totalOpen": 12,
    "waitingForRequester": 3,
    "recentlyUpdated": 5,
    "recentlyResolved": 8
  }
}
```

**Response Schema:**
| Field | Type | Description |
|-------|------|-------------|
| totalOpen | integer | Count of tickets in OPEN, IN_PROGRESS, or WAITING_FOR_REQUESTER status |
| waitingForRequester | integer | Count of tickets in WAITING_FOR_REQUESTER status only |
| recentlyUpdated | integer | Count of tickets updated in the last 7 days (any status) |
| recentlyResolved | integer | Count of tickets with status=RESOLVED resolved in the last 30 days |

**Calculation Details:**
- **totalOpen:** `COUNT(*) WHERE ownerId = userId AND status IN ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER')`
- **waitingForRequester:** `COUNT(*) WHERE ownerId = userId AND status = 'WAITING_FOR_REQUESTER'`
- **recentlyUpdated:** `COUNT(*) WHERE ownerId = userId AND updatedAt >= NOW() - INTERVAL '7 days'`
- **recentlyResolved:** `COUNT(*) WHERE ownerId = userId AND status = 'RESOLVED' AND resolvedAt >= NOW() - INTERVAL '30 days'`

**Error Responses:**

| Status | Condition | Error Message |
|--------|-----------|---------------|
| 401 | Not authenticated | "Authentication required" |
| 403 | REQUESTER viewing other's dashboard | "You do not have permission to view this dashboard" |
| 403 | IT_STAFF or ADMINISTRATOR calling this endpoint | "This endpoint is for Requesters only" |
| 500 | Database error | "An unexpected error occurred. Please try again later." |

---

### 5.2. GET /api/dashboards/staff

**Purpose:** Retrieve dashboard metrics for IT Staff and Administrators

**Authorization:**
- Requires IT_STAFF or ADMINISTRATOR role
- REQUESTER role returns 403 Forbidden

**Query Parameters:** None

**Success Response (200 OK):**
```json
{
  "data": {
    "unassigned": 15,
    "myAssigned": 8,
    "recentlyUpdated": 22,
    "highPriorityUnresolved": 4,
    "byStatus": {
      "NEW": 5,
      "OPEN": 12,
      "IN_PROGRESS": 18,
      "WAITING_FOR_REQUESTER": 7,
      "RESOLVED": 45,
      "CLOSED": 30,
      "REOPENED": 2,
      "CANCELLED": 3
    },
    "byPriority": {
      "LOW": 35,
      "MEDIUM": 50,
      "HIGH": 12
    }
  }
}
```

**Response Schema:**
| Field | Type | Description |
|-------|------|-------------|
| unassigned | integer | Count of tickets with itStaffId=null (excluding RESOLVED/CLOSED/CANCELLED) |
| myAssigned | integer | Count of tickets assigned to current user (itStaffId = session userId) |
| recentlyUpdated | integer | Count of all tickets updated in the last 7 days |
| highPriorityUnresolved | integer | Count of tickets with itPriority=HIGH and status NOT in [RESOLVED, CLOSED, CANCELLED] |
| byStatus | object | Breakdown of ticket counts by all status values |
| byPriority | object | Breakdown of ticket counts by all itPriority values |

**Calculation Details:**
- **unassigned:** `COUNT(*) WHERE itStaffId IS NULL AND status NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED')`
- **myAssigned:** `COUNT(*) WHERE itStaffId = session.userId`
- **recentlyUpdated:** `COUNT(*) WHERE updatedAt >= NOW() - INTERVAL '7 days'`
- **highPriorityUnresolved:** `COUNT(*) WHERE itPriority = 'HIGH' AND status NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED')`
- **byStatus:** `COUNT(*) GROUP BY status` (returns all 8 statuses with counts)
- **byPriority:** `COUNT(*) GROUP BY itPriority` (returns all 3 priorities with counts)

**Error Responses:**

| Status | Condition | Error Message |
|--------|-----------|---------------|
| 401 | Not authenticated | "Authentication required" |
| 403 | REQUESTER role | "You do not have permission to view this dashboard" |
| 500 | Database error | "An unexpected error occurred. Please try again later." |

---

## 6. Data Model: ActionTaken (New for Lab 4)

### 6.1. ActionTaken Model Schema

```prisma
model ActionTaken {
  id                Int       @id @default(autoincrement())
  ticketId          Int
  ticket            Ticket    @relation(fields: [ticketId], references: [id])
  performerId       Int
  performer         User      @relation(fields: [performerId], references: [id])
  actionDateTime    DateTime  @default(now())
  actionDescription String    // 10-2000 chars
  result            String    // 10-2000 chars
  followUpRequired  Boolean   @default(false)
  followupNote      String?   // 10-500 chars, required if followUpRequired=true
  attachmentNotes   String?   // 0-500 chars, optional
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([ticketId])
  @@index([performerId])
}
```

### 6.2. Ticket Model Update (Lab 4)

Add relation to ActionTaken:
```prisma
model Ticket {
  // ... existing fields ...
  actionsTaken  ActionTaken[]
}
```

Add optional resolvedAt timestamp:
```prisma
model Ticket {
  // ... existing fields ...
  resolvedAt    DateTime?
}
```

### 6.3. User Model Update (Lab 4)

Add relation to ActionTaken:
```prisma
model User {
  // ... existing fields ...
  actionsTaken  ActionTaken[]
}
```

---

## 7. API Endpoint Summary

| Method | Endpoint | Purpose | Auth Required | Roles Allowed |
|--------|----------|---------|---------------|---------------|
| POST | /api/staff/tickets/:ticketNumber/actions | Record new action | Yes | IT_STAFF, ADMINISTRATOR |
| GET | /api/staff/tickets/:ticketNumber/actions | Get all actions for ticket | Yes | IT_STAFF, ADMINISTRATOR |
| PATCH | /api/staff/tickets/:ticketNumber/actions/:actionId | Edit own action (< 24 hours) | Yes | IT_STAFF, ADMINISTRATOR (performer only) |
| GET | /api/dashboards/requester | Get Requester dashboard metrics | Yes | REQUESTER |
| GET | /api/dashboards/staff | Get IT Staff dashboard metrics | Yes | IT_STAFF, ADMINISTRATOR |

**Unchanged from Lab 3:**
- All Lab 1-3 endpoints remain functional
- PATCH /api/staff/tickets/:ticketNumber updated with new validation rule (resolution blocking)

---

## 8. Validation Rules Summary

### 8.1. Action Creation/Update Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| actionDescription | Required | "Action description is required" |
| actionDescription | 10-2000 chars | "Action description must be between 10 and 2000 characters" |
| result | Required | "Result is required" |
| result | 10-2000 chars | "Result must be between 10 and 2000 characters" |
| followUpRequired | Boolean | N/A |
| followupNote | Required if followUpRequired=true | "Follow-up note is required when follow-up is needed" |
| followupNote | 10-500 chars when provided | "Follow-up note must be between 10 and 500 characters" |
| attachmentNotes | 0-500 chars | "Attachment notes cannot exceed 500 characters" |
| performerId | Must be current user (edit only) | "You can only edit your own actions" |
| createdAt/updatedAt | < 24 hours ago (edit only) | "Actions cannot be edited after 24 hours" |

### 8.2. Resolution Validation (New for Lab 4)

| Rule | Error Message |
|------|---------------|
| No actions with followUpRequired=true when resolving ticket | "Cannot resolve ticket: unresolved follow-up actions exist" |

---

## 9. HTTP Status Code Reference

| Status | Usage in Lab 4 |
|--------|----------------|
| 200 OK | Successful GET, PATCH operations |
| 201 Created | Successful POST /api/staff/tickets/:ticketNumber/actions |
| 400 Bad Request | Validation errors (invalid field values, missing required fields) |
| 401 Unauthorized | Authentication required (no session) |
| 403 Forbidden | Authenticated but not authorized (wrong role, editing other's action, > 24 hours) |
| 404 Not Found | Ticket not found, Action not found |
| 409 Conflict | Cannot resolve ticket due to unresolved follow-up actions |
| 500 Internal Server Error | Unexpected server error, database error |

---

## 10. Testing Endpoints with curl

### 10.1. Record an Action

```bash
curl -X POST http://localhost:5000/api/staff/tickets/TKT-2026-000001/actions \
  -H "Content-Type: application/json" \
  -H "Cookie: toktickit.sid=<session-cookie>" \
  -d '{
    "actionDescription": "Investigated network connectivity issue. Found misconfigured DNS settings.",
    "result": "Corrected DNS settings to use company DNS servers. User now has full network access.",
    "followUpRequired": false,
    "attachmentNotes": "Network diagnostics screenshot attached to ticket."
  }'
```

### 10.2. Get All Actions for a Ticket

```bash
curl -X GET http://localhost:5000/api/staff/tickets/TKT-2026-000001/actions \
  -H "Cookie: toktickit.sid=<session-cookie>"
```

### 10.3. Update an Action

```bash
curl -X PATCH http://localhost:5000/api/staff/tickets/TKT-2026-000001/actions/42 \
  -H "Content-Type: application/json" \
  -H "Cookie: toktickit.sid=<session-cookie>" \
  -d '{
    "actionDescription": "Updated: Investigated network connectivity issue and DNS misconfiguration.",
    "result": "Corrected DNS settings and verified connectivity with user.",
    "followUpRequired": false
  }'
```

### 10.4. Get Requester Dashboard

```bash
curl -X GET http://localhost:5000/api/dashboards/requester \
  -H "Cookie: toktickit.sid=<requester-session-cookie>"
```

### 10.5. Get IT Staff Dashboard

```bash
curl -X GET http://localhost:5000/api/dashboards/staff \
  -H "Cookie: toktickit.sid=<staff-session-cookie>"
```

---

## 11. Definition of Done for API Implementation

- [ ] All 5 new Lab 4 endpoints implemented and functional
- [ ] POST /api/staff/tickets/:ticketNumber/actions validates all fields correctly
- [ ] GET /api/staff/tickets/:ticketNumber/actions returns actions in chronological order
- [ ] PATCH /api/staff/tickets/:ticketNumber/actions/:actionId enforces performer and 24-hour rules
- [ ] PATCH /api/staff/tickets/:ticketNumber validates follow-up actions before RESOLVED transition
- [ ] GET /api/dashboards/requester returns correct counts for all 4 metrics
- [ ] GET /api/dashboards/staff returns correct counts for all 6 metrics and breakdowns
- [ ] All authorization rules enforced (role-based access control)
- [ ] All validation error messages are clear and actionable
- [ ] All error responses follow standard format with appropriate HTTP status codes
- [ ] Prisma schema updated with ActionTaken model and relations
- [ ] Database migration created and tested
- [ ] All Supertest API tests pass
- [ ] No breaking changes to Lab 1-3 endpoints
- [ ] API documentation is complete and accurate

-----