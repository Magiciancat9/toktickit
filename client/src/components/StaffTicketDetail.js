import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useRef } from "react";
import { fetchStaffTicketByNumber, updateTicketOwner, updateItPriority, updateTicketStatus, createInternalNote, getInternalNotes, getComments, postComment, uploadAttachment, removeAttachment, getAttachmentDownloadUrl, fetchStaffUsers, } from "../api.js";
import { useRequester } from "../context/RequesterContext.js";
// ── Constants ────────────────────────────────────────────────────────────
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const PRIORITY_BADGE = {
    LOW: "bg-secondary",
    MEDIUM: "bg-warning text-dark",
    HIGH: "bg-danger",
};
const STATUS_BADGE = {
    NEW: "bg-info",
    OPEN: "bg-primary",
    IN_PROGRESS: "bg-warning text-dark",
    WAITING_FOR_REQUESTER: "bg-secondary",
    RESOLVED: "bg-success",
    CLOSED: "bg-dark",
    REOPENED: "bg-danger",
    CANCELLED: "bg-secondary",
};
const ROLE_BADGE = {
    REQUESTER: "bg-primary",
    IT_STAFF: "bg-success",
    ADMINISTRATOR: "bg-secondary",
};
// Status transition matrix
const STATUS_TRANSITIONS = {
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
function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
// ── Read-only field ───────────────────────────────────────────────────────
function ReadOnlyField({ label, value, testId, }) {
    return (_jsxs("div", { children: [_jsx("label", { className: "form-label fw-semibold mb-1", style: { color: "#1A2E22", fontSize: "0.875rem" }, children: label }), _jsx("div", { className: "form-control-plaintext ps-2 rounded", style: { backgroundColor: "#F0F4F2", color: "#1A2E22", minHeight: 38 }, "data-testid": testId, children: value ?? "—" })] }));
}
// ── Component ────────────────────────────────────────────────────────────
export function StaffTicketDetail({ ticketNumber, onBack }) {
    const { currentRequester } = useRequester();
    const [detailState, setDetailState] = useState("loading");
    const [ticket, setTicket] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [errorMsg, setErrorMsg] = useState(null);
    // Staff users for assignment
    const [staffUsers, setStaffUsers] = useState([]);
    // Upload state
    const fileInputRef = useRef(null);
    const [uploadError, setUploadError] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(null);
    // Remove modal state
    const [removeModal, setRemoveModal] = useState(null);
    // Comments and notes state
    const [comments, setComments] = useState([]);
    const [internalNotes, setInternalNotes] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [newNote, setNewNote] = useState("");
    const [commentError, setCommentError] = useState(null);
    const [noteError, setNoteError] = useState(null);
    const [postingComment, setPostingComment] = useState(false);
    const [postingNote, setPostingNote] = useState(false);
    // Update states
    const [updatingOwner, setUpdatingOwner] = useState(false);
    const [updatingPriority, setUpdatingPriority] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(null);
    // ── Load ticket ────────────────────────────────────────────────────────
    useEffect(() => {
        setDetailState("loading");
        Promise.all([fetchStaffTicketByNumber(ticketNumber), fetchStaffUsers()])
            .then(([t, users]) => {
            setTicket(t);
            setAttachments(t.attachments ?? []);
            setStaffUsers(users);
            setDetailState("loaded");
        })
            .catch((err) => {
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
    const handleOwnerChange = async (e) => {
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
        }
        catch (err) {
            alert(err.message || "Failed to update owner");
        }
        finally {
            setUpdatingOwner(false);
        }
    };
    // ── Update IT Priority ─────────────────────────────────────────────────
    const handlePriorityChange = async (e) => {
        const itPriority = e.target.value;
        setUpdatingPriority(true);
        setUpdateSuccess(null);
        try {
            await updateItPriority(ticketNumber, itPriority);
            const updated = await fetchStaffTicketByNumber(ticketNumber);
            setTicket(updated);
            setUpdateSuccess("IT Priority updated successfully");
            setTimeout(() => setUpdateSuccess(null), 3000);
        }
        catch (err) {
            alert(err.message || "Failed to update IT priority");
        }
        finally {
            setUpdatingPriority(false);
        }
    };
    // ── Update Status ──────────────────────────────────────────────────────
    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        setUpdatingStatus(true);
        setUpdateSuccess(null);
        try {
            await updateTicketStatus(ticketNumber, newStatus);
            const updated = await fetchStaffTicketByNumber(ticketNumber);
            setTicket(updated);
            setUpdateSuccess("Status updated successfully");
            setTimeout(() => setUpdateSuccess(null), 3000);
        }
        catch (err) {
            alert(err.message || "Failed to update status");
        }
        finally {
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
        }
        catch (err) {
            setCommentError(err.message || "Failed to post comment");
        }
        finally {
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
        }
        catch (err) {
            setNoteError(err.message || "Failed to post note");
        }
        finally {
            setPostingNote(false);
        }
    };
    // ── Upload attachment ──────────────────────────────────────────────────
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        // Reset file input
        if (fileInputRef.current)
            fileInputRef.current.value = "";
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
        }
        catch (err) {
            setUploadError(err.message || "Upload failed");
        }
        finally {
            setUploadingFile(null);
        }
    };
    // ── Remove attachment ──────────────────────────────────────────────────
    const openRemoveModal = (att) => {
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
        if (!removeModal)
            return;
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
        }
        catch (err) {
            setRemoveModal({ ...removeModal, submitting: false, error: err.message || "Remove failed" });
        }
    };
    // ── Render ─────────────────────────────────────────────────────────────
    if (detailState === "loading") {
        return (_jsx("div", { className: "d-flex justify-content-center align-items-center", style: { minHeight: 400 }, children: _jsx("div", { className: "spinner-border text-success", role: "status", children: _jsx("span", { className: "visually-hidden", children: "Loading ticket..." }) }) }));
    }
    if (detailState === "error") {
        return (_jsxs("div", { className: "alert alert-danger", role: "alert", children: [_jsx("strong", { children: "Error:" }), " ", errorMsg] }));
    }
    if (!ticket)
        return null;
    const allowedStatuses = STATUS_TRANSITIONS[ticket.status] || [];
    return (_jsxs("div", { className: "container-fluid py-4", "data-testid": "staff-ticket-detail", children: [_jsx("div", { className: "row mb-4", children: _jsxs("div", { className: "col", children: [_jsx("button", { onClick: onBack, className: "btn btn-outline-secondary btn-sm mb-3", "data-testid": "back-button", children: "\u2190 Back to Queue" }), _jsxs("h2", { className: "mb-2", children: ["Ticket ", ticket.ticketNumber] }), _jsxs("div", { className: "d-flex gap-2 flex-wrap", children: [_jsx("span", { className: `badge ${STATUS_BADGE[ticket.status] || "bg-secondary"}`, children: ticket.status }), ticket.problemResolvedByRequester && (_jsx("span", { className: "badge bg-success", children: "\u2713 Problem Resolved by Requester" }))] })] }) }), updateSuccess && (_jsxs("div", { className: "alert alert-success alert-dismissible fade show", role: "alert", children: [updateSuccess, _jsx("button", { type: "button", className: "btn-close", onClick: () => setUpdateSuccess(null), "aria-label": "Close" })] })), _jsxs("div", { className: "row g-4", children: [_jsx("div", { className: "col-lg-6", children: _jsx("div", { className: "card", children: _jsxs("div", { className: "card-body", children: [_jsx("h5", { className: "card-title mb-3", children: "Ticket Details" }), _jsxs("div", { className: "row g-3", children: [_jsx("div", { className: "col-md-6", children: _jsx(ReadOnlyField, { label: "Ticket Number", value: ticket.ticketNumber, testId: "ticket-number" }) }), _jsx("div", { className: "col-md-6", children: _jsx(ReadOnlyField, { label: "Ticket Date", value: formatDate(ticket.ticketDate), testId: "ticket-date" }) }), _jsx("div", { className: "col-md-6", children: _jsx(ReadOnlyField, { label: "Requester", value: ticket.requester?.name, testId: "requester-name" }) }), _jsx("div", { className: "col-md-6", children: _jsx(ReadOnlyField, { label: "Category", value: ticket.category?.name, testId: "category-name" }) }), _jsx("div", { className: "col-12", children: _jsx(ReadOnlyField, { label: "Related System", value: ticket.relatedSystem?.name, testId: "related-system-name" }) }), _jsx("div", { className: "col-12", children: _jsx(ReadOnlyField, { label: "Summary", value: ticket.summary, testId: "summary" }) }), _jsxs("div", { className: "col-12", children: [_jsx("label", { className: "form-label fw-semibold mb-1", children: "Description" }), _jsx("div", { className: "form-control-plaintext ps-2 rounded", style: {
                                                            backgroundColor: "#F0F4F2",
                                                            color: "#1A2E22",
                                                            minHeight: 100,
                                                            whiteSpace: "pre-wrap",
                                                        }, "data-testid": "description", children: ticket.description })] })] })] }) }) }), _jsxs("div", { className: "col-lg-6", children: [_jsx("div", { className: "card mb-3", children: _jsxs("div", { className: "card-body", children: [_jsx("h5", { className: "card-title mb-3", children: "IT Operations" }), _jsxs("div", { className: "row g-3", children: [_jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label fw-semibold", children: "Owner" }), _jsxs("select", { className: "form-select", value: ticket.ownerId ?? "", onChange: handleOwnerChange, disabled: updatingOwner, "data-testid": "owner-select", children: [_jsx("option", { value: "", children: "Unassigned" }), staffUsers.map((user) => (_jsx("option", { value: user.id, children: user.name }, user.id)))] }), updatingOwner && _jsx("small", { className: "text-muted", children: "Updating..." })] }), _jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label fw-semibold", children: "Status" }), _jsxs("select", { className: "form-select", value: ticket.status, onChange: handleStatusChange, disabled: updatingStatus || allowedStatuses.length === 0, "data-testid": "status-select", children: [_jsx("option", { value: ticket.status, children: ticket.status }), allowedStatuses.map((status) => (_jsx("option", { value: status, children: status }, status)))] }), updatingStatus && _jsx("small", { className: "text-muted", children: "Updating..." }), allowedStatuses.length === 0 && (_jsx("small", { className: "text-muted", children: "No transitions available" }))] }), _jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label fw-semibold", children: "Requested Priority" }), _jsx("div", { children: _jsx("span", { className: `badge ${PRIORITY_BADGE[ticket.requestedPriority] || "bg-secondary"}`, "data-testid": "requested-priority", children: ticket.requestedPriority }) })] }), _jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label fw-semibold", children: "IT Priority" }), _jsxs("select", { className: "form-select", value: ticket.itPriority, onChange: handlePriorityChange, disabled: updatingPriority, "data-testid": "it-priority-select", children: [_jsx("option", { value: "LOW", children: "LOW" }), _jsx("option", { value: "MEDIUM", children: "MEDIUM" }), _jsx("option", { value: "HIGH", children: "HIGH" })] }), updatingPriority && _jsx("small", { className: "text-muted", children: "Updating..." })] })] })] }) }), _jsx("div", { className: "card", children: _jsxs("div", { className: "card-body", children: [_jsx("h5", { className: "card-title mb-3", children: "Attachments" }), uploadError && (_jsx("div", { className: "alert alert-danger alert-sm", role: "alert", children: uploadError })), uploadingFile && (_jsxs("div", { className: "alert alert-info alert-sm", children: ["Uploading ", uploadingFile, "..."] })), _jsxs("div", { className: "mb-3", children: [_jsx("input", { ref: fileInputRef, type: "file", className: "form-control", accept: ALLOWED_TYPES.join(","), onChange: handleFileChange, disabled: !!uploadingFile, "data-testid": "file-input" }), _jsx("small", { className: "text-muted", children: "Max 5 MB. JPEG, PNG, WEBP, PDF only." })] }), _jsxs("div", { className: "list-group", children: [attachments.length === 0 && _jsx("p", { className: "text-muted", children: "No attachments" }), attachments.map((att) => (_jsx("div", { className: `list-group-item ${att.removedAt ? "text-muted" : ""}`, "data-testid": `attachment-${att.id}`, children: _jsxs("div", { className: "d-flex justify-content-between align-items-start", children: [_jsxs("div", { className: "flex-grow-1", children: [_jsx("div", { className: "fw-semibold", children: att.originalName }), _jsxs("small", { children: [formatBytes(att.sizeBytes), " \u00B7 ", formatDate(att.uploadedAt)] }), att.removedAt && (_jsxs("div", { className: "text-danger small mt-1", children: ["Removed: ", att.removalReason] }))] }), _jsx("div", { className: "btn-group", children: !att.removedAt && (_jsxs(_Fragment, { children: [_jsx("a", { href: getAttachmentDownloadUrl(att.id), className: "btn btn-sm btn-outline-primary", download: true, "data-testid": `download-${att.id}`, children: "Download" }), _jsx("button", { onClick: () => openRemoveModal(att), className: "btn btn-sm btn-outline-danger", "data-testid": `remove-${att.id}`, children: "Remove" })] })) })] }) }, att.id)))] })] }) })] })] }), _jsxs("div", { className: "row mt-4", children: [_jsx("div", { className: "col-lg-6", children: _jsx("div", { className: "card", children: _jsxs("div", { className: "card-body", children: [_jsx("h5", { className: "card-title mb-3", children: "Public Comments" }), _jsxs("div", { className: "mb-3", style: { maxHeight: 400, overflowY: "auto" }, children: [comments.length === 0 && _jsx("p", { className: "text-muted", children: "No comments yet" }), comments.map((c) => (_jsx("div", { className: "card mb-2", "data-testid": `comment-${c.id}`, children: _jsxs("div", { className: "card-body py-2", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-start mb-1", children: [_jsx("strong", { children: c.authorName }), _jsx("span", { className: `badge ${ROLE_BADGE[c.authorRole] || "bg-secondary"}`, children: c.authorRole })] }), _jsx("p", { className: "mb-1", style: { whiteSpace: "pre-wrap" }, children: c.content }), _jsx("small", { className: "text-muted", children: formatDate(c.createdAt) })] }) }, c.id)))] }), commentError && (_jsx("div", { className: "alert alert-danger alert-sm", role: "alert", children: commentError })), _jsxs("div", { className: "input-group", children: [_jsx("textarea", { className: "form-control", rows: 2, placeholder: "Add a public comment...", value: newComment, onChange: (e) => setNewComment(e.target.value), disabled: postingComment, "data-testid": "comment-input" }), _jsx("button", { className: "btn btn-primary", onClick: handlePostComment, disabled: postingComment || !newComment.trim(), "data-testid": "post-comment-button", children: postingComment ? "Posting..." : "Post" })] })] }) }) }), _jsx("div", { className: "col-lg-6", children: _jsx("div", { className: "card", style: { backgroundColor: "#FFF9E6", borderColor: "#FFD700" }, children: _jsxs("div", { className: "card-body", children: [_jsxs("h5", { className: "card-title mb-3", children: ["\uD83D\uDD12 Internal Notes ", _jsx("span", { className: "badge bg-warning text-dark", children: "IT STAFF ONLY" })] }), _jsxs("div", { className: "mb-3", style: { maxHeight: 400, overflowY: "auto" }, children: [internalNotes.length === 0 && _jsx("p", { className: "text-muted", children: "No internal notes yet" }), internalNotes.map((n) => (_jsx("div", { className: "card mb-2", style: { backgroundColor: "#FFFEF0" }, "data-testid": `note-${n.id}`, children: _jsxs("div", { className: "card-body py-2", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-start mb-1", children: [_jsx("strong", { children: n.authorName }), _jsx("span", { className: `badge ${ROLE_BADGE[n.authorRole] || "bg-secondary"}`, children: n.authorRole })] }), _jsx("p", { className: "mb-1", style: { whiteSpace: "pre-wrap" }, children: n.content }), _jsx("small", { className: "text-muted", children: formatDate(n.createdAt) })] }) }, n.id)))] }), noteError && (_jsx("div", { className: "alert alert-danger alert-sm", role: "alert", children: noteError })), _jsxs("div", { className: "input-group", children: [_jsx("textarea", { className: "form-control", rows: 2, placeholder: "Add an internal note (not visible to requester)...", value: newNote, onChange: (e) => setNewNote(e.target.value), disabled: postingNote, "data-testid": "note-input" }), _jsx("button", { className: "btn btn-warning text-dark", onClick: handlePostNote, disabled: postingNote || !newNote.trim(), "data-testid": "post-note-button", children: postingNote ? "Posting..." : "Post" })] })] }) }) })] }), removeModal && (_jsx("div", { className: "modal show d-block", tabIndex: -1, style: { backgroundColor: "rgba(0,0,0,0.5)" }, "data-testid": "remove-modal", children: _jsx("div", { className: "modal-dialog", children: _jsxs("div", { className: "modal-content", children: [_jsxs("div", { className: "modal-header", children: [_jsx("h5", { className: "modal-title", children: "Remove Attachment" }), _jsx("button", { type: "button", className: "btn-close", onClick: closeRemoveModal, disabled: removeModal.submitting })] }), _jsxs("div", { className: "modal-body", children: [_jsxs("p", { children: ["Are you sure you want to remove ", _jsx("strong", { children: removeModal.originalName }), "?"] }), _jsx("label", { className: "form-label", children: "Reason for removal (required):" }), _jsx("input", { type: "text", className: "form-control", value: removeModal.reason, onChange: (e) => setRemoveModal({ ...removeModal, reason: e.target.value }), disabled: removeModal.submitting, "data-testid": "removal-reason-input" }), removeModal.error && (_jsx("div", { className: "alert alert-danger mt-2", role: "alert", children: removeModal.error }))] }), _jsxs("div", { className: "modal-footer", children: [_jsx("button", { className: "btn btn-secondary", onClick: closeRemoveModal, disabled: removeModal.submitting, children: "Cancel" }), _jsx("button", { className: "btn btn-danger", onClick: handleRemoveSubmit, disabled: removeModal.submitting, "data-testid": "confirm-remove-button", children: removeModal.submitting ? "Removing..." : "Remove" })] })] }) }) }))] }));
}
