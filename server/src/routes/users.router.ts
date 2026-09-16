import { Router } from "express";
import { getUsers } from "../controllers/staff.controller.js";
import { loadAuthenticatedUser, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// All users routes require authentication
router.use(requireAuth, loadAuthenticatedUser);

// GET /api/users?role=IT_STAFF — List active IT Staff users for assignment
router.get("/", getUsers);

export default router;
