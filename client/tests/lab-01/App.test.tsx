import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.js";
import * as api from "../../src/api.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";

// App now requires RequesterProvider in its tree (added in Lab 2 Issue 3).
// We also need a Requester to be pre-selected so App renders the main content
// instead of the RequesterSelector screen.
function renderAppWithRequester() {
  const utils = render(
    <RequesterProvider>
      <App />
    </RequesterProvider>
  );

  // Simulate a Requester already being selected by completing the selector flow.
  // The selector screen shows first — we need to drive past it.
  // Because we are testing App behavior (not the selector), we mock fetchRequesters
  // and click Continue to set the context before the main assertions run.
  return utils;
}

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // fetchRequesters is called by RequesterSelector on mount
    vi.spyOn(api, "fetchRequesters").mockResolvedValue([
      { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@example.com" },
    ]);
  });

  it("renders the TokTickIT heading and Check System button on load (after requester selection)", async () => {
    renderAppWithRequester();

    // First the selector screen is shown — select a requester and continue
    await waitFor(() => {
      expect(screen.getByTestId("requester-select")).toBeInTheDocument();
    });
    await userEvent.selectOptions(screen.getByTestId("requester-select"), "1");
    await userEvent.click(screen.getByTestId("selector-continue-btn"));

    // Now the main App content should be visible
    await waitFor(() => {
      expect(screen.getByTestId("check-system-btn")).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: /TokTickIT/i })).toBeInTheDocument();
  });

  it("shows Online status and seeded categories on success", async () => {
    vi.spyOn(api, "checkSystem").mockResolvedValue({
      online: true,
      categories: [
        { id: 1, name: "Account and Access" },
        { id: 2, name: "Hardware" },
        { id: 3, name: "Software" },
        { id: 4, name: "Network" },
      ],
    });

    renderAppWithRequester();

    // Drive past selector screen
    await waitFor(() => {
      expect(screen.getByTestId("requester-select")).toBeInTheDocument();
    });
    await userEvent.selectOptions(screen.getByTestId("requester-select"), "1");
    await userEvent.click(screen.getByTestId("selector-continue-btn"));

    // Click Check System
    await waitFor(() => {
      expect(screen.getByTestId("check-system-btn")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId("check-system-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("online-status")).toHaveTextContent("System Status: Online");
    });

    expect(screen.getByTestId("categories-list")).toBeInTheDocument();
    expect(screen.getByText("Account and Access")).toBeInTheDocument();
    expect(screen.getByText("Hardware")).toBeInTheDocument();
    expect(screen.getByText("Software")).toBeInTheDocument();
    expect(screen.getByText("Network")).toBeInTheDocument();
  });

  it("shows an Offline error message when the API is unavailable", async () => {
    vi.spyOn(api, "checkSystem").mockRejectedValue(new Error("Network error"));

    renderAppWithRequester();

    // Drive past selector screen
    await waitFor(() => {
      expect(screen.getByTestId("requester-select")).toBeInTheDocument();
    });
    await userEvent.selectOptions(screen.getByTestId("requester-select"), "1");
    await userEvent.click(screen.getByTestId("selector-continue-btn"));

    // Click Check System
    await waitFor(() => {
      expect(screen.getByTestId("check-system-btn")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId("check-system-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("offline-status")).toHaveTextContent("System Status: Offline");
    });

    expect(screen.getByTestId("health-error-message")).toHaveTextContent(
      "Unable to connect to TokTickIT API"
    );
  });
});
