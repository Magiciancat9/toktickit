import { Request, Response } from "express";
import { getPrisma } from "../prisma.js";

/**
 * GET /api/related-systems
 * Returns all active Related Systems ordered by name ascending.
 */
export const getRelatedSystems = async (_req: Request, res: Response): Promise<void> => {
  try {
    const systems = await getPrisma().relatedSystem.findMany({
      where:   { isActive: true },
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    });
    res.status(200).json(systems);
  } catch (err) {
    console.error("Failed to fetch related systems:", err);
    res.status(500).json({ error: "Unable to load related systems. Please try again later." });
  }
};
