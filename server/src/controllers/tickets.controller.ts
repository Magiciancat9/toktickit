import { Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { generateTicketNumber } from "../utils/ticketNumber.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
type Priority = typeof VALID_PRIORITIES[number];

const VALID_SORT_FIELDS  = ["createdAt", "updatedAt"] as const;
const VALID_SORT_ORDERS  = ["asc", "desc"]            as const;
const ALLOWED_PAGE_SIZES = [10, 25, 50]               as const;
const DEFAULT_PAGE_SIZE  = 10;

interface CreateTicketBody {
  requesterId?: unknown;
  categoryId?: unknown;
  relatedSystemId?: unknown;
  summary?: unknown;
  description?: unknown;
  requestedPriority?: unknown;
}

// ── GET /api/tickets ────────────────────────────────────────────────────────

/**
 * GET /api/tickets
 * Returns a paginated list of tickets owned by the specified Requester.
 * Supports: search (ticketNumber + summary), category/priority/status filters,
 * sort field/direction, page number, and page size.
 * Ownership is enforced — only tickets belonging to requesterId are returned.
 */
/**
 * GET /api/tickets — List tickets owned by authenticated Requester (My Tickets)
 * Lab 3: Requires authentication, returns only requester's own tickets.
 */
export const getTickets = async (req: Request, res: Response): Promise<void> => {
  const prisma = getPrisma();
  const authReq = req as AuthenticatedRequest;

  // Lab 3: requesterId comes from authenticated session, not query parameter
  if (!authReq.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }

  // Only REQUESTER role can use this endpoint
  if (authReq.user.role !== "REQUESTER") {
    res.status(403).json({
      error: { code: "FORBIDDEN", message: "You do not have permission to access this resource" },
    });
    return;
  }

  const requesterId = authReq.user.id;

  // ── Parse optional query params ───────────────────────────────────────
  const search   = typeof req.query.search   === "string" ? req.query.search.trim()   : undefined;
  const category = typeof req.query.category === "string" ? req.query.category.trim() : undefined;

  const priorityRaw  = typeof req.query.priority === "string" ? req.query.priority.toUpperCase() : undefined;
  const priority     = priorityRaw && VALID_PRIORITIES.includes(priorityRaw as Priority)
    ? (priorityRaw as Priority) : undefined;
  if (priorityRaw && !priority) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: `Invalid priority value: ${req.query.priority}` },
    });
    return;
  }

  const statusRaw = typeof req.query.status === "string" ? req.query.status.toUpperCase() : undefined;
  // Lab 3: Allow all ticket statuses, not just NEW
  const validStatuses = ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CLOSED", "REOPENED", "CANCELLED"];
  if (statusRaw && !validStatuses.includes(statusRaw)) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: `Invalid status value: ${req.query.status}` },
    });
    return;
  }

  const sortRaw  = typeof req.query.sort  === "string" ? req.query.sort  : "createdAt";
  const orderRaw = typeof req.query.order === "string" ? req.query.order : "desc";
  const sort  = VALID_SORT_FIELDS.includes(sortRaw  as typeof VALID_SORT_FIELDS[number])
    ? sortRaw as typeof VALID_SORT_FIELDS[number] : "createdAt";
  const order = VALID_SORT_ORDERS.includes(orderRaw as typeof VALID_SORT_ORDERS[number])
    ? orderRaw as typeof VALID_SORT_ORDERS[number] : "desc";

  const page     = Math.max(1, parseInt(String(req.query.page     ?? "1"),  10) || 1);
  const pageSizeRaw = parseInt(String(req.query.pageSize ?? String(DEFAULT_PAGE_SIZE)), 10);
  const pageSize = (ALLOWED_PAGE_SIZES as readonly number[]).includes(pageSizeRaw)
    ? pageSizeRaw : DEFAULT_PAGE_SIZE;

  // ── Build Prisma where clause ─────────────────────────────────────────
  // Lab 3: BR-13 - Only return tickets where requesterId matches authenticated user
  const where: Record<string, unknown> = { requesterId };

  if (search) {
    where.OR = [
      { ticketNumber: { contains: search, mode: "insensitive" } },
      { summary:      { contains: search, mode: "insensitive" } },
    ];
  }
  if (category)  where.category      = { name: { equals: category, mode: "insensitive" } };
  if (priority)  where.requestedPriority = priority;
  if (statusRaw) where.status            = statusRaw;

  try {
    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy: { [sort]: order },
        skip:  (page - 1) * pageSize,
        take:  pageSize,
        include: {
          category:      { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
        },
      }),
    ]);

    res.status(200).json({
      data: tickets,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error("Failed to fetch tickets:", err);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Unable to load tickets. Please try again later." },
    });
  }
};

