import { Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
type Priority = typeof VALID_PRIORITIES[number];

const VALID_STATUSES = [
  "NEW",
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_REQUESTER",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
  "CANCELLED"
] as const;

const VALID_STAFF_SORT_FIELDS = ["createdAt", "updatedAt", "itPriority"] as const;
const VALID_SORT_ORDERS = ["asc", "desc"] as const;
const ALLOWED_PAGE_SIZES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

// ── GET /api/staff/tickets ──────────────────────────────────────────────────

/**
 * GET /api/staff/tickets
 * IT Staff Ticket Queue — returns ALL tickets (not limited to one requester)
 * Supports: search, category, reqPriority, itPriority, status, assignment filters
 * Sort by: createdAt, updatedAt, itPriority
 * Pagination: page, pageSize
 * Authorization: IT_STAFF or ADMINISTRATOR only
 */
export const getStaffTicketQueue = async (req: Request, res: Response): Promise<void> => {
  const prisma = getPrisma();
  const authReq = req as AuthenticatedRequest;

  // Authentication required
  if (!authReq.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }

  // Authorization: only IT Staff and Administrator can access staff queue
  if (authReq.user.role !== "IT_STAFF" && authReq.user.role !== "ADMINISTRATOR") {
    res.status(403).json({
      error: { code: "FORBIDDEN", message: "You do not have permission to access this resource" },
    });
    return;
  }

  // ── Parse query parameters ───────────────────────────────────────────────

  // Search: keyword in ticket number or summary
  const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;

  // Category filter
  const category = typeof req.query.category === "string" ? req.query.category.trim() : undefined;

  // Requested Priority filter
  const reqPriorityRaw = typeof req.query.reqPriority === "string" 
    ? req.query.reqPriority.toUpperCase() 
    : undefined;
  const reqPriority = reqPriorityRaw && VALID_PRIORITIES.includes(reqPriorityRaw as Priority)
    ? (reqPriorityRaw as Priority)
    : undefined;
  if (reqPriorityRaw && !reqPriority) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: `Invalid reqPriority value: ${req.query.reqPriority}` },
    });
    return;
  }

  // IT Priority filter
  const itPriorityRaw = typeof req.query.itPriority === "string"
    ? req.query.itPriority.toUpperCase()
    : undefined;
  const itPriority = itPriorityRaw && VALID_PRIORITIES.includes(itPriorityRaw as Priority)
    ? (itPriorityRaw as Priority)
    : undefined;
  if (itPriorityRaw && !itPriority) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: `Invalid itPriority value: ${req.query.itPriority}` },
    });
    return;
  }

  // Status filter
  const statusRaw = typeof req.query.status === "string" 
    ? req.query.status.toUpperCase() 
    : undefined;
  const status = statusRaw && VALID_STATUSES.includes(statusRaw as typeof VALID_STATUSES[number])
    ? statusRaw
    : undefined;
  if (statusRaw && !status) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: `Invalid status value: ${req.query.status}` },
    });
    return;
  }

  // Assignment filter: all | unassigned | assigned-to-me | assigned-to-others
  const assignment = typeof req.query.assignment === "string"
    ? req.query.assignment.toLowerCase()
    : "all";
  const validAssignments = ["all", "unassigned", "assigned-to-me", "assigned-to-others"];
  if (!validAssignments.includes(assignment)) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: `Invalid assignment value: ${req.query.assignment}` },
    });
    return;
  }

  // Sort and order
  const sortRaw = typeof req.query.sort === "string" ? req.query.sort : "itPriority";
  const orderRaw = typeof req.query.order === "string" ? req.query.order : "desc";
  const sort = VALID_STAFF_SORT_FIELDS.includes(sortRaw as typeof VALID_STAFF_SORT_FIELDS[number])
    ? (sortRaw as typeof VALID_STAFF_SORT_FIELDS[number])
    : "itPriority";
  const order = VALID_SORT_ORDERS.includes(orderRaw as typeof VALID_SORT_ORDERS[number])
    ? (orderRaw as typeof VALID_SORT_ORDERS[number])
    : "desc";

  // Pagination
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const pageSizeRaw = parseInt(String(req.query.pageSize ?? String(DEFAULT_PAGE_SIZE)), 10);
  const pageSize = (ALLOWED_PAGE_SIZES as readonly number[]).includes(pageSizeRaw)
    ? pageSizeRaw
    : DEFAULT_PAGE_SIZE;

  // ── Build Prisma where clause ────────────────────────────────────────────

  const where: Record<string, unknown> = {};

  // Search: ticket number OR summary contains keyword (case-insensitive)
  if (search) {
    where.OR = [
      { ticketNumber: { contains: search, mode: "insensitive" } },
      { summary: { contains: search, mode: "insensitive" } },
    ];
  }

  // Category filter
  if (category) {
    where.category = { name: { equals: category, mode: "insensitive" } };
  }

  // Requested Priority filter
  if (reqPriority) {
    where.requestedPriority = reqPriority;
  }

  // IT Priority filter
  if (itPriority) {
    where.itPriority = itPriority;
  }

  // Status filter
  if (status) {
    where.status = status;
  }

  // Assignment filter
  if (assignment === "unassigned") {
    where.ownerId = null;
  } else if (assignment === "assigned-to-me") {
    where.ownerId = authReq.user.id;
  } else if (assignment === "assigned-to-others") {
    where.ownerId = { not: null };
    where.NOT = { ownerId: authReq.user.id };
  }
  // "all" means no filter on ownerId

  // ── Execute query ─────────────────────────────────────────────────────────

  try {
    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          requester: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
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
    console.error("Failed to fetch staff ticket queue:", err);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Unable to load tickets. Please try again later." },
    });
  }
};

