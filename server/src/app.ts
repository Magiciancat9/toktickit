import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.router.js";
import categoriesRouter from "./routes/categories.router.js";
import requestersRouter from "./routes/requesters.router.js";
import relatedSystemsRouter from "./routes/relatedSystems.router.js";
import ticketsRouter from "./routes/tickets.router.js";

// The Express app is exported separately from app.listen() (see index.ts) so
// Supertest can import `app` without opening a port. Do not merge these files.
export const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/health", healthRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/requesters", requestersRouter);
app.use("/api/related-systems", relatedSystemsRouter);
app.use("/api/tickets", ticketsRouter);

export default app;
