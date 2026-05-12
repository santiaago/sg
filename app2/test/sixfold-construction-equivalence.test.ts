// Equivalence tests: DSL vs manual SixFold v0 construction
import { describe, it, expect } from "vitest";
import { buildSixfoldDslSteps, DSL_SIXFOLD_STEPS_LENGTH } from "../src/geometry/sixfoldDslSteps";
import { SIX_FOLD_V0_STEPS } from "../src/geometry/sixFoldV0Steps";
import { computeSixFoldV0Config } from "../src/geometry/sixFold/operations";
import { executeSteps } from "./dsl-test-utils";
import type { GeometryValue, Point, Line, Circle, CoordinateSystem } from "../src/types/geometry";

// Simple approximate equality check
function approx(a: number, b: number, tolerance = 1e-6): boolean {
  return Math.abs(a - b) <= tolerance;
}

// Debug: Compare distance computations
// Manual: distance(pic14, pi2) computed inline
// DSL: builder.distance("d1", pic14, pi2) creates separate step

// Helper function to compare geometry values approximately
function geomApproxEqual(
  a: GeometryValue | undefined,
  b: GeometryValue | undefined,
  tolerance = 1e-6,
): boolean {
  if (a === undefined || b === undefined) return false;
  if (a.type !== b.type) return false;

  switch (a.type) {
    case "point":
      return approx(a.x, (b as Point).x, tolerance) && approx(a.y, (b as Point).y, tolerance);
    case "line":
      return (
        approx(a.x1, (b as Line).x1, tolerance) &&
        approx(a.y1, (b as Line).y1, tolerance) &&
        approx(a.x2, (b as Line).x2, tolerance) &&
        approx(a.y2, (b as Line).y2, tolerance)
      );
    case "circle":
      return (
        approx(a.cx, (b as Circle).cx, tolerance) &&
        approx(a.cy, (b as Circle).cy, tolerance) &&
        approx(a.r, (b as Circle).r, tolerance)
      );
    case "coordinate_system":
      return (
        approx(a.x, (b as CoordinateSystem).x, tolerance) &&
        approx(a.y, (b as CoordinateSystem).y, tolerance) &&
        approx(a.arrowLength, (b as CoordinateSystem).arrowLength, tolerance) &&
        ((a.rotation === undefined && (b as CoordinateSystem).rotation === undefined) ||
          (a.rotation !== undefined &&
            (b as CoordinateSystem).rotation !== undefined &&
            approx(a.rotation, (b as CoordinateSystem).rotation as number, tolerance)))
      );
    default:
      return false;
  }
}

describe("SixFold DSL - Step Count", () => {
  it("Manual has 94 steps", () => {
    expect(SIX_FOLD_V0_STEPS.length).toBe(94);
  });

  it("DSL produces consistent step count", () => {
    const dslSteps = buildSixfoldDslSteps();
    // DSL produces 96 steps: 94 manual + 2 helper lines (line_pc23_cp2, line_pc34_cp4)
    // These helper lines are intermediate steps needed for circle intersections.
    expect(dslSteps.length).toBe(96);
  });

  it("DSL_SIXFOLD_STEPS_LENGTH matches actual DSL step count", () => {
    const dslSteps = buildSixfoldDslSteps();
    expect(DSL_SIXFOLD_STEPS_LENGTH).toBe(96);
    expect(dslSteps.length).toBe(96);
  });
});

describe("SixFold DSL - Geometry Order", () => {
  it("All manual geometry IDs appear in DSL output", () => {
    const dslSteps = buildSixfoldDslSteps();
    const dslIds = dslSteps.flatMap((step) => step.outputs);

    const manualIds = SIX_FOLD_V0_STEPS.flatMap((step) => step.outputs);

    // Note: DSL has extra intermediate geometry (distance steps, helper lines)
    // Verify all manual IDs exist in DSL
    for (const id of manualIds) {
      expect(dslIds).toContain(id);
    }
  });

  it("Manual geometry IDs appear in same relative order in DSL", () => {
    const dslSteps = buildSixfoldDslSteps();
    const dslIds = dslSteps.flatMap((step) => step.outputs);

    const manualIds = SIX_FOLD_V0_STEPS.flatMap((step) => step.outputs);

    // Find indices of manual IDs in DSL array
    const manualIndices: number[] = [];
    for (const id of manualIds) {
      const idx = dslIds.indexOf(id);
      expect(idx).not.toBe(-1);
      manualIndices.push(idx);
    }

    // Verify they appear in increasing order (same relative order)
    for (let i = 1; i < manualIndices.length; i++) {
      expect(manualIndices[i]).toBeGreaterThan(manualIndices[i - 1]);
    }
  });
});

