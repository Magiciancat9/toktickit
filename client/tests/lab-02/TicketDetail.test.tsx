import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TicketDetail } from "../../src/components/TicketDetail.js";
import * as api from "../../src/api.js";
import { RequesterProvider, useRequester } from "../../src/context/RequesterContext.js";

// ── Constants ─────────────────────────────────────────────────────────────

const MOCK_REQUESTER = { id: 1, name: "Jennifer Anderson", email: "jennifer@example.com" };

const ACTIVE_ATTACHMENT: api.AttachmentMeta = {
  id:            3,
  originalName:  "screenshot.png",
  mimeType:      "image/png",
  sizeBytes:     204800,
  uploadedAt:    new Date().toISOString(),
  removedAt:     null,
  removalReason: null,
};

const REMOVED_ATTACHMENT: api.AttachmentMeta = {
  id:            4,
  originalName:  "old-report.pdf",
  mimeType:      "application/pdf",
  sizeBytes:     512000,
  uploadedAt:    new Date().toISOString(),
  removedAt:     new Date().toISOString(),
  removalReason: "Not relevant to the issue",
};

const MOCK_TICKET = {
  id:               1,
  ticketNumber:     "TKT-2026-000001",
  requesterId:      1,
  categoryId:       1,
  relatedSystemId:  1,
  summary:          "Laptop battery drains quickly",
  description:      "Battery drains much faster than usual after last update.",
  requestedPriority: "MEDIUM" as api.Priority,
  status:           "NEW",
  ticketDate:       new Date().toISOString(),
  createdAt:        new Date().toISOString(),
  updatedAt:        new Date().toISOString(),
  requester:        { id: 1, name: "Jennifer Anderson" },
  category:         { id: 1, name: "Hardware" },
  relatedSystem:    { id: 1, name: "Corporate Laptop" },
  attachments:      [ACTIVE_ATTACHMENT, REMOVED_ATTACHMENT],
};

// ── Helper ────────────────────────────────────────────────────────────────

