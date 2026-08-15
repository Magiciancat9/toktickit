import { Request, Response } from "express";
import { getPrisma } from "../prisma.js";

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await getPrisma().category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    res.status(200).json(categories);
  } catch (err) {
    console.error("Failed to fetch categories:", err);
    res.status(500).json({ error: "Unable to load categories. Please try again later." });
  }
};
