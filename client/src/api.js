const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
// ── Requester ──────────────────────────────────────────────────────────────
/**
 * Fetches all active Development Requesters from GET /api/requesters.
 * Inactive Requesters are excluded by the backend.
 * This is a Lab 2 testing mechanism, not real authentication.
 */
export async function fetchRequesters() {
    const response = await fetch(`${API_URL}/api/requesters`, {
        credentials: "include"
    });
    if (!response.ok)
        throw new Error(`Failed to load requesters: ${response.status}`);
    return response.json();
}
// ── Reference data ─────────────────────────────────────────────────────────
/**
 * Fetches all active Categories from GET /api/categories.
 */
export async function fetchCategories() {
    const response = await fetch(`${API_URL}/api/categories`, {
        credentials: "include"
    });
    if (!response.ok)
        throw new Error(`Failed to load categories: ${response.status}`);
    return response.json();
}
/**
 * Fetches all active Related Systems from GET /api/related-systems.
 */
export async function fetchRelatedSystems() {
    const response = await fetch(`${API_URL}/api/related-systems`, {
        credentials: "include"
    });
    if (!response.ok)
        throw new Error(`Failed to load related systems: ${response.status}`);
    return response.json();
}
// ── Health ─────────────────────────────────────────────────────────────────
export async function fetchHealth() {
    const response = await fetch(`${API_URL}/api/health`, {
        credentials: "include"
    });
    if (!response.ok)
        throw new Error(`Backend unavailable with status ${response.status}`);
    return response.json();
}
export async function checkSystem() {
    const [health, categories] = await Promise.all([fetchHealth(), fetchCategories()]);
    if (health.status !== "online" && health.status !== "ok") {
        throw new Error("Backend system is not online");
    }
    return { online: true, categories };
}
/**
 * GET /api/tickets — returns the authenticated Requester's own tickets with search/filter/sort/pagination.
 * Requires valid session cookie.
 */
export async function fetchTickets(params) {
    const qs = new URLSearchParams();
    if (params.search)
        qs.set("search", params.search);
    if (params.category)
        qs.set("category", params.category);
    if (params.priority)
        qs.set("priority", params.priority);
    if (params.status)
        qs.set("status", params.status);
    if (params.sort)
        qs.set("sort", params.sort);
    if (params.order)
        qs.set("order", params.order);
    if (params.page)
        qs.set("page", String(params.page));
    if (params.pageSize)
        qs.set("pageSize", String(params.pageSize));
    const response = await fetch(`${API_URL}/api/tickets?${qs.toString()}`, {
        credentials: "include"
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to load tickets: ${response.status}`);
    }
    return response.json();
}
/**
 * GET /api/tickets/:ticketNumber — returns one owned ticket with attachments.
 * Requires valid session cookie.
 */
export async function fetchTicketByNumber(ticketNumber) {
    const response = await fetch(`${API_URL}/api/tickets/${ticketNumber}`, { credentials: "include" });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to load ticket: ${response.status}`);
    }
    return response.json();
}
/**
 * POST /api/tickets — creates a new ticket for the authenticated Requester.
 * Requires valid session cookie.
 * Throws with parsed field errors on 400 validation failure.
 */
