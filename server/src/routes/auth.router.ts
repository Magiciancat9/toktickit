/**
 * Authentication routes for Lab 3.
 * - POST /api/auth/login
 * - POST /api/auth/logout
 * - GET /api/auth/me
 * - POST /api/auth/change-password
 */

import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { loadAuthenticatedUser, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes (no authentication required)
router.post("/login", authController.login);

// Protected routes (authentication required)
router.post("/logout", authController.logout);
router.get("/me", loadAuthenticatedUser, requireAuth, authController.getCurrentUser);
router.post(
  "/change-password",
  loadAuthenticatedUser,
  requireAuth,
  authController.changePassword
);

export default router;
