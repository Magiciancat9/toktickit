import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const [fieldErrors, setFieldErrors] = useState({});
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
    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setFieldErrors({});
        setLoading(true);
        const result = await changePassword(currentPassword, newPassword, confirmPassword);
        setLoading(false);
        if (!result.success) {
            setError(result.error || "Password change failed");
            if (result.details) {
                const errors = {};
                result.details.forEach((detail) => {
                    errors[detail.field] = detail.message;
                });
                setFieldErrors(errors);
            }
        }
        // If successful, AuthContext will update user state and App will handle routing
    }
    return (_jsx("div", { style: {
            minHeight: "100vh",
            backgroundColor: "#EAF6EF", // Pale Green
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
        }, children: _jsxs("div", { style: {
                backgroundColor: "white",
                maxWidth: "500px",
                width: "100%",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                padding: "32px",
            }, children: [_jsxs("div", { style: { marginBottom: "24px" }, children: [_jsx("h2", { style: {
                                margin: "0 0 8px 0",
                                fontSize: "24px",
                                fontWeight: 600,
                                color: "#2C3E37", // Dark Charcoal-Green
                            }, children: "Change Your Password" }), _jsx("p", { style: {
                                margin: 0,
                                fontSize: "14px",
                                color: "#6B7280",
                            }, children: "You must change your password to continue." })] }), error && !Object.keys(fieldErrors).length && (_jsx("div", { style: {
                        backgroundColor: "#FEE2E2",
                        border: "1px solid #C41E3A",
                        borderRadius: "4px",
                        padding: "12px",
                        marginBottom: "16px",
                        color: "#C41E3A",
                        fontSize: "14px",
                    }, children: error })), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { style: { marginBottom: "16px" }, children: [_jsx("label", { htmlFor: "currentPassword", style: {
                                        display: "block",
                                        marginBottom: "6px",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color: "#2C3E37",
                                    }, children: "Current (temporary) password" }), _jsx("input", { id: "currentPassword", type: showPasswords ? "text" : "password", value: currentPassword, onChange: (e) => setCurrentPassword(e.target.value), disabled: loading, style: {
                                        width: "100%",
                                        padding: "10px 12px",
                                        fontSize: "16px",
                                        border: `1px solid ${fieldErrors.currentPassword ? "#C41E3A" : "#E0E6E3"}`,
                                        borderRadius: "4px",
                                        backgroundColor: loading ? "#F5F7F6" : "white",
                                        color: "#2C3E37",
                                        outline: "none",
                                    } }), fieldErrors.currentPassword && (_jsx("div", { style: { marginTop: "4px", fontSize: "13px", color: "#C41E3A" }, children: fieldErrors.currentPassword }))] }), _jsxs("div", { style: { marginBottom: "16px" }, children: [_jsx("label", { htmlFor: "newPassword", style: {
                                        display: "block",
                                        marginBottom: "6px",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color: "#2C3E37",
                                    }, children: "New password" }), _jsx("input", { id: "newPassword", type: showPasswords ? "text" : "password", value: newPassword, onChange: (e) => setNewPassword(e.target.value), disabled: loading, style: {
                                        width: "100%",
                                        padding: "10px 12px",
                                        fontSize: "16px",
                                        border: `1px solid ${fieldErrors.newPassword ? "#C41E3A" : "#E0E6E3"}`,
                                        borderRadius: "4px",
                                        backgroundColor: loading ? "#F5F7F6" : "white",
                                        color: "#2C3E37",
                                        outline: "none",
                                    } }), fieldErrors.newPassword && (_jsx("div", { style: { marginTop: "4px", fontSize: "13px", color: "#C41E3A" }, children: fieldErrors.newPassword })), newPassword && (_jsxs("div", { style: { marginTop: "12px", fontSize: "13px" }, children: [_jsx("div", { style: { marginBottom: "6px", fontWeight: 500, color: "#2C3E37" }, children: "Password must:" }), _jsxs("div", { style: { display: "flex", alignItems: "center", marginBottom: "4px" }, children: [_jsx("span", { style: { marginRight: "8px", color: requirements.length ? "#14B8A6" : "#6B7280" }, children: requirements.length ? "✓" : "○" }), _jsx("span", { style: { color: requirements.length ? "#2C3E37" : "#6B7280" }, children: "Be at least 8 characters" })] }), _jsxs("div", { style: { display: "flex", alignItems: "center", marginBottom: "4px" }, children: [_jsx("span", { style: {
                                                        marginRight: "8px",
                                                        color: requirements.uppercase && requirements.lowercase ? "#14B8A6" : "#6B7280",
                                                    }, children: requirements.uppercase && requirements.lowercase ? "✓" : "○" }), _jsx("span", { style: {
                                                        color: requirements.uppercase && requirements.lowercase ? "#2C3E37" : "#6B7280",
                                                    }, children: "Include upper and lower case letters" })] }), _jsxs("div", { style: { display: "flex", alignItems: "center" }, children: [_jsx("span", { style: {
                                                        marginRight: "8px",
                                                        color: requirements.number && requirements.special ? "#14B8A6" : "#6B7280",
                                                    }, children: requirements.number && requirements.special ? "✓" : "○" }), _jsx("span", { style: {
                                                        color: requirements.number && requirements.special ? "#2C3E37" : "#6B7280",
                                                    }, children: "Include a number and a special character" })] })] }))] }), _jsxs("div", { style: { marginBottom: "24px" }, children: [_jsx("label", { htmlFor: "confirmPassword", style: {
                                        display: "block",
                                        marginBottom: "6px",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color: "#2C3E37",
                                    }, children: "Confirm new password" }), _jsx("input", { id: "confirmPassword", type: showPasswords ? "text" : "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), disabled: loading, style: {
                                        width: "100%",
                                        padding: "10px 12px",
                                        fontSize: "16px",
                                        border: `1px solid ${fieldErrors.confirmPassword ? "#C41E3A" : "#E0E6E3"}`,
                                        borderRadius: "4px",
                                        backgroundColor: loading ? "#F5F7F6" : "white",
                                        color: "#2C3E37",
                                        outline: "none",
                                    } }), fieldErrors.confirmPassword && (_jsx("div", { style: { marginTop: "4px", fontSize: "13px", color: "#C41E3A" }, children: fieldErrors.confirmPassword })), !fieldErrors.confirmPassword && confirmPassword && !passwordsMatch && (_jsx("div", { style: { marginTop: "4px", fontSize: "13px", color: "#C41E3A" }, children: "Passwords do not match" }))] }), _jsx("div", { style: { marginBottom: "24px" }, children: _jsxs("label", { style: { display: "flex", alignItems: "center", cursor: "pointer" }, children: [_jsx("input", { type: "checkbox", checked: showPasswords, onChange: (e) => setShowPasswords(e.target.checked), disabled: loading, style: { marginRight: "8px" } }), _jsx("span", { style: { fontSize: "14px", color: "#2C3E37" }, children: "Show passwords" })] }) }), _jsx("button", { type: "submit", disabled: loading || !allRequirementsMet || !passwordsMatch || !currentPassword, style: {
                                width: "100%",
                                padding: "12px",
                                fontSize: "16px",
                                fontWeight: 600,
                                color: "white",
                                backgroundColor: loading || !allRequirementsMet || !passwordsMatch || !currentPassword
                                    ? "#E0E6E3"
                                    : "#006B3C",
                                border: "none",
                                borderRadius: "4px",
                                cursor: loading || !allRequirementsMet || !passwordsMatch || !currentPassword
                                    ? "not-allowed"
                                    : "pointer",
                                transition: "background-color 0.2s",
                            }, onMouseEnter: (e) => {
                                if (allRequirementsMet && passwordsMatch && currentPassword && !loading) {
                                    e.currentTarget.style.backgroundColor = "#0B7A46";
                                }
                            }, onMouseLeave: (e) => {
                                if (allRequirementsMet && passwordsMatch && currentPassword && !loading) {
                                    e.currentTarget.style.backgroundColor = "#006B3C";
                                }
                            }, children: loading ? "Saving..." : "Continue" })] })] }) }));
}
