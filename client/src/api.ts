const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Requester {
  id: number;
  name: string;
  email: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface RelatedSystem {
  id: number;
  name: string;
}

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface Ticket {
  id: number;
  ticketNumber: string;
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority: Priority;
  status: string;
  ticketDate: string;
  createdAt: string;
  updatedAt: string;
  requester?:     { id: number; name: string };
  category?:      { id: number; name: string };
  relatedSystem?: { id: number; name: string };
}

export interface CreateTicketPayload {
  requesterId:       number;
  categoryId:        number;
  relatedSystemId:   number;
  summary:           string;
  description:       string;
  requestedPriority: Priority;
}

export interface AttachmentMeta {
  id:            number;
  originalName:  string;
  mimeType:      string;
  sizeBytes:     number;
  uploadedAt:    string;
  removedAt:     string | null;
  removalReason: string | null;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export interface HealthResponse {
  status: string;
  service: string;
}

// ── Requester ──────────────────────────────────────────────────────────────

/**
 * Fetches all active Development Requesters from GET /api/requesters.
 * Inactive Requesters are excluded by the backend.
 * This is a Lab 2 testing mechanism, not real authentication.
 */
export async function fetchRequesters(): Promise<Requester[]> {
  const response = await fetch(`${API_URL}/api/requesters`);
  if (!response.ok) throw new Error(`Failed to load requesters: ${response.status}`);
  return response.json();
}

// ── Reference data ─────────────────────────────────────────────────────────

/**
 * Fetches all active Categories from GET /api/categories.
 */
export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_URL}/api/categories`);
  if (!response.ok) throw new Error(`Failed to load categories: ${response.status}`);
  return response.json();
}

/**
 * Fetches all active Related Systems from GET /api/related-systems.
 */
export async function fetchRelatedSystems(): Promise<RelatedSystem[]> {
  const response = await fetch(`${API_URL}/api/related-systems`);
  if (!response.ok) throw new Error(`Failed to load related systems: ${response.status}`);
  return response.json();
}

// ── Health ─────────────────────────────────────────────────────────────────

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/api/health`);
  if (!response.ok) throw new Error(`Backend unavailable with status ${response.status}`);
  return response.json();
}

export async function checkSystem(): Promise<SystemStatus> {
  const [health, categories] = await Promise.all([fetchHealth(), fetchCategories()]);
  if (health.status !== "online" && health.status !== "ok") {
    throw new Error("Backend system is not online");
  }
  return { online: true, categories };
}

// ── Tickets ────────────────────────────────────────────────────────────────

/**
 * POST /api/tickets — creates a new ticket for the selected Requester.
 * Throws with parsed field errors on 400 validation failure.
 */
export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const response = await fetch(`${API_URL}/api/tickets`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const msg  = body?.error?.message ?? `Failed to create ticket: ${response.status}`;
    const err  = Object.assign(new Error(msg), { fields: body?.error?.fields ?? {} });
    throw err;
  }
  return response.json();
}

// ── Attachments ────────────────────────────────────────────────────────────

/**
 * POST /api/tickets/:ticketNumber/attachments — uploads one file.
 * Returns attachment metadata on success.
 */
export async function uploadAttachment(
  ticketNumber: string,
  requesterId: number,
  file: File
): Promise<AttachmentMeta> {
  const formData = new FormData();
  formData.append("requesterId", String(requesterId));
  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/api/tickets/${ticketNumber}/attachments`,
    { method: "POST", body: formData }
  );
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Upload failed: ${response.status}`);
  }
  return response.json();
}