export async function createTicket(payload) {
    const response = await fetch(`${API_URL}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include"
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const msg = body?.error?.message ?? `Failed to create ticket: ${response.status}`;
        const err = Object.assign(new Error(msg), { fields: body?.error?.fields ?? {} });
        throw err;
    }
    return response.json();
}
// ── Attachments ────────────────────────────────────────────────────────────
/**
 * POST /api/tickets/:ticketNumber/attachments — uploads one file.
 * Requires valid session cookie.
 * Returns attachment metadata on success.
 */
export async function uploadAttachment(ticketNumber, file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_URL}/api/tickets/${ticketNumber}/attachments`, {
        method: "POST",
        body: formData,
        credentials: "include"
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Upload failed: ${response.status}`);
    }
    return response.json();
}
/**
 * PATCH /api/attachments/:id/remove — soft-removes an attachment.
 * Requires valid session cookie.
 * Requires a removalReason of at least 5 characters.
 */
export async function removeAttachment(attachmentId, removalReason) {
    const response = await fetch(`${API_URL}/api/attachments/${attachmentId}/remove`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removalReason }),
        credentials: "include"
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Remove failed: ${response.status}`);
    }
    return response.json();
}
/**
 * Returns the URL to download an active attachment.
 * The browser navigates to this URL — no fetch needed.
 * Session cookie will be sent automatically by the browser.
 * Blocked by the backend (410) if the attachment has been soft-removed.
 */
export function getAttachmentDownloadUrl(attachmentId) {
    return `${API_URL}/api/attachments/${attachmentId}/download`;
}
/**
 * POST /api/tickets/:ticketNumber/comments — Post a Public Comment on owned ticket
 * Requires valid session cookie.
 */
export async function postComment(ticketNumber, content) {
    const response = await fetch(`${API_URL}/api/tickets/${ticketNumber}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to post comment: ${response.status}`);
    }
    const result = await response.json();
    return result.data.comment;
}
/**
 * GET /api/tickets/:ticketNumber/comments — List Public Comments on owned ticket
 * Requires valid session cookie.
 */
export async function getComments(ticketNumber) {
    const response = await fetch(`${API_URL}/api/tickets/${ticketNumber}/comments`, {
        credentials: "include",
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to load comments: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
}
// ── Problem Resolved ────────────────────────────────────────────────────────
/**
 * PATCH /api/tickets/:ticketNumber/problem-resolved — Requester indicates problem appears resolved
 * Requires valid session cookie.
 * This does NOT change the ticket status to RESOLVED.
 */
export async function setProblemResolved(ticketNumber, problemResolvedByRequester) {
    const response = await fetch(`${API_URL}/api/tickets/${ticketNumber}/problem-resolved`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemResolvedByRequester }),
        credentials: "include",
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to update ticket: ${response.status}`);
    }
}
/**
 * GET /api/staff/tickets — IT Staff Ticket Queue
 * Returns all tickets (not limited to one requester) with search/filter/sort/pagination
 * Requires valid session cookie and IT_STAFF or ADMINISTRATOR role
 */
export async function fetchStaffTickets(params) {
    const qs = new URLSearchParams();
    if (params.search)
        qs.set("search", params.search);
    if (params.category)
        qs.set("category", params.category);
    if (params.reqPriority)
        qs.set("reqPriority", params.reqPriority);
    if (params.itPriority)
        qs.set("itPriority", params.itPriority);
    if (params.status)
        qs.set("status", params.status);
    if (params.assignment)
        qs.set("assignment", params.assignment);
    if (params.sort)
        qs.set("sort", params.sort);
    if (params.order)
        qs.set("order", params.order);
    if (params.page)
        qs.set("page", String(params.page));
    if (params.pageSize)
        qs.set("pageSize", String(params.pageSize));
    const response = await fetch(`${API_URL}/api/staff/tickets?${qs.toString()}`, {
        credentials: "include"
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to load tickets: ${response.status}`);
    }
    return response.json();
}
/**
 * GET /api/staff/tickets/:ticketNumber — Get one ticket with full details for IT Staff
 * Requires IT_STAFF or ADMINISTRATOR role
 * Returns ticket with attachments, owner, category, related system, and all details
 */
