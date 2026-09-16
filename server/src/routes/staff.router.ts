import { Router } from "express";
import {
  getStaffTicketQueue,
  getStaffTicketByNumber,
  updateTicketOwner,
  updateItPriority,
  updateTicketStatus,
  createInternalNote,
  getInternalNotes,
  getUsers,
} from "../controllers/staff.controller.js";
import { loadAuthenticatedUser, requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Lab 3: All staff routes require authentication
// Load authenticated user first
router.use(requireAuth, loadAuthenticatedUser);

// GET /api/staff/tickets — IT Staff Ticket Queue (all tickets with filters)
router.get("/tickets", getStaffTicketQueue);

// GET /api/staff/tickets/:ticketNumber — Get one ticket with full details
router.get("/tickets/:ticketNumber", getStaffTicketByNumber);

// PATCH /api/staff/tickets/:ticketNumber/owner — Claim/Reassign ownership
router.patch("/tickets/:ticketNumber/owner", updateTicketOwner);

// PATCH /api/staff/tickets/:ticketNumber/it-priority — Update IT Priority
router.patch("/tickets/:ticketNumber/it-priority", updateItPriority);

// PATCH /api/staff/tickets/:ticketNumber/status — Update status with transition validation
router.patch("/tickets/:ticketNumber/status", updateTicketStatus);

// POST /api/staff/tickets/:ticketNumber/notes — Create Internal Note
router.post("/tickets/:ticketNumber/notes", createInternalNote);

// GET /api/staff/tickets/:ticketNumber/notes — List Internal Notes
router.get("/tickets/:ticketNumber/notes", getInternalNotes);

export default router;
