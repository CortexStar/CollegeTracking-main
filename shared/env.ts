import 'dotenv/config';
import { z } from 'zod';

/**
 * Enhanced environment variables validation with Zod
 * 
 * Benefits:
 * - Runtime validation of all environment variables
 * - Type safety for environment variable usage
 * - Better error messages with specific validation failures
 * - Default values for optional variables
 * - Fail-fast approach to prevent runtime errors
 */

// Define AWS variables schema with validation
const awsSchema = z.object({
  AWS_REGION: z.string().min(1).optional()
    .describe("AWS region for S3 storage (e.g., 'us-east-1')"),
  AWS_ACCESS_KEY_ID: z.string().min(1).optional()
    .describe("AWS access key ID for S3 storage"),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional()
    .describe("AWS secret access key for S3 storage"),
  AWS_BUCKET_NAME: z.string().min(1).optional()
    .describe("AWS S3 bucket name for file storage"),
});

// Define auth variables schema
const authSchema = z.object({
  SESSION_SECRET: z.string().min(32).optional()
    .describe("Secret key for session management, must be at least 32 characters long"),
  COOKIE_MAX_AGE: z.string().transform(val => parseInt(val, 10)).default("86400000")
    .describe("Maximum age of cookies in milliseconds, defaults to 24 hours"),
});

// Define Redis variables schema (optional)
const redisSchema = z.object({
  REDIS_URL: z.string().url().optional()
    .describe("Redis connection URL for queue management"),
  REDIS_HOST: z.string().optional()
    .describe("Redis host if not using URL connection"),
  REDIS_PORT: z.string().transform(val => parseInt(val, 10)).optional()
    .describe("Redis port if not using URL connection"),
  REDIS_PASSWORD: z.string().optional()
    .describe("Redis password if not using URL connection"),
});

// Define core application variables schema
const appSchema = z.object({
  DATABASE_URL: z.string().url()
    .describe("PostgreSQL database connection URL"),
  PORT: z.string().transform(val => parseInt(val, 10)).default("5000")
    .describe("Port on which the server will run"),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development')
    .describe("Node environment mode"),
  UPLOAD_DIR: z.string().default("uploads")
    .describe("Directory for local file uploads"),
  HOST: z.string().default("0.0.0.0")
    .describe("Host address to bind the server to"),
});

// Combine all schemas
const envSchema = appSchema
  .merge(awsSchema)
  .merge(authSchema)
  .merge(redisSchema);

// Parse environment variables with detailed error handling
function parseEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
        .map(err => err.path.join('.'));
      
      const invalidVars = error.errors
        .filter(err => err.code !== 'invalid_type' || err.received !== 'undefined')
        .map(err => `${err.path.join('.')}: ${err.message}`);
      
      console.error('❌ Environment validation failed:');
      
      if (missingVars.length > 0) {
        console.error('Missing required variables:');
        missingVars.forEach(variable => console.error(`  - ${variable}`));
      }
      
      if (invalidVars.length > 0) {
        console.error('Invalid variables:');
        invalidVars.forEach(message => console.error(`  - ${message}`));
      }
      
      console.error('\nPlease check your .env file or environment variables.');
      process.exit(1);
    }
    
    console.error('❌ Unknown error validating environment variables:', error);
    process.exit(1);
  }
}

// Export the validated environment variables with defaults for session secret in development
const envWithDefaults = parseEnv();

if (process.env.NODE_ENV !== 'production' && !process.env.SESSION_SECRET) {
  console.warn('⚠️ Using default SESSION_SECRET in development. Do not use in production!');
  // @ts-ignore - We know we're adding a field that might be missing
  envWithDefaults.SESSION_SECRET = 'dev_session_secret_at_least_32_chars_long';
  // @ts-ignore - We're adding COOKIE_MAX_AGE if missing
  envWithDefaults.COOKIE_MAX_AGE = 86400000; // 24 hours
}

export const env = envWithDefaults;