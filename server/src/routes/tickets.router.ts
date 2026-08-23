import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import {
  createTicket,
  getTickets,
  getTicketByNumber,
} from "../controllers/tickets.controller.js";
import { uploadAttachment } from "../controllers/attachments.controller.js";

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

// GET /api/tickets — list tickets for a Requester (search/filter/sort/pagination)
router.get("/", getTickets);

// GET /api/tickets/:ticketNumber — get one owned Ticket with attachments
router.get("/:ticketNumber", getTicketByNumber);

// POST /api/tickets — create a new ticket (JSON body, no file)
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

export default router;
