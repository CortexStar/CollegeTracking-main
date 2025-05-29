import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { env } from "../shared/env";
import { requestLogger } from "./middlewares/requestLogger";
import { errorHandler } from "./middlewares/errorHandler";
import booksRouter from "./routes/books";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(requestLogger); // Use morgan for request logging

// Serve uploaded files
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve("uploads", "books");
app.use('/uploads', express.static(UPLOAD_DIR));

// Mount the books router
app.use("/api/books", booksRouter);

(async () => {
  const server = await registerRoutes(app);

  // Use our custom error handler middleware
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use the validated PORT from environment
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(env.PORT || "3001", 10);
  server.listen({
    port,
    host: "127.0.0.1",
  }, () => {
    log("📚 PDF service listening at http://localhost:" + String(port));
  });
})();