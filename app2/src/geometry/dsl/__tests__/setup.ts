// Test setup for DSL framework tests
// This file is automatically picked up by Vitest

import { afterEach, vi } from "vitest";

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
