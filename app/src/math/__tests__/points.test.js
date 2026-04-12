// Basic tests for Point class and functions
import { resetHashCounter } from "./mock-hash.js";
import { Point, distance, distanceBetweenPoints } from "./test-points.js";
import assert from "assert";

// Setup mock hash before tests
resetHashCounter();

// Test Point class
console.log("Testing Point class...");
{
  const p = new Point(1, 2, "test");
  assert.strictEqual(p.x, 1);
  assert.strictEqual(p.y, 2);
  assert.strictEqual(p.name, "test");
  assert.strictEqual(p.type, "point");
  console.log("✓ Point creation with explicit name works");
}

{
  const p = new Point(5, 10);
  assert.ok(p.name);
  assert.ok(typeof p.name === "string");
  console.log("✓ Auto-generated name works");
}

{
  const p = new Point(0, 0);
  assert.strictEqual(p.context, null);
  console.log("✓ Context property exists");
}

// Test distance() function
console.log("\nTesting distance() function...");
{
  const dist = distance(0, 0, 3, 4);
  assert.strictEqual(dist, 5);
  console.log("✓ Distance calculation (0,0) to (3,4) = 5");
}

{
  const dist = distance(-1, -1, 2, 2);
  assert.ok(Math.abs(dist - Math.sqrt(18)) < 0.0001);
  console.log("✓ Distance with negative coordinates works");
}

// Test distanceBetweenPoints() function
console.log("\nTesting distanceBetweenPoints() function...");
{
  const p1 = new Point(0, 0);
  const p2 = new Point(6, 8);
  const dist = distanceBetweenPoints(p1, p2);
  assert.strictEqual(dist, 10);
  console.log("✓ Distance between Point objects = 10");
}

// Test Point.distanceToPoint() method
console.log("\nTesting Point.distanceToPoint() method...");
{
  const p1 = new Point(0, 0);
  const p2 = new Point(3, 4);
  const dist = p1.distanceToPoint(p2);
  assert.strictEqual(dist, 5);
  console.log("✓ Point.distanceToPoint() method works");
}

console.log("\n🎉 All Point tests passed!");