// ── GET /api/staff/tickets/:ticketNumber ────────────────────────────────────

/**
 * GET /api/staff/tickets/:ticketNumber
 * Get one ticket with full details for IT Staff
 * Returns ticket with attachments, owner, category, related system
 * Authorization: IT_STAFF or ADMINISTRATOR only
 */
export const getStaffTicketByNumber = async (req: Request, res: Response): Promise<void> => {
  const prisma = getPrisma();
  const authReq = req as AuthenticatedRequest;
  const { ticketNumber } = req.params;

  // Authentication required
  if (!authReq.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }

  // Authorization: only IT Staff and Administrator
  if (authReq.user.role !== "IT_STAFF" && authReq.user.role !== "ADMINISTRATOR") {
    res.status(403).json({
      error: { code: "FORBIDDEN", message: "You do not have permission to access this resource" },
    });
    return;
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        requester: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        attachments: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            uploadedAt: true,
            removedAt: true,
            removalReason: true,
          },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "Resource not found" },
      });
      return;
    }

    res.status(200).json(ticket);
  } catch (err) {
    console.error("Failed to fetch ticket:", err);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Unable to load ticket" },
    });
  }
};

// ── PATCH /api/staff/tickets/:ticketNumber/owner ────────────────────────────

/**
 * PATCH /api/staff/tickets/:ticketNumber/owner
 * Claim or reassign ticket ownership
 * Request body: { ownerId: number | null }
 * - ownerId: user ID of IT Staff/Admin to assign (or null to unassign)
 * Authorization: IT_STAFF or ADMINISTRATOR only
 */
export const updateTicketOwner = async (req: Request, res: Response): Promise<void> => {
  const prisma = getPrisma();
  const authReq = req as AuthenticatedRequest;
  const { ticketNumber } = req.params;
  const { ownerId } = req.body;

  // Authentication required
  if (!authReq.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }

  // Authorization: only IT Staff and Administrator
  if (authReq.user.role !== "IT_STAFF" && authReq.user.role !== "ADMINISTRATOR") {
    res.status(403).json({
      error: { code: "FORBIDDEN", message: "You do not have permission to access this resource" },
    });
    return;
  }

  // Validate ownerId: must be null or a valid IT Staff/Administrator user ID
  if (ownerId !== null && ownerId !== undefined) {
    if (typeof ownerId !== "number") {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "ownerId must be a number or null" },
      });
      return;
    }

    // Check if user exists and is IT Staff or Administrator
    try {
      const targetUser = await prisma.user.findUnique({
        where: { id: ownerId },
        select: { id: true, name: true, role: true, isActive: true },
      });

      if (!targetUser || !targetUser.isActive) {
        res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Invalid ownerId: user does not exist or is inactive" },
        });
        return;
      }

      if (targetUser.role !== "IT_STAFF" && targetUser.role !== "ADMINISTRATOR") {
        res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "ownerId must reference an IT Staff or Administrator user" },
        });
        return;
      }
    } catch (err) {
      console.error("Failed to validate ownerId:", err);
      res.status(500).json({
        error: { code: "SERVER_ERROR", message: "Unable to update ticket owner" },
      });
      return;
    }
  }

  // Update ticket owner
  try {
    const ticket = await prisma.ticket.update({
      where: { ticketNumber },
      data: { ownerId: ownerId ?? null },
      include: {
        owner: { select: { id: true, name: true } },
      },
    });

    res.status(200).json({
      data: {
        ticket: {
          ticketNumber: ticket.ticketNumber,
          ownerId: ticket.ownerId,
          ownerName: ticket.owner?.name ?? null,
        },
      },
    });
  } catch (err: any) {
    if (err.code === "P2025") {
      // Ticket not found
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "Resource not found" },
      });
    } else {
      console.error("Failed to update ticket owner:", err);
      res.status(500).json({
        error: { code: "SERVER_ERROR", message: "Unable to update ticket owner" },
      });
    }
  }
};

