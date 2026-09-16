import { Router } from "express";
import { getStaffTicketQueue } from "../controllers/staff.controller.js";
import { loadAuthenticatedUser, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Lab 3: All staff routes require authentication
// Load authenticated user first
router.use(requireAuth, loadAuthenticatedUser);

// GET /api/staff/tickets — IT Staff Ticket Queue (all tickets with filters)
router.get("/tickets", getStaffTicketQueue);

export default router;