export async function fetchStaffTicketByNumber(ticketNumber) {
    const response = await fetch(`${API_URL}/api/staff/tickets/${ticketNumber}`, {
        credentials: "include",
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to load ticket: ${response.status}`);
    }
    return response.json();
}
// ── IT Staff Ticket Operations ─────────────────────────────────────────────
/**
 * PATCH /api/staff/tickets/:ticketNumber/owner — Claim or reassign ticket ownership
 * Requires IT_STAFF or ADMINISTRATOR role
 */
export async function updateTicketOwner(ticketNumber, ownerId) {
    const response = await fetch(`${API_URL}/api/staff/tickets/${ticketNumber}/owner`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId }),
        credentials: "include",
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to update owner: ${response.status}`);
    }
}
/**
 * PATCH /api/staff/tickets/:ticketNumber/it-priority — Update IT Priority
 * Requires IT_STAFF or ADMINISTRATOR role
 */
export async function updateItPriority(ticketNumber, itPriority) {
    const response = await fetch(`${API_URL}/api/staff/tickets/${ticketNumber}/it-priority`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itPriority }),
        credentials: "include",
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to update IT priority: ${response.status}`);
    }
}
/**
 * PATCH /api/staff/tickets/:ticketNumber/status — Update ticket status
 * Requires IT_STAFF or ADMINISTRATOR role
 * Validates status transitions according to workflow matrix
 */
export async function updateTicketStatus(ticketNumber, status) {
    const response = await fetch(`${API_URL}/api/staff/tickets/${ticketNumber}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to update status: ${response.status}`);
    }
}
/**
 * POST /api/staff/tickets/:ticketNumber/notes — Create Internal Note
 * Requires IT_STAFF or ADMINISTRATOR role
 */
export async function createInternalNote(ticketNumber, content) {
    const response = await fetch(`${API_URL}/api/staff/tickets/${ticketNumber}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to create note: ${response.status}`);
    }
    const result = await response.json();
    return result.data.note;
}
/**
 * GET /api/staff/tickets/:ticketNumber/notes — List Internal Notes
 * Requires IT_STAFF or ADMINISTRATOR role
 */
export async function getInternalNotes(ticketNumber) {
    const response = await fetch(`${API_URL}/api/staff/tickets/${ticketNumber}/notes`, {
        credentials: "include",
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to load notes: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
}
/**
 * GET /api/users?role=IT_STAFF — Fetch active IT Staff members for assignment
 * Note: This endpoint needs to be implemented if not already exists
 */
export async function fetchStaffUsers() {
    const response = await fetch(`${API_URL}/api/users?role=IT_STAFF`, {
        credentials: "include",
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to load staff users: ${response.status}`);
    }
    return response.json();
}
/**
 * GET /api/admin/users — Fetch all users for Admin User Management
 * Requires ADMINISTRATOR role
 */
export async function fetchAdminUsers(params) {
    const qs = new URLSearchParams();
    if (params?.search)
        qs.set("search", params.search);
    if (params?.role)
        qs.set("role", params.role);
    const response = await fetch(`${API_URL}/api/admin/users?${qs.toString()}`, {
        credentials: "include",
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to load users: ${response.status}`);
    }
    const result = await response.json();
    return result.data;
}
/**
 * POST /api/admin/users — Create a new user
 * Requires ADMINISTRATOR role
 */
export async function createAdminUser(payload) {
    const response = await fetch(`${API_URL}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw Object.assign(new Error(body?.error?.message ?? `Failed to create user: ${response.status}`), { status: response.status });
    }
    const result = await response.json();
    return result.data;
}
/**
 * PATCH /api/admin/users/:id — Update an existing user
 * Requires ADMINISTRATOR role
 */
export async function updateAdminUser(id, payload) {
    const response = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw Object.assign(new Error(body?.error?.message ?? `Failed to update user: ${response.status}`), { status: response.status });
    }
    const result = await response.json();
    return result.data;
}
/**
 * POST /api/admin/users/:id/reset-password — Reset user password
 * Requires ADMINISTRATOR role
 */
export async function resetAdminUserPassword(id, newPassword) {
    const response = await fetch(`${API_URL}/api/admin/users/${id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
        credentials: "include",
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to reset password: ${response.status}`);
    }
}