// ── PATCH /api/staff/tickets/:ticketNumber/it-priority ──────────────────────

/**
 * PATCH /api/staff/tickets/:ticketNumber/it-priority
 * Update IT Priority
 * Request body: { itPriority: "LOW" | "MEDIUM" | "HIGH" }
 * Authorization: IT_STAFF or ADMINISTRATOR only
 */
export const updateItPriority = async (req: Request, res: Response): Promise<void> => {
  const prisma = getPrisma();
  const authReq = req as AuthenticatedRequest;
  const { ticketNumber } = req.params;
  const { itPriority } = req.body;

  // Authentication required
  if (!authReq.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }

  // Authorization: only IT Staff and Administrator
  if (authReq.user.role !== "IT_STAFF" && authReq.user.role !== "ADMINISTRATOR") {
    res.status(403).json({
      error: { code: "FORBIDDEN", message: "You do not have permission to access this resource" },
    });
    return;
  }

  // Validate itPriority
  const priorityUpper = typeof itPriority === "string" ? itPriority.toUpperCase() : "";
  if (!VALID_PRIORITIES.includes(priorityUpper as Priority)) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: `Invalid itPriority value. Must be one of: ${VALID_PRIORITIES.join(", ")}` },
    });
    return;
  }

  // Update IT Priority
  try {
    const ticket = await prisma.ticket.update({
      where: { ticketNumber },
      data: { itPriority: priorityUpper as Priority },
      select: {
        ticketNumber: true,
        itPriority: true,
      },
    });

    res.status(200).json({
      data: {
        ticket: {
          ticketNumber: ticket.ticketNumber,
          itPriority: ticket.itPriority,
        },
      },
    });
  } catch (err: any) {
    if (err.code === "P2025") {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "Resource not found" },
      });
    } else {
      console.error("Failed to update IT Priority:", err);
      res.status(500).json({
        error: { code: "SERVER_ERROR", message: "Unable to update IT Priority" },
      });
    }
  }
};

// ── Status Transition Matrix ─────────────────────────────────────────────────

const STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ["OPEN", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"],
  CANCELLED: [], // Terminal state
};

// ── PATCH /api/staff/tickets/:ticketNumber/status ───────────────────────────

/**
 * PATCH /api/staff/tickets/:ticketNumber/status
 * Update ticket status with transition validation
 * Request body: { status: string }
 * Authorization: IT_STAFF or ADMINISTRATOR only
 */
export const updateTicketStatus = async (req: Request, res: Response): Promise<void> => {
  const prisma = getPrisma();
  const authReq = req as AuthenticatedRequest;
  const { ticketNumber } = req.params;
  const { status: newStatus } = req.body;

  // Authentication required
  if (!authReq.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }

  // Authorization: only IT Staff and Administrator
  if (authReq.user.role !== "IT_STAFF" && authReq.user.role !== "ADMINISTRATOR") {
    res.status(403).json({
      error: { code: "FORBIDDEN", message: "You do not have permission to access this resource" },
    });
    return;
  }

  // Validate new status
  const statusUpper = typeof newStatus === "string" ? newStatus.toUpperCase() : "";
  if (!VALID_STATUSES.includes(statusUpper as typeof VALID_STATUSES[number])) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: `Invalid status value. Must be one of: ${VALID_STATUSES.join(", ")}` },
    });
    return;
  }

  // Get current ticket to check transition validity
  try {
    const currentTicket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      select: { status: true },
    });

    if (!currentTicket) {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "Resource not found" },
      });
      return;
    }

    // Validate status transition
    const currentStatus = currentTicket.status;
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(statusUpper)) {
      res.status(400).json({
        error: {
          code: "INVALID_TRANSITION",
          message: `Invalid status transition: cannot change from ${currentStatus} to ${statusUpper}`,
        },
      });
      return;
    }

    // Update status
    const updatedTicket = await prisma.ticket.update({
      where: { ticketNumber },
      data: { status: statusUpper as any },
      select: {
        ticketNumber: true,
        status: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      data: {
        ticket: {
          ticketNumber: updatedTicket.ticketNumber,
          status: updatedTicket.status,
          updatedAt: updatedTicket.updatedAt,
        },
      },
    });
  } catch (err: any) {
    if (err.code === "P2025") {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "Resource not found" },
      });
    } else {
      console.error("Failed to update ticket status:", err);
      res.status(500).json({
        error: { code: "SERVER_ERROR", message: "Unable to update ticket status" },
      });
    }
  }
};

