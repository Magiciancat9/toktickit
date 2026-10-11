import React, { useState, useEffect } from 'react';
import * as api from '../api';
import './ActionsTaken.css';

interface ActionsTakenProps {
  ticketNumber: string;
  currentUserId: number;
  isStaff: boolean;
}

interface FormData {
  actionDescription: string;
  result: string;
  followUpRequired: boolean;
  followupNote: string;
  attachmentNotes: string;
}

interface FormErrors {
  actionDescription?: string;
  result?: string;
  followupNote?: string;
  attachmentNotes?: string;
}

const ActionsTaken: React.FC<ActionsTakenProps> = ({ ticketNumber, currentUserId, isStaff }) => {
  const [actions, setActions] = useState<api.ActionTaken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAction, setEditingAction] = useState<api.ActionTaken | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    actionDescription: '',
    result: '',
    followUpRequired: false,
    followupNote: '',
    attachmentNotes: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    loadActions();
  }, [ticketNumber]);

  const loadActions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.fetchActions(ticketNumber);
      setActions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load actions');
    } finally {
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

  const openEditForm = (action: api.ActionTaken) => {
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

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Action Description validation
    const desc = formData.actionDescription.trim();
    if (!desc) {
      errors.actionDescription = 'Action description is required';
    } else if (desc.length < 10) {
      errors.actionDescription = 'Action description must be at least 10 characters';
    } else if (desc.length > 2000) {
      errors.actionDescription = 'Action description cannot exceed 2000 characters';
    }

    // Result validation
    const res = formData.result.trim();
    if (!res) {
      errors.result = 'Result is required';
    } else if (res.length < 10) {
      errors.result = 'Result must be at least 10 characters';
    } else if (res.length > 2000) {
      errors.result = 'Result cannot exceed 2000 characters';
    }

    // Follow-up Note validation
    if (formData.followUpRequired) {
      const note = formData.followupNote.trim();
      if (!note) {
        errors.followupNote = 'Follow-up note is required when follow-up is needed';
      } else if (note.length < 10) {
        errors.followupNote = 'Follow-up note must be at least 10 characters';
      } else if (note.length > 500) {
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      } else {
        await api.createAction(ticketNumber, payload);
        setSuccessMessage('Action recorded successfully');
      }

      await loadActions();
      closeForm();

      // Auto-dismiss success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to save action');
    } finally {
      setSubmitting(false);
    }
  };

  const canEditAction = (action: api.ActionTaken): boolean => {
    if (action.performerId !== currentUserId) return false;

    // Check if action is < 24 hours old
    const actionAge = Date.now() - new Date(action.createdAt).getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return actionAge < twentyFourHours;
  };

  const formatDateTime = (dateStr: string): string => {
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
    return <div className="actions-loading">Loading actions...</div>;
  }

  if (error && !showForm) {
    return (
      <div className="actions-error">
        <p>{error}</p>
        <button onClick={loadActions} className="btn-secondary">Retry</button>
      </div>
    );
  }

  return (
    <div className="actions-taken-container">
      <div className="actions-header">
        <h3>Actions Taken</h3>
        {isStaff && !showForm && (
          <button onClick={openCreateForm} className="btn-primary">
            Record Action
          </button>
        )}
      </div>

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      {showForm && (
        <div className="action-form-modal">
          <div className="action-form-content">
            <div className="action-form-header">
              <h4>{editingAction ? 'Edit Action' : 'Record Action Taken'}</h4>
              <button onClick={closeForm} className="btn-close" aria-label="Close">×</button>
            </div>

            <form onSubmit={handleSubmit} className="action-form">
              {/* Action Description */}
              <div className="form-group">
                <label htmlFor="actionDescription">
                  Action Description <span className="required">*</span>
                </label>
                <textarea
                  id="actionDescription"
                  className={`zen-input ${formErrors.actionDescription ? 'error' : ''}`}
                  rows={4}
                  maxLength={2000}
                  value={formData.actionDescription}
                  onChange={(e) => setFormData({ ...formData, actionDescription: e.target.value })}
                  placeholder="Describe what action was taken to address this ticket..."
                  aria-required="true"
                  aria-invalid={!!formErrors.actionDescription}
                  aria-describedby={formErrors.actionDescription ? 'error-actionDescription' : undefined}
                />
                <div className="char-counter" aria-live="polite">
                  {formData.actionDescription.length} / 2000 characters
                </div>
                {formErrors.actionDescription && (
                  <div id="error-actionDescription" className="error-message" role="alert">
                    {formErrors.actionDescription}
                  </div>
                )}
              </div>

              {/* Result */}
              <div className="form-group">
                <label htmlFor="result">
                  Result <span className="required">*</span>
                </label>
                <textarea
                  id="result"
                  className={`zen-input ${formErrors.result ? 'error' : ''}`}
                  rows={4}
                  maxLength={2000}
                  value={formData.result}
                  onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                  placeholder="Describe the outcome or result of this action..."
                  aria-required="true"
                  aria-invalid={!!formErrors.result}
                  aria-describedby={formErrors.result ? 'error-result' : undefined}
                />
                <div className="char-counter" aria-live="polite">
                  {formData.result.length} / 2000 characters
                </div>
                {formErrors.result && (
                  <div id="error-result" className="error-message" role="alert">
                    {formErrors.result}
                  </div>
                )}
              </div>

              {/* Follow-Up Required */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    id="followUpRequired"
                    checked={formData.followUpRequired}
                    onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                  />
                  <span>Follow-Up Required</span>
                </label>
                <div className="helper-text">
                  Check if this action requires follow-up before ticket can be resolved
                </div>
              </div>

              {/* Follow-up Note (conditional) */}
              {formData.followUpRequired && (
                <div className="form-group">
                  <label htmlFor="followupNote">
                    Follow-up Note <span className="required">*</span>
                  </label>
                  <textarea
                    id="followupNote"
                    className={`zen-input ${formErrors.followupNote ? 'error' : ''}`}
                    rows={3}
                    maxLength={500}
                    value={formData.followupNote}
                    onChange={(e) => setFormData({ ...formData, followupNote: e.target.value })}
                    placeholder="Explain what follow-up is needed..."
                    aria-required="true"
                    aria-invalid={!!formErrors.followupNote}
                    aria-describedby={formErrors.followupNote ? 'error-followupNote' : undefined}
                  />
                  <div className="char-counter" aria-live="polite">
                    {formData.followupNote.length} / 500 characters
                  </div>
                  {formErrors.followupNote && (
                    <div id="error-followupNote" className="error-message" role="alert">
                      {formErrors.followupNote}
                    </div>
                  )}
                </div>
              )}

              {/* Attachment Notes */}
              <div className="form-group">
                <label htmlFor="attachmentNotes">Attachment Notes</label>
                <textarea
                  id="attachmentNotes"
                  className={`zen-input ${formErrors.attachmentNotes ? 'error' : ''}`}
                  rows={2}
                  maxLength={500}
                  value={formData.attachmentNotes}
                  onChange={(e) => setFormData({ ...formData, attachmentNotes: e.target.value })}
                  placeholder="Optional notes about any ticket attachments relevant to this action..."
                  aria-invalid={!!formErrors.attachmentNotes}
                  aria-describedby={formErrors.attachmentNotes ? 'error-attachmentNotes' : undefined}
                />
                <div className="char-counter" aria-live="polite">
                  {formData.attachmentNotes.length} / 500 characters
                </div>
                {formErrors.attachmentNotes && (
                  <div id="error-attachmentNotes" className="error-message" role="alert">
                    {formErrors.attachmentNotes}
                  </div>
                )}
              </div>

              {error && (
                <div className="alert alert-error" role="alert">
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={closeForm} className="btn-secondary" disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingAction ? 'Update Action' : 'Record Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Actions List */}
      {actions.length === 0 ? (
        <div className="actions-empty">
          <p>No actions have been recorded for this ticket yet.</p>
          {isStaff && (
            <button onClick={openCreateForm} className="btn-primary">
              Record First Action
            </button>
          )}
        </div>
      ) : (
        <div className="actions-list">
          {actions.map((action) => (
            <div key={action.id} className="action-card" data-testid={`action-card-${action.id}`}>
              <div className="action-header">
                <div className="action-performer">
                  <span className="performer-name">{action.performerName}</span>
                  <span className={`role-badge role-${action.performerRole.toLowerCase()}`}>
                    {action.performerRole.replace('_', ' ')}
                  </span>
                </div>
                <div className="action-date">{formatDateTime(action.actionDateTime)}</div>
              </div>

              <div className="action-content">
                <div className="action-field">
                  <strong>Action:</strong> {action.actionDescription}
                </div>
                <div className="action-field">
                  <strong>Result:</strong> {action.result}
                </div>

                {action.followUpRequired && (
                  <div className="follow-up-section">
                    <span className="badge badge-warning">Follow-Up Required</span>
                    {action.followupNote && (
                      <div className="followup-note">{action.followupNote}</div>
                    )}
                  </div>
                )}

                {action.attachmentNotes && (
                  <div className="action-field">
                    <strong>Attachment Notes:</strong> {action.attachmentNotes}
                  </div>
                )}
              </div>

              {isStaff && canEditAction(action) && (
                <div className="action-actions">
                  <button
                    onClick={() => openEditForm(action)}
                    className="btn-secondary btn-sm"
                    aria-label={`Edit action recorded on ${formatDateTime(action.actionDateTime)}`}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionsTaken;
