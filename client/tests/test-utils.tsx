import { ReactNode } from "react";
import { AuthProvider } from "../src/context/AuthContext.js";
import { RequesterProvider } from "../src/context/RequesterContext.js";

/**
 * Wraps children with AuthProvider (with mock/test mode) and RequesterProvider.
 * Use this for Lab 2 tests that need RequesterContext.
 * 
 * For Lab 2 tests, we're not actually logging in, so the user will be null.
 * This is fine because RequesterContext uses the Lab 2 pattern of manual selection.
 */
export function TestProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RequesterProvider>
        {children}
      </RequesterProvider>
    </AuthProvider>
  );
}