// ── POST /api/staff/tickets/:ticketNumber/notes ─────────────────────────────

/**
 * POST /api/staff/tickets/:ticketNumber/notes
 * Create an Internal Note (IT Staff/Admin only)
 * Request body: { content: string }
 * Authorization: IT_STAFF or ADMINISTRATOR only
 */
export const createInternalNote = async (req: Request, res: Response): Promise<void> => {
  const prisma = getPrisma();
  const authReq = req as AuthenticatedRequest;
  const { ticketNumber } = req.params;
  const { content } = req.body;

  // Authentication required
  if (!authReq.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }

  // Authorization: only IT Staff and Administrator
  if (authReq.user.role !== "IT_STAFF" && authReq.user.role !== "ADMINISTRATOR") {
    res.status(403).json({
      error: { code: "FORBIDDEN", message: "You do not have permission to access this resource" },
    });
    return;
  }

  // Validate content
  const trimmedContent = typeof content === "string" ? content.trim() : "";
  if (!trimmedContent) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Content cannot be empty" },
    });
    return;
  }

  if (trimmedContent.length > 2000) {
    res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Content must be 2000 characters or fewer" },
    });
    return;
  }

  // Create internal note
  try {
    // First, verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      select: { id: true },
    });

    if (!ticket) {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "Resource not found" },
      });
      return;
    }

    const note = await prisma.internalNote.create({
      data: {
        ticketId: ticket.id,
        authorId: authReq.user.id,
        content: trimmedContent,
      },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    res.status(201).json({
      data: {
        note: {
          id: note.id,
          ticketId: note.ticketId,
          authorId: note.authorId,
          authorName: note.author.name,
          authorRole: note.author.role,
          content: note.content,
          createdAt: note.createdAt,
        },
      },
    });
  } catch (err) {
    console.error("Failed to create internal note:", err);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Unable to create internal note" },
    });
  }
};

// ── GET /api/staff/tickets/:ticketNumber/notes ──────────────────────────────

/**
 * GET /api/staff/tickets/:ticketNumber/notes
 * List Internal Notes (IT Staff/Admin only)
 * Authorization: IT_STAFF or ADMINISTRATOR only
 */
export const getInternalNotes = async (req: Request, res: Response): Promise<void> => {
  const prisma = getPrisma();
  const authReq = req as AuthenticatedRequest;
  const { ticketNumber } = req.params;

  // Authentication required
  if (!authReq.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }

  // Authorization: only IT Staff and Administrator
  // Requester calling this endpoint gets 403 without exposing note content
  if (authReq.user.role !== "IT_STAFF" && authReq.user.role !== "ADMINISTRATOR") {
    res.status(403).json({
      error: { code: "FORBIDDEN", message: "You do not have permission to access this resource" },
    });
    return;
  }

  try {
    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      select: { id: true },
    });

    if (!ticket) {
      res.status(404).json({
        error: { code: "NOT_FOUND", message: "Resource not found" },
      });
      return;
    }

    // Get internal notes
    const notes = await prisma.internalNote.findMany({
      where: { ticketId: ticket.id },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    res.status(200).json({
      data: notes.map((note) => ({
        id: note.id,
        ticketId: note.ticketId,
        authorId: note.authorId,
        authorName: note.author.name,
        authorRole: note.author.role,
        content: note.content,
        createdAt: note.createdAt,
      })),
    });
  } catch (err) {
    console.error("Failed to fetch internal notes:", err);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Unable to load internal notes" },
    });
  }
};

// ── GET /api/users ──────────────────────────────────────────────────────────

/**
 * GET /api/users?role=IT_STAFF
 * List active IT Staff users for assignment
 * Authorization: IT_STAFF or ADMINISTRATOR only
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const prisma = getPrisma();
  const authReq = req as AuthenticatedRequest;
  const { role } = req.query;

  // Authentication required
  if (!authReq.user) {
    res.status(401).json({
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }

  // Authorization: only IT Staff and Administrator
  if (authReq.user.role !== "IT_STAFF" && authReq.user.role !== "ADMINISTRATOR") {
    res.status(403).json({
      error: { code: "FORBIDDEN", message: "You do not have permission to access this resource" },
    });
    return;
  }

  try {
    const where: any = { isActive: true };
    
    if (role) {
      const roleUpper = String(role).toUpperCase();
      if (roleUpper === "IT_STAFF" || roleUpper === "ADMINISTRATOR") {
        where.OR = [
          { role: "IT_STAFF" },
          { role: "ADMINISTRATOR" },
        ];
      }
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });

    res.status(200).json(users);
  } catch (err) {
    console.error("Failed to fetch users:", err);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Unable to load users" },
    });
  }
};
