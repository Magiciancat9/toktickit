# Lab 2 API Specification

All endpoints are prefixed with `/api`. Request and response bodies use `Content-Type: application/json` unless noted otherwise. File uploads use `Content-Type: multipart/form-data`.

---

## General Conventions

### Ownership
Since Lab 2 has no authentication, the `requesterId` is supplied by the client in request bodies or query parameters. The backend validates that the supplied `requesterId` refers to an active Requester and enforces that the Requester owns the resource being accessed. This will be replaced by a JWT claim in Lab 3.

### Error Response Shape
All error responses use a consistent shape:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "fields": {
      "summary": "Summary is required and must be at least 5 characters."
    }
  }
}
```
`fields` is only present for validation errors (HTTP 400). All other errors omit `fields`.

### Pagination Response Shape
All paginated list endpoints return:
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### HTTP Status Codes Used
| Code | Meaning |
|------|---------|
| 200 | Successful retrieval or update |
| 201 | Resource created successfully |
| 400 | Invalid input / validation failure |
| 403 | Ownership failure — Requester does not own the resource |
| 404 | Resource not found |
| 409 | Conflict — e.g. maximum attachments already reached |
| 410 | Gone — resource was soft-removed and is no longer available |
| 415 | Unsupported media type — invalid attachment file type |
| 500 | Unexpected server error — safe message, no internal details exposed |

---

## 1. GET /api/requesters

Retrieve all active Development Requesters for the selector dropdown.

### Request
No parameters required.

### Response — 200 OK
```json
[
  { "id": 1, "name": "Jennifer Anderson", "email": "jennifer.anderson@example.com" },
  { "id": 2, "name": "Michael Brown",    "email": "michael.brown@example.com" },
  { "id": 3, "name": "Sarah Johnson",    "email": "sarah.johnson@example.com" },
  { "id": 4, "name": "David Lee",        "email": "david.lee@example.com" }
]
```
Only Requesters with `isActive: true` are returned. Inactive Requesters are never included.

### Error Responses
| Status | Code | Condition |
|--------|------|-----------|
| 500 | `SERVER_ERROR` | Unexpected database or server failure |

---

## 2. GET /api/categories

Retrieve all active Ticket Categories.

### Request
No parameters required.

### Response — 200 OK
```json
[
  { "id": 1, "name": "Account and Access" },
  { "id": 2, "name": "Hardware" },
  { "id": 3, "name": "Network" },
  { "id": 4, "name": "Software" }
]
```
Ordered by `name` ascending.

### Error Responses
| Status | Code | Condition |
|--------|------|-----------|
| 500 | `SERVER_ERROR` | Unexpected failure |

---

## 3. GET /api/related-systems

Retrieve all active Related Systems.

### Request
No parameters required.

### Response — 200 OK
```json
[
  { "id": 1, "name": "Campus Wi-Fi" },
  { "id": 2, "name": "Corporate Laptop" },
  { "id": 3, "name": "Email" },
  { "id": 4, "name": "Grade Submission App" },
  { "id": 5, "name": "LEB2 App" },
  { "id": 6, "name": "VPN" }
]
```
Ordered by `name` ascending. Only systems with `isActive: true` are returned.

### Error Responses
| Status | Code | Condition |
|--------|------|-----------|
| 500 | `SERVER_ERROR` | Unexpected failure |

---

## 4. POST /api/tickets

Create a new Ticket for the specified Development Requester.

### Request Body
```json
{
  "requesterId": 1,
  "categoryId": 2,
  "relatedSystemId": 3,
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery is draining much faster than usual even when the system is idle. This started happening after last week's Windows update.",
  "requestedPriority": "MEDIUM"
}
```

### Field Validation Rules
| Field | Required | Rules |
|-------|----------|-------|
| `requesterId` | Yes | Must be an integer; must reference an active Requester |
| `categoryId` | Yes | Must be an integer; must reference an active Category |
| `relatedSystemId` | Yes | Must be an integer; must reference an active Related System |
| `summary` | Yes | String; trimmed; min 5 chars, max 150 chars |
| `description` | Yes | String; trimmed; min 10 chars, max 2000 chars |
| `requestedPriority` | Yes | One of: `LOW`, `MEDIUM`, `HIGH` |

### Response — 201 Created
```json
{
  "id": 7,
  "ticketNumber": "TKT-2026-000007",
  "requesterId": 1,
  "categoryId": 2,
  "relatedSystemId": 3,
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery is draining much faster than usual...",
  "requestedPriority": "MEDIUM",
  "status": "NEW",
  "ticketDate": "2026-08-15T10:30:00.000Z",
  "createdAt": "2026-08-15T10:30:00.000Z",
  "updatedAt": "2026-08-15T10:30:00.000Z"
}
```

### Error Responses
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Any required field missing, too short, too long, or invalid value; `fields` object identifies the failing field(s) |
| 400 | `INVALID_REQUESTER` | `requesterId` does not exist or is inactive |
| 400 | `INVALID_REFERENCE` | `categoryId` or `relatedSystemId` does not exist or is inactive |
| 500 | `SERVER_ERROR` | Unexpected failure |

---

## 5. GET /api/tickets

Retrieve the selected Requester's tickets with optional search, filter, sort, and pagination.

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `requesterId` | integer | Yes | — | Owner of the tickets to retrieve |
| `search` | string | No | — | Case-insensitive substring match on `ticketNumber` and `summary` |
| `category` | string | No | — | Filter by category name (e.g. `Hardware`) |
| `priority` | string | No | — | Filter by `requestedPriority`: `LOW`, `MEDIUM`, or `HIGH` |
| `status` | string | No | — | Filter by `status`: `NEW` |
| `sort` | string | No | `createdAt` | Field to sort by: `createdAt` or `updatedAt` |
| `order` | string | No | `desc` | Sort direction: `asc` or `desc` |
| `page` | integer | No | `1` | Page number (1-indexed) |
| `pageSize` | integer | No | `10` | Results per page; allowed values: `10`, `25`, `50` |

### Example Request
```
GET /api/tickets?requesterId=1&search=laptop&category=Hardware&sort=createdAt&order=desc&page=1&pageSize=10
```

### Response — 200 OK
```json
{
  "data": [
    {
      "id": 7,
      "ticketNumber": "TKT-2026-000007",
      "summary": "Laptop battery drains quickly",
      "category": { "id": 2, "name": "Hardware" },
      "relatedSystem": { "id": 2, "name": "Corporate Laptop" },
      "requestedPriority": "MEDIUM",
      "status": "NEW",
      "ticketDate": "2026-08-15T10:30:00.000Z",
      "createdAt": "2026-08-15T10:30:00.000Z",
      "updatedAt": "2026-08-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 1,
    "totalPages": 1
  }
}
```
If no tickets match, `data` is an empty array and `meta.total` is `0`.

### Invalid Parameter Behaviour
| Condition | Behaviour |
|-----------|-----------|
| `requesterId` missing or non-integer | 400 `VALIDATION_ERROR` |
| `requesterId` references inactive or non-existent Requester | 400 `INVALID_REQUESTER` |
| `page` < 1 or non-integer | Treated as page 1 |
| `pageSize` not in `[10, 25, 50]` | Treated as 10 |
| `sort` not in allowed values | Treated as `createdAt` |
| `order` not `asc` or `desc` | Treated as `desc` |
| Unknown filter values (e.g. invalid priority) | 400 `VALIDATION_ERROR` |

### Error Responses
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Missing or invalid `requesterId` or filter value |
| 500 | `SERVER_ERROR` | Unexpected failure |

---

## 6. GET /api/tickets/:ticketNumber

Retrieve one Ticket by its Ticket Number, owned by the specified Requester.

### Path Parameter
| Parameter | Description |
|-----------|-------------|
| `ticketNumber` | e.g. `TKT-2026-000007` |

### Query Parameter
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `requesterId` | integer | Yes | Must match the ticket's owner |

### Example Request
```
GET /api/tickets/TKT-2026-000007?requesterId=1
```

### Response — 200 OK
```json
{
  "id": 7,
  "ticketNumber": "TKT-2026-000007",
  "requester": { "id": 1, "name": "Jennifer Anderson" },
  "category": { "id": 2, "name": "Hardware" },
  "relatedSystem": { "id": 2, "name": "Corporate Laptop" },
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery is draining much faster than usual...",
  "requestedPriority": "MEDIUM",
  "status": "NEW",
  "ticketDate": "2026-08-15T10:30:00.000Z",
  "createdAt": "2026-08-15T10:30:00.000Z",
  "updatedAt": "2026-08-15T10:30:00.000Z",
  "attachments": [
    {
      "id": 3,
      "originalName": "screenshot.png",
      "mimeType": "image/png",
      "sizeBytes": 204800,
      "uploadedAt": "2026-08-15T11:00:00.000Z",
      "removedAt": null,
      "removalReason": null
    }
  ]
}
```

### Error Responses
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | `requesterId` missing or invalid |
| 403 | `FORBIDDEN` | Ticket exists but `requesterId` does not match ticket owner |
| 404 | `NOT_FOUND` | Ticket Number does not exist |
| 500 | `SERVER_ERROR` | Unexpected failure |

---

## 7. POST /api/tickets/:ticketNumber/attachments

Upload a new attachment to an existing Ticket.

### Path Parameter
| Parameter | Description |
|-----------|-------------|
| `ticketNumber` | e.g. `TKT-2026-000007` |

### Request
`Content-Type: multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `requesterId` | integer (form field) | Yes | Must match the ticket owner |
| `file` | file | Yes | The attachment file |

### Validation Rules
| Rule | Error |
|------|-------|
| File type must be JPG, JPEG, PNG, WEBP, or PDF | 415 `UNSUPPORTED_MEDIA_TYPE` |
| File size must be ≤ 5 MB | 400 `FILE_TOO_LARGE` |
| Ticket must have fewer than 5 active attachments | 409 `ATTACHMENT_LIMIT_REACHED` |
| `requesterId` must match ticket owner | 403 `FORBIDDEN` |

### Response — 201 Created
```json
{
  "id": 4,
  "ticketId": 7,
  "originalName": "battery_report.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 512000,
  "uploadedAt": "2026-08-15T11:30:00.000Z",
  "removedAt": null,
  "removalReason": null
}
```

### Error Responses
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | `requesterId` missing or non-integer |
| 400 | `FILE_TOO_LARGE` | File exceeds 5 MB |
| 403 | `FORBIDDEN` | `requesterId` does not own the ticket |
| 404 | `NOT_FOUND` | Ticket Number not found |
| 409 | `ATTACHMENT_LIMIT_REACHED` | Ticket already has 5 active attachments |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | File type not in allowed list |
| 500 | `SERVER_ERROR` | Unexpected failure; ticket is retained even if file storage fails |

---

## 8. GET /api/tickets/:ticketNumber/attachments

Retrieve all attachment metadata for a Ticket (active and removed).

### Path Parameter
| Parameter | Description |
|-----------|-------------|
| `ticketNumber` | e.g. `TKT-2026-000007` |

### Query Parameter
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `requesterId` | integer | Yes | Must match the ticket owner |

### Response — 200 OK
```json
[
  {
    "id": 3,
    "originalName": "screenshot.png",
    "mimeType": "image/png",
    "sizeBytes": 204800,
    "uploadedAt": "2026-08-15T11:00:00.000Z",
    "removedAt": null,
    "removalReason": null
  },
  {
    "id": 2,
    "originalName": "report.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 102400,
    "uploadedAt": "2026-08-15T10:45:00.000Z",
    "removedAt": "2026-08-16T09:00:00.000Z",
    "removalReason": "Not relevant to the issue"
  }
]
```
Ordered by `uploadedAt` ascending. Both active and soft-removed attachments are included. The `storedPath` is never returned to the client.

### Error Responses
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | `requesterId` missing or invalid |
| 403 | `FORBIDDEN` | `requesterId` does not own the ticket |
| 404 | `NOT_FOUND` | Ticket Number not found |
| 500 | `SERVER_ERROR` | Unexpected failure |

---

## 9. GET /api/attachments/:id/download

Download the file for an active attachment.

### Path Parameter
| Parameter | Description |
|-----------|-------------|
| `id` | Attachment ID (integer) |

### Query Parameter
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `requesterId` | integer | Yes | Must own the ticket that contains this attachment |

### Response — 200 OK
- `Content-Type`: the stored MIME type (e.g. `image/png`, `application/pdf`)
- `Content-Disposition`: `attachment; filename="<originalName>"`
- Body: raw file bytes

### Error Responses
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | `requesterId` missing or invalid |
| 403 | `FORBIDDEN` | `requesterId` does not own the ticket |
| 404 | `NOT_FOUND` | Attachment ID does not exist |
| 410 | `GONE` | Attachment has been soft-removed; download not permitted |
| 500 | `SERVER_ERROR` | Unexpected failure |

---

## 10. PATCH /api/attachments/:id/remove

Soft-remove an attachment. Sets `removedAt` and `removalReason`; file is no longer downloadable.

### Path Parameter
| Parameter | Description |
|-----------|-------------|
| `id` | Attachment ID (integer) |

### Request Body
```json
{
  "requesterId": 1,
  "removalReason": "Uploaded the wrong file by mistake"
}
```

### Validation Rules
| Field | Rules |
|-------|-------|
| `requesterId` | Required integer; must own the ticket |
| `removalReason` | Required string; trimmed; min 5 characters |

### Response — 200 OK
```json
{
  "id": 3,
  "originalName": "screenshot.png",
  "mimeType": "image/png",
  "sizeBytes": 204800,
  "uploadedAt": "2026-08-15T11:00:00.000Z",
  "removedAt": "2026-08-16T09:15:00.000Z",
  "removalReason": "Uploaded the wrong file by mistake"
}
```

### Error Responses
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | `requesterId` missing/invalid; `removalReason` missing or too short |
| 403 | `FORBIDDEN` | `requesterId` does not own the ticket that contains this attachment |
| 404 | `NOT_FOUND` | Attachment ID does not exist |
| 409 | `ALREADY_REMOVED` | Attachment is already soft-removed |
| 500 | `SERVER_ERROR` | Unexpected failure |

---

## Summary Table

| # | Method | Path | Purpose | Success | Auth-like Check |
|---|--------|------|---------|---------|-----------------|
| 1 | GET | `/api/requesters` | List active Requesters | 200 | None |
| 2 | GET | `/api/categories` | List active Categories | 200 | None |
| 3 | GET | `/api/related-systems` | List active Related Systems | 200 | None |
| 4 | POST | `/api/tickets` | Create a Ticket | 201 | `requesterId` active |
| 5 | GET | `/api/tickets` | List owned tickets (search/filter/sort/page) | 200 | `requesterId` active |
| 6 | GET | `/api/tickets/:ticketNumber` | Get one owned Ticket with attachments | 200 | `requesterId` owns ticket |
| 7 | POST | `/api/tickets/:ticketNumber/attachments` | Upload attachment | 201 | `requesterId` owns ticket |
| 8 | GET | `/api/tickets/:ticketNumber/attachments` | List attachment metadata | 200 | `requesterId` owns ticket |
| 9 | GET | `/api/attachments/:id/download` | Download active attachment | 200 | `requesterId` owns ticket |
| 10 | PATCH | `/api/attachments/:id/remove` | Soft-remove attachment | 200 | `requesterId` owns ticket |
