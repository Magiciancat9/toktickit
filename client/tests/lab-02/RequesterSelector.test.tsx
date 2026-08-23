import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequesterSelector } from "../../src/components/RequesterSelector.js";
import * as api from "../../src/api.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";

// Helper: wrap the component in RequesterProvider (required by useRequester hook)
function renderSelector() {
  return render(
    <RequesterProvider>
      <RequesterSelector />
    </RequesterProvider>
  );
}

const MOCK_REQUESTERS = [
  { id: 1, name: "Jennifer Anderson", email: "jennifer.anderson@example.com" },
  { id: 2, name: "Michael Brown",     email: "michael.brown@example.com" },
];

describe("RequesterSelector component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a loading state while fetching requesters", () => {
    // Never resolves — keeps component in loading state
    vi.spyOn(api, "fetchRequesters").mockReturnValue(new Promise(() => {}));
    renderSelector();
    expect(screen.getByTestId("selector-loading")).toBeInTheDocument();
  });

  it("renders the dropdown with active requesters after loading", async () => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValue(MOCK_REQUESTERS);
    renderSelector();

    await waitFor(() => {
      expect(screen.getByTestId("requester-select")).toBeInTheDocument();
    });

    expect(screen.getByText("Jennifer Anderson")).toBeInTheDocument();
    expect(screen.getByText("Michael Brown")).toBeInTheDocument();
  });

  it("shows an error state when the API call fails", async () => {
    vi.spyOn(api, "fetchRequesters").mockRejectedValue(new Error("Network error"));
    renderSelector();

    await waitFor(() => {
      expect(screen.getByTestId("selector-error")).toBeInTheDocument();
    });

    expect(screen.getByTestId("selector-error")).toHaveTextContent(
      "Unable to load requesters"
    );
  });

  it("shows an empty state when no active requesters exist", async () => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValue([]);
    renderSelector();

    await waitFor(() => {
      expect(screen.getByTestId("selector-empty")).toBeInTheDocument();
    });

    expect(screen.getByTestId("selector-empty")).toHaveTextContent(
      "No active requesters found"
    );
  });

  it("Continue button is disabled until a requester is selected", async () => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValue(MOCK_REQUESTERS);
    renderSelector();

    await waitFor(() => {
      expect(screen.getByTestId("selector-continue-btn")).toBeInTheDocument();
    });

    expect(screen.getByTestId("selector-continue-btn")).toBeDisabled();
  });

  it("Continue button becomes enabled after selecting a requester", async () => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValue(MOCK_REQUESTERS);
    renderSelector();

    await waitFor(() => {
      expect(screen.getByTestId("requester-select")).toBeInTheDocument();
    });

    await userEvent.selectOptions(
      screen.getByTestId("requester-select"),
      "1" // Jennifer Anderson id
    );

    expect(screen.getByTestId("selector-continue-btn")).not.toBeDisabled();
  });

  it("displays explanatory text that this is not a login screen", async () => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValue(MOCK_REQUESTERS);
    renderSelector();

    await waitFor(() => {
      expect(screen.getByTestId("requester-selector-screen")).toBeInTheDocument();
    });

    expect(screen.getByText(/not a login screen/i)).toBeInTheDocument();
  });
});
