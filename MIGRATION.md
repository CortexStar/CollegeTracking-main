# Migration to Monorepo Structure

This document outlines the changes made to convert the project to a pnpm workspace monorepo structure and the steps to follow when working with the new structure.

## Changes Made

1. **Monorepo Structure**:
   - Implemented pnpm workspaces with `pnpm-workspace.yaml`
   - Set up Turborepo for build orchestration with `turbo.json`
   - Created package.json files for each workspace

2. **TypeScript Configuration**:
   - Added a base `tsconfig.base.json` with stricter type checking
   - Created workspace-specific `tsconfig.json` files
   - Enabled `noImplicitAny` and `strictNullChecks`

3. **Code Quality Tools**:
   - Added ESLint configuration
   - Added Prettier for code formatting
   - Set up Husky for pre-commit hooks
   - Added lint-staged to run linters on staged files

4. **Documentation**:
   - Updated README.md with monorepo usage instructions
   - Added this MIGRATION.md guide

## Working with the Monorepo

### Installation

Instead of `npm install`, use:

```bash
pnpm install
```

### Running Commands

Run commands across all workspaces:

```bash
pnpm dev          # Start all services in development mode
pnpm build        # Build all packages and applications
pnpm check        # Type-check all TypeScript code
pnpm lint         # Run ESLint on all packages
```

Run commands for specific workspaces:

```bash
pnpm --filter client dev        # Start only the client development server
pnpm --filter server dev        # Start only the server
pnpm --filter db db:push        # Update the database schema
```

### Adding Dependencies

Add a dependency to a specific workspace:

```bash
pnpm --filter client add react-router-dom    # Add react-router-dom to client
pnpm --filter server add express-rate-limit   # Add express-rate-limit to server
```

Add a dependency to all workspaces:

```bash
pnpm add -w typescript   # Add to the root package.json (devDependencies)
```

Add a workspace as a dependency to another workspace:

```bash
pnpm --filter server add shared@workspace:*  # Add shared package to server
```

### Importing from Other Workspaces

Use the path aliases defined in the tsconfig files:

```typescript
// In server code
import { Something } from '@shared/schema';

// In client code
import { Something } from '@/components/ui/button';
```

## Common Development Workflows

### Making Changes to Shared Code

When you make changes to the `shared` package:

1. Make your changes in the shared package
2. Run `pnpm check` to ensure type safety
3. The changes will be immediately available to other packages that depend on it

### Running Tests

```bash
pnpm --filter tests test       # Run all tests
pnpm --filter tests test:watch # Run tests in watch mode
```

## Troubleshooting

### TypeScript Path Aliases

If you're seeing errors about imports not being found:

1. Make sure you're using the correct path alias
2. Check that the target package has the shared package as a dependency
3. Verify that the tsconfig.json in the package has the correct paths configuration

### Slow Builds

If builds are slow:

1. Use the Turborepo cache: `pnpm turbo run build` instead of `pnpm build`
2. Consider adding more specific tasks in `turbo.json` to avoid rebuilding everything

## Continuous Integration

The CI pipeline has been updated to:

1. Install dependencies with `pnpm install`
2. Run type checking with `pnpm check`
3. Run tests with `pnpm test`
4. Build all packages with `pnpm build`
