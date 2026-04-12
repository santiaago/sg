#!/usr/bin/env node

// Simple test runner for math package
import { createRequire } from "module";
const require = createRequire(import.meta.url);

async function runTests() {
  console.log("🧪 Running math package tests...\n");

  try {
    // Import and run points tests
    console.log("📍 Testing Points...");
    await import("./src/math/__tests__/points.test.js");

    // Import and run lines tests
    console.log("\n📐 Testing Lines...");
    await import("./src/math/__tests__/lines.test.js");

    console.log("\n✅ All tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
