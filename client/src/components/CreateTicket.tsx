import { useEffect, useState, useRef, ChangeEvent } from "react";
import {
  fetchCategories,
  fetchRelatedSystems,
  createTicket,
  uploadAttachment,
  Category,
  RelatedSystem,
  Priority,
} from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

// ── Constants ────────────────────────────────────────────────────────────

const ALLOWED_TYPES  = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FILES      = 5;

// ── Types ────────────────────────────────────────────────────────────────

interface FieldErrors {
  summary?:           string;
  description?:       string;
  categoryId?:        string;
  relatedSystemId?:   string;
  requestedPriority?: string;
  [key: string]: string | undefined;
}

interface PendingFile {
  file:  File;
  error: string | null;
}

type FormState = "idle" | "submitting" | "success" | "error";

// ── Component ────────────────────────────────────────────────────────────

interface CreateTicketProps {
  onCancel?: () => void;
}

export function CreateTicket({ onCancel }: CreateTicketProps) {
  const { currentRequester } = useRequester();

  // Reference data
  const [categories,     setCategories]     = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [refLoading,     setRefLoading]     = useState(true);
  const [refError,       setRefError]       = useState<string | null>(null);

  // Form fields
  const [summary,           setSummary]           = useState("");
  const [description,       setDescription]       = useState("");
  const [categoryId,        setCategoryId]        = useState("");
  const [relatedSystemId,   setRelatedSystemId]   = useState("");
  const [requestedPriority, setRequestedPriority] = useState<Priority | "">("");
  const [pendingFiles,      setPendingFiles]       = useState<PendingFile[]>([]);

  // Form state
  const [formState,   setFormState]   = useState<FormState>("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError,    setApiError]    = useState<string | null>(null);
  const [successTicketNumber, setSuccessTicketNumber] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!summary.trim())               errors.summary           = "Summary is required.";
    else if (summary.trim().length < 5)  errors.summary         = "Summary must be at least 5 characters.";
    else if (summary.trim().length > 150) errors.summary        = "Summary must be 150 characters or fewer.";
    if (!description.trim())           errors.description       = "Description is required.";
    else if (description.trim().length < 10) errors.description = "Description must be at least 10 characters.";
    else if (description.trim().length > 2000) errors.description = "Description must be 2000 characters or fewer.";
    if (!categoryId)                   errors.categoryId        = "Category is required.";
    if (!relatedSystemId)              errors.relatedSystemId   = "Related System is required.";
    if (!requestedPriority)            errors.requestedPriority = "Requested Priority is required.";
    return errors;
  }

  // ── File handling ──────────────────────────────────────────────────────

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newPending: PendingFile[] = files.map((file) => {
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Submit ─────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentRequester) return;

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const validFiles  = pendingFiles.filter((f) => !f.error);
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
        requesterId:       currentRequester.id,
        categoryId:        Number(categoryId),
        relatedSystemId:   Number(relatedSystemId),
        summary:           summary.trim(),
        description:       description.trim(),
        requestedPriority: requestedPriority as Priority,
      });

      // 2. Upload attachments one by one (ticket is NOT rolled back on upload failure)
      const uploadErrors: string[] = [];
      for (const { file } of validFiles) {
        try {
          await uploadAttachment(ticket.ticketNumber, currentRequester.id, file);
        } catch (err) {
          uploadErrors.push(
            `"${file.name}" could not be uploaded: ${err instanceof Error ? err.message : "unknown error"}`
          );
        }
      }

      setSuccessTicketNumber(ticket.ticketNumber);
      setFormState("success");

      if (uploadErrors.length > 0) {
        setApiError(
          `Ticket created, but some attachments failed to upload:\n${uploadErrors.join("\n")}`
        );
      }
    } catch (err: unknown) {
      // Server-side field validation errors
      const fieldErrs = (err as { fields?: FieldErrors }).fields;
      if (fieldErrs && Object.keys(fieldErrs).length > 0) {
        setFieldErrors(fieldErrs);
        setFormState("idle");
      } else {
        setApiError(
          err instanceof Error
            ? err.message
            : "Unable to create ticket. Please try again later."
        );
        setFormState("error");
      }
      // Form values are preserved (no reset) so the user doesn't lose their work
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────────

  function FieldError({ name }: { name: string }) {
    const msg = fieldErrors[name];
    if (!msg) return null;
    return (
      <div
        className="text-danger mt-1"
        style={{ fontSize: "0.82rem" }}
        role="alert"
        data-testid={`error-${name}`}
      >
        {msg}
      </div>
    );
  }

  const isSubmitting = formState === "submitting";
  const labelStyle   = { color: "#1A2E22", fontWeight: 600, fontSize: "0.875rem" };
  const inputClass   = "form-control";
  const readonlyClass = "form-control-plaintext ps-2";

  // ── Loading / error reference data ────────────────────────────────────

  if (refLoading) {
    return (
      <div className="text-center py-5" data-testid="create-ticket-ref-loading">
        <div className="spinner-border" style={{ color: "#006B3C" }} role="status">
          <span className="visually-hidden">Loading form data…</span>
        </div>
        <p className="mt-2" style={{ color: "#5A6E62" }}>Loading form data…</p>
      </div>
    );
  }

  if (refError) {
    return (
      <div className="alert alert-danger" data-testid="create-ticket-ref-error">
        {refError}
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────

  if (formState === "success") {
    return (
      <div data-testid="create-ticket-success">
        <div
          className="alert d-flex flex-column gap-2 p-4"
          style={{ backgroundColor: "#EAF6EF", border: "1px solid #0B7A46", color: "#065F46" }}
        >
          <strong style={{ fontSize: "1.1rem" }}>✅ Ticket created successfully!</strong>
          <span>
            Your Ticket Number is:{" "}
            <strong data-testid="success-ticket-number">{successTicketNumber}</strong>
          </span>
          {apiError && (
            <div className="alert alert-warning mb-0 py-2" style={{ fontSize: "0.85rem" }}>
              {apiError}
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn mt-3"
          style={{ backgroundColor: "#006B3C", color: "white" }}
          onClick={onCancel}
          data-testid="back-btn"
        >
          ← Back
        </button>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 760 }} data-testid="create-ticket-form">
      <h1 className="h4 fw-bold mb-4" style={{ color: "#1A2E22" }}>
        Create Ticket
      </h1>

      {/* API error banner (preserves form values) */}
      {formState === "error" && apiError && (
        <div className="alert alert-danger mb-4" role="alert" data-testid="api-error-banner">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* ── System-generated fields (read-only) ── */}
        <div className="row mb-3">
          <div className="col-md-6 mb-3 mb-md-0">
            <label style={labelStyle}>Ticket Number</label>
            <input
              className={readonlyClass}
              readOnly
              value="Will be assigned on submission"
              style={{ backgroundColor: "#F0F4F2", color: "#5A6E62" }}
              aria-label="Ticket Number — assigned on submission"
            />
          </div>
          <div className="col-md-6">
            <label style={labelStyle}>Ticket Date</label>
            <input
              className={readonlyClass}
              readOnly
              value="Will be assigned on submission"
              style={{ backgroundColor: "#F0F4F2", color: "#5A6E62" }}
              aria-label="Ticket Date — assigned on submission"
            />
          </div>
        </div>

        {/* ── Requester (read-only, pre-filled from context) ── */}
        <div className="row mb-3">
          <div className="col-md-6 mb-3 mb-md-0">
            <label style={labelStyle}>Requester</label>
            <input
              className={readonlyClass}
              readOnly
              value={currentRequester?.name ?? ""}
              style={{ backgroundColor: "#F0F4F2" }}
              data-testid="requester-readonly"
              aria-label="Requester"
            />
          </div>

          {/* ── Requested Priority ── */}
          <div className="col-md-6">
            <label htmlFor="priority-select" style={labelStyle}>
              Requested Priority{" "}
              <span className="text-danger" aria-hidden="true">*</span>
              <span className="visually-hidden">(required)</span>
            </label>
            <select
              id="priority-select"
              className={`${inputClass}${fieldErrors.requestedPriority ? " is-invalid" : ""}`}
              value={requestedPriority}
              onChange={(e) => setRequestedPriority(e.target.value as Priority | "")}
              disabled={isSubmitting}
              aria-required="true"
              data-testid="priority-select"
            >
              <option value="">Select priority…</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <FieldError name="requestedPriority" />
          </div>
        </div>

        {/* ── Category + Related System ── */}
        <div className="row mb-3">
          <div className="col-md-6 mb-3 mb-md-0">
            <label htmlFor="category-select" style={labelStyle}>
              Category{" "}
              <span className="text-danger" aria-hidden="true">*</span>
              <span className="visually-hidden">(required)</span>
            </label>
            <select
              id="category-select"
              className={`${inputClass}${fieldErrors.categoryId ? " is-invalid" : ""}`}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={isSubmitting}
              aria-required="true"
              data-testid="category-select"
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <FieldError name="categoryId" />
          </div>

          <div className="col-md-6">
            <label htmlFor="system-select" style={labelStyle}>
              Related System{" "}
              <span className="text-danger" aria-hidden="true">*</span>
              <span className="visually-hidden">(required)</span>
            </label>
            <select
              id="system-select"
              className={`${inputClass}${fieldErrors.relatedSystemId ? " is-invalid" : ""}`}
              value={relatedSystemId}
              onChange={(e) => setRelatedSystemId(e.target.value)}
              disabled={isSubmitting}
              aria-required="true"
              data-testid="system-select"
            >
              <option value="">Select system…</option>
              {relatedSystems.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <FieldError name="relatedSystemId" />
          </div>
        </div>

        {/* ── Summary ── */}
        <div className="mb-3">
          <label htmlFor="summary-input" style={labelStyle}>
            Ticket Summary{" "}
            <span className="text-danger" aria-hidden="true">*</span>
            <span className="visually-hidden">(required)</span>
          </label>
          <input
            id="summary-input"
            type="text"
            className={`${inputClass}${fieldErrors.summary ? " is-invalid" : ""}`}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            disabled={isSubmitting}
            maxLength={150}
            aria-required="true"
            data-testid="summary-input"
            placeholder="Brief description of the issue (5–150 characters)"
          />
          <FieldError name="summary" />
        </div>

        {/* ── Description ── */}
        <div className="mb-3">
          <label htmlFor="description-input" style={labelStyle}>
            Description{" "}
            <span className="text-danger" aria-hidden="true">*</span>
            <span className="visually-hidden">(required)</span>
          </label>
          <textarea
            id="description-input"
            className={`${inputClass}${fieldErrors.description ? " is-invalid" : ""}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            rows={5}
            maxLength={2000}
            aria-required="true"
            data-testid="description-input"
            placeholder="Detailed description of the issue (10–2000 characters)"
            style={{ resize: "vertical", minHeight: 120 }}
          />
          <FieldError name="description" />
        </div>

        {/* ── Attachments ── */}
        <div className="mb-4">
          <label style={labelStyle}>Attachments (optional)</label>
          <div
            className="border rounded p-3"
            style={{ backgroundColor: "#F5F7F6", borderColor: "#D1D9D5" }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              disabled={isSubmitting}
              className="form-control mb-2"
              data-testid="file-input"
              aria-label="Attach files (JPG, PNG, WEBP, PDF, max 5 MB each)"
            />
            <p style={{ fontSize: "0.8rem", color: "#5A6E62", margin: 0 }}>
              Allowed: JPG, PNG, WEBP, PDF · Max 5 MB per file · Max {MAX_FILES} files
            </p>

            {/* Pending file list */}
            {pendingFiles.length > 0 && (
              <ul className="list-group mt-2" data-testid="pending-files-list">
                {pendingFiles.map(({ file, error }, i) => (
                  <li
                    key={i}
                    className={`list-group-item d-flex justify-content-between align-items-start py-2 ${error ? "list-group-item-danger" : ""}`}
                    data-testid={`pending-file-${i}`}
                  >
                    <div>
                      <span style={{ fontSize: "0.875rem" }}>{file.name}</span>
                      {error && (
                        <div
                          className="text-danger"
                          style={{ fontSize: "0.78rem" }}
                          data-testid={`file-error-${i}`}
                        >
                          {error}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger ms-2"
                      onClick={() => removePendingFile(i)}
                      disabled={isSubmitting}
                      aria-label={`Remove ${file.name}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            data-testid="cancel-btn"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn text-white fw-semibold"
            style={{ backgroundColor: isSubmitting ? "#5A6E62" : "#006B3C" }}
            disabled={isSubmitting}
            data-testid="submit-btn"
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
                Submitting…
              </>
            ) : (
              "Submit Ticket →"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateTicket;
