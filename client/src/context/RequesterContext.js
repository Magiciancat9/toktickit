import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext.js";
const RequesterContext = createContext(null);
/**
 * Provides the selected Development Requester testing context to the whole app.
 * Lab 3: Automatically sets the authenticated user as the current requester.
 */
export function RequesterProvider({ children }) {
    const { user } = useAuth();
    const [currentRequester, setCurrentRequester] = useState(null);
    const [manuallySet, setManuallySet] = useState(false);
    // Lab 3: Auto-set authenticated user as current requester (only if not manually set)
    useEffect(() => {
        if (manuallySet)
            return; // Don't override manual selection
        if (user && user.role === "REQUESTER") {
            setCurrentRequester({
                id: user.id,
                name: user.name,
                email: user.email,
            });
        }
        else if (!user) {
            setCurrentRequester(null);
        }
    }, [user, manuallySet]);
    function selectRequester(r) {
        setCurrentRequester(r);
        setManuallySet(true);
    }
    function clearRequester() {
        setCurrentRequester(null);
        setManuallySet(false);
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
