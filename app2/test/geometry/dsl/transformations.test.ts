// Tests for coordinate system transformation helpers
import { describe, it, expect } from "vitest";
import {
  transformPointToLocalSpace,
  transformToLocalCoords,
  selectByDirectionInLocalSpace,
} from "@/geometry/dsl/transformations";
import { coordinateSystem, point } from "@/types/geometry";
import type { CoordinateSystem, Point } from "@/types/geometry";

// Helper to create a coordinate system
function createCs(
  x: number,
  y: number,
  arrowLength: number,
  rotation: number,
  flipX: boolean = false,
  flipY: boolean = false,
): CoordinateSystem {
  return coordinateSystem(x, y, arrowLength, rotation, flipX, flipY);
}

// Helper to create a point
function createPt(x: number, y: number): Point {
  return point(x, y);
}

describe("transformPointToLocalSpace", () => {
  it("transforms point to local space without flip", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const pt = createPt(150, 100); // 50 units to the right of cs origin

    const result = transformPointToLocalSpace(pt, cs);

    expect(result.x).toBeCloseTo(50, 5);
    expect(result.y).toBeCloseTo(0, 5);
  });

  it("transforms point to local space with flipX", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0, true);
    const pt = createPt(150, 100); // 50 units to the right of cs origin

    const result = transformPointToLocalSpace(pt, cs);

    // With flipX, x should be negated in local space
    expect(result.x).toBeCloseTo(-50, 5);
    expect(result.y).toBeCloseTo(0, 5);
  });

  it("transforms point to local space with flipY", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0, false, true);
    const pt = createPt(100, 150); // 50 units above cs origin

    const result = transformPointToLocalSpace(pt, cs);

    expect(result.x).toBeCloseTo(0, 5);
    // With flipY, y should be negated in local space
    expect(result.y).toBeCloseTo(-50, 5);
  });

  it("transforms point to local space with rotation", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, Math.PI / 2); // 90 degrees
    const pt = createPt(100, 150); // 50 units below cs origin in global space

    const result = transformPointToLocalSpace(pt, cs);

    // In local space: (0, 50)
    // Inverse rotation by 90 degrees: x' = x*cos + y*sin = 0*0 + 50*1 = 50
    //                               y' = -x*sin + y*cos = -0*1 + 50*0 = 0
    expect(result.x).toBeCloseTo(50, 5);
    expect(result.y).toBeCloseTo(0, 5);
  });
});

describe("transformToLocalCoords", () => {
  it("transforms global point to local coordinates", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const globalPoint = createPt(150, 150);

    const result = transformToLocalCoords(globalPoint, cs);

    expect(result.x).toBeCloseTo(50, 5);
    expect(result.y).toBeCloseTo(50, 5);
  });

  it("handles flipX transformation", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0, true);
    const globalPoint = createPt(150, 150);

    const result = transformToLocalCoords(globalPoint, cs);

    expect(result.x).toBeCloseTo(-50, 5);
    expect(result.y).toBeCloseTo(50, 5);
  });
});

describe("selectByDirectionInLocalSpace", () => {
  it("selects left direction correctly", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const points = [
      createPt(50, 0), // right
      createPt(-50, 0), // left
      createPt(0, 50), // up
      createPt(0, -50), // down
    ];

    const result = selectByDirectionInLocalSpace(points, cs, "left");
    expect(result).toEqual(createPt(-50, 0));
  });

  it("selects right direction correctly", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const points = [
      createPt(50, 0), // right
      createPt(-50, 0), // left
    ];

    const result = selectByDirectionInLocalSpace(points, cs, "right");
    expect(result).toEqual(createPt(50, 0));
  });

  it("selects north direction correctly", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const points = [
      createPt(0, 50), // larger y
      createPt(0, -50), // smaller y = north
    ];

    const result = selectByDirectionInLocalSpace(points, cs, "north");
    // North = smallest y in local space
    expect(result).toEqual(createPt(0, -50));
  });

  it("selects south direction correctly", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const points = [
      createPt(0, 50), // larger y = south
      createPt(0, -50), // smaller y
    ];

    const result = selectByDirectionInLocalSpace(points, cs, "south");
    // South = largest y in local space
    expect(result).toEqual(createPt(0, 50));
  });

  it("selects east direction correctly", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const points = [
      createPt(50, 0), // east
      createPt(-50, 0), // west
    ];

    const result = selectByDirectionInLocalSpace(points, cs, "east");
    expect(result).toEqual(createPt(50, 0));
  });

  it("selects west direction correctly", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const points = [
      createPt(50, 0), // east
      createPt(-50, 0), // west
    ];

    const result = selectByDirectionInLocalSpace(points, cs, "west");
    expect(result).toEqual(createPt(-50, 0));
  });

  it("returns null for empty points array", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0);
    const points: Point[] = [];

    const result = selectByDirectionInLocalSpace(points, cs, "north");
    expect(result).toBeNull();
  });

  it("handles flipX for direction selection", () => {
    const cs: CoordinateSystem = createCs(100, 100, 20, 0, true);
    const points = [
      createPt(50, 0), // right in global = left in local (due to flipX)
      createPt(-50, 0), // left in global = right in local (due to flipX)
    ];

    // With flipX, "right" in local space should select the point with negative x
    const result = selectByDirectionInLocalSpace(points, cs, "right");
    expect(result).toEqual(createPt(-50, 0));
  });
});
