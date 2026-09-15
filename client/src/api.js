const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
// ── Requester ──────────────────────────────────────────────────────────────
/**
 * Fetches all active Development Requesters from GET /api/requesters.
 * Inactive Requesters are excluded by the backend.
 * This is a Lab 2 testing mechanism, not real authentication.
 */
export async function fetchRequesters() {
    const response = await fetch(`${API_URL}/api/requesters`);
    if (!response.ok)
        throw new Error(`Failed to load requesters: ${response.status}`);
    return response.json();
}
// ── Reference data ─────────────────────────────────────────────────────────
/**
 * Fetches all active Categories from GET /api/categories.
 */
export async function fetchCategories() {
    const response = await fetch(`${API_URL}/api/categories`);
    if (!response.ok)
        throw new Error(`Failed to load categories: ${response.status}`);
    return response.json();
}
/**
 * Fetches all active Related Systems from GET /api/related-systems.
 */
export async function fetchRelatedSystems() {
    const response = await fetch(`${API_URL}/api/related-systems`);
    if (!response.ok)
        throw new Error(`Failed to load related systems: ${response.status}`);
    return response.json();
}
// ── Health ─────────────────────────────────────────────────────────────────
export async function fetchHealth() {
    const response = await fetch(`${API_URL}/api/health`);
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
 * GET /api/tickets — returns the Requester's own tickets with search/filter/sort/pagination.
 */
export async function fetchTickets(params) {
    const qs = new URLSearchParams();
    qs.set("requesterId", String(params.requesterId));
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
    const response = await fetch(`${API_URL}/api/tickets?${qs.toString()}`);
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to load tickets: ${response.status}`);
    }
    return response.json();
}
/**
 * GET /api/tickets/:ticketNumber — returns one owned ticket with attachments.
 */
export async function fetchTicketByNumber(ticketNumber, requesterId) {
    const response = await fetch(`${API_URL}/api/tickets/${ticketNumber}?requesterId=${requesterId}`);
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Failed to load ticket: ${response.status}`);
    }
    return response.json();
}
/**
 * POST /api/tickets — creates a new ticket for the selected Requester.
 * Throws with parsed field errors on 400 validation failure.
 */
export async function createTicket(payload) {
    const response = await fetch(`${API_URL}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
 * Returns attachment metadata on success.
 */
export async function uploadAttachment(ticketNumber, requesterId, file) {
    const formData = new FormData();
    formData.append("requesterId", String(requesterId));
    formData.append("file", file);
    const response = await fetch(`${API_URL}/api/tickets/${ticketNumber}/attachments`, { method: "POST", body: formData });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Upload failed: ${response.status}`);
    }
    return response.json();
}
/**
 * PATCH /api/attachments/:id/remove — soft-removes an attachment.
 * Requires a removalReason of at least 5 characters.
 */
export async function removeAttachment(attachmentId, requesterId, removalReason) {
    const response = await fetch(`${API_URL}/api/attachments/${attachmentId}/remove`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId, removalReason }),
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
 * Blocked by the backend (410) if the attachment has been soft-removed.
 */
export function getAttachmentDownloadUrl(attachmentId, requesterId) {
    return `${API_URL}/api/attachments/${attachmentId}/download?requesterId=${requesterId}`;
}
