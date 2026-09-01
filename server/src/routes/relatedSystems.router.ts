import { Router } from "express";
import { getRelatedSystems } from "../controllers/relatedSystems.controller.js";

const router = Router();
router.get("/", getRelatedSystems);

export default router;
