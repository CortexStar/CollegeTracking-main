import { beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { Express } from 'express';
import express from 'express';
import { setupAuth } from '../server/auth';
import { registerRoutes } from '../server/routes';
import { Server } from 'http';

// Global variables for test setup
let app: Express;
let server: Server;

/**
 * Setup function to create a test Express app with routes
 * @returns Express app instance for testing
 */
export async function setupTestApp() {
  // Create a new Express app for testing
  app = express();
  app.use(express.json());

  // Setup authentication
  setupAuth(app);

  // Register routes
  server = await registerRoutes(app);

  return app;
}

/**
 * Get the test app instance
 * @returns Express app for testing
 */
export function getTestApp() {
  return app;
}

/**
 * Get the test server instance
 * @returns HTTP server for testing
 */
export function getTestServer() {
  return server;
}

// Setup and teardown hooks for all tests
beforeAll(async () => {
  app = await setupTestApp();
});

afterAll(async () => {
  if (server && server.listening) {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }
});

// Reset any mocks after each test
afterEach(() => {
  // Clean up any mock state
});