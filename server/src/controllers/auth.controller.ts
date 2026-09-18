/**
 * Authentication controller for Lab 3.
 * Handles login, logout, current user, and password change.
 */

import { Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { comparePassword, hashPassword, validatePassword } from "../utils/password.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

/**
 * POST /api/auth/login
 * Authenticate user with email and password.
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        error: {
          message: "Email and password are required",
        },
      });
      return;
    }

    // Find user by email
    const user = await getPrisma().user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
        requiresPasswordChange: true,
      },
    });

    // Check if user exists and is active
    // Use same error message for both wrong email, wrong password, and inactive account
    // This prevents user enumeration
    if (!user || !user.isActive) {
      res.status(401).json({
        error: {
          message: "Invalid email or password",
        },
      });
      return;
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({
        error: {
          message: "Invalid email or password",
        },
      });
      return;
    }

    // Authentication successful - establish session
    req.session.userId = user.id;

    // Return user data (excluding passwordHash)
    res.status(200).json({
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          requiresPasswordChange: user.requiresPasswordChange,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: {
        message: "An unexpected error occurred. Please try again later.",
      },
    });
  }
}

/**
 * POST /api/auth/logout
 * Invalidate current session.
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    if (!req.session.userId) {
      // Already logged out
      res.status(204).send();
      return;
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        res.status(500).json({
          error: {
            message: "An unexpected error occurred. Please try again later.",
          },
        });
        return;
      }

      res.clearCookie("toktickit.sid"); // Match cookie name in session config
      res.status(204).send();
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: {
        message: "An unexpected error occurred. Please try again later.",
      },
    });
  }
}

/**
 * GET /api/auth/me
 * Get current authenticated user.
 */
export async function getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          message: "Authentication required",
        },
      });
      return;
    }

    res.status(200).json({
      data: {
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          requiresPasswordChange: req.user.requiresPasswordChange,
        },
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      error: {
        message: "An unexpected error occurred. Please try again later.",
      },
    });
  }
}

/**
 * POST /api/auth/change-password
 * Change user password (for first login or user-initiated change).
 */
export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        error: {
          message: "Authentication required",
        },
      });
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    const validationErrors: Array<{ field: string; message: string }> = [];

    if (!currentPassword) {
      validationErrors.push({
        field: "currentPassword",
        message: "Current password is required",
      });
    }

    if (!newPassword) {
      validationErrors.push({
        field: "newPassword",
        message: "New password is required",
      });
    }

    if (!confirmPassword) {
      validationErrors.push({
        field: "confirmPassword",
        message: "Password confirmation is required",
      });
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      validationErrors.push({
        field: "confirmPassword",
        message: "Passwords do not match",
      });
    }

    // Validate new password against rules
    if (newPassword) {
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        passwordValidation.errors.forEach((error) => {
          validationErrors.push({
            field: "newPassword",
            message: error,
          });
        });
      }
    }

    if (validationErrors.length > 0) {
      res.status(400).json({
        error: {
          message: "Validation failed",
          details: validationErrors,
        },
      });
      return;
    }

    // Load user with password hash
    const user = await getPrisma().user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        requiresPasswordChange: true,
      },
    });

    if (!user) {
      res.status(401).json({
        error: {
          message: "Authentication required",
        },
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      res.status(401).json({
        error: {
          message: "Current password is incorrect",
        },
      });
      return;
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update user
    const updatedUser = await getPrisma().user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        requiresPasswordChange: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        requiresPasswordChange: true,
      },
    });

    // Update session user data
    if (req.user) {
      req.user.requiresPasswordChange = false;
    }

    res.status(200).json({
      data: {
        message: "Password changed successfully",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          requiresPasswordChange: updatedUser.requiresPasswordChange,
        },
      },
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      error: {
        message: "An unexpected error occurred. Please try again later.",
      },
    });
  }
}
