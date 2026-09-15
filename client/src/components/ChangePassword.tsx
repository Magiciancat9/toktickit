/**
 * ChangePassword component for Lab 3.
 * Mandatory first-login password change screen with validation and requirements checklist.
 */

import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

export function ChangePassword() {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Password requirement checks
  const requirements = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };

  const allRequirementsMet = Object.values(requirements).every((met) => met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    setLoading(true);

    const result = await changePassword(currentPassword, newPassword, confirmPassword);

    setLoading(false);

    if (!result.success) {
      setError(result.error || "Password change failed");

      if (result.details) {
        const errors: Record<string, string> = {};
        result.details.forEach((detail) => {
          errors[detail.field] = detail.message;
        });
        setFieldErrors(errors);
      }
    }
    // If successful, AuthContext will update user state and App will handle routing
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#EAF6EF", // Pale Green
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          maxWidth: "500px",
          width: "100%",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          padding: "32px",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h2
            style={{
              margin: "0 0 8px 0",
              fontSize: "24px",
              fontWeight: 600,
              color: "#2C3E37", // Dark Charcoal-Green
            }}
          >
            Change Your Password
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#6B7280",
            }}
          >
            You must change your password to continue.
          </p>
        </div>

        {/* Error message */}
        {error && !Object.keys(fieldErrors).length && (
          <div
            style={{
              backgroundColor: "#FEE2E2",
              border: "1px solid #C41E3A",
              borderRadius: "4px",
              padding: "12px",
              marginBottom: "16px",
              color: "#C41E3A",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* Change password form */}
        <form onSubmit={handleSubmit}>
          {/* Current password */}
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="currentPassword"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#2C3E37",
              }}
            >
              Current (temporary) password
            </label>
            <input
              id="currentPassword"
              type={showPasswords ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "16px",
                border: `1px solid ${fieldErrors.currentPassword ? "#C41E3A" : "#E0E6E3"}`,
                borderRadius: "4px",
                backgroundColor: loading ? "#F5F7F6" : "white",
                color: "#2C3E37",
                outline: "none",
              }}
            />
            {fieldErrors.currentPassword && (
              <div style={{ marginTop: "4px", fontSize: "13px", color: "#C41E3A" }}>
                {fieldErrors.currentPassword}
              </div>
            )}
          </div>

          {/* New password */}
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="newPassword"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#2C3E37",
              }}
            >
              New password
            </label>
            <input
              id="newPassword"
              type={showPasswords ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "16px",
                border: `1px solid ${fieldErrors.newPassword ? "#C41E3A" : "#E0E6E3"}`,
                borderRadius: "4px",
                backgroundColor: loading ? "#F5F7F6" : "white",
                color: "#2C3E37",
                outline: "none",
              }}
            />
            {fieldErrors.newPassword && (
              <div style={{ marginTop: "4px", fontSize: "13px", color: "#C41E3A" }}>
                {fieldErrors.newPassword}
              </div>
            )}

            {/* Password requirements checklist */}
            {newPassword && (
              <div style={{ marginTop: "12px", fontSize: "13px" }}>
                <div style={{ marginBottom: "6px", fontWeight: 500, color: "#2C3E37" }}>
                  Password must:
                </div>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ marginRight: "8px", color: requirements.length ? "#14B8A6" : "#6B7280" }}>
                    {requirements.length ? "✓" : "○"}
                  </span>
                  <span style={{ color: requirements.length ? "#2C3E37" : "#6B7280" }}>
                    Be at least 8 characters
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                  <span
                    style={{
                      marginRight: "8px",
                      color: requirements.uppercase && requirements.lowercase ? "#14B8A6" : "#6B7280",
                    }}
                  >
                    {requirements.uppercase && requirements.lowercase ? "✓" : "○"}
                  </span>
                  <span
                    style={{
                      color: requirements.uppercase && requirements.lowercase ? "#2C3E37" : "#6B7280",
                    }}
                  >
                    Include upper and lower case letters
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      marginRight: "8px",
                      color: requirements.number && requirements.special ? "#14B8A6" : "#6B7280",
                    }}
                  >
                    {requirements.number && requirements.special ? "✓" : "○"}
                  </span>
                  <span
                    style={{
                      color: requirements.number && requirements.special ? "#2C3E37" : "#6B7280",
                    }}
                  >
                    Include a number and a special character
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div style={{ marginBottom: "24px" }}>
            <label
              htmlFor="confirmPassword"
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#2C3E37",
              }}
            >
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "16px",
                border: `1px solid ${fieldErrors.confirmPassword ? "#C41E3A" : "#E0E6E3"}`,
                borderRadius: "4px",
                backgroundColor: loading ? "#F5F7F6" : "white",
                color: "#2C3E37",
                outline: "none",
              }}
            />
            {fieldErrors.confirmPassword && (
              <div style={{ marginTop: "4px", fontSize: "13px", color: "#C41E3A" }}>
                {fieldErrors.confirmPassword}
              </div>
            )}
            {!fieldErrors.confirmPassword && confirmPassword && !passwordsMatch && (
              <div style={{ marginTop: "4px", fontSize: "13px", color: "#C41E3A" }}>
                Passwords do not match
              </div>
            )}
          </div>

          {/* Show passwords toggle */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                disabled={loading}
                style={{ marginRight: "8px" }}
              />
              <span style={{ fontSize: "14px", color: "#2C3E37" }}>Show passwords</span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !allRequirementsMet || !passwordsMatch || !currentPassword}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              fontWeight: 600,
              color: "white",
              backgroundColor:
                loading || !allRequirementsMet || !passwordsMatch || !currentPassword
                  ? "#E0E6E3"
                  : "#006B3C",
              border: "none",
              borderRadius: "4px",
              cursor:
                loading || !allRequirementsMet || !passwordsMatch || !currentPassword
                  ? "not-allowed"
                  : "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (allRequirementsMet && passwordsMatch && currentPassword && !loading) {
                e.currentTarget.style.backgroundColor = "#0B7A46";
              }
            }}
            onMouseLeave={(e) => {
              if (allRequirementsMet && passwordsMatch && currentPassword && !loading) {
                e.currentTarget.style.backgroundColor = "#006B3C";
              }
            }}
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
