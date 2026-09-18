# Lab 3 API Specification

## 1. Authentication Mechanism

### 1.1. Approach: Session-Based Authentication with HTTP-Only Cookies

**Rationale:** Session-based authentication with HTTP-only cookies is chosen for Lab 3 for simplicity, security, and ease of logout. Session cookies are automatically sent with each request, cannot be accessed by JavaScript (mitigating XSS attacks), and can be easily invalidated on logout.

**Implementation:**
- Backend uses `express-session` middleware with PostgreSQL session store (`connect-pg-simple`)
- Session cookie named `toktickit.sid` (configurable)
- Cookie attributes: `HttpOnly`, `Secure` (HTTPS only in production), `SameSite=Lax` (CSRF protection)
- Session expiration: 24 hours of inactivity (configurable)

**Alternative (Deferred):** JWT tokens stored in HTTP-only cookies. This is more complex for logout (requires token blacklist or short expiration + refresh tokens). Session-based is sufficient for Lab 3.

### 1.2. Password Hashing

- Algorithm: bcrypt
- Work factor: 10 (2^10 iterations)
- Passwords are never stored in plaintext
- Password hashes are never returned to the client

### 1.3. CSRF Protection

- `SameSite=Lax` cookie attribute provides CSRF protection for modern browsers
- For additional security, custom header validation can be added (e.g., require `X-Requested-With: XMLHttpRequest`)

---

## 2. Common Response Patterns

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

**400 Bad Request** — Validation errors, malformed request
```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Email address is required" },
      { "field": "password", "message": "Password must be at least 8 characters" }
    ]
  }
}
```

**401 Unauthorized** — Authentication required or invalid credentials
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

**404 Not Found** — Resource does not exist OR user does not have permission (safe error)
```json
{
  "error": {
    "message": "Resource not found"
  }
}
```

**409 Conflict** — Duplicate resource, invalid state transition
```json
{
  "error": {
    "message": "A user with this email already exists"
  }
}
```

**410 Gone** — Resource was removed (e.g., soft-deleted attachment)
```json
{
  "error": {
    "message": "This attachment has been removed"
  }
}
```