function renderTicketDetail(onBack = vi.fn()) {
  function Seeder() {
    const { selectRequester, currentRequester } = useRequester();
    if (!currentRequester) selectRequester(MOCK_REQUESTER);
    return <TicketDetail ticketNumber="TKT-2026-000001" onBack={onBack} />;
  }
  return render(
    <RequesterProvider>
      <Seeder />
    </RequesterProvider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe("TicketDetail component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchTicketByNumber").mockResolvedValue(MOCK_TICKET as never);
  });

  // ── Loading / error states ─────────────────────────────────────────────

  it("shows a loading state while the ticket is being fetched", () => {
    vi.spyOn(api, "fetchTicketByNumber").mockReturnValue(new Promise(() => {}));
    renderTicketDetail();
    expect(screen.getByTestId("ticket-detail-loading")).toBeInTheDocument();
  });

  it("shows an error state when the API call fails", async () => {
    vi.spyOn(api, "fetchTicketByNumber").mockRejectedValue(new Error("Not found"));
    renderTicketDetail();
    await waitFor(() => {
      expect(screen.getByTestId("ticket-detail-error")).toBeInTheDocument();
    });
  });

  // ── Ticket fields ──────────────────────────────────────────────────────

  it("renders the ticket screen after loading", async () => {
    renderTicketDetail();
    await waitFor(() => {
      expect(screen.getByTestId("ticket-detail-screen")).toBeInTheDocument();
    });
  });

  it("displays the ticket number as a read-only field", async () => {
    renderTicketDetail();
    await waitFor(() => expect(screen.getByTestId("detail-ticket-number")).toBeInTheDocument());
    expect(screen.getByTestId("detail-ticket-number")).toHaveTextContent("TKT-2026-000001");
  });

  it("displays the ticket summary as a read-only field", async () => {
    renderTicketDetail();
    await waitFor(() => expect(screen.getByTestId("detail-summary")).toBeInTheDocument());
    expect(screen.getByTestId("detail-summary")).toHaveTextContent("Laptop battery drains quickly");
  });

  it("displays the requester name as a read-only field", async () => {
    renderTicketDetail();
    await waitFor(() => expect(screen.getByTestId("detail-requester")).toBeInTheDocument());
    expect(screen.getByTestId("detail-requester")).toHaveTextContent("Jennifer Anderson");
  });

  // ── Attachment states ──────────────────────────────────────────────────

  it("renders the active attachment with a download button and remove button", async () => {
    renderTicketDetail();
    await waitFor(() =>
      expect(screen.getByTestId("active-attachments-list")).toBeInTheDocument()
    );
    expect(screen.getByTestId(`attachment-active-${ACTIVE_ATTACHMENT.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`download-btn-${ACTIVE_ATTACHMENT.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`remove-btn-${ACTIVE_ATTACHMENT.id}`)).toBeInTheDocument();
  });

  it("renders the removed attachment with REMOVED badge and no download button", async () => {
    renderTicketDetail();
    await waitFor(() =>
      expect(screen.getByTestId("removed-attachments-list")).toBeInTheDocument()
    );
    expect(screen.getByTestId(`attachment-removed-${REMOVED_ATTACHMENT.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`removed-badge-${REMOVED_ATTACHMENT.id}`)).toHaveTextContent("REMOVED");
    expect(screen.queryByTestId(`download-btn-${REMOVED_ATTACHMENT.id}`)).not.toBeInTheDocument();
  });

  // ── Upload errors ──────────────────────────────────────────────────────

  it("shows an upload error for an unsupported file type", async () => {
    renderTicketDetail();
    await waitFor(() => expect(screen.getByTestId("add-attachment-input")).toBeInTheDocument());
    const badFile = new File(["x"], "malware.exe", { type: "application/octet-stream" });
    await userEvent.upload(screen.getByTestId("add-attachment-input"), badFile);
    await waitFor(() => {
      expect(screen.getByTestId("upload-error")).toBeInTheDocument();
    });
    expect(screen.getByTestId("upload-error")).toHaveTextContent("not an allowed type");
  });

  it("shows an upload error for a file that exceeds 5 MB", async () => {
    renderTicketDetail();
    await waitFor(() => expect(screen.getByTestId("add-attachment-input")).toBeInTheDocument());
    const bigFile = new File([new Uint8Array(6 * 1024 * 1024)], "large.jpg", {
      type: "image/jpeg",
    });
    await userEvent.upload(screen.getByTestId("add-attachment-input"), bigFile);
    await waitFor(() => {
      expect(screen.getByTestId("upload-error")).toBeInTheDocument();
    });
    expect(screen.getByTestId("upload-error")).toHaveTextContent("5 MB");
  });

  // ── Remove modal ───────────────────────────────────────────────────────

  it("opens the remove modal when the Remove button is clicked", async () => {
    renderTicketDetail();
    await waitFor(() =>
      expect(screen.getByTestId(`remove-btn-${ACTIVE_ATTACHMENT.id}`)).toBeInTheDocument()
    );
    await userEvent.click(screen.getByTestId(`remove-btn-${ACTIVE_ATTACHMENT.id}`));
    expect(screen.getByTestId("remove-modal")).toBeInTheDocument();
  });

  it("shows a validation error when reason is too short", async () => {
    renderTicketDetail();
    await waitFor(() =>
      expect(screen.getByTestId(`remove-btn-${ACTIVE_ATTACHMENT.id}`)).toBeInTheDocument()
    );
    await userEvent.click(screen.getByTestId(`remove-btn-${ACTIVE_ATTACHMENT.id}`));
    await userEvent.type(screen.getByTestId("removal-reason-input"), "nope");
    await userEvent.click(screen.getByTestId("confirm-remove-btn"));
    expect(screen.getByTestId("removal-reason-error")).toBeInTheDocument();
    expect(screen.getByTestId("removal-reason-error")).toHaveTextContent("at least 5 characters");
  });

  it("calls removeAttachment and closes the modal on a valid reason", async () => {
    const removedResult: api.AttachmentMeta = {
      ...ACTIVE_ATTACHMENT,
      removedAt:     new Date().toISOString(),
      removalReason: "Valid removal reason",
    };
    vi.spyOn(api, "removeAttachment").mockResolvedValue(removedResult);

    renderTicketDetail();
    await waitFor(() =>
      expect(screen.getByTestId(`remove-btn-${ACTIVE_ATTACHMENT.id}`)).toBeInTheDocument()
    );
    await userEvent.click(screen.getByTestId(`remove-btn-${ACTIVE_ATTACHMENT.id}`));
    await userEvent.type(screen.getByTestId("removal-reason-input"), "Valid removal reason");
    await userEvent.click(screen.getByTestId("confirm-remove-btn"));

    await waitFor(() => {
      expect(screen.queryByTestId("remove-modal")).not.toBeInTheDocument();
    });
    expect(api.removeAttachment).toHaveBeenCalledWith(
      ACTIVE_ATTACHMENT.id,
      MOCK_REQUESTER.id,
      "Valid removal reason"
    );
  });

  it("closes the modal without removing when Cancel is clicked", async () => {
    renderTicketDetail();
    await waitFor(() =>
      expect(screen.getByTestId(`remove-btn-${ACTIVE_ATTACHMENT.id}`)).toBeInTheDocument()
    );
    await userEvent.click(screen.getByTestId(`remove-btn-${ACTIVE_ATTACHMENT.id}`));
    expect(screen.getByTestId("remove-modal")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("cancel-remove-btn"));
    expect(screen.queryByTestId("remove-modal")).not.toBeInTheDocument();
  });

  it("calls onBack when Back to My Tickets is clicked", async () => {
    const onBack = vi.fn();
    renderTicketDetail(onBack);
    await waitFor(() => expect(screen.getByTestId("back-to-tickets-btn")).toBeInTheDocument());
    await userEvent.click(screen.getByTestId("back-to-tickets-btn"));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
