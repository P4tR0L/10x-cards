/**
 * Vitest test setup file
 *
 * This file runs before all tests to configure the test environment.
 */

import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Extend Vitest matchers with jest-dom matchers
import "@testing-library/jest-dom/vitest";

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