**500 Internal Server Error** — Unexpected server error
```json
{
  "error": {
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

### 2.3. Safe Error Messages

- **Do not reveal** whether an email exists during login ("Invalid email or password")
- **Do not reveal** whether a protected resource exists during 403/404 ("Resource not found" or "Forbidden")
- **Do not expose** Internal Note content or existence to Requester role (return 403 if endpoint is called)

---

## 3. Authentication Endpoints

### 3.1. POST /api/auth/login

**Purpose:** Authenticate user with email and password; establish session

**Request:**
```json
{
  "email": "jennifer.anderson@example.com",
  "password": "TempPass123!"
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "user": {
      "id": 5,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@example.com",
      "role": "REQUESTER",
      "requiresPasswordChange": true
    }
  }
}
```
- Session cookie `toktickit.sid` is set in response headers

**Error Responses:**
- **400 Bad Request:** Missing email or password
  ```json
  {
    "error": {
      "message": "Email and password are required"
    }
  }
  ```
- **401 Unauthorized:** Invalid credentials OR inactive account
  ```json
  {
    "error": {
      "message": "Invalid email or password"
    }
  }
  ```
  - **Important:** Same message whether email is wrong, password is wrong, or account is inactive (security: no user enumeration)

**Business Rules:**
- BR-01: Only active users (isActive = true) can authenticate
- BR-08: Generic error message for failed authentication
- BR-09: Inactive users receive same error as invalid credentials

---

### 3.2. POST /api/auth/logout

**Purpose:** Invalidate current session

**Request:** (No body, session cookie sent automatically)

**Success Response (204 No Content):**
- Session cookie is cleared/invalidated
- No response body

**Error Responses:**
- **401 Unauthorized:** No valid session (already logged out or session expired)

**Business Rules:**
- BR-10: Logout invalidates session; subsequent requests return 401

---

### 3.3. GET /api/auth/me

**Purpose:** Get current authenticated user information

**Request:** (No body, session cookie sent automatically)

**Success Response (200 OK):**
```json
{
  "data": {
    "user": {
      "id": 5,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@example.com",
      "role": "REQUESTER",
      "requiresPasswordChange": false
    }
  }
}
```

**Error Responses:**
- **401 Unauthorized:** No valid session

**Business Rules:**
- Used by frontend to determine authenticated user and role for navigation/UI

---

### 3.4. POST /api/auth/change-password

**Purpose:** Change user password (mandatory for first login or admin-reset passwords)

**Request:**
```json
{
  "currentPassword": "TempPass123!",
  "newPassword": "NewSecure456@",
  "confirmPassword": "NewSecure456@"
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "message": "Password changed successfully",
    "user": {
      "id": 5,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@example.com",
      "role": "REQUESTER",
      "requiresPasswordChange": false
    }
  }
}
```
- `requiresPasswordChange` flag is set to false
- User can now access normal application

**Error Responses:**
- **400 Bad Request:** Validation errors
  ```json
  {
    "error": {
      "message": "Validation failed",
      "details": [
        { "field": "newPassword", "message": "Password must be at least 8 characters" },
        { "field": "confirmPassword", "message": "Passwords do not match" }
      ]
    }
  }
  ```
- **401 Unauthorized:** Current password is incorrect
  ```json
  {
    "error": {
      "message": "Current password is incorrect"
    }
  }
  ```

**Business Rules:**
- BR-02: User with requiresPasswordChange=true cannot access normal app until password changed
- BR-03: Password must be at least 8 characters
- BR-04: Password must include uppercase, lowercase, number, special character
- BR-05: Confirmation must match new password
- BR-06: Current password must be validated
- BR-07: Passwords hashed with bcrypt before storage

---

## 4. Requester Endpoints (Lab 2 APIs with Authentication)

All Lab 2 Requester endpoints now require authentication. The authenticated user's ID is used for ownership checks. Client no longer supplies requesterId in request body.

### 4.1. POST /api/tickets

**Purpose:** Create a new ticket (requesterId from authenticated session)

**Request:**
```json
{
  "categoryId": 2,
  "relatedSystemId": 4,
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery is draining much faster than usual even when the system is idle. This started happening after last week's Windows update.",
  "requestedPriority": "MEDIUM"
}
```
- **Note:** `requesterId` is NOT in request body; derived from authenticated session

**Success Response (201 Created):**
```json
{
  "data": {
    "ticket": {
      "id": 42,
      "ticketNumber": "TKT-2026-000042",
      "requesterId": 5,
      "categoryId": 2,
      "relatedSystemId": 4,
      "summary": "Laptop battery drains quickly",
      "description": "My laptop battery is draining much faster than usual...",
      "requestedPriority": "MEDIUM",
      "itPriority": "MEDIUM",
      "status": "NEW",
      "ownerId": null,
      "problemResolvedByRequester": false,
      "ticketDate": "2026-09-14T14:30:00.000Z",
      "createdAt": "2026-09-14T14:30:00.000Z",
      "updatedAt": "2026-09-14T14:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request:** Validation errors (missing fields, invalid categoryId, etc.)
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Authenticated user is not a Requester (IT Staff/Admin cannot create tickets as Requester in Lab 3)

**Business Rules:**
- BR-13: Authenticated user identity determines ownership
- All Lab 2 validation rules apply (BR-05 through BR-09)

---

### 4.2. GET /api/tickets

**Purpose:** List tickets owned by authenticated user (My Tickets)

**Query Parameters:**
- `search` (optional): keyword search in Ticket Number and Summary
- `category` (optional): filter by categoryId
- `priority` (optional): filter by requestedPriority
- `status` (optional): filter by status
- `sort` (optional): `createdAt` or `updatedAt` (default: `createdAt`)
- `order` (optional): `asc` or `desc` (default: `desc`)
- `page` (optional): page number (default: 1)
- `pageSize` (optional): 10, 25, or 50 (default: 10)

**Example Request:**
```
GET /api/tickets?search=laptop&category=2&priority=MEDIUM&page=1&pageSize=10
```

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 42,
      "ticketNumber": "TKT-2026-000042",
      "summary": "Laptop battery drains quickly",
      "categoryName": "Hardware",
      "requestedPriority": "MEDIUM",
      "status": "NEW",
      "createdAt": "2026-09-14T14:30:00.000Z",
      "updatedAt": "2026-09-14T14:30:00.000Z"
    },
    ...
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "pageSize": 10,
    "totalPages": 2
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Not authenticated

**Business Rules:**
- Only tickets where `requesterId = authenticated user ID` are returned
- BR-13: Backend enforces ownership

---

### 4.3. GET /api/tickets/:ticketNumber

**Purpose:** Get detail of one owned ticket

**Success Response (200 OK):**
```json
{
  "data": {
    "ticket": {
      "id": 42,
      "ticketNumber": "TKT-2026-000042",
      "requesterId": 5,
      "requesterName": "Jennifer Anderson",
      "categoryId": 2,
      "categoryName": "Hardware",
      "relatedSystemId": 4,
      "relatedSystemName": "Corporate Laptop",
      "summary": "Laptop battery drains quickly",
      "description": "My laptop battery is draining...",
      "requestedPriority": "MEDIUM",
      "itPriority": "MEDIUM",
      "status": "NEW",
      "ownerId": null,
      "ownerName": null,
      "problemResolvedByRequester": false,
      "ticketDate": "2026-09-14T14:30:00.000Z",
      "createdAt": "2026-09-14T14:30:00.000Z",
      "updatedAt": "2026-09-14T14:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Ticket exists but authenticated user is not the owner
- **404 Not Found:** Ticket does not exist (same message as 403 for security)

**Business Rules:**
- BR-13: Only owner can view ticket
- BR-15: 403 if authenticated user is not owner
- BR-17: Safe error (403/404 use same generic message)

---

### 4.4. POST /api/tickets/:ticketNumber/comments

**Purpose:** Post a Public Comment on an owned ticket

**Request:**
```json
{
  "content": "Thank you for the update. Please let me know if you need any additional information."
}
```

**Success Response (201 Created):**
```json
{
  "data": {
    "comment": {
      "id": 15,
      "ticketId": 42,
      "authorId": 5,
      "authorName": "Jennifer Anderson",
      "authorRole": "REQUESTER",
      "content": "Thank you for the update...",
      "createdAt": "2026-09-14T15:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request:** Content is empty or whitespace-only, or exceeds 2000 characters
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Ticket exists but user is not the owner
- **404 Not Found:** Ticket does not exist

**Business Rules:**
- FR-19: Requester can post Public Comments on owned tickets
- BR-35: Requester can post Public Comments
- BR-39: Content must not be empty or whitespace-only
- BR-40: Max 2000 characters
- BR-41: Author identity from session

---

### 4.5. GET /api/tickets/:ticketNumber/comments

**Purpose:** List Public Comments on an owned ticket

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 14,
      "ticketId": 42,
      "authorId": 8,
      "authorName": "Michael Brown",
      "authorRole": "IT_STAFF",
      "content": "We are investigating the issue...",
      "createdAt": "2026-09-14T14:45:00.000Z"
    },
    {
      "id": 15,
      "ticketId": 42,
      "authorId": 5,
      "authorName": "Jennifer Anderson",
      "authorRole": "REQUESTER",
      "content": "Thank you for the update...",
      "createdAt": "2026-09-14T15:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Ticket exists but user is not the owner
- **404 Not Found:** Ticket does not exist

**Business Rules:**
- BR-33: Public Comments visible to Requester, IT Staff, Administrator
- Comments returned in chronological order

---

### 4.6. PATCH /api/tickets/:ticketNumber/problem-resolved

**Purpose:** Requester indicates that problem appears resolved

**Request:**
```json
{
  "problemResolvedByRequester": true
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "ticket": {
      "ticketNumber": "TKT-2026-000042",
      "problemResolvedByRequester": true
    }
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Ticket exists but user is not the owner
- **404 Not Found:** Ticket does not exist

**Business Rules:**
- FR-20: Requester can indicate problem appears resolved
- BR-31: This does NOT change ticket status to RESOLVED
- IT Staff/Administrator see this flag but must formally resolve the ticket

---

### 4.7. Attachment Endpoints (Unchanged from Lab 2, now with Auth)

All Lab 2 attachment endpoints work identically, but now require authentication and enforce ownership via session user ID.

**POST /api/tickets/:ticketNumber/attachments** — Upload attachment (owner only)

**GET /api/tickets/:ticketNumber/attachments** — List attachments (owner, IT Staff, Admin)

**GET /api/attachments/:id/download** — Download attachment (owner, IT Staff, Admin)

**PATCH /api/attachments/:id/remove** — Soft-remove attachment (owner only)

**Authorization:**
- Requester can upload and remove only on owned tickets
- IT Staff and Administrator can view and download attachments on any ticket
- IT Staff cannot upload attachments (Lab 3 limitation)

---

## 5. IT Staff Endpoints

All IT Staff endpoints require authentication and role check: `role = IT_STAFF` or `ADMINISTRATOR`.

### 5.1. GET /api/staff/tickets

**Purpose:** IT Staff Ticket Queue (all tickets, not limited to one requester)

**Query Parameters:**
- `search` (optional): keyword search in Ticket Number and Summary
- `category` (optional): filter by categoryId
- `reqPriority` (optional): filter by requestedPriority
- `itPriority` (optional): filter by itPriority
- `status` (optional): filter by status
- `assignment` (optional): `all` / `unassigned` / `assigned-to-me` / `assigned-to-others`
- `sort` (optional): `createdAt` / `updatedAt` / `itPriority` (default: `itPriority`)
- `order` (optional): `asc` / `desc` (default: `desc` for itPriority, `desc` for createdAt)
- `page` (optional): page number (default: 1)
- `pageSize` (optional): 10, 25, or 50 (default: 10)

**Example Request:**
```
GET /api/staff/tickets?itPriority=HIGH&assignment=unassigned&page=1&pageSize=25
```

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 42,
      "ticketNumber": "TKT-2026-000042",
      "summary": "Laptop battery drains quickly",
      "categoryName": "Hardware",
      "requestedPriority": "MEDIUM",
      "itPriority": "HIGH",
      "status": "NEW",
      "ownerId": null,
      "ownerName": null,
      "requesterName": "Jennifer Anderson",
      "createdAt": "2026-09-14T14:30:00.000Z",
      "updatedAt": "2026-09-14T14:30:00.000Z"
    },
    ...
  ],
  "meta": {
    "total": 87,
    "page": 1,
    "pageSize": 25,
    "totalPages": 4
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Authenticated user is not IT Staff or Administrator

**Business Rules:**
- FR-22: IT Staff can view all tickets
- FR-23: Supports search, filters, sorting, pagination
- BR-14: Server-side role authorization enforced

---

### 5.2. GET /api/staff/tickets/:ticketNumber

**Purpose:** Get ticket detail (IT Staff can view any ticket)

**Success Response (200 OK):**
```json
{
  "data": {
    "ticket": {
      "id": 42,
      "ticketNumber": "TKT-2026-000042",
      "requesterId": 5,
      "requesterName": "Jennifer Anderson",
      "categoryId": 2,
      "categoryName": "Hardware",
      "relatedSystemId": 4,
      "relatedSystemName": "Corporate Laptop",
      "summary": "Laptop battery drains quickly",
      "description": "My laptop battery is draining...",
      "requestedPriority": "MEDIUM",
      "itPriority": "HIGH",
      "status": "NEW",
      "ownerId": null,
      "ownerName": null,
      "problemResolvedByRequester": false,
      "ticketDate": "2026-09-14T14:30:00.000Z",
      "createdAt": "2026-09-14T14:30:00.000Z",
      "updatedAt": "2026-09-14T14:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Not IT Staff or Administrator
- **404 Not Found:** Ticket does not exist

**Business Rules:**
- FR-26: IT Staff can open any ticket
- No ownership restriction (unlike Requester endpoint)

---

### 5.3. PATCH /api/staff/tickets/:ticketNumber/owner

**Purpose:** Claim or reassign ticket ownership

**Request (Claim ticket):**
```json
{
  "ownerId": 8
}
```
- `ownerId` can be authenticated user's ID (claim) or another IT Staff/Admin user ID (reassign)
- `ownerId: null` to unassign

**Success Response (200 OK):**
```json
{
  "data": {
    "ticket": {
      "ticketNumber": "TKT-2026-000042",
      "ownerId": 8,
      "ownerName": "Michael Brown"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid ownerId (user does not exist or is not IT Staff/Administrator)
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Not IT Staff or Administrator
- **404 Not Found:** Ticket does not exist

**Business Rules:**
- FR-27: IT Staff can claim unassigned ticket
- FR-28: IT Staff can reassign to another active IT Staff or Administrator
- BR-20: Only IT Staff and Administrator can claim/reassign
- BR-21: Owner must be active IT Staff or Administrator

---

### 5.4. PATCH /api/staff/tickets/:ticketNumber/it-priority

**Purpose:** Update IT Priority

**Request:**
```json
{
  "itPriority": "HIGH"
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "ticket": {
      "ticketNumber": "TKT-2026-000042",
      "itPriority": "HIGH"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid priority value (must be LOW, MEDIUM, or HIGH)
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Not IT Staff or Administrator
- **404 Not Found:** Ticket does not exist

**Business Rules:**
- FR-29: IT Staff can update IT Priority
- BR-25: Only IT Staff or Administrator can change IT Priority
- BR-26: Allowed values: LOW, MEDIUM, HIGH

---

### 5.5. PATCH /api/staff/tickets/:ticketNumber/status

**Purpose:** Update ticket status (with transition validation)

**Request:**
```json
{
  "status": "OPEN"
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "ticket": {
      "ticketNumber": "TKT-2026-000042",
      "status": "OPEN",
      "updatedAt": "2026-09-14T16:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid status transition
  ```json
  {
    "error": {
      "message": "Invalid status transition: cannot change from NEW to RESOLVED directly"
    }
  }
  ```
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Not IT Staff or Administrator
- **404 Not Found:** Ticket does not exist

**Business Rules:**
- FR-30: IT Staff can change status through permitted transitions
- BR-29: Status transitions governed by transition matrix
- BR-30: Only IT Staff and Administrator can change status

**Status Transition Matrix (validated by backend):**

| From Status | Permitted Next Status(es) |
|-------------|---------------------------|
| NEW | OPEN, CANCELLED |
| OPEN | IN_PROGRESS, CANCELLED |
| IN_PROGRESS | WAITING_FOR_REQUESTER, RESOLVED, CANCELLED |
| WAITING_FOR_REQUESTER | IN_PROGRESS, RESOLVED, CANCELLED |
| RESOLVED | CLOSED, REOPENED |
| CLOSED | REOPENED |
| REOPENED | OPEN, IN_PROGRESS, RESOLVED, CANCELLED |
| CANCELLED | (terminal state) |

---

### 5.6. POST /api/staff/tickets/:ticketNumber/notes

**Purpose:** Create an Internal Note (IT Staff/Admin only)

**Request:**
```json
{
  "content": "Checked the device logs. Battery health is at 65%. Will recommend replacement."
}
```

**Success Response (201 Created):**
```json
{
  "data": {
    "note": {
      "id": 7,
      "ticketId": 42,
      "authorId": 8,
      "authorName": "Michael Brown",
      "authorRole": "IT_STAFF",
      "content": "Checked the device logs...",
      "createdAt": "2026-09-14T16:15:00.000Z"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request:** Content is empty or exceeds 2000 characters
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Not IT Staff or Administrator
- **404 Not Found:** Ticket does not exist

**Business Rules:**
- FR-32: Only IT Staff and Administrator can create Internal Notes
- BR-34: Internal Notes visible only to IT Staff and Administrator
- BR-36: Only IT Staff and Administrator can create
- BR-39: Content not empty
- BR-40: Max 2000 characters
- BR-41: Author identity from session

---

### 5.7. GET /api/staff/tickets/:ticketNumber/notes

**Purpose:** List Internal Notes (IT Staff/Admin only)

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 7,
      "ticketId": 42,
      "authorId": 8,
      "authorName": "Michael Brown",
      "authorRole": "IT_STAFF",
      "content": "Checked the device logs...",
      "createdAt": "2026-09-14T16:15:00.000Z"
    },
    ...
  ]
}
```

**Error Responses:**
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Not IT Staff or Administrator (Requester calling this endpoint gets 403 with NO note content exposed)
- **404 Not Found:** Ticket does not exist

**Business Rules:**
- BR-34: Internal Notes visible only to IT Staff and Administrator
- BR-17: Safe error (Requester gets 403 without confirming notes exist)

---

## 6. Administrator Endpoints

All Administrator endpoints require authentication and role check: `role = ADMINISTRATOR`.

### 6.1. GET /api/admin/users

**Purpose:** List all users with optional search and role filter

**Query Parameters:**
- `search` (optional): keyword search in name and email
- `role` (optional): filter by role (REQUESTER, IT_STAFF, ADMINISTRATOR)

**Example Request:**
```
GET /api/admin/users?search=anderson&role=REQUESTER
```

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": 5,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@example.com",
      "role": "REQUESTER",
      "isActive": true,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-09-14T12:00:00.000Z"
    },
    ...
  ]
}
```

**Error Responses:**
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Not Administrator

**Business Rules:**
- FR-41: Administrator can view all users
- FR-42: Search by name or email
- FR-43: Filter by role

---

### 6.2. POST /api/admin/users

**Purpose:** Create a new user

**Request:**
```json
{
  "name": "Alex Thompson",
  "email": "alex.thompson@example.com",
  "role": "IT_STAFF",
  "isActive": true,
  "initialPassword": "TempPass123!"
}
```

**Success Response (201 Created):**
```json
{
  "data": {
    "user": {
      "id": 12,
      "name": "Alex Thompson",
      "email": "alex.thompson@example.com",
      "role": "IT_STAFF",
      "isActive": true,
      "requiresPasswordChange": true,
      "createdAt": "2026-09-14T17:00:00.000Z",
      "updatedAt": "2026-09-14T17:00:00.000Z"
    }
  }
}
```
- `requiresPasswordChange` is automatically set to `true`

**Error Responses:**
- **400 Bad Request:** Validation errors
  ```json
  {
    "error": {
      "message": "Validation failed",
      "details": [
        { "field": "email", "message": "Please enter a valid email address" },
        { "field": "initialPassword", "message": "Password must be at least 8 characters" }
      ]
    }
  }
  ```
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Not Administrator
- **409 Conflict:** Duplicate email
  ```json
  {
    "error": {
      "message": "A user with this email already exists"
    }
  }
  ```

**Business Rules:**
- FR-44: Administrator can create user with one role, active state, initial password
- BR-42: One role only (REQUESTER, IT_STAFF, or ADMINISTRATOR)
- BR-43: Email must be unique
- BR-44: Duplicate email rejected with 409
- BR-50: Initial password is temporary; requiresPasswordChange = true

---

### 6.3. GET /api/admin/users/:id

**Purpose:** Get one user detail

**Success Response (200 OK):**
```json
{
  "data": {
    "user": {
      "id": 5,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@example.com",
      "role": "REQUESTER",
      "isActive": true,
      "requiresPasswordChange": false,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-09-14T12:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Not Administrator
- **404 Not Found:** User does not exist

---

### 6.4. PATCH /api/admin/users/:id

**Purpose:** Update user (name, email, role, isActive)

**Request:**
```json
{
  "name": "Jennifer Anderson",
  "email": "jennifer.anderson@example.com",
  "role": "IT_STAFF",
  "isActive": true
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "user": {
      "id": 5,
      "name": "Jennifer Anderson",
      "email": "jennifer.anderson@example.com",
      "role": "IT_STAFF",
      "isActive": true,
      "updatedAt": "2026-09-14T17:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request:** Validation errors (invalid email format, invalid role)
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Not Administrator OR attempting to deactivate own account
  ```json
  {
    "error": {
      "message": "You cannot deactivate your own account"
    }
  }
  ```
- **404 Not Found:** User does not exist
- **409 Conflict:** Duplicate email (if changing to an email that exists) OR attempting to deactivate last active Administrator
  ```json
  {
    "error": {
      "message": "Cannot deactivate the last active Administrator"
    }
  }
  ```

**Business Rules:**
- FR-46: Administrator can edit name, email, role, activation state
- BR-45: Email must remain unique
- BR-46: Administrator cannot deactivate own account
- BR-47: Cannot deactivate last active Administrator

---

### 6.5. POST /api/admin/users/:id/reset-password

**Purpose:** Set a new initial password for a user

**Request:**
```json
{
  "initialPassword": "NewTempPass456!"
}
```

**Success Response (200 OK):**
```json
{
  "data": {
    "message": "Initial password set successfully. User will be required to change it on next login."
  }
}
```
- Backend sets `requiresPasswordChange = true` for the user

**Error Responses:**
- **400 Bad Request:** Password does not meet requirements
  ```json
  {
    "error": {
      "message": "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
    }
  }
  ```
- **401 Unauthorized:** Not authenticated
- **403 Forbidden:** Not Administrator
- **404 Not Found:** User does not exist

**Business Rules:**
- FR-47: Administrator can set new initial password
- BR-49: User's requiresPasswordChange flag set to true
- BR-50: Initial password is temporary

---

## 7. Reference Data Endpoints (Unchanged, Now with Auth)

These Lab 1/Lab 2 endpoints continue to work, now requiring authentication.

### 7.1. GET /api/categories

**Purpose:** List active categories

**Success Response (200 OK):**
```json
{
  "data": [
    { "id": 1, "name": "Account and Access" },
    { "id": 2, "name": "Hardware" },
    { "id": 3, "name": "Software" },
    { "id": 4, "name": "Network" }
  ]
}
```

**Error Responses:**
- **401 Unauthorized:** Not authenticated

---

### 7.2. GET /api/related-systems

**Purpose:** List active related systems

**Success Response (200 OK):**
```json
{
  "data": [
    { "id": 1, "name": "Email" },
    { "id": 2, "name": "Campus Wi-Fi" },
    { "id": 3, "name": "VPN" },
    { "id": 4, "name": "LEB2 App" },
    { "id": 5, "name": "Grade Submission App" },
    { "id": 6, "name": "Corporate Laptop" }
  ]
}
```

**Error Responses:**
- **401 Unauthorized:** Not authenticated

---

## 8. Summary of HTTP Status Codes

| Status Code | Usage |
|-------------|-------|
| 200 OK | Successful GET, PATCH |
| 201 Created | Successful POST (resource created) |
| 204 No Content | Successful DELETE, logout |
| 400 Bad Request | Validation errors, malformed request, invalid state transition |
| 401 Unauthorized | Authentication required, invalid credentials, session expired |
| 403 Forbidden | Authenticated but not authorized (role mismatch, ownership violation) |
| 404 Not Found | Resource does not exist (or safe error hiding forbidden resource) |
| 409 Conflict | Duplicate resource (email), invalid state (last admin, self-deactivation) |
| 410 Gone | Soft-deleted resource (removed attachment) |
| 500 Internal Server Error | Unexpected server error |

---

## 9. Security Considerations

### 9.1. Authentication
- Session cookies are HTTP-only (not accessible via JavaScript)
- Session cookies use Secure flag in production (HTTPS only)
- Session cookies use SameSite=Lax for CSRF protection
- Passwords are hashed with bcrypt (never stored in plaintext)

### 9.2. Authorization
- Every protected endpoint validates authenticated user's role and ownership
- Forbidden access returns 403 without exposing resource existence
- Internal Notes are completely hidden from Requester (403 if endpoint called)

### 9.3. Safe Error Messages
- Login errors do not reveal whether email exists
- 403/404 errors do not confirm resource existence
- Internal Notes existence never exposed to Requester

### 9.4. Input Validation
- All request bodies validated before processing
- Email format validated
- Password complexity enforced
- Content length limits enforced (Summary 150 chars, Description/Comments/Notes 2000 chars)

### 9.5. CSRF Protection
- SameSite=Lax cookie attribute (modern browsers)
- Optional: require custom header (X-Requested-With) for additional protection

### 9.6. Rate Limiting (Recommended for Production, Optional for Lab 3)
- Login endpoint: limit failed attempts per IP/email
- Password change endpoint: limit attempts per user

---

## 10. Testing Considerations

### 10.1. Authentication Tests
- Valid login returns user data and sets session cookie
- Invalid credentials return 401 with generic error
- Inactive user login returns 401 with same generic error
- Logout invalidates session
- Unauthenticated requests to protected endpoints return 401

### 10.2. Authorization Tests
- Requester can only view/modify owned tickets
- Requester cannot access Internal Notes (403)
- IT Staff can view all tickets
- IT Staff can claim/reassign/update any ticket
- Administrator can manage all users
- Non-Administrator cannot access /api/admin/users (403)

### 10.3. Password Change Tests
- User with requiresPasswordChange=true is blocked from normal app
- Current password must be correct
- New password must meet requirements
- Confirmation must match
- After successful change, requiresPasswordChange=false

### 10.4. Status Transition Tests
- Valid transitions succeed
- Invalid transitions return 400

### 10.5. User Management Tests
- Duplicate email rejected with 409
- Administrator cannot deactivate own account (403)
- Cannot deactivate last active Administrator (409)
- Non-Administrator cannot access admin endpoints (403)
