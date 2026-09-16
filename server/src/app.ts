import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pkg from "pg";
const { Pool } = pkg;

// Import routers
import healthRouter from "./routes/health.router.js";
import categoriesRouter from "./routes/categories.router.js";
import requestersRouter from "./routes/requesters.router.js";
import relatedSystemsRouter from "./routes/relatedSystems.router.js";
import ticketsRouter from "./routes/tickets.router.js";
import attachmentsRouter from "./routes/attachments.router.js";
import authRouter from "./routes/auth.router.js";
import staffRouter from "./routes/staff.router.js";
import usersRouter from "./routes/users.router.js";
import adminRouter from "./routes/admin.router.js";

export const app = express();

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:5173", // Vite dev server
    credentials: true, // Allow cookies
  })
);

app.use(express.json());

// Lab 3: Session configuration with PostgreSQL store
const PgSession = connectPgSimple(session);

// Create PostgreSQL connection pool for session store
const sessionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(
  session({
    store: new PgSession({
      pool: sessionPool,
      tableName: "session", // Default table name
      createTableIfMissing: true, // Auto-create session table
    }),
    name: "toktickit.sid", // Session cookie name
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
      httpOnly: true, // Prevent JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax", // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// API routes
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter); // Lab 3: Authentication routes
app.use("/api/categories", categoriesRouter);
app.use("/api/requesters", requestersRouter);
app.use("/api/related-systems", relatedSystemsRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/attachments", attachmentsRouter);
app.use("/api/staff", staffRouter); // Lab 3: IT Staff routes
app.use("/api/users", usersRouter); // Lab 3: Users list for assignment
app.use("/api/admin", adminRouter); // Lab 3: Admin routes

export default app;
