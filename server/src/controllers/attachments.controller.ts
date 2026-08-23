import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { getPrisma } from "../prisma.js";
import {
  isAllowedMimeType,
  isAllowedFileSize,
  MAX_ACTIVE_ATTACHMENTS,
} from "../utils/attachmentValidation.js";

/**
 * POST /api/tickets/:ticketNumber/attachments
 * Uploads a file attachment to an existing Ticket.
 * Validates file type, size, and active attachment count.
 * If the ticket exists but upload validation fails, the ticket is NOT rolled back.
 */
export const uploadAttachment = async (req: Request, res: Response): Promise<void> => {
  const prisma = getPrisma();
  const { ticketNumber } = req.params;
  const requesterId = Number(req.body.requesterId);

  // multer v2 stores file in req.file
  const file = req.file as Express.Multer.File | undefined;

  if (!requesterId || isNaN(requesterId)) {
    // Clean up uploaded file if it slipped through
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

  // Validate MIME type
  if (!isAllowedMimeType(file.mimetype)) {
    fs.unlink(file.path, () => {});
    res.status(415).json({
      error: {
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "Only JPG, PNG, WEBP, and PDF files are allowed.",
      },
    });
    return;
  }

  // Validate file size
  if (!isAllowedFileSize(file.size)) {
    fs.unlink(file.path, () => {});
    res.status(400).json({
      error: { code: "FILE_TOO_LARGE", message: "File must be 5 MB or smaller." },
    });
    return;
  }

  try {
    // Verify ticket exists and belongs to the requester
    const ticket = await prisma.ticket.findUnique({ where: { ticketNumber } });
    if (!ticket) {
      fs.unlink(file.path, () => {});
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
      return;
    }
    if (ticket.requesterId !== requesterId) {
      fs.unlink(file.path, () => {});
      res.status(403).json({
        error: { code: "FORBIDDEN", message: "You do not own this ticket." },
      });
      return;
    }

    // Check active attachment count
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

    // Persist attachment metadata
    const attachment = await prisma.attachment.create({
      data: {
        ticketId:     ticket.id,
        originalName: file.originalname,
        storedPath:   file.path,
        mimeType:     file.mimetype,
        sizeBytes:    file.size,
      },
    });

    // Return metadata only — never expose storedPath to the client
    res.status(201).json({
      id:           attachment.id,
      originalName: attachment.originalName,
      mimeType:     attachment.mimeType,
      sizeBytes:    attachment.sizeBytes,
      uploadedAt:   attachment.uploadedAt,
      removedAt:    attachment.removedAt,
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
