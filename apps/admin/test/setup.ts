import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

// Cleanup React testing library after each test
afterEach(() => {
  cleanup();
});

// Mock matchMedia for viewport tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock IntersectionObserver
global.IntersectionObserver = class {
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
} as any;

// Mock ResizeObserver
global.ResizeObserver = class {
  observe = () => {};
  unobserve = () => {};
  disconnect = () => {};
} as any;

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeEach(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('React does not recognize'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalError;
});
