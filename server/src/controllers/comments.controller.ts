import { Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

// ── POST /api/tickets/:ticketNumber/comments ───────────────────────────────

/**
 * Post a Public Comment on an owned ticket.
 * Authorization: Requester can only post on owned tickets.
 * IT Staff/Admin can post on any ticket (for future use).
 */
export const postComment = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const prisma = getPrisma();
  const { ticketNumber } = req.params;
  const content = typeof req.body.content === "string" ? req.body.content.trim() : "";

  if (!authReq.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required." },
    });
    return;
  }

  // Validation: content must not be empty or whitespace-only
  if (!content) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Comment content is required and must not be empty.",
      },
    });
    return;
  }

  // Validation: max 2000 characters
  if (content.length > 2000) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Comment content must be 2000 characters or fewer.",
      },
    });
    return;
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { ticketNumber } });
    
    if (!ticket) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
      return;
    }

    // Authorization: Requester can only comment on owned tickets
    // IT Staff and Admin can comment on any ticket
    const isOwner = ticket.requesterId === authReq.user.id;
    const isStaffOrAdmin = authReq.user.role === "IT_STAFF" || authReq.user.role === "ADMINISTRATOR";
    
    if (!isOwner && !isStaffOrAdmin) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
      return;
    }

    const comment = await prisma.publicComment.create({
      data: {
        ticketId: ticket.id,
        authorId: authReq.user.id,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json({
      data: {
        comment: {
          id: comment.id,
          ticketId: comment.ticketId,
          authorId: comment.authorId,
          authorName: comment.author.name,
          authorRole: comment.author.role,
          content: comment.content,
          createdAt: comment.createdAt,
        },
      },
    });
  } catch (err) {
    console.error("Failed to post comment:", err);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Unable to post comment. Please try again later." },
    });
  }
};

// ── GET /api/tickets/:ticketNumber/comments ────────────────────────────────

/**
 * List Public Comments on a ticket.
 * Authorization: Requester can only view comments on owned tickets.
 * IT Staff/Admin can view comments on any ticket.
 * Comments returned in chronological order.
 */
export const getComments = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const prisma = getPrisma();
  const { ticketNumber } = req.params;

  if (!authReq.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required." },
    });
    return;
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { ticketNumber } });
    
    if (!ticket) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
      return;
    }

    // Authorization: Requester can only view comments on owned tickets
    // IT Staff and Admin can view comments on any ticket
    const isOwner = ticket.requesterId === authReq.user.id;
    const isStaffOrAdmin = authReq.user.role === "IT_STAFF" || authReq.user.role === "ADMINISTRATOR";
    
    if (!isOwner && !isStaffOrAdmin) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
      return;
    }

    const comments = await prisma.publicComment.findMany({
      where: { ticketId: ticket.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "asc" }, // Chronological order
    });

    res.status(200).json({
      data: comments.map((c) => ({
        id: c.id,
        ticketId: c.ticketId,
        authorId: c.authorId,
        authorName: c.author.name,
        authorRole: c.author.role,
        content: c.content,
        createdAt: c.createdAt,
      })),
    });
  } catch (err) {
    console.error("Failed to get comments:", err);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Unable to load comments. Please try again later." },
    });
  }
};
