import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.router.js";
import categoriesRouter from "./routes/categories.router.js";
import requestersRouter from "./routes/requesters.router.js";
import relatedSystemsRouter from "./routes/relatedSystems.router.js";
import ticketsRouter from "./routes/tickets.router.js";
import attachmentsRouter from "./routes/attachments.router.js";

export const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use("/api/health", healthRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/requesters", requestersRouter);
app.use("/api/related-systems", relatedSystemsRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/attachments", attachmentsRouter);

export default app;
