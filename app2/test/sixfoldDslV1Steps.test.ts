/**
 * Tests for Sixfold DSL v1 with cs2 coordinate system
 * Verifies cs2 hierarchy and transformation propagation
 */

import { describe, it, expect } from "vitest";
import {
  buildSixfoldDslV1Steps,
  DSL_SIXFOLD_V1_STEPS_LENGTH,
} from "../src/geometry/sixfoldDslV1Steps";
import { executeSteps } from "./dsl-test-utils";
import { computeSixFoldV0Config } from "../src/geometry/sixFold/operations";
import type { Point, Line, CoordinateSystem } from "../src/types/geometry";

// Simple approximate equality check
function approx(a: number, b: number, tolerance = 1e-9): boolean {
  return Math.abs(a - b) < tolerance;
}

describe("Sixfold DSL v1 with cs2", () => {
  const defaultConfig = computeSixFoldV0Config(800, 600);

  describe("Step count", () => {
    it("step count is 97", () => {
      const steps = buildSixfoldDslV1Steps();
      expect(steps.length).toBe(DSL_SIXFOLD_V1_STEPS_LENGTH);
      expect(DSL_SIXFOLD_V1_STEPS_LENGTH).toBe(97);
    });
  });

  describe("Core structure", () => {
    it("cs2 at (p1x, p1y) from config", () => {
      const steps = buildSixfoldDslV1Steps();
      const result = executeSteps(steps, { config: defaultConfig });
      const cs2 = result.values.get("cs2");

      expect(cs2).toBeDefined();
      const cs2Coord = cs2 as CoordinateSystem;
      expect(approx(cs2Coord.x, defaultConfig.p1x)).toBe(true);
      expect(approx(cs2Coord.y, defaultConfig.p1y)).toBe(true);
    });

    it("p1 at (0, 0) in cs2, absolute (p1x, p1y)", () => {
      const steps = buildSixfoldDslV1Steps();
      const result = executeSteps(steps, { config: defaultConfig });
      const p1 = result.values.get("p1");
      const cs2 = result.values.get("cs2");

      expect(p1).toBeDefined();
      expect(cs2).toBeDefined();
      const p1Pt = p1 as Point;
      const cs2Coord = cs2 as CoordinateSystem;
      // p1 at origin of cs2
      expect(approx(p1Pt.x, cs2Coord.x)).toBe(true);
      expect(approx(p1Pt.y, cs2Coord.y)).toBe(true);
      // Which equals config.p1x, config.p1y
      expect(approx(p1Pt.x, defaultConfig.p1x)).toBe(true);
      expect(approx(p1Pt.y, defaultConfig.p1y)).toBe(true);
    });

    it("p2 in cs2 coordinate system", () => {
      const steps = buildSixfoldDslV1Steps();
      const result = executeSteps(steps, { config: defaultConfig });
      const p2 = result.values.get("p2");
      const cs2 = result.values.get("cs2");

      expect(p2).toBeDefined();
      expect(cs2).toBeDefined();
      const p2Pt = p2 as Point;
      const cs2Coord = cs2 as CoordinateSystem;
      // p2 at (p2x, p2y) in cs2, so absolute = cs2 + (p2x, p2y)
      expect(approx(p2Pt.x, cs2Coord.x + defaultConfig.p2x)).toBe(true);
      expect(approx(p2Pt.y, cs2Coord.y + defaultConfig.p2y)).toBe(true);
    });
  });

  describe("Geometry hierarchy", () => {
    it("line1 connects p1 and p2 correctly", () => {
      const steps = buildSixfoldDslV1Steps();
      const result = executeSteps(steps, { config: defaultConfig });
      const line1 = result.values.get("line1");
      const p1 = result.values.get("p1");
      const p2 = result.values.get("p2");

      expect(line1).toBeDefined();
      expect(p1).toBeDefined();
      expect(p2).toBeDefined();
      const line = line1 as Line;
      const p1Pt = p1 as Point;
      const p2Pt = p2 as Point;
      // Line should pass through p1 and p2
      expect(approx(line.x1, p1Pt.x)).toBe(true);
      expect(approx(line.y1, p1Pt.y)).toBe(true);
      expect(approx(line.x2, p2Pt.x)).toBe(true);
      expect(approx(line.y2, p2Pt.y)).toBe(true);
    });

    it("all geometries computed without errors", () => {
      const steps = buildSixfoldDslV1Steps();
      const result = executeSteps(steps, { config: defaultConfig });

      expect(result.errors).toHaveLength(0);
      expect(result.stepsExecuted).toBe(steps.length);

      // Check that all expected geometries exist
      const expectedIds = [
        "cs",
        "cs2",
        "p1",
        "p2",
        "line1",
        "cp1",
        "c1",
        "cp2",
        "c2",
        "pic12",
        "cPic12",
        "p3",
        "p4",
        "l13",
        "l24",
        "cp4",
        "cp3",
        "c4",
        "c3",
        "l12",
        "l23",
        "l34",
        "l41",
      ];
      for (const id of expectedIds) {
        expect(result.values.get(id)).toBeDefined();
      }
    });

    // TODO: Task 12 - Test all points use cs2 as parent
    // This requires inspecting step inputs to verify pointInCs calls use cs2
    // For now, we verify key geometries are positioned correctly relative to cs2

    // TODO: Task 13 - Test direction computation relative to cs2 orientation
    // Requires framework support for relative direction computation

    // TODO: Task 14 - Test cs2 transformations propagate
    // Requires testing with rotated cs2 and verifying child geometries update
  });
});
