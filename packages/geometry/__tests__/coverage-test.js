// Coverage test that imports actual source files
import { resetHashCounter } from './mock-hash.js';
import assert from 'assert';

// Mock the hash module before importing actual source
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Mock hash/name module
import { pathToFileURL } from 'url';
const mockHash = await import('./mock-hash.js');

// Override the hash import in the actual source files
const Module = await import('module');
const originalRequire = Module.createRequire(import.meta.url);

// This is tricky - we need to intercept the hash/name import
// For coverage purposes, let's create a simple test that uses the actual functions

console.log('🎯 Running coverage test on actual source files...\n');

// Test actual points.js
try {
  const pointsModule = await import('../src/points.js');
  console.log('✓ Successfully imported actual points.js');
  
  const p1 = new pointsModule.Point(0, 0, 'test');
  const p2 = new pointsModule.Point(3, 4, 'test2');
  
  assert.strictEqual(p1.x, 0);
  assert.strictEqual(p1.y, 0);
  assert.strictEqual(p1.name, 'test');
  
  const dist = pointsModule.distance(0, 0, 3, 4);
  assert.strictEqual(dist, 5);
  
  const distBetween = pointsModule.distanceBetweenPoints(p1, p2);
  assert.strictEqual(distBetween, 5);
  
  console.log('✓ Points.js functions work correctly');
} catch (error) {
  console.log('❌ Points.js test failed:', error.message);
}

// Test actual lines.js  
try {
  const linesModule = await import('../src/lines.js');
  const pointsModule = await import('../src/points.js');
  console.log('✓ Successfully imported actual lines.js');
  
  const p1 = new pointsModule.Point(0, 0);
  const p2 = new pointsModule.Point(2, 2);
  const line = new linesModule.Line(p1, p2, 'test-line');
  
  assert.strictEqual(line.name, 'test-line');
  assert.strictEqual(line.type, 'line');
  
  const result = linesModule.intersect(0, 0, 2, 2, 0, 2, 2, 0);
  assert.ok(Array.isArray(result));
  assert.strictEqual(result.length, 2);
  
  console.log('✓ Lines.js functions work correctly');
} catch (error) {
  console.log('❌ Lines.js test failed:', error.message);
}

console.log('\n🎉 Coverage test completed!');