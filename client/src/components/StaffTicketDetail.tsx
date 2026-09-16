import { useEffect, useState, useRef } from "react";
import {
  fetchStaffTicketByNumber,
  updateTicketOwner,
  updateItPriority,
  updateTicketStatus,
  createInternalNote,
  getInternalNotes,
  getComments,
  postComment,
  uploadAttachment,
  removeAttachment,
  getAttachmentDownloadUrl,
  fetchStaffUsers,
  Ticket,
  AttachmentMeta,
  PublicComment,
  InternalNote,
  StaffUser,
  Priority,
} from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

// ── Constants ────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const PRIORITY_BADGE: Record<string, string> = {
  LOW: "bg-secondary",
  MEDIUM: "bg-warning text-dark",
  HIGH: "bg-danger",
};

const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-info",
  OPEN: "bg-primary",
  IN_PROGRESS: "bg-warning text-dark",
  WAITING_FOR_REQUESTER: "bg-secondary",
  RESOLVED: "bg-success",
  CLOSED: "bg-dark",
  REOPENED: "bg-danger",
  CANCELLED: "bg-secondary",
};

const ROLE_BADGE: Record<string, string> = {
  REQUESTER: "bg-primary",
  IT_STAFF: "bg-success",
  ADMINISTRATOR: "bg-secondary",
};

// Status transition matrix
const STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ["OPEN", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"],
  CANCELLED: [],
};

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Types ────────────────────────────────────────────────────────────────

type DetailState = "loading" | "loaded" | "error";

interface RemoveModalState {
  attachmentId: number;
  originalName: string;
  reason: string;
  error: string | null;
  submitting: boolean;
}

interface StaffTicketDetailProps {
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

export function StaffTicketDetail({ ticketNumber, onBack }: StaffTicketDetailProps) {
  const { currentRequester } = useRequester();

  const [detailState, setDetailState] = useState<DetailState>("loading");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Staff users for assignment
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  // Remove modal state
  const [removeModal, setRemoveModal] = useState<RemoveModalState | null>(null);

  // Comments and notes state
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newNote, setNewNote] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [postingComment, setPostingComment] = useState(false);
  const [postingNote, setPostingNote] = useState(false);

  // Update states
  const [updatingOwner, setUpdatingOwner] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // ── Load ticket ────────────────────────────────────────────────────────

  useEffect(() => {
    setDetailState("loading");
    Promise.all([fetchStaffTicketByNumber(ticketNumber), fetchStaffUsers()])
      .then(([t, users]) => {
        setTicket(t);
        setAttachments((t as Ticket & { attachments?: AttachmentMeta[] }).attachments ?? []);
        setStaffUsers(users);
        setDetailState("loaded");
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setDetailState("error");
      });
  }, [ticketNumber]);

  // ── Load comments and notes ────────────────────────────────────────────

  useEffect(() => {
    if (detailState === "loaded") {
      Promise.all([getComments(ticketNumber), getInternalNotes(ticketNumber)])
        .then(([cmts, notes]) => {
          setComments(cmts);
          setInternalNotes(notes);
        })
        .catch((err) => {
          console.error("Failed to load comments/notes:", err);
        });
    }
  }, [detailState, ticketNumber]);

  // ── Update owner ───────────────────────────────────────────────────────

  const handleOwnerChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const ownerId = value === "" ? null : parseInt(value, 10);

