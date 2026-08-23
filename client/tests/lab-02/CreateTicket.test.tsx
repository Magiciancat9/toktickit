import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateTicket } from "../../src/components/CreateTicket.js";
import * as api from "../../src/api.js";
import { RequesterProvider, useRequester } from "../../src/context/RequesterContext.js";

// ── Constants ─────────────────────────────────────────────────────────────

const MOCK_CATEGORIES = [
  { id: 1, name: "Account and Access" },
  { id: 2, name: "Hardware" },
];
const MOCK_SYSTEMS = [
  { id: 1, name: "Corporate Laptop" },
  { id: 2, name: "Email" },
];
const MOCK_TICKET = {
  id: 1,
  ticketNumber: "TKT-2026-000001",
  requesterId: 1,
  categoryId: 2,
  relatedSystemId: 1,
  summary: "Laptop battery drains quickly",
  description: "Battery drains much faster than usual after the last update.",
  requestedPriority: "MEDIUM" as const,
  status: "NEW",
  ticketDate: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
const MOCK_REQUESTER = { id: 1, name: "Jennifer Anderson", email: "jennifer@example.com" };

// ── Helper: render CreateTicket with a pre-selected requester ─────────────

/**
 * Seeds the RequesterContext with a mock requester, then renders CreateTicket.
 * Uses a stable inner component that calls selectRequester during render.
 */
function renderWithRequester(onCancel = vi.fn()) {
  function Seeder() {
    const { selectRequester, currentRequester } = useRequester();
    if (!currentRequester) {
      // Call during render phase is fine here — setState during render is
      // acceptable in React when used to initialise state from a prop/context.
      // We use act to flush any resulting state updates.
      selectRequester(MOCK_REQUESTER);
    }
    return <CreateTicket onCancel={onCancel} />;
  }

  return render(
    <RequesterProvider>
      <Seeder />
    </RequesterProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("CreateTicket component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchCategories").mockResolvedValue(MOCK_CATEGORIES);
    vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue(MOCK_SYSTEMS);
  });

  // ── Reference data states ──────────────────────────────────────────────

  it("shows a loading spinner while reference data is being fetched", () => {
    vi.spyOn(api, "fetchCategories").mockReturnValue(new Promise(() => {}));
    vi.spyOn(api, "fetchRelatedSystems").mockReturnValue(new Promise(() => {}));
    renderWithRequester();
    expect(screen.getByTestId("create-ticket-ref-loading")).toBeInTheDocument();
  });

  it("renders the form after reference data loads", async () => {
    renderWithRequester();
    await waitFor(() => {
      expect(screen.getByTestId("create-ticket-form")).toBeInTheDocument();
    });
  });

  it("shows error state when reference data fails to load", async () => {
    vi.spyOn(api, "fetchCategories").mockRejectedValue(new Error("Network error"));
    vi.spyOn(api, "fetchRelatedSystems").mockRejectedValue(new Error("Network error"));
    renderWithRequester();
    await waitFor(() => {
      expect(screen.getByTestId("create-ticket-ref-error")).toBeInTheDocument();
    });
  });

  // ── Required field inputs present ─────────────────────────────────────

  it("renders all required field inputs after loading", async () => {
    renderWithRequester();
    await waitFor(() => expect(screen.getByTestId("create-ticket-form")).toBeInTheDocument());
    expect(screen.getByTestId("summary-input")).toBeInTheDocument();
    expect(screen.getByTestId("description-input")).toBeInTheDocument();
    expect(screen.getByTestId("category-select")).toBeInTheDocument();
    expect(screen.getByTestId("system-select")).toBeInTheDocument();
    expect(screen.getByTestId("priority-select")).toBeInTheDocument();
  });

  it("pre-fills the Requester field as read-only from context", async () => {
    renderWithRequester();
    await waitFor(() => expect(screen.getByTestId("create-ticket-form")).toBeInTheDocument());
    expect(screen.getByTestId("requester-readonly")).toHaveValue("Jennifer Anderson");
  });

  // ── Field-level validation errors ─────────────────────────────────────

  it("shows a summary error when summary is empty on submit", async () => {
    renderWithRequester();
    await waitFor(() => expect(screen.getByTestId("submit-btn")).toBeInTheDocument());
    await userEvent.click(screen.getByTestId("submit-btn"));
    expect(screen.getByTestId("error-summary")).toHaveTextContent("Summary is required.");
  });

  it("shows a summary error when summary is too short", async () => {
    renderWithRequester();
    await waitFor(() => expect(screen.getByTestId("submit-btn")).toBeInTheDocument());
    await userEvent.type(screen.getByTestId("summary-input"), "Hi");
    await userEvent.click(screen.getByTestId("submit-btn"));
    expect(screen.getByTestId("error-summary")).toHaveTextContent("at least 5 characters");
  });

  it("shows a description error when description is empty on submit", async () => {
    renderWithRequester();
    await waitFor(() => expect(screen.getByTestId("submit-btn")).toBeInTheDocument());
    await userEvent.click(screen.getByTestId("submit-btn"));
    expect(screen.getByTestId("error-description")).toBeInTheDocument();
  });

  it("shows a description error when description is too short", async () => {
    renderWithRequester();
    await waitFor(() => expect(screen.getByTestId("submit-btn")).toBeInTheDocument());
    await userEvent.type(screen.getByTestId("description-input"), "Too short");
    await userEvent.click(screen.getByTestId("submit-btn"));
    expect(screen.getByTestId("error-description")).toHaveTextContent("at least 10 characters");
  });

  it("does not call the API when there are validation errors", async () => {
    const spy = vi.spyOn(api, "createTicket");
    renderWithRequester();
    await waitFor(() => expect(screen.getByTestId("submit-btn")).toBeInTheDocument());
    await userEvent.click(screen.getByTestId("submit-btn"));
    expect(spy).not.toHaveBeenCalled();
  });

  // ── File validation ────────────────────────────────────────────────────

  it("shows an error for an unsupported file type", async () => {
    renderWithRequester();
    await waitFor(() => expect(screen.getByTestId("file-input")).toBeInTheDocument());
    const badFile = new File(["content"], "malware.exe", { type: "application/octet-stream" });
    await userEvent.upload(screen.getByTestId("file-input"), badFile);
    await waitFor(() => {
      expect(screen.getByTestId("file-error-0")).toBeInTheDocument();
    });
    expect(screen.getByTestId("file-error-0")).toHaveTextContent("not an allowed file type");
  });

  it("shows an error for a file that exceeds 5 MB", async () => {
    renderWithRequester();
    await waitFor(() => expect(screen.getByTestId("file-input")).toBeInTheDocument());
    const bigContent = new Uint8Array(6 * 1024 * 1024);
    const bigFile = new File([bigContent], "large.jpg", { type: "image/jpeg" });
    await userEvent.upload(screen.getByTestId("file-input"), bigFile);
    await waitFor(() => {
      expect(screen.getByTestId("file-error-0")).toBeInTheDocument();
    });
    expect(screen.getByTestId("file-error-0")).toHaveTextContent("5 MB");
  });

  it("accepts a valid PDF file without showing an error", async () => {
    renderWithRequester();
    await waitFor(() => expect(screen.getByTestId("file-input")).toBeInTheDocument());
    const validFile = new File(["pdf content"], "report.pdf", { type: "application/pdf" });
    await userEvent.upload(screen.getByTestId("file-input"), validFile);
    await waitFor(() => {
      expect(screen.getByTestId("pending-file-0")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("file-error-0")).not.toBeInTheDocument();
  });

  // ── Busy / disabled state ──────────────────────────────────────────────

  it("disables the submit button and shows spinner while submitting", async () => {
    vi.spyOn(api, "createTicket").mockReturnValue(new Promise(() => {}));
    renderWithRequester();
    await waitFor(() => expect(screen.getByTestId("submit-btn")).toBeInTheDocument());

    await userEvent.type(screen.getByTestId("summary-input"), "Valid summary text");
    await userEvent.type(screen.getByTestId("description-input"), "Valid description that is long enough.");
    await userEvent.selectOptions(screen.getByTestId("category-select"), "2");
    await userEvent.selectOptions(screen.getByTestId("system-select"), "1");
    await userEvent.selectOptions(screen.getByTestId("priority-select"), "MEDIUM");
    await userEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("submit-btn")).toBeDisabled();
    });
    expect(screen.getByTestId("submit-btn")).toHaveTextContent("Submitting");
  });

  // ── Success state ──────────────────────────────────────────────────────

  it("shows the success state with the generated Ticket Number", async () => {
    vi.spyOn(api, "createTicket").mockResolvedValue(MOCK_TICKET);
    renderWithRequester();
    await waitFor(() => expect(screen.getByTestId("submit-btn")).toBeInTheDocument());

    await userEvent.type(screen.getByTestId("summary-input"), "Valid summary text");
    await userEvent.type(screen.getByTestId("description-input"), "Valid description that is long enough.");
    await userEvent.selectOptions(screen.getByTestId("category-select"), "2");
    await userEvent.selectOptions(screen.getByTestId("system-select"), "1");
    await userEvent.selectOptions(screen.getByTestId("priority-select"), "MEDIUM");
    await userEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("create-ticket-success")).toBeInTheDocument();
    });
    expect(screen.getByTestId("success-ticket-number")).toHaveTextContent("TKT-2026-000001");
  });

  // ── API failure — form values preserved ───────────────────────────────

  it("shows API error banner and preserves form values on backend failure", async () => {
    vi.spyOn(api, "createTicket").mockRejectedValue(new Error("Server error"));
    renderWithRequester();
    await waitFor(() => expect(screen.getByTestId("submit-btn")).toBeInTheDocument());

    const summaryText = "Valid summary text";
    await userEvent.type(screen.getByTestId("summary-input"), summaryText);
    await userEvent.type(screen.getByTestId("description-input"), "Valid description that is long enough.");
    await userEvent.selectOptions(screen.getByTestId("category-select"), "2");
    await userEvent.selectOptions(screen.getByTestId("system-select"), "1");
    await userEvent.selectOptions(screen.getByTestId("priority-select"), "MEDIUM");
    await userEvent.click(screen.getByTestId("submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("api-error-banner")).toBeInTheDocument();
    });
    // Form values preserved after failure
    expect(screen.getByTestId("summary-input")).toHaveValue(summaryText);
  });
});
