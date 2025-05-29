import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "../../shared/env";
import * as schema from "../../shared/schema";

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

// Create and export the database client
export const db = drizzle(pool, { schema });

// Export the pool for potential direct usage
export { pool }; 