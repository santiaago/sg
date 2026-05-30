// Tests for coordinate system transformation utilities
import { describe, it, expect } from "vitest";
import { transformPointToLocalSpace, transformToLocalCoords, selectByDirectionInLocalSpace } from "@/geometry/dsl/transformations";
import type { Point, CoordinateSystem } from "@/types/geometry";

function makePoint(x: number, y: number): Point {
  return { type: "point", x, y };
}

function makeCs(x: number, y: number, rotation: number = 0, flipX: boolean = false, flipY: boolean = false): CoordinateSystem {
  return { type: "coordinate_system", x, y, arrowLength: 10, rotation, flipX, flipY };
}

describe("transformPointToLocalSpace", () => {
  it("should transform point at origin with no rotation or flip", () => {
    const cs = makeCs(0, 0);
    const point = makePoint(5, 10);
    const result = transformPointToLocalSpace(point, cs);
    expect(result.x).toBeCloseTo(5);
    expect(result.y).toBeCloseTo(10);
  });

  it("should translate point relative to CS origin", () => {
    const cs = makeCs(100, 200);
    const point = makePoint(105, 210);
    const result = transformPointToLocalSpace(point, cs);
    expect(result.x).toBeCloseTo(5);
    expect(result.y).toBeCloseTo(10);
  });

  it("should apply inverse rotation", () => {
    const cs = makeCs(0, 0, Math.PI / 2); // 90 degrees
    const point = makePoint(0, 5); // Point on positive y-axis
    const result = transformPointToLocalSpace(point, cs);
    // After inverse rotation of 90 degrees, (0, 5) -> (-5, 0)
    expect(result.x).toBeCloseTo(-5);
    expect(result.y).toBeCloseTo(0);
  });

  it("should apply flipX transformation", () => {
    const cs = makeCs(0, 0, 0, true, false);
    const point = makePoint(5, 10);
    const result = transformPointToLocalSpace(point, cs);
    // flipX inverts the x coordinate
    expect(result.x).toBeCloseTo(-5);
    expect(result.y).toBeCloseTo(10);
  });

  it("should apply flipY transformation", () => {
    const cs = makeCs(0, 0, 0, false, true);
    const point = makePoint(5, 10);
    const result = transformPointToLocalSpace(point, cs);
    // flipY inverts the y coordinate
    expect(result.x).toBeCloseTo(5);
    expect(result.y).toBeCloseTo(-10);
  });

  it("should apply both flipX and flipY", () => {
    const cs = makeCs(0, 0, 0, true, true);
    const point = makePoint(5, 10);
    const result = transformPointToLocalSpace(point, cs);
    expect(result.x).toBeCloseTo(-5);
    expect(result.y).toBeCloseTo(-10);
  });

  it("should combine translation, rotation, and flipX", () => {
    const cs = makeCs(100, 200, Math.PI / 2, true, false);
    const point = makePoint(100, 205); // 5 units below origin in global space
    const result = transformPointToLocalSpace(point, cs);
    // Translate: (100, 205) - (100, 200) = (0, 5)
    // Inverse rotate 90 deg: (0, 5) -> (-5, 0)
    // Apply flipX: (-5, 0) -> (5, 0)
    expect(result.x).toBeCloseTo(5);
    expect(result.y).toBeCloseTo(0);
  });
});

describe("transformToLocalCoords", () => {
  it("should return x and y coordinates without type", () => {
    const cs = makeCs(100, 200);
    const point = makePoint(105, 210);
    const result = transformToLocalCoords(point, cs);
    expect(result.x).toBeCloseTo(5);
    expect(result.y).toBeCloseTo(10);
    expect(result).not.toHaveProperty("type");
  });
});

describe("selectByDirectionInLocalSpace", () => {
  it("should return null for empty points array", () => {
    const cs = makeCs(0, 0);
    const result = selectByDirectionInLocalSpace([], cs, "north");
    expect(result).toBeNull();
  });

  it("should return the only point for single point array", () => {
    const cs = makeCs(0, 0);
    const point = makePoint(5, 10);
    const result = selectByDirectionInLocalSpace([point], cs, "north");
    expect(result).toBe(point);
  });

  it("should select left point (smallest x) in local space", () => {
    const cs = makeCs(0, 0);
    const points = [makePoint(10, 0), makePoint(5, 0), makePoint(15, 0)];
    const result = selectByDirectionInLocalSpace(points, cs, "left");
    expect(result?.x).toBe(5);
  });

  it("should select right point (largest x) in local space", () => {
    const cs = makeCs(0, 0);
    const points = [makePoint(10, 0), makePoint(5, 0), makePoint(15, 0)];
    const result = selectByDirectionInLocalSpace(points, cs, "right");
    expect(result?.x).toBe(15);
  });

  it("should select north point (smallest y) in local space", () => {
    const cs = makeCs(0, 0);
    const points = [makePoint(0, 10), makePoint(0, 5), makePoint(0, 15)];
    const result = selectByDirectionInLocalSpace(points, cs, "north");
    expect(result?.y).toBe(5);
  });

  it("should select south point (largest y) in local space", () => {
    const cs = makeCs(0, 0);
    const points = [makePoint(0, 10), makePoint(0, 5), makePoint(0, 15)];
    const result = selectByDirectionInLocalSpace(points, cs, "south");
    expect(result?.y).toBe(15);
  });

  it("should select west point (smallest x) in local space", () => {
    const cs = makeCs(0, 0);
    const points = [makePoint(10, 0), makePoint(5, 0), makePoint(15, 0)];
    const result = selectByDirectionInLocalSpace(points, cs, "west");
    expect(result?.x).toBe(5);
  });

  it("should select east point (largest x) in local space", () => {
    const cs = makeCs(0, 0);
    const points = [makePoint(10, 0), makePoint(5, 0), makePoint(15, 0)];
    const result = selectByDirectionInLocalSpace(points, cs, "east");
    expect(result?.x).toBe(15);
  });

  it("should select correctly in flipped coordinate system", () => {
    // In a flipped X system, left becomes right and vice versa
    const cs = makeCs(0, 0, 0, true, false);
    const points = [makePoint(10, 0), makePoint(5, 0)];
    
    // In global space: (5, 0) is left of (10, 0)
    // In local space with flipX: (5, 0) becomes (-5, 0) and (10, 0) becomes (-10, 0)
    // So (-10, 0) is "left" in local space, which corresponds to (10, 0) in global
    const result = selectByDirectionInLocalSpace(points, cs, "left");
    expect(result?.x).toBe(10);
  });

  it("should select north correctly in flipped Y coordinate system", () => {
    const cs = makeCs(0, 0, 0, false, true);
    const points = [makePoint(0, 10), makePoint(0, 5)];
    
    // In global space: (0, 5) is north of (0, 10)
    // In local space with flipY: (0, 5) becomes (0, -5) and (0, 10) becomes (0, -10)
    // So (0, -10) is "north" (smallest y) in local space, which corresponds to (0, 10) in global
    const result = selectByDirectionInLocalSpace(points, cs, "north");
    expect(result?.y).toBe(10);
  });
});
