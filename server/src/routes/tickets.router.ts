import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import {
  createTicket,
  getTickets,
  getTicketByNumber,
  setProblemResolved,
} from "../controllers/tickets.controller.js";
import { uploadAttachment } from "../controllers/attachments.controller.js";
import { postComment, getComments } from "../controllers/comments.controller.js";
import { loadAuthenticatedUser, requireAuth } from "../middleware/auth.middleware.js";

// Store uploaded files in server/uploads/ with a unique name
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB hard limit
});

const router = Router();

// Lab 3: All ticket routes require authentication
// Load authenticated user first
router.use(requireAuth, loadAuthenticatedUser);

// GET /api/tickets — list tickets for authenticated Requester (My Tickets)
router.get("/", getTickets);

// GET /api/tickets/:ticketNumber — get one owned Ticket with attachments
router.get("/:ticketNumber", getTicketByNumber);

// POST /api/tickets — create a new ticket (requesterId from session)
router.post("/", createTicket);

// POST /api/tickets/:ticketNumber/attachments — upload one file to an existing ticket
router.post(
  "/:ticketNumber/attachments",
  (req: Request, res: Response, next: NextFunction) => {
    upload.single("file")(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
          error: { code: "FILE_TOO_LARGE", message: "File must be 5 MB or smaller." },
        });
        return;
      }
      if (err) {
        next(err);
        return;
      }
      next();
    });
  },
  uploadAttachment
);

// POST /api/tickets/:ticketNumber/comments — post a Public Comment on owned ticket
router.post("/:ticketNumber/comments", postComment);

// GET /api/tickets/:ticketNumber/comments — list Public Comments on owned ticket
router.get("/:ticketNumber/comments", getComments);

// PATCH /api/tickets/:ticketNumber/problem-resolved — Requester indicates problem appears resolved
router.patch("/:ticketNumber/problem-resolved", setProblemResolved);

export default router;
