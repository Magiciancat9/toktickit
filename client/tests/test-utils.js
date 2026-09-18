import { jsx as _jsx } from "react/jsx-runtime";
import { AuthProvider } from "../src/context/AuthContext.js";
import { RequesterProvider } from "../src/context/RequesterContext.js";
/**
 * Wraps children with AuthProvider (with mock/test mode) and RequesterProvider.
 * Use this for Lab 2 tests that need RequesterContext.
 *
 * For Lab 2 tests, we're not actually logging in, so the user will be null.
 * This is fine because RequesterContext uses the Lab 2 pattern of manual selection.
 */
export function TestProviders({ children }) {
    return (_jsx(AuthProvider, { children: _jsx(RequesterProvider, { children: children }) }));
}
