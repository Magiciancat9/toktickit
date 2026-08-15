import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("App", () => {
  beforeEach(() => {
    vi.spyOn(api, "fetchHealth").mockResolvedValue({
      status: "online",
      service: "TokTickIT API",
    });
  });

  it("renders the TokTickIT heading and health status", async () => {
    render(<App />);
    expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("online-status")).toHaveTextContent("Backend: online (TokTickIT API)");
    });
  });

  it.todo("shows Online and the seeded categories on success");
  it.todo("shows an Offline error message when the API is unavailable");
});
