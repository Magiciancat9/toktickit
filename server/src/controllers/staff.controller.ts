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
