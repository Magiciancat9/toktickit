/**
 * AuthContext for Lab 3.
 * Manages authenticated user state and provides authentication methods.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  requiresPasswordChange: boolean;
}

interface AuthContextValue {
  /** Currently authenticated user, or null if not authenticated. */
  user: AuthUser | null;
  /** Loading state during initial auth check. */
  loading: boolean;
  /** Login function. */
  login: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
    user?: AuthUser;
  }>;
  /** Logout function. */
  logout: () => Promise<void>;
  /** Change password function. */
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<{
    success: boolean;
    error?: string;
    details?: Array<{ field: string; message: string }>;
  }>;
  /** Refresh current user data (e.g., after password change). */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * AuthProvider manages authentication state for the entire app.
 * On mount, it checks if the user is already authenticated (/api/auth/me).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
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
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
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
      } else {
        return {
          success: false,
          error: data.error?.message || "Login failed",
        };
      }
    } catch (error) {
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
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  }

  async function changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) {
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
      } else {
        return {
          success: false,
          error: data.error?.message || "Password change failed",
          details: data.error?.details,
        };
      }
    } catch (error) {
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

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, changePassword, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context.
 * Must be used inside an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return ctx;
}
