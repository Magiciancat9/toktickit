import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Login component for Lab 3.
 * Zen Green styled login screen with email, password, validation, and safe errors.
 */
import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
export function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        // Basic validation
        if (!email || !password) {
            setError("Email and password are required");
            return;
        }
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);
        if (!result.success) {
            setError(result.error || "Login failed");
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
                maxWidth: "400px",
                width: "100%",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                padding: "32px",
            }, children: [_jsxs("div", { style: { textAlign: "center", marginBottom: "24px" }, children: [_jsx("div", { style: {
                                width: "48px",
                                height: "48px",
                                backgroundColor: "#006B3C", // Primary Green
                                borderRadius: "50%",
                                margin: "0 auto 16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "24px",
                                fontWeight: "bold",
                            }, children: "T" }), _jsx("h2", { style: {
                                margin: 0,
                                fontSize: "24px",
                                fontWeight: 600,
                                color: "#2C3E37", // Dark Charcoal-Green
                            }, children: "Sign in to your account" })] }), error && (_jsx("div", { style: {
                        backgroundColor: "#FEE2E2",
                        border: "1px solid #C41E3A",
                        borderRadius: "4px",
                        padding: "12px",
                        marginBottom: "16px",
                        color: "#C41E3A",
                        fontSize: "14px",
                    }, children: error })), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { style: { marginBottom: "16px" }, children: [_jsx("label", { htmlFor: "email", style: {
                                        display: "block",
                                        marginBottom: "6px",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color: "#2C3E37",
                                    }, children: "Email address" }), _jsx("input", { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), disabled: loading, placeholder: "name@example.com", style: {
                                        width: "100%",
                                        padding: "10px 12px",
                                        fontSize: "16px",
                                        border: "1px solid #E0E6E3",
                                        borderRadius: "4px",
                                        backgroundColor: loading ? "#F5F7F6" : "white",
                                        color: "#2C3E37",
                                        outline: "none",
                                        transition: "border-color 0.2s",
                                    }, onFocus: (e) => (e.target.style.borderColor = "#0B7A46"), onBlur: (e) => (e.target.style.borderColor = "#E0E6E3") })] }), _jsxs("div", { style: { marginBottom: "24px" }, children: [_jsx("label", { htmlFor: "password", style: {
                                        display: "block",
                                        marginBottom: "6px",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        color: "#2C3E37",
                                    }, children: "Password" }), _jsxs("div", { style: { position: "relative" }, children: [_jsx("input", { id: "password", type: showPassword ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), disabled: loading, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", style: {
                                                width: "100%",
                                                padding: "10px 40px 10px 12px",
                                                fontSize: "16px",
                                                border: "1px solid #E0E6E3",
                                                borderRadius: "4px",
                                                backgroundColor: loading ? "#F5F7F6" : "white",
                                                color: "#2C3E37",
                                                outline: "none",
                                                transition: "border-color 0.2s",
                                            }, onFocus: (e) => (e.target.style.borderColor = "#0B7A46"), onBlur: (e) => (e.target.style.borderColor = "#E0E6E3") }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), disabled: loading, style: {
                                                position: "absolute",
                                                right: "8px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                background: "none",
                                                border: "none",
                                                cursor: loading ? "not-allowed" : "pointer",
                                                padding: "4px",
                                                color: "#6B7280",
                                            }, children: showPassword ? "👁️" : "👁️‍🗨️" })] })] }), _jsx("button", { type: "submit", disabled: loading, style: {
                                width: "100%",
                                padding: "12px",
                                fontSize: "16px",
                                fontWeight: 600,
                                color: "white",
                                backgroundColor: loading ? "#0B7A46" : "#006B3C",
                                border: "none",
                                borderRadius: "4px",
                                cursor: loading ? "not-allowed" : "pointer",
                                opacity: loading ? 0.7 : 1,
                                transition: "background-color 0.2s",
                            }, onMouseEnter: (e) => {
                                if (!loading)
                                    e.currentTarget.style.backgroundColor = "#0B7A46";
                            }, onMouseLeave: (e) => {
                                if (!loading)
                                    e.currentTarget.style.backgroundColor = "#006B3C";
                            }, children: loading ? "Signing in..." : "Sign In" })] })] }) }));
}
