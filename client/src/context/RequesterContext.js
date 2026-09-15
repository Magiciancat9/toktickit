import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
const RequesterContext = createContext(null);
/**
 * Provides the selected Development Requester testing context to the whole app.
 * This is NOT authentication — it is a Lab 2 testing mechanism only.
 * No passwords, sessions, or tokens are involved.
 */
export function RequesterProvider({ children }) {
    const [currentRequester, setCurrentRequester] = useState(null);
    function selectRequester(r) {
        setCurrentRequester(r);
    }
    function clearRequester() {
        setCurrentRequester(null);
    }
    return (_jsx(RequesterContext.Provider, { value: { currentRequester, selectRequester, clearRequester }, children: children }));
}
/**
 * Hook to access the current Requester context.
 * Must be used inside a <RequesterProvider>.
 */
export function useRequester() {
    const ctx = useContext(RequesterContext);
    if (!ctx) {
        throw new Error("useRequester must be used inside a <RequesterProvider>");
    }
    return ctx;
}
