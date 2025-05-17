import 'dotenv/config';
import { z } from 'zod';

export const env = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
}).parse(process.env);