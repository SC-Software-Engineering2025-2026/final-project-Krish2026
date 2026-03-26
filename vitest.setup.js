import "@testing-library/jest-dom";
import { expect, afterEach, vi, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";

// Set up environment variables for Firebase
beforeAll(() => {
  if (!process.env.VITE_FIREBASE_API_KEY) {
    process.env.VITE_FIREBASE_API_KEY = "test-api-key";
    process.env.VITE_FIREBASE_AUTH_DOMAIN = "test.firebaseapp.com";
    process.env.VITE_FIREBASE_PROJECT_ID = "test-project";
    process.env.VITE_FIREBASE_STORAGE_BUCKET = "test.appspot.com";
    process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = "123456789";
    process.env.VITE_FIREBASE_APP_ID = "1:123456789:web:abcdefg";
  }
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Suppress console errors and warnings in tests unless explicitly needed
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = vi.fn((...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Missing Firestore rules") ||
        args[0].includes("Cannot read properties"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  });

  console.warn = vi.fn((...args) => {
    if (typeof args[0] === "string" && args[0].includes("esbuild")) {
      return;
    }
    originalWarn.call(console, ...args);
  });
});
