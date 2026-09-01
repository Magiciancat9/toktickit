import { Router } from "express";
import { getRequesters } from "../controllers/requesters.controller.js";

const router = Router();
router.get("/", getRequesters);

export default router;
