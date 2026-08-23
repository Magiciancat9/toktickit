import { createContext, useContext, useState, ReactNode } from "react";

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
 * This is NOT authentication — it is a Lab 2 testing mechanism only.
 * No passwords, sessions, or tokens are involved.
 */
export function RequesterProvider({ children }: { children: ReactNode }) {
  const [currentRequester, setCurrentRequester] = useState<Requester | null>(null);

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
