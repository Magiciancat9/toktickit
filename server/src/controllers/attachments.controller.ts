import { Request, Response } from "express";
import fs from "fs";
import { getPrisma } from "../prisma.js";
import {
  isAllowedMimeType,
  isAllowedFileSize,
  MAX_ACTIVE_ATTACHMENTS,
} from "../utils/attachmentValidation.js";

// ── POST /api/tickets/:ticketNumber/attachments ────────────────────────────

/**
 * Uploads a file attachment to an existing Ticket.
 * Validates file type, size, and active attachment count.
 * If the ticket exists but upload validation fails, the ticket is NOT rolled back.
 */
export const uploadAttachment = async (req: Request, res: Response): Promise<void> => {
  const prisma = getPrisma();
  const { ticketNumber } = req.params;
  const requesterId = Number(req.body.requesterId);
  const file = req.file as Express.Multer.File | undefined;

  if (!requesterId || isNaN(requesterId)) {
    if (file?.path) fs.unlink(file.path, () => {});
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "requesterId is required." },
    });
    return;
  }

  if (!file) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "A file is required." },
    });
    return;
  }

  if (!isAllowedMimeType(file.mimetype)) {
    fs.unlink(file.path, () => {});
    res.status(415).json({
      error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Only JPG, PNG, WEBP, and PDF files are allowed." },
    });
    return;
  }

  if (!isAllowedFileSize(file.size)) {
    fs.unlink(file.path, () => {});
    res.status(400).json({
      error: { code: "FILE_TOO_LARGE", message: "File must be 5 MB or smaller." },
    });
    return;
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { ticketNumber } });
    if (!ticket) {
      fs.unlink(file.path, () => {});
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
      return;
    }
    if (ticket.requesterId !== requesterId) {
      fs.unlink(file.path, () => {});
      res.status(403).json({ error: { code: "FORBIDDEN", message: "You do not own this ticket." } });
      return;
    }

    const activeCount = await prisma.attachment.count({
      where: { ticketId: ticket.id, removedAt: null },
    });
    if (activeCount >= MAX_ACTIVE_ATTACHMENTS) {
      fs.unlink(file.path, () => {});
      res.status(409).json({
        error: {
          code: "ATTACHMENT_LIMIT_REACHED",
          message: `A ticket can have at most ${MAX_ACTIVE_ATTACHMENTS} active attachments.`,
        },
      });
      return;
    }

    const attachment = await prisma.attachment.create({
      data: {
        ticketId:     ticket.id,
        originalName: file.originalname,
        storedPath:   file.path,
        mimeType:     file.mimetype,
        sizeBytes:    file.size,
      },
    });

    res.status(201).json({
      id:            attachment.id,
      originalName:  attachment.originalName,
      mimeType:      attachment.mimeType,
      sizeBytes:     attachment.sizeBytes,
      uploadedAt:    attachment.uploadedAt,
      removedAt:     attachment.removedAt,
      removalReason: attachment.removalReason,
    });
  } catch (err) {
    console.error("Failed to upload attachment:", err);
    if (file?.path) fs.unlink(file.path, () => {});
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Unable to upload attachment. Please try again later." },
    });
  }
};

// ── GET /api/attachments/:id/download ─────────────────────────────────────

/**
 * Downloads the file for an active attachment.
 * Returns 410 Gone if the attachment has been soft-removed.
 * Returns 403 if the requesting Requester does not own the ticket.
 */
export const downloadAttachment = async (req: Request, res: Response): Promise<void> => {
  const prisma = getPrisma();
  const id = Number(req.params.id);
  const requesterId = Number(req.query.requesterId);

  if (!req.query.requesterId || isNaN(requesterId)) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "requesterId is required." },
    });
    return;
  }

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid attachment id." },
    });
    return;
  }

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: { ticket: { select: { requesterId: true } } },
    });

    if (!attachment) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Attachment not found." } });
      return;
    }

    if (attachment.ticket.requesterId !== requesterId) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "You do not own this attachment." } });
      return;
    }

    if (attachment.removedAt !== null) {
      res.status(410).json({
        error: { code: "GONE", message: "This attachment has been removed and is no longer available." },
      });
      return;
    }

    if (!fs.existsSync(attachment.storedPath)) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Attachment file not found on server." } });
      return;
    }

    res.setHeader("Content-Type", attachment.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(attachment.originalName)}"`
    );
    fs.createReadStream(attachment.storedPath).pipe(res);
  } catch (err) {
    console.error("Failed to download attachment:", err);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Unable to download attachment. Please try again later." },
    });
  }
};

// ── PATCH /api/attachments/:id/remove ─────────────────────────────────────

/**
 * Soft-removes an attachment. Sets removedAt and removalReason.
 * The file is no longer downloadable after removal.
 * The metadata row is retained for audit purposes.
 */
export const removeAttachment = async (req: Request, res: Response): Promise<void> => {
  const prisma = getPrisma();
  const id = Number(req.params.id);
  const requesterId = Number(req.body.requesterId);
  const removalReason =
    typeof req.body.removalReason === "string" ? req.body.removalReason.trim() : "";

  if (!req.body.requesterId || isNaN(requesterId)) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "requesterId is required." },
    });
    return;
  }

  if (!removalReason || removalReason.length < 5) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "A removal reason of at least 5 characters is required.",
      },
    });
    return;
  }

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: { ticket: { select: { requesterId: true } } },
    });

    if (!attachment) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Attachment not found." } });
      return;
    }

    if (attachment.ticket.requesterId !== requesterId) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "You do not own this attachment." } });
      return;
    }

    if (attachment.removedAt !== null) {
      res.status(409).json({
        error: { code: "ALREADY_REMOVED", message: "This attachment has already been removed." },
      });
      return;
    }

    const updated = await prisma.attachment.update({
      where: { id },
      data:  { removedAt: new Date(), removalReason },
    });

    res.status(200).json({
      id:            updated.id,
      originalName:  updated.originalName,
      mimeType:      updated.mimeType,
      sizeBytes:     updated.sizeBytes,
      uploadedAt:    updated.uploadedAt,
      removedAt:     updated.removedAt,
      removalReason: updated.removalReason,
    });
  } catch (err) {
    console.error("Failed to remove attachment:", err);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Unable to remove attachment. Please try again later." },
    });
  }
};