    setUpdatingOwner(true);
    setUpdateSuccess(null);
    try {
      await updateTicketOwner(ticketNumber, ownerId);
      const updated = await fetchStaffTicketByNumber(ticketNumber);
      setTicket(updated);
      setUpdateSuccess("Owner updated successfully");
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update owner");
    } finally {
      setUpdatingOwner(false);
    }
  };

  // ── Update IT Priority ─────────────────────────────────────────────────

  const handlePriorityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itPriority = e.target.value as Priority;

    setUpdatingPriority(true);
    setUpdateSuccess(null);
    try {
      await updateItPriority(ticketNumber, itPriority);
      const updated = await fetchStaffTicketByNumber(ticketNumber);
      setTicket(updated);
      setUpdateSuccess("IT Priority updated successfully");
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update IT priority");
    } finally {
      setUpdatingPriority(false);
    }
  };

  // ── Update Status ──────────────────────────────────────────────────────

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;

    setUpdatingStatus(true);
    setUpdateSuccess(null);
    try {
      await updateTicketStatus(ticketNumber, newStatus);
      const updated = await fetchStaffTicketByNumber(ticketNumber);
      setTicket(updated);
      setUpdateSuccess("Status updated successfully");
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ── Post comment ───────────────────────────────────────────────────────

  const handlePostComment = async () => {
    const content = newComment.trim();
    if (!content) {
      setCommentError("Comment cannot be empty");
      return;
    }

    setPostingComment(true);
    setCommentError(null);
    try {
      const comment = await postComment(ticketNumber, content);
      setComments([...comments, comment]);
      setNewComment("");
    } catch (err: any) {
      setCommentError(err.message || "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  // ── Post internal note ─────────────────────────────────────────────────

  const handlePostNote = async () => {
    const content = newNote.trim();
    if (!content) {
      setNoteError("Note cannot be empty");
      return;
    }

    setPostingNote(true);
    setNoteError(null);
    try {
      const note = await createInternalNote(ticketNumber, content);
      setInternalNotes([...internalNotes, note]);
      setNewNote("");
    } catch (err: any) {
      setNoteError(err.message || "Failed to post note");
    } finally {
      setPostingNote(false);
    }
  };

  // ── Upload attachment ──────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Invalid file type. Only images (JPEG, PNG, WEBP) and PDF are allowed.");
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError("File must be 5 MB or smaller.");
      return;
    }

    setUploadError(null);
    setUploadingFile(file.name);

    try {
      const newAttachment = await uploadAttachment(ticketNumber, file);
      setAttachments([...attachments, newAttachment]);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploadingFile(null);
    }
  };

  // ── Remove attachment ──────────────────────────────────────────────────

  const openRemoveModal = (att: AttachmentMeta) => {
    setRemoveModal({
      attachmentId: att.id,
      originalName: att.originalName,
      reason: "",
      error: null,
      submitting: false,
    });
  };

  const closeRemoveModal = () => {
    setRemoveModal(null);
  };

  const handleRemoveSubmit = async () => {
    if (!removeModal) return;

    const reason = removeModal.reason.trim();
    if (reason.length < 5) {
      setRemoveModal({ ...removeModal, error: "Reason must be at least 5 characters" });
      return;
    }

    setRemoveModal({ ...removeModal, submitting: true, error: null });

    try {
      const updated = await removeAttachment(removeModal.attachmentId, reason);
      setAttachments(attachments.map((a) => (a.id === updated.id ? updated : a)));
      closeRemoveModal();
    } catch (err: any) {
      setRemoveModal({ ...removeModal, submitting: false, error: err.message || "Remove failed" });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  if (detailState === "loading") {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading ticket...</span>
        </div>
      </div>
    );
  }

  if (detailState === "error") {
    return (
      <div className="alert alert-danger" role="alert">
        <strong>Error:</strong> {errorMsg}
      </div>
    );
  }

  if (!ticket) return null;

  const allowedStatuses = STATUS_TRANSITIONS[ticket.status] || [];

  return (
    <div className="container-fluid py-4" data-testid="staff-ticket-detail">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <button
            onClick={onBack}
            className="btn btn-outline-secondary btn-sm mb-3"
            data-testid="back-button"
          >
            ← Back to Queue
          </button>
          <h2 className="mb-2">Ticket {ticket.ticketNumber}</h2>
          <div className="d-flex gap-2 flex-wrap">
            <span className={`badge ${STATUS_BADGE[ticket.status] || "bg-secondary"}`}>
              {ticket.status}
            </span>
            {ticket.problemResolvedByRequester && (
              <span className="badge bg-success">
                ✓ Problem Resolved by Requester
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Success message */}
      {updateSuccess && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {updateSuccess}
          <button
            type="button"
            className="btn-close"
            onClick={() => setUpdateSuccess(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      <div className="row g-4">
        {/* Left column: Ticket details */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Ticket Details</h5>

              <div className="row g-3">
                {/* Ticket Number */}
                <div className="col-md-6">
                  <ReadOnlyField
                    label="Ticket Number"
                    value={ticket.ticketNumber}
                    testId="ticket-number"
                  />
                </div>

                {/* Ticket Date */}
                <div className="col-md-6">
                  <ReadOnlyField
                    label="Ticket Date"
                    value={formatDate(ticket.ticketDate)}
                    testId="ticket-date"
                  />
                </div>

                {/* Requester */}
                <div className="col-md-6">
                  <ReadOnlyField
                    label="Requester"
                    value={ticket.requester?.name}
                    testId="requester-name"
                  />
                </div>

                {/* Category */}
                <div className="col-md-6">
                  <ReadOnlyField
                    label="Category"
                    value={ticket.category?.name}
                    testId="category-name"
                  />
                </div>

                {/* Related System */}
                <div className="col-12">
                  <ReadOnlyField
                    label="Related System"
                    value={ticket.relatedSystem?.name}
                    testId="related-system-name"
                  />
                </div>

                {/* Summary */}
                <div className="col-12">
                  <ReadOnlyField label="Summary" value={ticket.summary} testId="summary" />
                </div>

                {/* Description */}
                <div className="col-12">
                  <label className="form-label fw-semibold mb-1">Description</label>
                  <div
                    className="form-control-plaintext ps-2 rounded"
                    style={{
                      backgroundColor: "#F0F4F2",
                      color: "#1A2E22",
                      minHeight: 100,
                      whiteSpace: "pre-wrap",
                    }}
                    data-testid="description"
                  >
                    {ticket.description}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Operations */}
        <div className="col-lg-6">
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title mb-3">IT Operations</h5>

              <div className="row g-3">
                {/* Owner */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Owner</label>
                  <select
                    className="form-select"
                    value={ticket.ownerId ?? ""}
                    onChange={handleOwnerChange}
                    disabled={updatingOwner}
                    data-testid="owner-select"
                  >
                    <option value="">Unassigned</option>
                    {staffUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  {updatingOwner && <small className="text-muted">Updating...</small>}
                </div>

                {/* Status */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Status</label>
                  <select
                    className="form-select"
                    value={ticket.status}
                    onChange={handleStatusChange}
                    disabled={updatingStatus || allowedStatuses.length === 0}
                    data-testid="status-select"
                  >
                    <option value={ticket.status}>{ticket.status}</option>
                    {allowedStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {updatingStatus && <small className="text-muted">Updating...</small>}
                  {allowedStatuses.length === 0 && (
                    <small className="text-muted">No transitions available</small>
                  )}
                </div>

                {/* Requested Priority */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Requested Priority</label>
                  <div>
                    <span
                      className={`badge ${
                        PRIORITY_BADGE[ticket.requestedPriority] || "bg-secondary"
                      }`}
                      data-testid="requested-priority"
                    >
                      {ticket.requestedPriority}
                    </span>
                  </div>
                </div>

                {/* IT Priority */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">IT Priority</label>
                  <select
                    className="form-select"
                    value={ticket.itPriority}
                    onChange={handlePriorityChange}
                    disabled={updatingPriority}
                    data-testid="it-priority-select"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                  {updatingPriority && <small className="text-muted">Updating...</small>}
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Attachments</h5>

              {uploadError && (
                <div className="alert alert-danger alert-sm" role="alert">
                  {uploadError}
                </div>
              )}

              {uploadingFile && (
                <div className="alert alert-info alert-sm">Uploading {uploadingFile}...</div>
              )}

              <div className="mb-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="form-control"
                  accept={ALLOWED_TYPES.join(",")}
                  onChange={handleFileChange}
                  disabled={!!uploadingFile}
                  data-testid="file-input"
                />
                <small className="text-muted">Max 5 MB. JPEG, PNG, WEBP, PDF only.</small>
              </div>

              <div className="list-group">
                {attachments.length === 0 && <p className="text-muted">No attachments</p>}
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className={`list-group-item ${att.removedAt ? "text-muted" : ""}`}
                    data-testid={`attachment-${att.id}`}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{att.originalName}</div>
                        <small>
                          {formatBytes(att.sizeBytes)} · {formatDate(att.uploadedAt)}
                        </small>
                        {att.removedAt && (
                          <div className="text-danger small mt-1">
                            Removed: {att.removalReason}
                          </div>
                        )}
                      </div>
                      <div className="btn-group">
                        {!att.removedAt && (
                          <>
                            <a
                              href={getAttachmentDownloadUrl(att.id)}
                              className="btn btn-sm btn-outline-primary"
                              download
                              data-testid={`download-${att.id}`}
                            >
                              Download
                            </a>
                            <button
                              onClick={() => openRemoveModal(att)}
                              className="btn btn-sm btn-outline-danger"
                              data-testid={`remove-${att.id}`}
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Public Comments */}
      <div className="row mt-4">
        <div className="col-lg-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-3">Public Comments</h5>

              <div className="mb-3" style={{ maxHeight: 400, overflowY: "auto" }}>
                {comments.length === 0 && <p className="text-muted">No comments yet</p>}
                {comments.map((c) => (
                  <div key={c.id} className="card mb-2" data-testid={`comment-${c.id}`}>
                    <div className="card-body py-2">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <strong>{c.authorName}</strong>
                        <span className={`badge ${ROLE_BADGE[c.authorRole] || "bg-secondary"}`}>
                          {c.authorRole}
                        </span>
                      </div>
                      <p className="mb-1" style={{ whiteSpace: "pre-wrap" }}>
                        {c.content}
                      </p>
                      <small className="text-muted">{formatDate(c.createdAt)}</small>
                    </div>
                  </div>
                ))}
              </div>

              {commentError && (
                <div className="alert alert-danger alert-sm" role="alert">
                  {commentError}
                </div>
              )}

              <div className="input-group">
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Add a public comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={postingComment}
                  data-testid="comment-input"
                />
                <button
                  className="btn btn-primary"
                  onClick={handlePostComment}
                  disabled={postingComment || !newComment.trim()}
                  data-testid="post-comment-button"
                >
                  {postingComment ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Internal Notes */}
        <div className="col-lg-6">
          <div className="card" style={{ backgroundColor: "#FFF9E6", borderColor: "#FFD700" }}>
            <div className="card-body">
              <h5 className="card-title mb-3">
                🔒 Internal Notes <span className="badge bg-warning text-dark">IT STAFF ONLY</span>
              </h5>

              <div className="mb-3" style={{ maxHeight: 400, overflowY: "auto" }}>
                {internalNotes.length === 0 && <p className="text-muted">No internal notes yet</p>}
                {internalNotes.map((n) => (
                  <div
                    key={n.id}
                    className="card mb-2"
                    style={{ backgroundColor: "#FFFEF0" }}
                    data-testid={`note-${n.id}`}
                  >
                    <div className="card-body py-2">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <strong>{n.authorName}</strong>
                        <span className={`badge ${ROLE_BADGE[n.authorRole] || "bg-secondary"}`}>
                          {n.authorRole}
                        </span>
                      </div>
                      <p className="mb-1" style={{ whiteSpace: "pre-wrap" }}>
                        {n.content}
                      </p>
                      <small className="text-muted">{formatDate(n.createdAt)}</small>
                    </div>
                  </div>
                ))}
              </div>

              {noteError && (
                <div className="alert alert-danger alert-sm" role="alert">
                  {noteError}
                </div>
              )}

              <div className="input-group">
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Add an internal note (not visible to requester)..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  disabled={postingNote}
                  data-testid="note-input"
                />
                <button
                  className="btn btn-warning text-dark"
                  onClick={handlePostNote}
                  disabled={postingNote || !newNote.trim()}
                  data-testid="post-note-button"
                >
                  {postingNote ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Attachment Modal */}
      {removeModal && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          data-testid="remove-modal"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Remove Attachment</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeRemoveModal}
                  disabled={removeModal.submitting}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to remove <strong>{removeModal.originalName}</strong>?
                </p>
                <label className="form-label">Reason for removal (required):</label>
                <input
                  type="text"
                  className="form-control"
                  value={removeModal.reason}
                  onChange={(e) => setRemoveModal({ ...removeModal, reason: e.target.value })}
                  disabled={removeModal.submitting}
                  data-testid="removal-reason-input"
                />
                {removeModal.error && (
                  <div className="alert alert-danger mt-2" role="alert">
                    {removeModal.error}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={closeRemoveModal}
                  disabled={removeModal.submitting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleRemoveSubmit}
                  disabled={removeModal.submitting}
                  data-testid="confirm-remove-button"
                >
                  {removeModal.submitting ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
