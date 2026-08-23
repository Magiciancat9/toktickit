import { Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { generateTicketNumber } from "../utils/ticketNumber.js";

const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
type Priority = typeof VALID_PRIORITIES[number];

interface CreateTicketBody {
  requesterId?: unknown;
  categoryId?: unknown;
  relatedSystemId?: unknown;
  summary?: unknown;
  description?: unknown;
  requestedPriority?: unknown;
}

/**
 * POST /api/tickets
 * Creates a new Ticket for the specified Development Requester.
 * Ticket Number and ticketDate are generated server-side.
 * Default status is NEW.
 */
export const createTicket = async (req: Request, res: Response): Promise<void> => {
  const prisma = getPrisma();
  const body = req.body as CreateTicketBody;

  // ── Validation ──────────────────────────────────────────────────────────
  const errors: Record<string, string> = {};

  const requesterId = Number(body.requesterId);
  if (!body.requesterId || isNaN(requesterId)) {
    errors.requesterId = "Requester ID is required and must be a number.";
  }

  const categoryId = Number(body.categoryId);
  if (!body.categoryId || isNaN(categoryId)) {
    errors.categoryId = "Category is required.";
  }

  const relatedSystemId = Number(body.relatedSystemId);
  if (!body.relatedSystemId || isNaN(relatedSystemId)) {
    errors.relatedSystemId = "Related System is required.";
  }

  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  if (!summary) {
    errors.summary = "Summary is required.";
  } else if (summary.length < 5) {
    errors.summary = "Summary must be at least 5 characters.";
  } else if (summary.length > 150) {
    errors.summary = "Summary must be 150 characters or fewer.";
  }

  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!description) {
    errors.description = "Description is required.";
  } else if (description.length < 10) {
    errors.description = "Description must be at least 10 characters.";
  } else if (description.length > 2000) {
    errors.description = "Description must be 2000 characters or fewer.";
  }

  const requestedPriority = typeof body.requestedPriority === "string"
    ? body.requestedPriority.toUpperCase()
    : "";
  if (!requestedPriority || !VALID_PRIORITIES.includes(requestedPriority as Priority)) {
    errors.requestedPriority = "Requested Priority must be LOW, MEDIUM, or HIGH.";
  }

  if (Object.keys(errors).length > 0) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Validation failed.", fields: errors },
    });
    return;
  }

  try {
    // Verify requester exists and is active
    const requester = await prisma.requesterUser.findFirst({
      where: { id: requesterId, isActive: true },
    });
    if (!requester) {
      res.status(400).json({
        error: { code: "INVALID_REQUESTER", message: "Requester not found or is inactive." },
      });
      return;
    }

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      res.status(400).json({
        error: { code: "INVALID_REFERENCE", message: "Category not found." },
      });
      return;
    }

    // Verify related system exists and is active
    const relatedSystem = await prisma.relatedSystem.findFirst({
      where: { id: relatedSystemId, isActive: true },
    });
    if (!relatedSystem) {
      res.status(400).json({
        error: { code: "INVALID_REFERENCE", message: "Related System not found or is inactive." },
      });
      return;
    }

    // Generate unique Ticket Number
    const ticketNumber = await generateTicketNumber(prisma);

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        requesterId,
        categoryId,
        relatedSystemId,
        summary,
        description,
        requestedPriority: requestedPriority as Priority,
        status: "NEW",
      },
      include: {
        requester:     { select: { id: true, name: true } },
        category:      { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(ticket);
  } catch (err) {
    console.error("Failed to create ticket:", err);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Unable to create ticket. Please try again later." },
    });
  }
};
