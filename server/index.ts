import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { env } from "../shared/env";
import { requestLogger } from "./middlewares/requestLogger";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(requestLogger); // Use morgan for request logging

(async () => {
  const server = await registerRoutes(app); // We need to see what `server` is here

  // Use our custom error handler middleware
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (env.NODE_ENV === "development") {
    await setupVite(app, server); // And how vite uses/modifies `server`
  } else {
    serveStatic(app);
  }

  // Use the validated PORT from environment
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(env.PORT, 10); // Reads from your .env (e.g., 3001)
  server.listen({ // This `server` object is the one that needs to correctly handle listen
    port,
    host: "127.0.0.1", // We changed this from "0.0.0.0" in previous steps
   // reusePort: true, // <<<< TEMPORARILY COMMENT THIS OUT OR REMOVE IT
  }, () => {
    log(`serving on host 127.0.0.1 port ${port}`); // Ensure this log matches the host
  });
})();