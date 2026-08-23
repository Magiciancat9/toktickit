import { useEffect, useState, useRef, ChangeEvent } from "react";
import {
  fetchTicketByNumber,
  uploadAttachment,
  removeAttachment,
  getAttachmentDownloadUrl,
  Ticket,
  AttachmentMeta,
} from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

// ── Constants ────────────────────────────────────────────────────────────

const ALLOWED_TYPES  = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const PRIORITY_BADGE: Record<string, string> = {
  LOW:    "bg-secondary",
  MEDIUM: "bg-warning text-dark",
  HIGH:   "bg-danger",
};
const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-success",
};

// ── Types ────────────────────────────────────────────────────────────────

type DetailState = "loading" | "loaded" | "error";

interface RemoveModalState {
  attachmentId: number;
  originalName: string;
  reason: string;
  error: string | null;
  submitting: boolean;
}

interface TicketDetailProps {
  ticketNumber: string;
  onBack: () => void;
}

// ── Read-only field ───────────────────────────────────────────────────────

function ReadOnlyField({
  label,
  value,
  testId,
}: {
  label: string;
  value: string | undefined;
  testId?: string;
}) {
  return (
    <div>
      <label
        className="form-label fw-semibold mb-1"
        style={{ color: "#1A2E22", fontSize: "0.875rem" }}
      >
        {label}
      </label>
      <div
        className="form-control-plaintext ps-2 rounded"
        style={{ backgroundColor: "#F0F4F2", color: "#1A2E22", minHeight: 38 }}
        data-testid={testId}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────

export function TicketDetail({ ticketNumber, onBack }: TicketDetailProps) {
  const { currentRequester } = useRequester();

  const [detailState, setDetailState] = useState<DetailState>("loading");
  const [ticket,      setTicket]      = useState<Ticket | null>(null);
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError,    setUploadError]    = useState<string | null>(null);
  const [uploadingFile,  setUploadingFile]  = useState<string | null>(null); // filename while uploading

  // Remove modal state
  const [removeModal, setRemoveModal] = useState<RemoveModalState | null>(null);

  // ── Load ticket ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!currentRequester) return;
    setDetailState("loading");
    fetchTicketByNumber(ticketNumber, currentRequester.id)
      .then((t) => {
        setTicket(t);
        setAttachments((t as Ticket & { attachments?: AttachmentMeta[] }).attachments ?? []);
        setDetailState("loaded");
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setDetailState("error");
      });
  }, [ticketNumber, currentRequester]);

  // ── Upload ─────────────────────────────────────────────────────────────

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !ticket || !currentRequester) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setUploadError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError(`"${file.name}" is not an allowed type. Use JPG, PNG, WEBP, or PDF.`);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError(`"${file.name}" exceeds the 5 MB size limit.`);
      return;
    }

    setUploadingFile(file.name);
    try {
      const meta = await uploadAttachment(ticketNumber, currentRequester.id, file);
      setAttachments((prev) => [...prev, meta]);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    } finally {
      setUploadingFile(null);
    }
  }

  // ── Remove modal ───────────────────────────────────────────────────────

  function openRemoveModal(att: AttachmentMeta) {
    setRemoveModal({
      attachmentId: att.id,
      originalName: att.originalName,
      reason:       "",
      error:        null,
      submitting:   false,
    });
  }

  function closeRemoveModal() {
    setRemoveModal(null);
  }

  async function confirmRemove() {
    if (!removeModal || !currentRequester) return;
    if (removeModal.reason.trim().length < 5) {
      setRemoveModal((m) => m ? { ...m, error: "Reason must be at least 5 characters." } : m);
      return;
    }
    setRemoveModal((m) => m ? { ...m, submitting: true, error: null } : m);
    try {
      const updated = await removeAttachment(
        removeModal.attachmentId,
        currentRequester.id,
        removeModal.reason.trim()
      );
      setAttachments((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
      closeRemoveModal();
    } catch (err) {
      setRemoveModal((m) =>
        m ? {
          ...m,
          submitting: false,
          error: err instanceof Error ? err.message : "Remove failed.",
        } : m
      );
    }
  }

  // ── Render states ──────────────────────────────────────────────────────

  if (detailState === "loading") {
    return (
      <div className="text-center py-5" data-testid="ticket-detail-loading">
        <div className="spinner-border" style={{ color: "#006B3C" }} role="status">
          <span className="visually-hidden">Loading ticket…</span>
        </div>
        <p className="mt-2 text-muted">Loading ticket…</p>
      </div>
    );
  }

  if (detailState === "error" || !ticket) {
    return (
      <div data-testid="ticket-detail-error">
        <div className="alert alert-danger">
          {errorMsg ?? "Unable to load ticket."}
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={onBack}>
          ← Back to My Tickets
        </button>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────

  const t = ticket as Ticket & {
    requester?:     { id: number; name: string };
    category?:      { id: number; name: string };
    relatedSystem?: { id: number; name: string };
  };

  const activeAttachments  = attachments.filter((a) => a.removedAt === null);
  const removedAttachments = attachments.filter((a) => a.removedAt !== null);

  return (
    <div data-testid="ticket-detail-screen">
      {/* ── Breadcrumb + back ── */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0" style={{ fontSize: "0.875rem" }}>
          <li className="breadcrumb-item">
            <button
              className="btn btn-link p-0 text-decoration-none"
              style={{ color: "#0B7A46" }}
              onClick={onBack}
              data-testid="back-to-tickets-btn"
            >
              My Tickets
            </button>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {t.ticketNumber}
          </li>
        </ol>
      </nav>

      <div className="card shadow-sm border-0 p-4 mb-4" data-testid="ticket-header">
        {/* ── Row 1: Ticket No. + Date ── */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <ReadOnlyField label="Ticket No." value={t.ticketNumber} testId="detail-ticket-number" />
          </div>
          <div className="col-md-6">
            <ReadOnlyField label="Ticket Date" value={formatDate(t.ticketDate)} testId="detail-ticket-date" />
          </div>
        </div>

        {/* ── Row 2: Requester + Priority ── */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <ReadOnlyField label="Requester" value={t.requester?.name} testId="detail-requester" />
          </div>
          <div className="col-md-6">
            <div>
              <label className="form-label fw-semibold mb-1" style={{ color: "#1A2E22", fontSize: "0.875rem" }}>
                Requested Priority
              </label>
              <div className="ps-1 pt-1" data-testid="detail-priority">
                <span className={`badge ${PRIORITY_BADGE[t.requestedPriority] ?? "bg-secondary"}`}>
                  {t.requestedPriority}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 3: Category + Related System ── */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <ReadOnlyField label="Category" value={t.category?.name} testId="detail-category" />
          </div>
          <div className="col-md-6">
            <ReadOnlyField label="Related System" value={t.relatedSystem?.name} testId="detail-related-system" />
          </div>
        </div>

        {/* ── Row 4: Status ── */}
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <div>
              <label className="form-label fw-semibold mb-1" style={{ color: "#1A2E22", fontSize: "0.875rem" }}>
                Current Status
              </label>
              <div className="ps-1 pt-1" data-testid="detail-status">
                <span className={`badge ${STATUS_BADGE[t.status] ?? "bg-secondary"}`}>
                  {t.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Summary ── */}
        <div className="mb-3">
          <ReadOnlyField label="Ticket Summary" value={t.summary} testId="detail-summary" />
        </div>

        {/* ── Description ── */}
        <div>
          <label className="form-label fw-semibold mb-1" style={{ color: "#1A2E22", fontSize: "0.875rem" }}>
            Description
          </label>
          <div
            className="rounded p-2"
            style={{
              backgroundColor: "#F0F4F2", color: "#1A2E22",
              whiteSpace: "pre-wrap", minHeight: 80,
            }}
            data-testid="detail-description"
          >
            {t.description}
          </div>
        </div>
      </div>

      {/* ── Attachments section ── */}
      <div className="card shadow-sm border-0 p-4" data-testid="attachments-section">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h6 fw-bold mb-0" style={{ color: "#1A2E22" }}>
            Attachments
            {activeAttachments.length > 0 && (
              <span className="badge bg-secondary ms-2">{activeAttachments.length}</span>
            )}
          </h2>

          {/* Add attachment control */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="d-none"
              onChange={handleFileChange}
              disabled={!!uploadingFile}
              data-testid="add-attachment-input"
              aria-label="Add attachment"
            />
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={!!uploadingFile}
              data-testid="add-attachment-btn"
            >
              {uploadingFile ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                  Uploading…
                </>
              ) : (
                "+ Add Attachment"
              )}
            </button>
          </div>
        </div>

        {/* Upload error */}
        {uploadError && (
          <div className="alert alert-danger py-2 mb-3" data-testid="upload-error">
            {uploadError}
          </div>
        )}

        {/* Active attachments */}
        {activeAttachments.length === 0 && removedAttachments.length === 0 && (
          <p className="text-muted mb-0" style={{ fontSize: "0.875rem" }} data-testid="no-attachments">
            No attachments yet.
          </p>
        )}

        {activeAttachments.length > 0 && (
          <ul className="list-group list-group-flush mb-2" data-testid="active-attachments-list">
            {activeAttachments.map((att) => (
              <li
                key={att.id}
                className="list-group-item d-flex justify-content-between align-items-center px-0"
                data-testid={`attachment-active-${att.id}`}
              >
                <div>
                  <span className="fw-semibold" style={{ fontSize: "0.9rem" }}>
                    {att.originalName}
                  </span>
                  <small className="text-muted ms-2">
                    {formatBytes(att.sizeBytes)} · {formatDate(att.uploadedAt)}
                  </small>
                </div>
                <div className="d-flex gap-2">
                  <a
                    href={getAttachmentDownloadUrl(att.id, currentRequester!.id)}
                    className="btn btn-sm btn-outline-secondary"
                    target="_blank"
                    rel="noreferrer"
                    data-testid={`download-btn-${att.id}`}
                    aria-label={`Download ${att.originalName}`}
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => openRemoveModal(att)}
                    data-testid={`remove-btn-${att.id}`}
                    aria-label={`Remove ${att.originalName}`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Removed attachments (metadata only, no download) */}
        {removedAttachments.length > 0 && (
          <div data-testid="removed-attachments-list">
            <p className="text-muted mb-1" style={{ fontSize: "0.8rem" }}>Removed attachments:</p>
            <ul className="list-group list-group-flush">
              {removedAttachments.map((att) => (
                <li
                  key={att.id}
                  className="list-group-item px-0"
                  style={{ opacity: 0.6 }}
                  data-testid={`attachment-removed-${att.id}`}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <span
                        className="fw-semibold text-decoration-line-through"
                        style={{ fontSize: "0.9rem", color: "#5A6E62" }}
                      >
                        {att.originalName}
                      </span>
                      <small className="text-muted ms-2">
                        {formatBytes(att.sizeBytes)}
                      </small>
                      <div style={{ fontSize: "0.8rem", color: "#5A6E62" }}>
                        Removed {att.removedAt ? formatDate(att.removedAt) : ""} — "{att.removalReason}"
                      </div>
                    </div>
                    {/* No download button for removed attachments */}
                    <span
                      className="badge bg-secondary"
                      data-testid={`removed-badge-${att.id}`}
                    >
                      REMOVED
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Remove modal ── */}
      {removeModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-modal-title"
          data-testid="remove-modal"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="remove-modal-title">
                  Remove Attachment
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeRemoveModal}
                  disabled={removeModal.submitting}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  Are you sure you want to remove{" "}
                  <strong>{removeModal.originalName}</strong>? This cannot be undone.
                </p>
                <label
                  htmlFor="removal-reason"
                  className="form-label fw-semibold"
                  style={{ fontSize: "0.875rem" }}
                >
                  Reason for removal <span className="text-danger">*</span>
                </label>
                <textarea
                  id="removal-reason"
                  className="form-control"
                  rows={3}
                  value={removeModal.reason}
                  onChange={(e) =>
                    setRemoveModal((m) => m ? { ...m, reason: e.target.value } : m)
                  }
                  disabled={removeModal.submitting}
                  placeholder="Minimum 5 characters"
                  data-testid="removal-reason-input"
                  aria-required="true"
                />
                {removeModal.error && (
                  <div
                    className="text-danger mt-1"
                    style={{ fontSize: "0.82rem" }}
                    data-testid="removal-reason-error"
                  >
                    {removeModal.error}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeRemoveModal}
                  disabled={removeModal.submitting}
                  data-testid="cancel-remove-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmRemove}
                  disabled={removeModal.submitting}
                  data-testid="confirm-remove-btn"
                >
                  {removeModal.submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                      Removing…
                    </>
                  ) : (
                    "Confirm Remove"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketDetail;
