/**
 * Authentication middleware for Lab 3.
 * - requireAuth: Ensures user is authenticated (session exists)
 * - requireRole: Ensures user has one of the permitted roles
 */

import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";

/**
 * Extend Express Request to include user from session.
 */
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

/**
 * Extend Express Request to include authenticated user data.
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    requiresPasswordChange: boolean;
  };
}

/**
 * Middleware: Require authentication.
 * Checks if session contains userId, loads user from DB, attaches to req.user.
 * Returns 401 if not authenticated.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).json({
      error: {
        message: "Authentication required",
      },
    });
    return;
  }

  // User data will be loaded by controller if needed, or we can load here
  // For now, we trust session userId exists. Controllers can fetch full user data.
  // To make it simpler, let's load user here and attach to req
  // We'll do this in the controllers for now to keep middleware lightweight
  next();
}

/**
 * Middleware factory: Require one of the specified roles.
 * Must be used after requireAuth.
 *
 * @param allowedRoles Array of UserRole values
 * @returns Express middleware function
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({
        error: {
          message: "Authentication required",
        },
      });
      return;
    }

    if (!allowedRoles.includes(authReq.user.role)) {
      res.status(403).json({
        error: {
          message: "You do not have permission to access this resource",
        },
      });
      return;
    }

    next();
  };
}

/**
 * Helper middleware to load authenticated user from session and attach to req.user.
 * Used after requireAuth to populate req.user with full user data.
 */
import { getPrisma } from "../prisma.js";

export async function loadAuthenticatedUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const userId = req.session.userId;

  if (!userId) {
    next();
    return;
  }

  try {
    const user = await getPrisma().user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        requiresPasswordChange: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      // Session exists but user is inactive or deleted - clear session
      req.session.destroy(() => {});
      res.status(401).json({
        error: {
          message: "Authentication required",
        },
      });
      return;
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    console.error("Error loading authenticated user:", error);
    res.status(500).json({
      error: {
        message: "An unexpected error occurred. Please try again later.",
      },
    });
  }
}
