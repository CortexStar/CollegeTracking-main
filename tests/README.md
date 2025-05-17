# Tests

Comprehensive test suite using Vitest, React Testing Library, and Supertest.

## Overview

This package provides:
- Unit tests for utilities and hooks
- Component tests for React components 
- API tests for backend endpoints
- Test utilities and setup

## Directory Structure

- `/api/` - API integration tests
- `/components/` - React component tests
- `/setup.ts` - Test setup for API tests
- `/setup-component.tsx` - Test setup for component tests
- `/mocks/` - Mock data and services

## Getting Started

### Running Tests

To run all tests:

```bash
npm test
```

To run tests in watch mode:

```bash
npm run test:watch
```

To run tests with coverage:

```bash
npm run test:coverage
```

### Writing Tests

#### Component Tests

```tsx
// Example component test
import { render, screen } from '../setup-component';
import Header from '@/components/header';

describe('Header', () => {
  it('renders the logo', () => {
    render(<Header />);
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
  });
});
```

#### API Tests

```ts
// Example API test
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { setupTestApp } from '../setup';
import { Express } from 'express';

describe('User API', () => {
  let app: Express;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  it('returns 401 when not authenticated', async () => {
    const response = await request(app).get('/api/user');
    expect(response.status).toBe(401);
  });
});
```

## Test Configuration

Tests are configured in `vitest.config.ts` with:
- Coverage reporting
- JSDOM for React component testing
- Path aliases matching the application