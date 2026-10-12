import { Router } from "express";
import { getRequesterDashboard, getStaffDashboard } from "../controllers/dashboards.controller.js";
import { requireAuth, loadAuthenticatedUser } from "../middleware/auth.middleware.js";

const router = Router();

// All dashboard endpoints require authentication and user loading
router.use(requireAuth, loadAuthenticatedUser);

// GET /api/dashboards/requester — Requester dashboard metrics
router.get("/requester", getRequesterDashboard);

// GET /api/dashboards/staff — IT Staff dashboard metrics
router.get("/staff", getStaffDashboard);

export default router;
