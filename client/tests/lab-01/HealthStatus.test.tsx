import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import HealthStatus from "../../src/components/HealthStatus.js";
import * as api from "../../src/api.js";

describe("HealthStatus component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches health status on mount and displays online status when backend responds 200", async () => {
    vi.spyOn(api, "fetchHealth").mockResolvedValue({
      status: "online",
      service: "TokTickIT API",
    });

    render(<HealthStatus />);

    // Should display loading state initially
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();

    // After resolution, should display backend status from response
    await waitFor(() => {
      expect(screen.getByTestId("online-status")).toHaveTextContent("Backend: online (TokTickIT API)");
    });
  });

  it("displays clear error message when backend API fails", async () => {
    vi.spyOn(api, "fetchHealth").mockRejectedValue(new Error("Network error"));

    render(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByTestId("health-error-message")).toHaveTextContent(
        "Unable to reach the backend. Please try again later."
      );
    });

    expect(screen.getByTestId("error-status")).toHaveTextContent("Offline");
  });
});
