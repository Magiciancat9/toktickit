import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext.js";

export interface Requester {
  id: number;
  name: string;
  email: string;
}

interface RequesterContextValue {
  /** The currently selected Development Requester, or null if none selected yet. */
  currentRequester: Requester | null;
  /** Call this to set the selected Requester (e.g. after Continue is clicked). */
  selectRequester: (r: Requester) => void;
  /** Call this to clear the selection and return to the Selector screen. */
  clearRequester: () => void;
}

const RequesterContext = createContext<RequesterContextValue | null>(null);

/**
 * Provides the selected Development Requester testing context to the whole app.
 * Lab 3: Automatically sets the authenticated user as the current requester.
 */
export function RequesterProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentRequester, setCurrentRequester] = useState<Requester | null>(null);

  // Lab 3: Auto-set authenticated user as current requester
  useEffect(() => {
    if (user && user.role === "REQUESTER") {
      setCurrentRequester({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    } else if (!user) {
      setCurrentRequester(null);
    }
  }, [user]);

  function selectRequester(r: Requester) {
    setCurrentRequester(r);
  }

  function clearRequester() {
    setCurrentRequester(null);
  }

  return (
    <RequesterContext.Provider value={{ currentRequester, selectRequester, clearRequester }}>
      {children}
    </RequesterContext.Provider>
  );
}

/**
 * Hook to access the current Requester context.
 * Must be used inside a <RequesterProvider>.
 */
export function useRequester(): RequesterContextValue {
  const ctx = useContext(RequesterContext);
  if (!ctx) {
    throw new Error("useRequester must be used inside a <RequesterProvider>");
  }
  return ctx;
}
