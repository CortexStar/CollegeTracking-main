# Linear Algebra Learning Platform

An advanced interactive learning platform for academic grade tracking and performance analysis, offering comprehensive tools for students to manage, visualize, and forecast their academic progress.

## Repository Structure

This project uses a monorepo structure with pnpm workspaces and Turborepo:

- `client`: React frontend application
- `server`: Express.js backend API
- `db`: Database schema and utilities
- `shared`: Shared types and utilities
- `packages/*`: Reusable packages
  - `packages/queues`: Queue processing for background jobs
- `tests`: Integration and unit tests

## Technologies

- React.js frontend with TypeScript
- Express.js backend
- Drizzle ORM with PostgreSQL
- Tailwind CSS for styling
- pnpm for package management
- Turborepo for monorepo management

## Development

### Prerequisites

- Node.js v20+
- pnpm (install with `npm install -g pnpm`)
- PostgreSQL database
### THE WORLD IS CRASHING
### Setup

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=postgresql://username:password@localhost:5432/database
```

3. Start the development server:

```bash
pnpm dev
```

This will start both the frontend and backend in development mode.

### Common Commands

- `pnpm dev`: Start all services in development mode
- `pnpm build`: Build all packages and applications
- `pnpm db:push`: Update database schema
- `pnpm db:seed`: Seed the database with test data
- `pnpm lint`: Run ESLint on all packages
- `pnpm format`: Format code with Prettier
- `pnpm check`: Type-check all TypeScript code
- `pnpm test`: Run tests

## Project Structure

The project is organized as follows:

- `/client/src`: Frontend React application
  - `/components`: Reusable UI components
  - `/hooks`: Custom React hooks
  - `/pages`: Page components
  - `/lib`: Utility functions

- `/server`: Backend Express application
  - `/middlewares`: Express middleware
  - `/routes`: API routes
  - `/storage`: File storage implementations

- `/db`: Database models and migrations
  - `index.ts`: Database connection
  - `seed.ts`: Seeding script

- `/shared`: Shared code
  - `schema.ts`: Drizzle schema definitions
  - `env.ts`: Environment variable validation

## Code Quality

This project uses:

- ESLint for code linting
- Prettier for code formatting
- TypeScript with strict mode
- Husky for pre-commit hooks
- lint-staged for running linters on staged files

## Contributing

1. Create a new branch for your feature
2. Make changes and ensure all tests pass
3. Submit a pull request

## License

MIT