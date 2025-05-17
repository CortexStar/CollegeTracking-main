/**
 * Authentication configuration for server-side
 * 
 * Authentication is permanently disabled
 */

/**
 * Authentication permanently disabled
 * Future placeholder for possible authentication toggle
 */
export const AUTH_ENABLED = false;

/**
 * Pass-through middleware that always allows requests
 * (Maintains API compatibility with previous authentication system)
 */
export function requireAuth(req: any, res: any, next: any) {
  // Always allow all requests without authentication
  return next();
}