import { Router } from "express";
import { 
  getUsers, 
  getUser, 
  createUser, 
  updateUser, 
  resetPassword 
} from "../controllers/admin.controller.js";
import { loadAuthenticatedUser, requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

// Protect all admin routes: must be authenticated and have ADMINISTRATOR role
router.use(requireAuth, loadAuthenticatedUser, requireRole("ADMINISTRATOR"));

// GET /api/admin/users — List users with optional search and role filter
router.get("/users", getUsers);

// POST /api/admin/users — Create user
router.post("/users", createUser);

// GET /api/admin/users/:id — Get one user
router.get("/users/:id", getUser);

// PATCH /api/admin/users/:id — Update user (name, email, role, isActive)
router.patch("/users/:id", updateUser);

// POST /api/admin/users/:id/reset-password — Set new initial password
router.post("/users/:id/reset-password", resetPassword);

export default router;
