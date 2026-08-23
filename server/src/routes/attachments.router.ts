import { Router } from "express";
import {
  downloadAttachment,
  removeAttachment,
} from "../controllers/attachments.controller.js";

const router = Router();

// GET  /api/attachments/:id/download — stream active file; 410 if soft-removed
router.get("/:id/download", downloadAttachment);

// PATCH /api/attachments/:id/remove — soft-remove with reason
router.patch("/:id/remove", removeAttachment);

export default router;
