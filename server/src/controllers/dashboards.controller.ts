import { Request, Response } from "express";
import { getPrisma } from "../prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

const prisma = getPrisma();

/**
 * GET /api/dashboards/requester
 * Retrieve dashboard metrics for a Requester
 * 
 * Authorization: REQUESTER role only
 * Returns: totalOpen, waitingForRequester, recentlyUpdated, recentlyResolved counts
 */
export const getRequesterDashboard = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;

  // Authentication required
  if (!authReq.user) {
    res.status(401).json({
      error: { message: "Authentication required" },
    });
    return;
  }

  // Authorization: REQUESTER role only
  if (authReq.user.role !== "REQUESTER") {
    res.status(403).json({
      error: { message: "This endpoint is for Requesters only" },
    });
    return;
  }

  const userId = authReq.user.id;

  // If requesterId query parameter provided, must match session user
  const requestedUserId = req.query.requesterId;
  if (requestedUserId && parseInt(requestedUserId as string) !== userId) {
    res.status(403).json({
      error: { message: "You do not have permission to view this dashboard" },
    });
    return;
  }

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Total Open: NEW, OPEN, IN_PROGRESS, WAITING_FOR_REQUESTER, REOPENED
    const totalOpen = await prisma.ticket.count({
      where: {
        requesterId: userId,
        status: {
          in: ["NEW", "OPEN", "IN_PROGRESS", "WAITING_FOR_REQUESTER", "REOPENED"],
        },
      },
    });

    // Waiting for Requester: WAITING_FOR_REQUESTER only
    const waitingForRequester = await prisma.ticket.count({
      where: {
        requesterId: userId,
        status: "WAITING_FOR_REQUESTER",
      },
    });

    // Recently Updated: updated in last 7 days (excluding CLOSED and CANCELLED)
    const recentlyUpdated = await prisma.ticket.count({
      where: {
        requesterId: userId,
        updatedAt: {
          gte: sevenDaysAgo,
        },
        status: {
          notIn: ["CLOSED", "CANCELLED"],
        },
      },
    });

    // Recently Resolved: RESOLVED or CLOSED in last 30 days
    const recentlyResolved = await prisma.ticket.count({
      where: {
        requesterId: userId,
        status: {
          in: ["RESOLVED", "CLOSED"],
        },
        resolvedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    res.status(200).json({
      data: {
        totalOpen,
        waitingForRequester,
        recentlyUpdated,
        recentlyResolved,
      },
    });
  } catch (err: any) {
    console.error("Failed to get requester dashboard:", err);
    res.status(500).json({
      error: { message: "An unexpected error occurred. Please try again later." },
    });
  }
};

/**
 * GET /api/dashboards/staff
 * Retrieve dashboard metrics for IT Staff and Administrators
 * 
 * Authorization: IT_STAFF or ADMINISTRATOR role
 * Returns: unassigned, myAssigned, byStatus, byPriority, recentlyUpdated, highPriorityUnresolved counts
 */
export const getStaffDashboard = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;

  // Authentication required
  if (!authReq.user) {
    res.status(401).json({
      error: { message: "Authentication required" },
    });
    return;
  }

  // Authorization: IT_STAFF or ADMINISTRATOR only
  if (authReq.user.role !== "IT_STAFF" && authReq.user.role !== "ADMINISTRATOR") {
    res.status(403).json({
      error: { message: "You do not have permission to view this dashboard" },
    });
    return;
  }

  const userId = authReq.user.id;

  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Unassigned: ownerId=null, not RESOLVED/CLOSED/CANCELLED
    const unassigned = await prisma.ticket.count({
      where: {
        ownerId: null,
        status: {
          notIn: ["RESOLVED", "CLOSED", "CANCELLED"],
        },
      },
    });

    // My Assigned: owned by current user, not RESOLVED/CLOSED/CANCELLED
    const myAssigned = await prisma.ticket.count({
      where: {
        ownerId: userId,
        status: {
          notIn: ["RESOLVED", "CLOSED", "CANCELLED"],
        },
      },
    });

    // Recently Updated: updated in last 7 days (all tickets)
    const recentlyUpdated = await prisma.ticket.count({
      where: {
        updatedAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // High Priority Unresolved: itPriority=HIGH, not RESOLVED/CLOSED/CANCELLED
    const highPriorityUnresolved = await prisma.ticket.count({
      where: {
        itPriority: "HIGH",
        status: {
          notIn: ["RESOLVED", "CLOSED", "CANCELLED"],
        },
      },
    });

    // By Status: count for each status (excluding CLOSED and CANCELLED per spec)
    const statusCounts = await prisma.ticket.groupBy({
      by: ["status"],
      _count: true,
      where: {
        status: {
          notIn: ["CLOSED", "CANCELLED"],
        },
      },
    });

    const byStatus: Record<string, number> = {
      NEW: 0,
      OPEN: 0,
      IN_PROGRESS: 0,
      WAITING_FOR_REQUESTER: 0,
      RESOLVED: 0,
      REOPENED: 0,
    };

    statusCounts.forEach((item) => {
      byStatus[item.status] = item._count;
    });

    // By Priority: count for each priority (excluding CLOSED and CANCELLED)
    const priorityCounts = await prisma.ticket.groupBy({
      by: ["itPriority"],
      _count: true,
      where: {
        status: {
          notIn: ["CLOSED", "CANCELLED"],
        },
      },
    });

    const byPriority: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    };

    priorityCounts.forEach((item) => {
      byPriority[item.itPriority] = item._count;
    });

    res.status(200).json({
      data: {
        unassigned,
        myAssigned,
        recentlyUpdated,
        highPriorityUnresolved,
        byStatus,
        byPriority,
      },
    });
  } catch (err: any) {
    console.error("Failed to get staff dashboard:", err);
    res.status(500).json({
      error: { message: "An unexpected error occurred. Please try again later." },
    });
  }
};
