import React from 'react';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Automatically cleanup after each test
afterEach(() => {
  cleanup();
});

// Create a wrapper component for testing with providers
export function TestProviders({ children }: { children: React.ReactNode }) {
  return (
    <>{children}</>
  );
}

// Custom render function that includes global providers
export function renderWithProviders(ui: React.ReactElement) {
  return render(ui, { wrapper: TestProviders });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';