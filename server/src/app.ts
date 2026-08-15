import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.router.js";
import categoriesRouter from "./routes/categories.router.js";

// The Express app is exported separately from app.listen() (see index.ts) so
// Supertest can import `app` without opening a port. Do not merge these files.
export const app = express();

app.use(cors());          // already wired: lets the Vite dev server call this API
app.use(express.json());

// API routes
app.use("/api/health", healthRouter);
app.use("/api/categories", categoriesRouter);

export default app;