// ── GET /api/tickets/:ticketNumber ──────────────────────────────────────────

/**
 * GET /api/tickets/:ticketNumber
 * Returns a single ticket with attachments, enforcing ownership via requesterId query param.
 * Returns 403 if the ticket exists but belongs to a different Requester.
 */
/**
 * GET /api/tickets/:ticketNumber — Get detail of one owned ticket
 * Lab 3: Requires authentication, only returns ticket if owned by authenticated user
 */
export const getTicketByNumber = async (req: Request, res: Response): Promise<void> => {
  const prisma = getPrisma();
  const authReq = req as AuthenticatedRequest;
  const { ticketNumber } = req.params;

  // Lab 3: Authentication required
  if (!authReq.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }

  // Lab 3: Only REQUESTER role can use this endpoint
  if (authReq.user.role !== "REQUESTER") {
    res.status(403).json({
      error: { code: "FORBIDDEN", message: "You do not have permission to access this resource" },
    });
    return;
  }

  const requesterId = authReq.user.id;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        requester:     { select: { id: true, name: true } },
        owner:         { select: { id: true, name: true, role: true } },
        category:      { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        attachments: {
          orderBy: { uploadedAt: "asc" },
          select: {
            id: true, originalName: true, mimeType: true,
            sizeBytes: true, uploadedAt: true, removedAt: true, removalReason: true,
          },
        },
      },
    });

    // Lab 3: BR-17 - Use same generic message for 403/404 to not leak resource existence
    if (!ticket || ticket.requesterId !== requesterId) {
      res.status(404).json({ 
        error: { code: "NOT_FOUND", message: "Ticket not found" } 
      });
      return;
    }

    res.status(200).json(ticket);
  } catch (err) {
    console.error("Failed to fetch ticket:", err);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Unable to load ticket. Please try again later." },
    });
  }
};

// ── POST /api/tickets ───────────────────────────────────────────────────────

/**
 * POST /api/tickets — Create a new ticket (Lab 3: requesterId from authenticated session)
 */
export const createTicket = async (req: Request, res: Response): Promise<void> => {
  const prisma = getPrisma();
  const authReq = req as AuthenticatedRequest;
  const body = req.body as CreateTicketBody;

  // Lab 3: Authentication required
  if (!authReq.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }

  // Lab 3: Only REQUESTER role can create tickets
  if (authReq.user.role !== "REQUESTER") {
    res.status(403).json({
      error: { code: "FORBIDDEN", message: "Only Requesters can create tickets" },
    });
    return;
  }

  // Lab 3: requesterId comes from authenticated session, not request body
  const requesterId = authReq.user.id;

  // ── Validation ──────────────────────────────────────────────────────────
  const errors: Record<string, string> = {};

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

    // Lab 3: Set itPriority to match requestedPriority initially
    const itPriority = requestedPriority as Priority;

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
        itPriority,
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

// ── PATCH /api/tickets/:ticketNumber/problem-resolved ──────────────────────

/**
 * PATCH /api/tickets/:ticketNumber/problem-resolved
 * Requester indicates that the problem appears resolved.
 * This does NOT change the ticket status to RESOLVED.
 * IT Staff/Admin must formally resolve the ticket through status workflow.
 */
export const setProblemResolved = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const prisma = getPrisma();
  const { ticketNumber } = req.params;
  const problemResolvedByRequester = req.body.problemResolvedByRequester;

  if (!authReq.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required." },
    });
    return;
  }

  // Validation: problemResolvedByRequester must be a boolean
  if (typeof problemResolvedByRequester !== "boolean") {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "problemResolvedByRequester must be a boolean value.",
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

    // Authorization: only the ticket owner (Requester) can set this flag
    if (ticket.requesterId !== authReq.user.id) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Ticket not found." } });
      return;
    }

    // Update the flag (does NOT change status)
    const updated = await prisma.ticket.update({
      where: { ticketNumber },
      data: { problemResolvedByRequester },
      select: {
        ticketNumber: true,
        problemResolvedByRequester: true,
      },
    });

    res.status(200).json({
      data: {
        ticket: {
          ticketNumber: updated.ticketNumber,
          problemResolvedByRequester: updated.problemResolvedByRequester,
        },
      },
    });
  } catch (err) {
    console.error("Failed to update problem resolved flag:", err);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Unable to update ticket. Please try again later." },
    });
  }
};
