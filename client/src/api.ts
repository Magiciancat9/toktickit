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

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export interface HealthResponse {
  status: string;
  service: string;
}

/**
 * Fetches all active Development Requesters from GET /api/requesters.
 * Inactive Requesters are excluded by the backend.
 * This is a Lab 2 testing mechanism, not real authentication.
 */
export async function fetchRequesters(): Promise<Requester[]> {
  const response = await fetch(`${API_URL}/api/requesters`);
  if (!response.ok) {
    throw new Error(`Failed to load requesters: ${response.status}`);
  }
  const data: Requester[] = await response.json();
  return data;
}

/**
 * Sends a GET request to /api/health to check the backend service status.
 */
export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/api/health`);
  if (!response.ok) {
    throw new Error(`Backend unavailable with status ${response.status}`);
  }
  const data: HealthResponse = await response.json();
  return data;
}

/**
 * Fetches all categories from GET /api/categories.
 * Returns them in the order the API provides (name asc).
 */
export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_URL}/api/categories`);
  if (!response.ok) {
    throw new Error(`Failed to load categories: ${response.status}`);
  }
  const data: Category[] = await response.json();
  return data;
}

// Issue 2 + Issue 4 — call the backend.
export async function checkSystem(): Promise<SystemStatus> {
  const [health, categories] = await Promise.all([
    fetchHealth(),
    fetchCategories(),
  ]);
  if (health.status !== "online" && health.status !== "ok") {
    throw new Error("Backend system is not online");
  }
  return {
    online: true,
    categories,
  };
}
