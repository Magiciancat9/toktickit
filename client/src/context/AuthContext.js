import { jsx as _jsx } from "react/jsx-runtime";
/**
 * AuthContext for Lab 3.
 * Manages authenticated user state and provides authentication methods.
 */
import { createContext, useContext, useState, useEffect } from "react";
const AuthContext = createContext(null);
/**
 * AuthProvider manages authentication state for the entire app.
 * On mount, it checks if the user is already authenticated (/api/auth/me).
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // Check if user is already authenticated on mount
    useEffect(() => {
        checkAuth();
    }, []);
    async function checkAuth() {
        try {
            const response = await fetch("http://localhost:3000/api/auth/me", {
                credentials: "include", // Send session cookie
            });
            if (response.ok) {
                const data = await response.json();
                setUser(data.data.user);
            }
            else {
                setUser(null);
            }
        }
        catch (error) {
            console.error("Auth check error:", error);
            setUser(null);
        }
        finally {
            setLoading(false);
        }
    }
    async function login(email, password) {
        try {
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // Send/receive session cookie
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                setUser(data.data.user);
                return { success: true, user: data.data.user };
            }
            else {
                return {
                    success: false,
                    error: data.error?.message || "Login failed",
                };
            }
        }
        catch (error) {
            console.error("Login error:", error);
            return {
                success: false,
                error: "An unexpected error occurred. Please try again.",
            };
        }
    }
    async function logout() {
        try {
            await fetch("http://localhost:3000/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });
        }
        catch (error) {
            console.error("Logout error:", error);
        }
        finally {
            setUser(null);
        }
    }
    async function changePassword(currentPassword, newPassword, confirmPassword) {
        try {
            const response = await fetch("http://localhost:3000/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
            });
            const data = await response.json();
            if (response.ok) {
                setUser(data.data.user);
                return { success: true };
            }
            else {
                return {
                    success: false,
                    error: data.error?.message || "Password change failed",
                    details: data.error?.details,
                };
            }
        }
        catch (error) {
            console.error("Change password error:", error);
            return {
                success: false,
                error: "An unexpected error occurred. Please try again.",
            };
        }
    }
    async function refreshUser() {
        await checkAuth();
    }
    return (_jsx(AuthContext.Provider, { value: { user, loading, login, logout, changePassword, refreshUser }, children: children }));
}
/**
 * Hook to access auth context.
 * Must be used inside an AuthProvider.
 */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside an AuthProvider");
    }
    return ctx;
}
