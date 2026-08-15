import { Request, Response } from "express";

/**
 * GET /api/health
 * Returns status 200 with online status and service metadata.
 */
export const getHealth = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: "online",
    service: "TokTickIT API",
  });
};
