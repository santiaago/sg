// Basic tests for Line class and functions
import { resetHashCounter } from "./mock-hash.js";
import { Line, intersect, intersectLines } from "./test-lines.js";
import { Point } from "./test-points.js";
import assert from "assert";

// Setup mock hash before tests
resetHashCounter();

// Test Line class
console.log("Testing Line class...");
{
  const p1 = new Point(0, 0, "p1");
  const p2 = new Point(1, 1, "p2");
  const line = new Line(p1, p2, "test-line");

  assert.strictEqual(line.p1, p1);
  assert.strictEqual(line.p2, p2);
  assert.strictEqual(line.name, "test-line");
  assert.strictEqual(line.type, "line");
  console.log("✓ Line creation with explicit name works");
}

{
  const p1 = new Point(0, 0);
  const p2 = new Point(1, 1);
  const line = new Line(p1, p2);
  assert.ok(line.name);
  assert.ok(typeof line.name === "string");
  console.log("✓ Auto-generated name works");
}

{
  const p1 = new Point(0, 0);
  const p2 = new Point(1, 1);
  const line = new Line(p1, p2);
  assert.strictEqual(line.context, null);
  console.log("✓ Context property exists");
}

// Test intersect() function
console.log("\nTesting intersect() function...");
{
  // Line 1: (0,0) to (2,2)
  // Line 2: (0,2) to (2,0)
  // Should intersect at (1,1)
  const result = intersect(0, 0, 2, 2, 0, 2, 2, 0);
  assert.ok(Array.isArray(result));
  assert.strictEqual(result.length, 2);
  assert.ok(Math.abs(result[0] - 1) < 0.0001);
  assert.ok(Math.abs(result[1] - 1) < 0.0001);
  console.log("✓ Line intersection at (1,1) works");
}

{
  // Two horizontal lines
  const result = intersect(0, 0, 2, 0, 0, 1, 2, 1);
  assert.ok(Array.isArray(result));
  assert.strictEqual(result.length, 0);
  console.log("✓ Parallel lines return empty array");
}

{
  // Same line
  const result = intersect(0, 0, 2, 2, 0, 0, 2, 2);
  assert.ok(Array.isArray(result));
  assert.strictEqual(result.length, 0);
  console.log("✓ Coincident lines return empty array");
}

// Test intersectLines() function
console.log("\nTesting intersectLines() function...");
{
  const p1 = new Point(0, 0);
  const p2 = new Point(2, 2);
  const p3 = new Point(0, 2);
  const p4 = new Point(2, 0);

  const line1 = new Line(p1, p2);
  const line2 = new Line(p3, p4);

  const intersection = intersectLines(line1, line2);
  assert.ok(intersection instanceof Point);
  assert.ok(Math.abs(intersection.x - 1) < 0.0001);
  assert.ok(Math.abs(intersection.y - 1) < 0.0001);
  console.log("✓ Line objects intersection works");
}

{
  const p1 = new Point(0, 0);
  const p2 = new Point(2, 0);
  const p3 = new Point(0, 1);
  const p4 = new Point(2, 1);

  const line1 = new Line(p1, p2);
  const line2 = new Line(p3, p4);

  const intersection = intersectLines(line1, line2);
  assert.strictEqual(intersection, null);
  console.log("✓ Parallel Line objects return null");
}

console.log("\n🎉 All Line tests passed!");
