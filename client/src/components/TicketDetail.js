import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useRef } from "react";
import { fetchTicketByNumber, uploadAttachment, removeAttachment, getAttachmentDownloadUrl, } from "../api.js";
import { useRequester } from "../context/RequesterContext.js";
// ── Constants ────────────────────────────────────────────────────────────
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
// ── Helpers ──────────────────────────────────────────────────────────────
function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
const PRIORITY_BADGE = {
    LOW: "bg-secondary",
    MEDIUM: "bg-warning text-dark",
    HIGH: "bg-danger",
};
const STATUS_BADGE = {
    NEW: "bg-success",
};
// ── Read-only field ───────────────────────────────────────────────────────
function ReadOnlyField({ label, value, testId, }) {
    return (_jsxs("div", { children: [_jsx("label", { className: "form-label fw-semibold mb-1", style: { color: "#1A2E22", fontSize: "0.875rem" }, children: label }), _jsx("div", { className: "form-control-plaintext ps-2 rounded", style: { backgroundColor: "#F0F4F2", color: "#1A2E22", minHeight: 38 }, "data-testid": testId, children: value ?? "—" })] }));
}
// ── Component ────────────────────────────────────────────────────────────
export function TicketDetail({ ticketNumber, onBack }) {
    const { currentRequester } = useRequester();
    const [detailState, setDetailState] = useState("loading");
    const [ticket, setTicket] = useState(null);
    const [attachments, setAttachments] = useState([]);
    const [errorMsg, setErrorMsg] = useState(null);
    // Upload state
    const fileInputRef = useRef(null);
    const [uploadError, setUploadError] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(null); // filename while uploading
    // Remove modal state
    const [removeModal, setRemoveModal] = useState(null);
    // ── Load ticket ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!currentRequester)
            return;
        setDetailState("loading");
        fetchTicketByNumber(ticketNumber, currentRequester.id)
            .then((t) => {
            setTicket(t);
            setAttachments(t.attachments ?? []);
            setDetailState("loaded");
        })
            .catch((err) => {
            setErrorMsg(err.message);
            setDetailState("error");
        });
    }, [ticketNumber, currentRequester]);
    // ── Upload ─────────────────────────────────────────────────────────────
    async function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file || !ticket || !currentRequester)
            return;
        if (fileInputRef.current)
            fileInputRef.current.value = "";
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
        }
        catch (err) {
            setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
        }
        finally {
            setUploadingFile(null);
        }
    }
    // ── Remove modal ───────────────────────────────────────────────────────
    function openRemoveModal(att) {
        setRemoveModal({
            attachmentId: att.id,
            originalName: att.originalName,
            reason: "",
            error: null,
            submitting: false,
        });
    }
    function closeRemoveModal() {
        setRemoveModal(null);
    }
    async function confirmRemove() {
        if (!removeModal || !currentRequester)
            return;
        if (removeModal.reason.trim().length < 5) {
            setRemoveModal((m) => m ? { ...m, error: "Reason must be at least 5 characters." } : m);
            return;
        }
        setRemoveModal((m) => m ? { ...m, submitting: true, error: null } : m);
        try {
            const updated = await removeAttachment(removeModal.attachmentId, currentRequester.id, removeModal.reason.trim());
            setAttachments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            closeRemoveModal();
        }
        catch (err) {
            setRemoveModal((m) => m ? {
                ...m,
                submitting: false,
                error: err instanceof Error ? err.message : "Remove failed.",
            } : m);
        }
    }
    // ── Render states ──────────────────────────────────────────────────────
    if (detailState === "loading") {
        return (_jsxs("div", { className: "text-center py-5", "data-testid": "ticket-detail-loading", children: [_jsx("div", { className: "spinner-border", style: { color: "#006B3C" }, role: "status", children: _jsx("span", { className: "visually-hidden", children: "Loading ticket\u2026" }) }), _jsx("p", { className: "mt-2 text-muted", children: "Loading ticket\u2026" })] }));
    }
    if (detailState === "error" || !ticket) {
        return (_jsxs("div", { "data-testid": "ticket-detail-error", children: [_jsx("div", { className: "alert alert-danger", children: errorMsg ?? "Unable to load ticket." }), _jsx("button", { className: "btn btn-outline-secondary btn-sm", onClick: onBack, children: "\u2190 Back to My Tickets" })] }));
    }
    // ── Main render ────────────────────────────────────────────────────────
    const t = ticket;
    const activeAttachments = attachments.filter((a) => a.removedAt === null);
    const removedAttachments = attachments.filter((a) => a.removedAt !== null);
    return (_jsxs("div", { "data-testid": "ticket-detail-screen", children: [_jsx("nav", { "aria-label": "breadcrumb", className: "mb-3", children: _jsxs("ol", { className: "breadcrumb mb-0", style: { fontSize: "0.875rem" }, children: [_jsx("li", { className: "breadcrumb-item", children: _jsx("button", { className: "btn btn-link p-0 text-decoration-none", style: { color: "#0B7A46" }, onClick: onBack, "data-testid": "back-to-tickets-btn", children: "My Tickets" }) }), _jsx("li", { className: "breadcrumb-item active", "aria-current": "page", children: t.ticketNumber })] }) }), _jsxs("div", { className: "card shadow-sm border-0 p-4 mb-4", "data-testid": "ticket-header", children: [_jsxs("div", { className: "row g-3 mb-3", children: [_jsx("div", { className: "col-md-6", children: _jsx(ReadOnlyField, { label: "Ticket No.", value: t.ticketNumber, testId: "detail-ticket-number" }) }), _jsx("div", { className: "col-md-6", children: _jsx(ReadOnlyField, { label: "Ticket Date", value: formatDate(t.ticketDate), testId: "detail-ticket-date" }) })] }), _jsxs("div", { className: "row g-3 mb-3", children: [_jsx("div", { className: "col-md-6", children: _jsx(ReadOnlyField, { label: "Requester", value: t.requester?.name, testId: "detail-requester" }) }), _jsx("div", { className: "col-md-6", children: _jsxs("div", { children: [_jsx("label", { className: "form-label fw-semibold mb-1", style: { color: "#1A2E22", fontSize: "0.875rem" }, children: "Requested Priority" }), _jsx("div", { className: "ps-1 pt-1", "data-testid": "detail-priority", children: _jsx("span", { className: `badge ${PRIORITY_BADGE[t.requestedPriority] ?? "bg-secondary"}`, children: t.requestedPriority }) })] }) })] }), _jsxs("div", { className: "row g-3 mb-3", children: [_jsx("div", { className: "col-md-6", children: _jsx(ReadOnlyField, { label: "Category", value: t.category?.name, testId: "detail-category" }) }), _jsx("div", { className: "col-md-6", children: _jsx(ReadOnlyField, { label: "Related System", value: t.relatedSystem?.name, testId: "detail-related-system" }) })] }), _jsx("div", { className: "row g-3 mb-3", children: _jsx("div", { className: "col-md-6", children: _jsxs("div", { children: [_jsx("label", { className: "form-label fw-semibold mb-1", style: { color: "#1A2E22", fontSize: "0.875rem" }, children: "Current Status" }), _jsx("div", { className: "ps-1 pt-1", "data-testid": "detail-status", children: _jsx("span", { className: `badge ${STATUS_BADGE[t.status] ?? "bg-secondary"}`, children: t.status }) })] }) }) }), _jsx("div", { className: "mb-3", children: _jsx(ReadOnlyField, { label: "Ticket Summary", value: t.summary, testId: "detail-summary" }) }), _jsxs("div", { children: [_jsx("label", { className: "form-label fw-semibold mb-1", style: { color: "#1A2E22", fontSize: "0.875rem" }, children: "Description" }), _jsx("div", { className: "rounded p-2", style: {
                                    backgroundColor: "#F0F4F2", color: "#1A2E22",
                                    whiteSpace: "pre-wrap", minHeight: 80,
                                }, "data-testid": "detail-description", children: t.description })] })] }), _jsxs("div", { className: "card shadow-sm border-0 p-4", "data-testid": "attachments-section", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-3", children: [_jsxs("h2", { className: "h6 fw-bold mb-0", style: { color: "#1A2E22" }, children: ["Attachments", activeAttachments.length > 0 && (_jsx("span", { className: "badge bg-secondary ms-2", children: activeAttachments.length }))] }), _jsxs("div", { children: [_jsx("input", { ref: fileInputRef, type: "file", className: "d-none", onChange: handleFileChange, disabled: !!uploadingFile, "data-testid": "add-attachment-input", "aria-label": "Add attachment" }), _jsx("button", { type: "button", className: "btn btn-sm btn-outline-secondary", onClick: () => fileInputRef.current?.click(), disabled: !!uploadingFile, "data-testid": "add-attachment-btn", children: uploadingFile ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "spinner-border spinner-border-sm me-1", role: "status", "aria-hidden": "true" }), "Uploading\u2026"] })) : ("+ Add Attachment") })] })] }), uploadError && (_jsx("div", { className: "alert alert-danger py-2 mb-3", "data-testid": "upload-error", children: uploadError })), activeAttachments.length === 0 && removedAttachments.length === 0 && (_jsx("p", { className: "text-muted mb-0", style: { fontSize: "0.875rem" }, "data-testid": "no-attachments", children: "No attachments yet." })), activeAttachments.length > 0 && (_jsx("ul", { className: "list-group list-group-flush mb-2", "data-testid": "active-attachments-list", children: activeAttachments.map((att) => (_jsxs("li", { className: "list-group-item d-flex justify-content-between align-items-center px-0", "data-testid": `attachment-active-${att.id}`, children: [_jsxs("div", { children: [_jsx("span", { className: "fw-semibold", style: { fontSize: "0.9rem" }, children: att.originalName }), _jsxs("small", { className: "text-muted ms-2", children: [formatBytes(att.sizeBytes), " \u00B7 ", formatDate(att.uploadedAt)] })] }), _jsxs("div", { className: "d-flex gap-2", children: [_jsx("a", { href: getAttachmentDownloadUrl(att.id, currentRequester.id), className: "btn btn-sm btn-outline-secondary", target: "_blank", rel: "noreferrer", "data-testid": `download-btn-${att.id}`, "aria-label": `Download ${att.originalName}`, children: "Download" }), _jsx("button", { type: "button", className: "btn btn-sm btn-outline-danger", onClick: () => openRemoveModal(att), "data-testid": `remove-btn-${att.id}`, "aria-label": `Remove ${att.originalName}`, children: "Remove" })] })] }, att.id))) })), removedAttachments.length > 0 && (_jsxs("div", { "data-testid": "removed-attachments-list", children: [_jsx("p", { className: "text-muted mb-1", style: { fontSize: "0.8rem" }, children: "Removed attachments:" }), _jsx("ul", { className: "list-group list-group-flush", children: removedAttachments.map((att) => (_jsx("li", { className: "list-group-item px-0", style: { opacity: 0.6 }, "data-testid": `attachment-removed-${att.id}`, children: _jsxs("div", { className: "d-flex justify-content-between align-items-start", children: [_jsxs("div", { children: [_jsx("span", { className: "fw-semibold text-decoration-line-through", style: { fontSize: "0.9rem", color: "#5A6E62" }, children: att.originalName }), _jsx("small", { className: "text-muted ms-2", children: formatBytes(att.sizeBytes) }), _jsxs("div", { style: { fontSize: "0.8rem", color: "#5A6E62" }, children: ["Removed ", att.removedAt ? formatDate(att.removedAt) : "", " \u2014 \"", att.removalReason, "\""] })] }), _jsx("span", { className: "badge bg-secondary", "data-testid": `removed-badge-${att.id}`, children: "REMOVED" })] }) }, att.id))) })] }))] }), removeModal && (_jsx("div", { className: "modal d-block", style: { backgroundColor: "rgba(0,0,0,0.4)" }, role: "dialog", "aria-modal": "true", "aria-labelledby": "remove-modal-title", "data-testid": "remove-modal", children: _jsx("div", { className: "modal-dialog modal-dialog-centered", children: _jsxs("div", { className: "modal-content", children: [_jsxs("div", { className: "modal-header", children: [_jsx("h5", { className: "modal-title", id: "remove-modal-title", children: "Remove Attachment" }), _jsx("button", { type: "button", className: "btn-close", onClick: closeRemoveModal, disabled: removeModal.submitting, "aria-label": "Close" })] }), _jsxs("div", { className: "modal-body", children: [_jsxs("p", { className: "mb-3", children: ["Are you sure you want to remove", " ", _jsx("strong", { children: removeModal.originalName }), "? This cannot be undone."] }), _jsxs("label", { htmlFor: "removal-reason", className: "form-label fw-semibold", style: { fontSize: "0.875rem" }, children: ["Reason for removal ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("textarea", { id: "removal-reason", className: "form-control", rows: 3, value: removeModal.reason, onChange: (e) => setRemoveModal((m) => m ? { ...m, reason: e.target.value } : m), disabled: removeModal.submitting, placeholder: "Minimum 5 characters", "data-testid": "removal-reason-input", "aria-required": "true" }), removeModal.error && (_jsx("div", { className: "text-danger mt-1", style: { fontSize: "0.82rem" }, "data-testid": "removal-reason-error", children: removeModal.error }))] }), _jsxs("div", { className: "modal-footer", children: [_jsx("button", { type: "button", className: "btn btn-outline-secondary", onClick: closeRemoveModal, disabled: removeModal.submitting, "data-testid": "cancel-remove-btn", children: "Cancel" }), _jsx("button", { type: "button", className: "btn btn-danger", onClick: confirmRemove, disabled: removeModal.submitting, "data-testid": "confirm-remove-btn", children: removeModal.submitting ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "spinner-border spinner-border-sm me-1", role: "status", "aria-hidden": "true" }), "Removing\u2026"] })) : ("Confirm Remove") })] })] }) }) }))] }));
}
export default TicketDetail;
