import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useRef } from "react";
import { fetchCategories, fetchRelatedSystems, createTicket, uploadAttachment, } from "../api.js";
import { useRequester } from "../context/RequesterContext.js";
// ── Constants ────────────────────────────────────────────────────────────
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 5;
export function CreateTicket({ onCancel }) {
    const { currentRequester } = useRequester();
    // Reference data
    const [categories, setCategories] = useState([]);
    const [relatedSystems, setRelatedSystems] = useState([]);
    const [refLoading, setRefLoading] = useState(true);
    const [refError, setRefError] = useState(null);
    // Form fields
    const [summary, setSummary] = useState("");
    const [description, setDescription] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [relatedSystemId, setRelatedSystemId] = useState("");
    const [requestedPriority, setRequestedPriority] = useState("");
    const [pendingFiles, setPendingFiles] = useState([]);
    // Form state
    const [formState, setFormState] = useState("idle");
    const [fieldErrors, setFieldErrors] = useState({});
    const [apiError, setApiError] = useState(null);
    const [successTicketNumber, setSuccessTicketNumber] = useState(null);
    const fileInputRef = useRef(null);
    // Load reference data on mount
    useEffect(() => {
        Promise.all([fetchCategories(), fetchRelatedSystems()])
            .then(([cats, systems]) => {
            setCategories(cats);
            setRelatedSystems(systems);
            setRefLoading(false);
        })
            .catch(() => {
            setRefError("Unable to load form data. Please refresh and try again.");
            setRefLoading(false);
        });
    }, []);
    // ── Client-side validation ─────────────────────────────────────────────
    function validate() {
        const errors = {};
        if (!summary.trim())
            errors.summary = "Summary is required.";
        else if (summary.trim().length < 5)
            errors.summary = "Summary must be at least 5 characters.";
        else if (summary.trim().length > 150)
            errors.summary = "Summary must be 150 characters or fewer.";
        if (!description.trim())
            errors.description = "Description is required.";
        else if (description.trim().length < 10)
            errors.description = "Description must be at least 10 characters.";
        else if (description.trim().length > 2000)
            errors.description = "Description must be 2000 characters or fewer.";
        if (!categoryId)
            errors.categoryId = "Category is required.";
        if (!relatedSystemId)
            errors.relatedSystemId = "Related System is required.";
        if (!requestedPriority)
            errors.requestedPriority = "Requested Priority is required.";
        return errors;
    }
    // ── File handling ──────────────────────────────────────────────────────
    function handleFileChange(e) {
        const files = Array.from(e.target.files ?? []);
        const newPending = files.map((file) => {
            if (!ALLOWED_TYPES.includes(file.type)) {
                return { file, error: `"${file.name}" is not an allowed file type (JPG, PNG, WEBP, PDF only).` };
            }
            if (file.size > MAX_SIZE_BYTES) {
                return { file, error: `"${file.name}" exceeds the 5 MB size limit.` };
            }
            return { file, error: null };
        });
        setPendingFiles((prev) => {
            const combined = [...prev, ...newPending];
            // Keep at most MAX_FILES valid files + all invalid ones for error display
            return combined;
        });
        // Reset input so the same file can be re-selected after removal
        if (fileInputRef.current)
            fileInputRef.current.value = "";
    }
    function removePendingFile(index) {
        setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    }
    // ── Submit ─────────────────────────────────────────────────────────────
    async function handleSubmit(e) {
        e.preventDefault();
        if (!currentRequester)
            return;
        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }
        setFieldErrors({});
        const validFiles = pendingFiles.filter((f) => !f.error);
        const invalidCount = pendingFiles.filter((f) => f.error).length;
        if (invalidCount > 0) {
            setApiError("Please remove invalid files before submitting.");
            return;
        }
        if (validFiles.length > MAX_FILES) {
            setApiError(`You can attach at most ${MAX_FILES} files per ticket.`);
            return;
        }
        setFormState("submitting");
        setApiError(null);
        try {
            // 1. Create the ticket
            const ticket = await createTicket({
                requesterId: currentRequester.id,
                categoryId: Number(categoryId),
                relatedSystemId: Number(relatedSystemId),
                summary: summary.trim(),
                description: description.trim(),
                requestedPriority: requestedPriority,
            });
            // 2. Upload attachments one by one (ticket is NOT rolled back on upload failure)
            const uploadErrors = [];
            for (const { file } of validFiles) {
                try {
                    await uploadAttachment(ticket.ticketNumber, currentRequester.id, file);
                }
                catch (err) {
                    uploadErrors.push(`"${file.name}" could not be uploaded: ${err instanceof Error ? err.message : "unknown error"}`);
                }
            }
            setSuccessTicketNumber(ticket.ticketNumber);
            setFormState("success");
            if (uploadErrors.length > 0) {
                setApiError(`Ticket created, but some attachments failed to upload:\n${uploadErrors.join("\n")}`);
            }
        }
        catch (err) {
            // Server-side field validation errors
            const fieldErrs = err.fields;
            if (fieldErrs && Object.keys(fieldErrs).length > 0) {
                setFieldErrors(fieldErrs);
                setFormState("idle");
            }
            else {
                setApiError(err instanceof Error
                    ? err.message
                    : "Unable to create ticket. Please try again later.");
                setFormState("error");
            }
            // Form values are preserved (no reset) so the user doesn't lose their work
        }
    }
    // ── Render helpers ─────────────────────────────────────────────────────
    function FieldError({ name }) {
        const msg = fieldErrors[name];
        if (!msg)
            return null;
        return (_jsx("div", { className: "text-danger mt-1", style: { fontSize: "0.82rem" }, role: "alert", "data-testid": `error-${name}`, children: msg }));
    }
    const isSubmitting = formState === "submitting";
    const labelStyle = { color: "#1A2E22", fontWeight: 600, fontSize: "0.875rem" };
    const inputClass = "form-control";
    const readonlyClass = "form-control-plaintext ps-2";
    // ── Loading / error reference data ────────────────────────────────────
    if (refLoading) {
        return (_jsxs("div", { className: "text-center py-5", "data-testid": "create-ticket-ref-loading", children: [_jsx("div", { className: "spinner-border", style: { color: "#006B3C" }, role: "status", children: _jsx("span", { className: "visually-hidden", children: "Loading form data\u2026" }) }), _jsx("p", { className: "mt-2", style: { color: "#5A6E62" }, children: "Loading form data\u2026" })] }));
    }
    if (refError) {
        return (_jsx("div", { className: "alert alert-danger", "data-testid": "create-ticket-ref-error", children: refError }));
    }
    // ── Success state ─────────────────────────────────────────────────────
    if (formState === "success") {
        return (_jsxs("div", { "data-testid": "create-ticket-success", children: [_jsxs("div", { className: "alert d-flex flex-column gap-2 p-4", style: { backgroundColor: "#EAF6EF", border: "1px solid #0B7A46", color: "#065F46" }, children: [_jsx("strong", { style: { fontSize: "1.1rem" }, children: "\u2705 Ticket created successfully!" }), _jsxs("span", { children: ["Your Ticket Number is:", " ", _jsx("strong", { "data-testid": "success-ticket-number", children: successTicketNumber })] }), apiError && (_jsx("div", { className: "alert alert-warning mb-0 py-2", style: { fontSize: "0.85rem" }, children: apiError }))] }), _jsx("button", { type: "button", className: "btn mt-3", style: { backgroundColor: "#006B3C", color: "white" }, onClick: onCancel, "data-testid": "back-btn", children: "\u2190 Back" })] }));
    }
    // ── Main form ─────────────────────────────────────────────────────────
    return (_jsxs("div", { style: { maxWidth: 760 }, "data-testid": "create-ticket-form", children: [_jsx("h1", { className: "h4 fw-bold mb-4", style: { color: "#1A2E22" }, children: "Create Ticket" }), formState === "error" && apiError && (_jsx("div", { className: "alert alert-danger mb-4", role: "alert", "data-testid": "api-error-banner", children: apiError })), _jsxs("form", { onSubmit: handleSubmit, noValidate: true, children: [_jsxs("div", { className: "row mb-3", children: [_jsxs("div", { className: "col-md-6 mb-3 mb-md-0", children: [_jsx("label", { style: labelStyle, children: "Ticket Number" }), _jsx("input", { className: readonlyClass, readOnly: true, value: "Will be assigned on submission", style: { backgroundColor: "#F0F4F2", color: "#5A6E62" }, "aria-label": "Ticket Number \u2014 assigned on submission" })] }), _jsxs("div", { className: "col-md-6", children: [_jsx("label", { style: labelStyle, children: "Ticket Date" }), _jsx("input", { className: readonlyClass, readOnly: true, value: "Will be assigned on submission", style: { backgroundColor: "#F0F4F2", color: "#5A6E62" }, "aria-label": "Ticket Date \u2014 assigned on submission" })] })] }), _jsxs("div", { className: "row mb-3", children: [_jsxs("div", { className: "col-md-6 mb-3 mb-md-0", children: [_jsx("label", { style: labelStyle, children: "Requester" }), _jsx("input", { className: readonlyClass, readOnly: true, value: currentRequester?.name ?? "", style: { backgroundColor: "#F0F4F2" }, "data-testid": "requester-readonly", "aria-label": "Requester" })] }), _jsxs("div", { className: "col-md-6", children: [_jsxs("label", { htmlFor: "priority-select", style: labelStyle, children: ["Requested Priority", " ", _jsx("span", { className: "text-danger", "aria-hidden": "true", children: "*" }), _jsx("span", { className: "visually-hidden", children: "(required)" })] }), _jsxs("select", { id: "priority-select", className: `${inputClass}${fieldErrors.requestedPriority ? " is-invalid" : ""}`, value: requestedPriority, onChange: (e) => setRequestedPriority(e.target.value), disabled: isSubmitting, "aria-required": "true", "data-testid": "priority-select", children: [_jsx("option", { value: "", children: "Select priority\u2026" }), _jsx("option", { value: "LOW", children: "Low" }), _jsx("option", { value: "MEDIUM", children: "Medium" }), _jsx("option", { value: "HIGH", children: "High" })] }), _jsx(FieldError, { name: "requestedPriority" })] })] }), _jsxs("div", { className: "row mb-3", children: [_jsxs("div", { className: "col-md-6 mb-3 mb-md-0", children: [_jsxs("label", { htmlFor: "category-select", style: labelStyle, children: ["Category", " ", _jsx("span", { className: "text-danger", "aria-hidden": "true", children: "*" }), _jsx("span", { className: "visually-hidden", children: "(required)" })] }), _jsxs("select", { id: "category-select", className: `${inputClass}${fieldErrors.categoryId ? " is-invalid" : ""}`, value: categoryId, onChange: (e) => setCategoryId(e.target.value), disabled: isSubmitting, "aria-required": "true", "data-testid": "category-select", children: [_jsx("option", { value: "", children: "Select category\u2026" }), categories.map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id)))] }), _jsx(FieldError, { name: "categoryId" })] }), _jsxs("div", { className: "col-md-6", children: [_jsxs("label", { htmlFor: "system-select", style: labelStyle, children: ["Related System", " ", _jsx("span", { className: "text-danger", "aria-hidden": "true", children: "*" }), _jsx("span", { className: "visually-hidden", children: "(required)" })] }), _jsxs("select", { id: "system-select", className: `${inputClass}${fieldErrors.relatedSystemId ? " is-invalid" : ""}`, value: relatedSystemId, onChange: (e) => setRelatedSystemId(e.target.value), disabled: isSubmitting, "aria-required": "true", "data-testid": "system-select", children: [_jsx("option", { value: "", children: "Select system\u2026" }), relatedSystems.map((s) => (_jsx("option", { value: s.id, children: s.name }, s.id)))] }), _jsx(FieldError, { name: "relatedSystemId" })] })] }), _jsxs("div", { className: "mb-3", children: [_jsxs("label", { htmlFor: "summary-input", style: labelStyle, children: ["Ticket Summary", " ", _jsx("span", { className: "text-danger", "aria-hidden": "true", children: "*" }), _jsx("span", { className: "visually-hidden", children: "(required)" })] }), _jsx("input", { id: "summary-input", type: "text", className: `${inputClass}${fieldErrors.summary ? " is-invalid" : ""}`, value: summary, onChange: (e) => setSummary(e.target.value), disabled: isSubmitting, maxLength: 150, "aria-required": "true", "data-testid": "summary-input", placeholder: "Brief description of the issue (5\u2013150 characters)" }), _jsx(FieldError, { name: "summary" })] }), _jsxs("div", { className: "mb-3", children: [_jsxs("label", { htmlFor: "description-input", style: labelStyle, children: ["Description", " ", _jsx("span", { className: "text-danger", "aria-hidden": "true", children: "*" }), _jsx("span", { className: "visually-hidden", children: "(required)" })] }), _jsx("textarea", { id: "description-input", className: `${inputClass}${fieldErrors.description ? " is-invalid" : ""}`, value: description, onChange: (e) => setDescription(e.target.value), disabled: isSubmitting, rows: 5, maxLength: 2000, "aria-required": "true", "data-testid": "description-input", placeholder: "Detailed description of the issue (10\u20132000 characters)", style: { resize: "vertical", minHeight: 120 } }), _jsx(FieldError, { name: "description" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { style: labelStyle, children: "Attachments (optional)" }), _jsxs("div", { className: "border rounded p-3", style: { backgroundColor: "#F5F7F6", borderColor: "#D1D9D5" }, children: [_jsx("input", { ref: fileInputRef, type: "file", multiple: true, onChange: handleFileChange, disabled: isSubmitting, className: "form-control mb-2", "data-testid": "file-input", "aria-label": "Attach files (JPG, PNG, WEBP, PDF, max 5 MB each)" }), _jsxs("p", { style: { fontSize: "0.8rem", color: "#5A6E62", margin: 0 }, children: ["Allowed: JPG, PNG, WEBP, PDF \u00B7 Max 5 MB per file \u00B7 Max ", MAX_FILES, " files"] }), pendingFiles.length > 0 && (_jsx("ul", { className: "list-group mt-2", "data-testid": "pending-files-list", children: pendingFiles.map(({ file, error }, i) => (_jsxs("li", { className: `list-group-item d-flex justify-content-between align-items-start py-2 ${error ? "list-group-item-danger" : ""}`, "data-testid": `pending-file-${i}`, children: [_jsxs("div", { children: [_jsx("span", { style: { fontSize: "0.875rem" }, children: file.name }), error && (_jsx("div", { className: "text-danger", style: { fontSize: "0.78rem" }, "data-testid": `file-error-${i}`, children: error }))] }), _jsx("button", { type: "button", className: "btn btn-sm btn-outline-danger ms-2", onClick: () => removePendingFile(i), disabled: isSubmitting, "aria-label": `Remove ${file.name}`, children: "\u2715" })] }, i))) }))] })] }), _jsxs("div", { className: "d-flex justify-content-end gap-2", children: [_jsx("button", { type: "button", className: "btn btn-outline-secondary", onClick: onCancel, disabled: isSubmitting, "data-testid": "cancel-btn", children: "Cancel" }), _jsx("button", { type: "submit", className: "btn text-white fw-semibold", style: { backgroundColor: isSubmitting ? "#5A6E62" : "#006B3C" }, disabled: isSubmitting, "data-testid": "submit-btn", children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "spinner-border spinner-border-sm me-2", role: "status", "aria-hidden": "true" }), "Submitting\u2026"] })) : ("Submit Ticket →") })] })] })] }));
}
export default CreateTicket;
