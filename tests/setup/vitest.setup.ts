import { vi, beforeEach } from 'vitest';

/**
 * Test setup: mock the WebExtension `browser` global and `window.postMessage`,
 * while keeping jsdom's real `window`/`document` so DOM-based tests work.
 */

const createBrowserMock = () => ({
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    id: 'test-extension-id',
    getURL: vi.fn((path: string) => `extension://test-extension-id/${path}`),
    openOptionsPage: vi.fn(),
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
  },
  scripting: {
    executeScript: vi.fn(),
  },
});

// Expose the mock as a global (the source references `browser` as a free global).
(globalThis as unknown as { browser: ReturnType<typeof createBrowserMock> }).browser =
  createBrowserMock();

// Mock postMessage so messaging tests can assert on it.
window.postMessage = vi.fn() as unknown as typeof window.postMessage;

// Reduce console noise from intentional error/warn paths.
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(() => {
  // Fresh browser mock per test to avoid cross-test leakage.
  (globalThis as unknown as { browser: ReturnType<typeof createBrowserMock> }).browser =
    createBrowserMock();
  window.postMessage = vi.fn() as unknown as typeof window.postMessage;
});
