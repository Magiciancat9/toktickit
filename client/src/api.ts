const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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

// Issue 2 + Issue 4 — call the backend.
export async function checkSystem(): Promise<SystemStatus> {
  const health = await fetchHealth();
  if (health.status !== "online" && health.status !== "ok") {
    throw new Error("Backend system is not online");
  }
  return {
    online: true,
    categories: [],
  };
}
