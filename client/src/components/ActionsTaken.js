import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import * as api from '../api';
import './ActionsTaken.css';
const ActionsTaken = ({ ticketNumber, currentUserId, isStaff }) => {
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingAction, setEditingAction] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [formData, setFormData] = useState({
        actionDescription: '',
        result: '',
        followUpRequired: false,
        followupNote: '',
        attachmentNotes: '',
    });
    const [formErrors, setFormErrors] = useState({});
    useEffect(() => {
        loadActions();
    }, [ticketNumber]);
    const loadActions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.fetchActions(ticketNumber);
            setActions(data);
        }
        catch (err) {
            setError(err.message || 'Failed to load actions');
        }
        finally {
            setLoading(false);
        }
    };
    const openCreateForm = () => {
        setFormData({
            actionDescription: '',
            result: '',
            followUpRequired: false,
            followupNote: '',
            attachmentNotes: '',
        });
        setFormErrors({});
        setEditingAction(null);
        setShowForm(true);
        setSuccessMessage(null);
    };
    const openEditForm = (action) => {
        setFormData({
            actionDescription: action.actionDescription,
            result: action.result,
            followUpRequired: action.followUpRequired,
            followupNote: action.followupNote || '',
            attachmentNotes: action.attachmentNotes || '',
        });
        setFormErrors({});
        setEditingAction(action);
        setShowForm(true);
        setSuccessMessage(null);
    };
    const closeForm = () => {
        setShowForm(false);
        setEditingAction(null);
        setFormData({
            actionDescription: '',
            result: '',
            followUpRequired: false,
            followupNote: '',
            attachmentNotes: '',
        });
        setFormErrors({});
    };
    const validateForm = () => {
        const errors = {};
        // Action Description validation
        const desc = formData.actionDescription.trim();
        if (!desc) {
            errors.actionDescription = 'Action description is required';
        }
        else if (desc.length < 10) {
            errors.actionDescription = 'Action description must be at least 10 characters';
        }
        else if (desc.length > 2000) {
            errors.actionDescription = 'Action description cannot exceed 2000 characters';
        }
        // Result validation
        const res = formData.result.trim();
        if (!res) {
            errors.result = 'Result is required';
        }
        else if (res.length < 10) {
            errors.result = 'Result must be at least 10 characters';
        }
        else if (res.length > 2000) {
            errors.result = 'Result cannot exceed 2000 characters';
        }
        // Follow-up Note validation
        if (formData.followUpRequired) {
            const note = formData.followupNote.trim();
            if (!note) {
                errors.followupNote = 'Follow-up note is required when follow-up is needed';
            }
            else if (note.length < 10) {
                errors.followupNote = 'Follow-up note must be at least 10 characters';
            }
            else if (note.length > 500) {
                errors.followupNote = 'Follow-up note cannot exceed 500 characters';
            }
        }
        // Attachment Notes validation
        if (formData.attachmentNotes.trim().length > 500) {
            errors.attachmentNotes = 'Attachment notes cannot exceed 500 characters';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        try {
            setSubmitting(true);
            setError(null);
            const payload = {
                actionDescription: formData.actionDescription.trim(),
                result: formData.result.trim(),
                followUpRequired: formData.followUpRequired,
                followupNote: formData.followUpRequired ? formData.followupNote.trim() : undefined,
                attachmentNotes: formData.attachmentNotes.trim() || undefined,
            };
            if (editingAction) {
                await api.updateAction(ticketNumber, editingAction.id, payload);
                setSuccessMessage('Action updated successfully');
            }
            else {
                await api.createAction(ticketNumber, payload);
                setSuccessMessage('Action recorded successfully');
            }
            await loadActions();
            closeForm();
            // Auto-dismiss success message after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000);
        }
        catch (err) {
            setError(err.message || 'Failed to save action');
        }
        finally {
            setSubmitting(false);
        }
    };
    const canEditAction = (action) => {
        if (action.performerId !== currentUserId)
            return false;
        // Check if action is < 24 hours old
        const actionAge = Date.now() - new Date(action.createdAt).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        return actionAge < twentyFourHours;
    };
    const formatDateTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    if (loading) {
        return _jsx("div", { className: "actions-loading", children: "Loading actions..." });
    }
    if (error && !showForm) {
        return (_jsxs("div", { className: "actions-error", children: [_jsx("p", { children: error }), _jsx("button", { onClick: loadActions, className: "btn-secondary", children: "Retry" })] }));
    }
    return (_jsxs("div", { className: "actions-taken-container", children: [_jsxs("div", { className: "actions-header", children: [_jsx("h3", { children: "Actions Taken" }), isStaff && !showForm && (_jsx("button", { onClick: openCreateForm, className: "btn-primary", children: "Record Action" }))] }), successMessage && (_jsx("div", { className: "alert alert-success", role: "alert", children: successMessage })), showForm && (_jsx("div", { className: "action-form-modal", children: _jsxs("div", { className: "action-form-content", children: [_jsxs("div", { className: "action-form-header", children: [_jsx("h4", { children: editingAction ? 'Edit Action' : 'Record Action Taken' }), _jsx("button", { onClick: closeForm, className: "btn-close", "aria-label": "Close", children: "\u00D7" })] }), _jsxs("form", { onSubmit: handleSubmit, className: "action-form", children: [_jsxs("div", { className: "form-group", children: [_jsxs("label", { htmlFor: "actionDescription", children: ["Action Description ", _jsx("span", { className: "required", children: "*" })] }), _jsx("textarea", { id: "actionDescription", className: `zen-input ${formErrors.actionDescription ? 'error' : ''}`, rows: 4, maxLength: 2000, value: formData.actionDescription, onChange: (e) => setFormData({ ...formData, actionDescription: e.target.value }), placeholder: "Describe what action was taken to address this ticket...", "aria-required": "true", "aria-invalid": !!formErrors.actionDescription, "aria-describedby": formErrors.actionDescription ? 'error-actionDescription' : undefined }), _jsxs("div", { className: "char-counter", "aria-live": "polite", children: [formData.actionDescription.length, " / 2000 characters"] }), formErrors.actionDescription && (_jsx("div", { id: "error-actionDescription", className: "error-message", role: "alert", children: formErrors.actionDescription }))] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { htmlFor: "result", children: ["Result ", _jsx("span", { className: "required", children: "*" })] }), _jsx("textarea", { id: "result", className: `zen-input ${formErrors.result ? 'error' : ''}`, rows: 4, maxLength: 2000, value: formData.result, onChange: (e) => setFormData({ ...formData, result: e.target.value }), placeholder: "Describe the outcome or result of this action...", "aria-required": "true", "aria-invalid": !!formErrors.result, "aria-describedby": formErrors.result ? 'error-result' : undefined }), _jsxs("div", { className: "char-counter", "aria-live": "polite", children: [formData.result.length, " / 2000 characters"] }), formErrors.result && (_jsx("div", { id: "error-result", className: "error-message", role: "alert", children: formErrors.result }))] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { className: "checkbox-label", children: [_jsx("input", { type: "checkbox", id: "followUpRequired", checked: formData.followUpRequired, onChange: (e) => setFormData({ ...formData, followUpRequired: e.target.checked }) }), _jsx("span", { children: "Follow-Up Required" })] }), _jsx("div", { className: "helper-text", children: "Check if this action requires follow-up before ticket can be resolved" })] }), formData.followUpRequired && (_jsxs("div", { className: "form-group", children: [_jsxs("label", { htmlFor: "followupNote", children: ["Follow-up Note ", _jsx("span", { className: "required", children: "*" })] }), _jsx("textarea", { id: "followupNote", className: `zen-input ${formErrors.followupNote ? 'error' : ''}`, rows: 3, maxLength: 500, value: formData.followupNote, onChange: (e) => setFormData({ ...formData, followupNote: e.target.value }), placeholder: "Explain what follow-up is needed...", "aria-required": "true", "aria-invalid": !!formErrors.followupNote, "aria-describedby": formErrors.followupNote ? 'error-followupNote' : undefined }), _jsxs("div", { className: "char-counter", "aria-live": "polite", children: [formData.followupNote.length, " / 500 characters"] }), formErrors.followupNote && (_jsx("div", { id: "error-followupNote", className: "error-message", role: "alert", children: formErrors.followupNote }))] })), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "attachmentNotes", children: "Attachment Notes" }), _jsx("textarea", { id: "attachmentNotes", className: `zen-input ${formErrors.attachmentNotes ? 'error' : ''}`, rows: 2, maxLength: 500, value: formData.attachmentNotes, onChange: (e) => setFormData({ ...formData, attachmentNotes: e.target.value }), placeholder: "Optional notes about any ticket attachments relevant to this action...", "aria-invalid": !!formErrors.attachmentNotes, "aria-describedby": formErrors.attachmentNotes ? 'error-attachmentNotes' : undefined }), _jsxs("div", { className: "char-counter", "aria-live": "polite", children: [formData.attachmentNotes.length, " / 500 characters"] }), formErrors.attachmentNotes && (_jsx("div", { id: "error-attachmentNotes", className: "error-message", role: "alert", children: formErrors.attachmentNotes }))] }), error && (_jsx("div", { className: "alert alert-error", role: "alert", children: error })), _jsxs("div", { className: "form-actions", children: [_jsx("button", { type: "button", onClick: closeForm, className: "btn-secondary", disabled: submitting, children: "Cancel" }), _jsx("button", { type: "submit", className: "btn-primary", disabled: submitting, children: submitting ? 'Saving...' : editingAction ? 'Update Action' : 'Record Action' })] })] })] }) })), actions.length === 0 ? (_jsxs("div", { className: "actions-empty", children: [_jsx("p", { children: "No actions have been recorded for this ticket yet." }), isStaff && (_jsx("button", { onClick: openCreateForm, className: "btn-primary", children: "Record First Action" }))] })) : (_jsx("div", { className: "actions-list", children: actions.map((action) => (_jsxs("div", { className: "action-card", "data-testid": `action-card-${action.id}`, children: [_jsxs("div", { className: "action-header", children: [_jsxs("div", { className: "action-performer", children: [_jsx("span", { className: "performer-name", children: action.performerName }), _jsx("span", { className: `role-badge role-${action.performerRole.toLowerCase()}`, children: action.performerRole.replace('_', ' ') })] }), _jsx("div", { className: "action-date", children: formatDateTime(action.actionDateTime) })] }), _jsxs("div", { className: "action-content", children: [_jsxs("div", { className: "action-field", children: [_jsx("strong", { children: "Action:" }), " ", action.actionDescription] }), _jsxs("div", { className: "action-field", children: [_jsx("strong", { children: "Result:" }), " ", action.result] }), action.followUpRequired && (_jsxs("div", { className: "follow-up-section", children: [_jsx("span", { className: "badge badge-warning", children: "Follow-Up Required" }), action.followupNote && (_jsx("div", { className: "followup-note", children: action.followupNote }))] })), action.attachmentNotes && (_jsxs("div", { className: "action-field", children: [_jsx("strong", { children: "Attachment Notes:" }), " ", action.attachmentNotes] }))] }), isStaff && canEditAction(action) && (_jsx("div", { className: "action-actions", children: _jsx("button", { onClick: () => openEditForm(action), className: "btn-secondary btn-sm", "aria-label": `Edit action recorded on ${formatDateTime(action.actionDateTime)}`, children: "Edit" }) }))] }, action.id))) }))] }));
};
export default ActionsTaken;
