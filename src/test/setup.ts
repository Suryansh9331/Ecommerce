// Global Vitest setup — adds jest-dom matchers and stubs a handful of
// browser APIs that jsdom doesn't ship but our components call during
// render.
import '@testing-library/jest-dom/vitest';

// Default to a sentinel API base so components that read it don't crash
// in tests. This file is test-only and is NOT bundled into the production
// build — the sentinel URL will never leak to users.
if (!import.meta.env.VITE_API_BASE_URL) {
  (import.meta.env as Record<string, string>).VITE_API_BASE_URL =
    'http://test.invalid';
}

// jsdom doesn't implement matchMedia, which the i18n language detector
// and a couple of shop components rely on.
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

// jsdom doesn't implement scrollTo
window.scrollTo = () => {};

// Silence noisy console errors in tests unless we explicitly check them.
// react-beautiful-dnd prints a one-time warning when used in jsdom that is
// safe to ignore in a test environment.
const origError = console.error;
console.error = (...args: unknown[]) => {
  const first = args[0];
  if (typeof first === 'string' && first.includes('react-beautiful-dnd')) return;
  origError(...args);
};
