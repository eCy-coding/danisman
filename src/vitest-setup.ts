// vitest-setup.ts
// This file provides environment mocks for Vitest tests.
// It deliberately does NOT import '@testing-library/jest-dom' to avoid conflicts with Vitest's expect.

import { vi } from 'vitest';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

// React 19: configure act() support for the jsdom environment
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// S14 R21 — React 19.2.6 production bundle ships without `React.act`; falls back
// to the deprecated `react-dom/test-utils` shim that re-throws
// "React.act is not a function". @testing-library/react@16.3.2 expects
// `React.act` to be a function; result was 747/1118 vitest cases failing on the
// very first `render()` call.
//
// Minimal sync+async-aware polyfill: matches the React 18 act() contract
// (returns a thenable) so testing-library's `withGlobalActEnvironment` wrapper
// is satisfied without needing a real React commit-scheduler tick.
function actPolyfill(callback: () => unknown): unknown {
  const result = callback();
  if (result !== null && typeof result === 'object' && 'then' in result) {
    return Promise.resolve(result);
  }
  return {
    then(resolve: () => void) {
      resolve();
    },
  };
}
// CJS require — ESM React module exports are frozen; @testing-library uses
// `require('react')` internally which returns the mutable CJS interop object,
// so attaching `act` there gets picked up by act-compat.js. Top-level await
// avoids the read-only ESM namespace error from `import * as React`.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ReactCJS = require('react') as Record<string, unknown>;
if (typeof ReactCJS.act !== 'function') {
  ReactCJS.act = actPolyfill;
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// P26 — jsdom doesn't ship IntersectionObserver, but framer-motion's
// `useInView` (used inside LegalLayout / FadeIn / many marketing sections)
// touches it during the first commit and throws ReferenceError. A no-op
// stub keeps the render path quiet without changing observed behavior.
class IntersectionObserverStub {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverStub,
});
Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverStub,
});

// ResizeObserver also missing in jsdom and used by recharts / radix.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

// cmdk uses scrollIntoView internally — jsdom doesn't implement it.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverStub,
});
Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverStub,
});

// Mock LocalStorage (if not provided by environment)
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