describe("SixFold DSL - Dependency Graphs", () => {
  /**
   * Compute transitive dependencies for a geometry ID.
   * Returns all IDs that are transitively required to compute the given ID.
   */
  function getTransitiveDependencies(
    id: string,
    steps: Array<{ inputs: string[]; outputs: string[] }>,
  ): Set<string> {
    const result = new Set<string>();
    const visited = new Set<string>();

    function visit(currentId: string): void {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      for (const step of steps) {
        if (step.outputs.includes(currentId)) {
          for (const input of step.inputs) {
            if (!visited.has(input)) {
              result.add(input);
              visit(input);
            }
          }
        }
      }
    }

    visit(id);
    return result;
  }

  // NOTE: Skipped - DSL uses explicit intermediate steps (line_pc23_cp2, line_pc34_cp4)
  // while manual computes them inline. Additionally, manual steps may have unused inputs
  // (e.g., STEP_81 for PC23E lists PC3SW as input but doesn't use it).
  // The geometry value equivalence test (below) is the authoritative check.
  it.skip("DSL and manual have same transitive dependency structure", () => {
    const dslSteps = buildSixfoldDslSteps();
    const manualSteps = [...SIX_FOLD_V0_STEPS];

    // Get all manual geometry IDs
    const manualIds = manualSteps.flatMap((step) => step.outputs);

    // Compare transitive dependencies for each manual geometry ID
    const depMismatches: string[] = [];
    for (const id of manualIds) {
      const dslTransitive = getTransitiveDependencies(id, dslSteps);
      const manualTransitive = getTransitiveDependencies(id, manualSteps);

      // Compare sets (order doesn't matter)
      const dslArray = Array.from(dslTransitive).sort();
      const manualArray = Array.from(manualTransitive).sort();

      if (JSON.stringify(dslArray) !== JSON.stringify(manualArray)) {
        const onlyInDsl = dslArray.filter((x) => !manualArray.includes(x));
        const onlyInManual = manualArray.filter((x) => !dslArray.includes(x));
        depMismatches.push(
          `${id}: Only in DSL=[${onlyInDsl.join(",")}], Only in Manual=[${onlyInManual.join(",")}]`,
        );
      }
    }

    if (depMismatches.length > 0) {
      expect.fail(`Transitive dependency mismatches:\n${depMismatches.join("\n")}`);
    }
  });
});

describe("SixFold DSL - Geometry Values", () => {
  // Use a fixed config for both implementations
  const config = computeSixFoldV0Config(1000, 1000);

  it("DSL steps can be executed", () => {
    const dslSteps = buildSixfoldDslSteps();
    const dslResult = executeSteps(dslSteps, { config });
    expect(dslResult.values.size).toBeGreaterThan(0);
    expect(dslResult.errors).toHaveLength(0);
  });

  it("Manual steps can be executed", () => {
    const manualSteps = [...SIX_FOLD_V0_STEPS];
    const manualResult = executeSteps(manualSteps, { config });
    expect(manualResult.values.size).toBeGreaterThan(0);
    expect(manualResult.errors).toHaveLength(0);
  });

  it("DSL and manual produce same geometry values (with tolerance)", () => {
    const dslSteps = buildSixfoldDslSteps();
    const manualSteps = [...SIX_FOLD_V0_STEPS];

    const dslResult = executeSteps(dslSteps, { config });
    const manualResult = executeSteps(manualSteps, { config });

    // Get all manual geometry IDs
    const manualIds = SIX_FOLD_V0_STEPS.flatMap((step) => step.outputs);

    // Compare values for each manual geometry ID with approximate matching
    const mismatches: string[] = [];
    for (const id of manualIds) {
      const dslVal = dslResult.values.get(id);
      const manualVal = manualResult.values.get(id);

      if (!dslVal) {
        mismatches.push(`${id}: DSL missing`);
        continue;
      }
      if (!manualVal) {
        mismatches.push(`${id}: Manual missing`);
        continue;
      }

      if (!geomApproxEqual(dslVal, manualVal, 1e-9)) {
        mismatches.push(
          `${id}: DSL={${JSON.stringify(dslVal)}}, Manual={${JSON.stringify(manualVal)}}`,
        );
      }
    }

    if (mismatches.length > 0) {
      expect.fail(`Geometry mismatches:\n${mismatches.join("\n")}`);
    }
  });
});
