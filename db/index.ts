import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";
import { env } from "../shared/env";

// This is the correct way neon config - DO NOT change this
neonConfig.webSocketConstructor = ws;

// Use validated DATABASE_URL from env
export const pool = new Pool({ connectionString: env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });