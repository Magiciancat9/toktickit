import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { fetchRequesters } from "../api.js";
import { useRequester } from "../context/RequesterContext.js";
/**
 * Development Requester Selection screen.
 *
 * This is a LAB 2 TESTING MECHANISM ONLY — not real authentication.
 * No passwords, sessions, or tokens are involved.
 * In Lab 3 this screen will be replaced by real login.
 */
export function RequesterSelector() {
    const { selectRequester } = useRequester();
    const [selectorState, setSelectorState] = useState("loading");
    const [requesters, setRequesters] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [errorMsg, setErrorMsg] = useState(null);
    useEffect(() => {
        fetchRequesters()
            .then((data) => {
            setRequesters(data);
            setSelectorState(data.length === 0 ? "empty" : "loaded");
        })
            .catch(() => {
            setErrorMsg("Unable to load requesters. Please check your connection and try again.");
            setSelectorState("error");
        });
    }, []);
    function handleContinue() {
        const requester = requesters.find((r) => r.id === Number(selectedId));
        if (requester)
            selectRequester(requester);
    }
    return (_jsx("div", { className: "min-vh-100 d-flex align-items-center justify-content-center", style: { backgroundColor: "#EAF6EF" }, "data-testid": "requester-selector-screen", children: _jsxs("div", { className: "card shadow-sm border-0 p-4 p-md-5", style: { maxWidth: 480, width: "100%" }, children: [_jsx("div", { className: "text-center mb-3", children: _jsx("span", { style: { fontSize: "3rem", color: "#006B3C" }, "aria-hidden": "true", children: "\uD83D\uDC64" }) }), _jsx("h1", { className: "h4 fw-bold text-center mb-2", style: { color: "#1A2E22" }, children: "Select Development Requester" }), _jsxs("p", { className: "text-center mb-4", style: { color: "#5A6E62", fontSize: "0.9rem" }, children: ["Choose a development requester to simulate the current requester context for Lab 2.", " ", _jsx("strong", { children: "This is for testing only and is not a login screen." })] }), selectorState === "loading" && (_jsxs("div", { className: "text-center py-3", "data-testid": "selector-loading", children: [_jsx("div", { className: "spinner-border", style: { color: "#006B3C" }, role: "status", "aria-label": "Loading requesters", children: _jsx("span", { className: "visually-hidden", children: "Loading\u2026" }) }), _jsx("p", { className: "mt-2 mb-0", style: { color: "#5A6E62" }, children: "Loading requesters\u2026" })] })), selectorState === "error" && (_jsx("div", { className: "alert alert-danger", role: "alert", "data-testid": "selector-error", children: errorMsg })), selectorState === "empty" && (_jsx("div", { className: "alert alert-warning", role: "alert", "data-testid": "selector-empty", children: "No active requesters found. Please contact your administrator." })), selectorState === "loaded" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "rounded p-2 mb-3 d-flex align-items-center gap-2", style: {
                                backgroundColor: "#EAF6EF",
                                border: "1px solid #0B7A46",
                                fontSize: "0.85rem",
                                color: "#065F46",
                            }, "data-testid": "selector-info", children: [_jsx("span", { "aria-hidden": "true", children: "\u2139\uFE0F" }), "Only active development requesters are shown."] }), _jsxs("div", { className: "mb-3", children: [_jsxs("label", { htmlFor: "requester-select", className: "form-label fw-semibold", style: { color: "#1A2E22" }, children: ["Development Requester", " ", _jsx("span", { className: "text-danger", "aria-hidden": "true", children: "*" }), _jsx("span", { className: "visually-hidden", children: "(required)" })] }), _jsxs("select", { id: "requester-select", className: "form-select", value: selectedId, onChange: (e) => setSelectedId(e.target.value), "aria-required": "true", "data-testid": "requester-select", children: [_jsx("option", { value: "", disabled: true, children: "Select a requester\u2026" }), requesters.map((r) => (_jsx("option", { value: r.id, children: r.name }, r.id)))] })] }), _jsxs("div", { className: "rounded p-2 mb-4", style: {
                                backgroundColor: "#F5F7F6",
                                border: "1px solid #D1D9D5",
                                fontSize: "0.82rem",
                                color: "#5A6E62",
                            }, children: [_jsx("strong", { children: "Authentication coming in Lab 3" }), " \u2014 In Lab 3, this selection will be replaced with secure authentication so you can access the system with your own account."] }), _jsxs("div", { className: "d-flex justify-content-end gap-2", children: [_jsx("button", { type: "button", className: "btn btn-outline-secondary", onClick: () => setSelectedId(""), "data-testid": "selector-cancel-btn", children: "Cancel" }), _jsx("button", { type: "button", className: "btn text-white fw-semibold", style: { backgroundColor: "#006B3C" }, disabled: !selectedId, onClick: handleContinue, "data-testid": "selector-continue-btn", children: "Continue \u2192" })] })] }))] }) }));
}
export default RequesterSelector;
