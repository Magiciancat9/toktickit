import { Request, Response } from "express";
import { getPrisma } from "../prisma.js";

/**
 * GET /api/requesters
 * Returns only active Development Requesters for the selector dropdown.
 * Inactive Requesters are excluded — they must never appear in the selector.
 * This is a Lab 2 testing mechanism, not real authentication.
 */
export const getRequesters = async (_req: Request, res: Response): Promise<void> => {
  try {
    const requesters = await getPrisma().requesterUser.findMany({
      where:   { isActive: true },
      select:  { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    res.status(200).json(requesters);
  } catch (err) {
    console.error("Failed to fetch requesters:", err);
    res.status(500).json({ error: "Unable to load requesters. Please try again later." });
  }
};
