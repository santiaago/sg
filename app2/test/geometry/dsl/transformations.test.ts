// Tests for coordinate system transformation helpers
import { describe, it, expect } from "vitest";
import {
  transformPointToLocalSpace,
  transformToLocalCoords,
  selectByDirectionInLocalSpace,
} from "@/geometry/dsl/transformations";
import type { CoordinateSystem } from "@/types/geometry";

// Helper to create a coordinate system
function createCs(
  x: number,
  y: number,
  arrowLength: number,
  angle: number,
  flipX: boolean = false,
  flipY: boolean = false,
): CoordinateSystem {
  return { x, y, arrowLength, angle, flipX, flipY };
}

describe("transformPointToLocalSpace", () => {
  it("transforms point to local space without flip", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const point = { x: 150, y: 100 }; // 50 units to the right of cs origin

    const result = transformPointToLocalSpace(point, cs);

    expect(result.x).toBeCloseTo(50, 5);
    expect(result.y).toBeCloseTo(0, 5);
  });

  it("transforms point to local space with flipX", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0, true);
    const point = { x: 150, y: 100 }; // 50 units to the right of cs origin

    const result = transformPointToLocalSpace(point, cs);

    // With flipX, x should be negated in local space
    expect(result.x).toBeCloseTo(-50, 5);
    expect(result.y).toBeCloseTo(0, 5);
  });

  it("transforms point to local space with flipY", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0, false, true);
    const point = { x: 100, y: 150 }; // 50 units above cs origin

    const result = transformPointToLocalSpace(point, cs);

    expect(result.x).toBeCloseTo(0, 5);
    // With flipY, y should be negated in local space
    expect(result.y).toBeCloseTo(-50, 5);
  });

  it("transforms point to local space with rotation", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, Math.PI / 2); // 90 degrees
    const point = { x: 100, y: 150 }; // 50 units above cs origin

    const result = transformPointToLocalSpace(point, cs);

    // With 90 degree rotation, x and y should be swapped and x negated
    expect(result.x).toBeCloseTo(-50, 5);
    expect(result.y).toBeCloseTo(0, 5);
  });
});

describe("transformToLocalCoords", () => {
  it("transforms global point to local coordinates", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const globalPoint = { x: 150, y: 150 };

    const result = transformToLocalCoords(globalPoint, cs);

    expect(result.x).toBeCloseTo(50, 5);
    expect(result.y).toBeCloseTo(50, 5);
  });

  it("handles flipX transformation", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0, true);
    const globalPoint = { x: 150, y: 150 };

    const result = transformToLocalCoords(globalPoint, cs);

    expect(result.x).toBeCloseTo(-50, 5);
    expect(result.y).toBeCloseTo(50, 5);
  });
});

describe("selectByDirectionInLocalSpace", () => {
  it("selects left direction correctly", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const points = [
      { x: 50, y: 0 }, // right
      { x: -50, y: 0 }, // left
      { x: 0, y: 50 }, // up
      { x: 0, y: -50 }, // down
    ];

    const result = selectByDirectionInLocalSpace(points, cs, "left");
    expect(result).toEqual({ x: -50, y: 0 });
  });

  it("selects right direction correctly", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const points = [
      { x: 50, y: 0 }, // right
      { x: -50, y: 0 }, // left
    ];

    const result = selectByDirectionInLocalSpace(points, cs, "right");
    expect(result).toEqual({ x: 50, y: 0 });
  });

  it("selects north direction correctly", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const points = [
      { x: 0, y: 50 }, // north
      { x: 0, y: -50 }, // south
    ];

    const result = selectByDirectionInLocalSpace(points, cs, "north");
    expect(result).toEqual({ x: 0, y: 50 });
  });

  it("selects south direction correctly", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const points = [
      { x: 0, y: 50 }, // north
      { x: 0, y: -50 }, // south
    ];

    const result = selectByDirectionInLocalSpace(points, cs, "south");
    expect(result).toEqual({ x: 0, y: -50 });
  });

  it("selects east direction correctly", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const points = [
      { x: 50, y: 0 }, // east
      { x: -50, y: 0 }, // west
    ];

    const result = selectByDirectionInLocalSpace(points, cs, "east");
    expect(result).toEqual({ x: 50, y: 0 });
  });

  it("selects west direction correctly", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const points = [
      { x: 50, y: 0 }, // east
      { x: -50, y: 0 }, // west
    ];

    const result = selectByDirectionInLocalSpace(points, cs, "west");
    expect(result).toEqual({ x: -50, y: 0 });
  });

  it("returns undefined for empty points array", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const points: Array<{ x: number; y: number }> = [];

    const result = selectByDirectionInLocalSpace(points, cs, "north");
    expect(result).toBeUndefined();
  });

  it("handles flipX for direction selection", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0, true);
    const points = [
      { x: 50, y: 0 }, // right in global = left in local (due to flipX)
      { x: -50, y: 0 }, // left in global = right in local (due to flipX)
    ];

    // With flipX, "right" in local space should select the point with negative x
    const result = selectByDirectionInLocalSpace(points, cs, "right");
    expect(result).toEqual({ x: -50, y: 0 });
  });
});
