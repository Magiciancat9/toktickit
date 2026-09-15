import { Router } from "express";
import {
  downloadAttachment,
  removeAttachment,
} from "../controllers/attachments.controller.js";
import { requireAuth, loadAuthenticatedUser } from "../middleware/auth.middleware.js";

const router = Router();

// GET  /api/attachments/:id/download — stream active file; 410 if soft-removed
router.get("/:id/download", requireAuth, loadAuthenticatedUser, downloadAttachment);

// PATCH /api/attachments/:id/remove — soft-remove with reason
router.patch("/:id/remove", requireAuth, loadAuthenticatedUser, removeAttachment);

export default router;
