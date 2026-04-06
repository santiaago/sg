// Vitest tests for Point class and functions
import { describe, it, expect, beforeEach } from 'vitest';
import { resetHashCounter } from './mock-hash.ts';
import { Point, distance, distanceBetweenPoints } from '../src/points';

describe('Point class', () => {
  beforeEach(() => {
    resetHashCounter();
  });

  it('should create Point with explicit name', () => {
    const p = new Point(1, 2, 'test');
    expect(p.x).toBe(1);
    expect(p.y).toBe(2);
    expect(p.name).toBe('test');
    expect(p.type).toBe('point');
  });

  it('should auto-generate name when not provided', () => {
    const p = new Point(5, 10);
    expect(p.name).toBeDefined();
    expect(typeof p.name).toBe('string');
  });

  it('should have null context by default', () => {
    const p = new Point(0, 0);
    expect(p.context).toBeNull();
  });
});

describe('distance() function', () => {
  it('should calculate distance between (0,0) and (3,4)', () => {
    const dist = distance(0, 0, 3, 4);
    expect(dist).toBe(5);
  });

  it('should handle negative coordinates', () => {
    const dist = distance(-1, -1, 2, 2);
    expect(dist).toBeCloseTo(Math.sqrt(18), 4);
  });
});

describe('distanceBetweenPoints() function', () => {
  it('should calculate distance between Point objects', () => {
    const p1 = new Point(0, 0);
    const p2 = new Point(6, 8);
    const dist = distanceBetweenPoints(p1, p2);
    expect(dist).toBe(10);
  });
});

describe('Point.distanceToPoint() method', () => {
  it('should calculate distance from point to another point', () => {
    const p1 = new Point(0, 0);
    const p2 = new Point(3, 4);
    const dist = p1.distanceToPoint(p2);
    expect(dist).toBe(5);
  });
});