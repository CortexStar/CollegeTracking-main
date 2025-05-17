# Database

Database schema and utilities using Drizzle ORM.

## Overview

This package provides:
- Database schema definitions
- Drizzle ORM setup
- Database seeding scripts
- Migrations management

## Directory Structure

- `/index.ts` - Database client and connection
- `/schema.ts` - Database schema definitions (moved to shared package)
- `/seed.ts` - Database seeding logic
- `/migrations/` - SQL migrations for database schema changes

## Getting Started

The database module uses [Drizzle ORM](https://orm.drizzle.team/) with PostgreSQL.

### Schema Updates

When updating the database schema in `shared/schema.ts`, you need to run:

```bash
npm run db:generate
```

This generates SQL migration files in the `db/migrations` directory.

### Applying Migrations

To push schema changes to the database:

```bash
npm run db:push
```

### Database Seeding

To seed the database with initial data:

```bash
npm run db:seed
```

Our seed script is designed to be idempotent, using `onConflictDoNothing` to avoid duplicating data.

## Environment Variables

| Name | Description | Default |
|------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |

## Schema Design

The database schema includes tables for:

- `users` - User accounts and authentication
- `books` - Book metadata and storage references