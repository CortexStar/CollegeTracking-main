# Shared

Shared code and types used across client and server packages.

## Overview

This package provides:
- Common TypeScript types and interfaces
- Database schema definitions
- Environment variable validation
- Shared utilities like logging

## Directory Structure

- `/env.ts` - Environment variable validation and defaults
- `/logger.ts` - Logging utility for consistent logging
- `/schema.ts` - Database schema using Drizzle ORM

## Usage

### Environment Variables

The `env.ts` module provides type-safe access to environment variables:

```ts
import { env } from '@shared/env';

// Access validated environment variables
const port = env.PORT; // Typed as number with default value
const isProd = env.NODE_ENV === 'production'; // Typed as string
```

### Database Schema

The `schema.ts` module defines the database schema using Drizzle ORM:

```ts
import { users, books, type User, type Book } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '@db';

// Use schema in queries
const user = await db.query.users.findFirst({
  where: eq(users.id, userId)
});

// Use types
function processUser(user: User) {
  // ...
}
```

### Logging

The `logger.ts` module provides a consistent logging interface:

```ts
import { logger } from '@shared/logger';

// Create a category-specific logger
const apiLogger = logger.createLogger({ category: 'api' });

// Log at different levels
apiLogger.debug('Debug information');
apiLogger.info('Information message');
apiLogger.warn('Warning message');
apiLogger.error('Error message', error);
```

## Environment Variables

This package doesn't require its own environment variables, but validates and provides defaults for variables used throughout the application.