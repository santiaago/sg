// Vitest tests for Line class and functions
import { describe, it, expect, beforeEach } from 'vitest';
import { resetHashCounter } from './mock-hash.ts';
import { Line, intersect, intersectLines } from '../src/lines';
import { Point } from '../src/points';

describe('Line class', () => {
  beforeEach(() => {
    resetHashCounter();
  });

  it('should create Line with explicit name', () => {
    const p1 = new Point(0, 0, 'p1');
    const p2 = new Point(1, 1, 'p2');
    const line = new Line(p1, p2, 'test-line');
    
    expect(line.p1).toBe(p1);
    expect(line.p2).toBe(p2);
    expect(line.name).toBe('test-line');
    expect(line.type).toBe('line');
  });

  it('should auto-generate name when not provided', () => {
    const p1 = new Point(0, 0);
    const p2 = new Point(1, 1);
    const line = new Line(p1, p2);
    expect(line.name).toBeDefined();
    expect(typeof line.name).toBe('string');
  });

  it('should have null context by default', () => {
    const p1 = new Point(0, 0);
    const p2 = new Point(1, 1);
    const line = new Line(p1, p2);
    expect(line.context).toBeNull();
  });
});

describe('intersect() function', () => {
  it('should find intersection at (1,1)', () => {
    // Line 1: (0,0) to (2,2)
    // Line 2: (0,2) to (2,0)
    // Should intersect at (1,1)
    const result = intersect(0, 0, 2, 2, 0, 2, 2, 0);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toBeCloseTo(1, 4);
    expect(result[1]).toBeCloseTo(1, 4);
  });

  it('should return empty array for parallel lines', () => {
    // Two horizontal lines
    const result = intersect(0, 0, 2, 0, 0, 1, 2, 1);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('should return empty array for coincident lines', () => {
    // Same line
    const result = intersect(0, 0, 2, 2, 0, 0, 2, 2);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

describe('intersectLines() function', () => {
  it('should find intersection of Line objects', () => {
    const p1 = new Point(0, 0);
    const p2 = new Point(2, 2);
    const p3 = new Point(0, 2);
    const p4 = new Point(2, 0);
    
    const line1 = new Line(p1, p2);
    const line2 = new Line(p3, p4);
    
    const intersection = intersectLines(line1, line2);
    expect(intersection).toBeInstanceOf(Point);
    expect(intersection.x).toBeCloseTo(1, 4);
    expect(intersection.y).toBeCloseTo(1, 4);
  });

  it('should return null for parallel Line objects', () => {
    const p1 = new Point(0, 0);
    const p2 = new Point(2, 0);
    const p3 = new Point(0, 1);
    const p4 = new Point(2, 1);
    
    const line1 = new Line(p1, p2);
    const line2 = new Line(p3, p4);
    
    const intersection = intersectLines(line1, line2);
    expect(intersection).toBeNull();
  });
});