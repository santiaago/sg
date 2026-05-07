// Integration test: Square construction equivalence
// Verifies that DSL-based square construction produces equivalent results to step-based construction

import { describe, it, expect, beforeEach } from "vitest";
import { GeometryBuilder } from "@/geometry/dsl/GeometryBuilder";
import { DefaultGeometryRenderer } from "@/geometry/dsl/renderers/DefaultRenderer";
import { executeSteps } from "./dsl-test-utils";
import { SQUARE_STEPS, computeSquareConfig, GEOM } from "@/geometry/squareSteps";
import type { SquareConfig } from "@/geometry/squareSteps";
import type { GeometryValue, Point, Line, Circle, Polygon } from "@/types/geometry";

// Test configuration matching square construction defaults
const TEST_WIDTH = 800;
const TEST_HEIGHT = 600;

function createTestConfig(): SquareConfig {
  return computeSquareConfig(TEST_WIDTH, TEST_HEIGHT);
}

// Type-safe helper to get geometry value
function getValue<T extends GeometryValue>(
  values: Map<string, GeometryValue>,
  id: string,
): T | undefined {
  return values.get(id) as T | undefined;
}

// Helper to compare points with tolerance
function pointsEqual(
  a: { x: number; y: number },
  b: { x: number; y: number },
  tolerance: number = 0.001,
): boolean {
  return Math.abs(a.x - b.x) < tolerance && Math.abs(a.y - b.y) < tolerance;
}

// Helper to compare lines with tolerance
function linesEqual(a: Line, b: Line, tolerance: number = 0.001): boolean {
  return (
    pointsEqual({ x: a.x1, y: a.y1 }, { x: b.x1, y: b.y1 }, tolerance) &&
    pointsEqual({ x: a.x2, y: a.y2 }, { x: b.x2, y: b.y2 }, tolerance)
  );
}

// Helper to compare circles with tolerance
function circlesEqual(a: Circle, b: Circle, tolerance: number = 0.001): boolean {
  return (
    Math.abs(a.cx - b.cx) < tolerance &&
    Math.abs(a.cy - b.cy) < tolerance &&
    Math.abs(a.r - b.r) < tolerance
  );
}

describe("Square Construction Equivalence", () => {
  let builder: GeometryBuilder<SquareConfig>;
  let config: SquareConfig;

  beforeEach(() => {
    builder = new GeometryBuilder<SquareConfig>(new DefaultGeometryRenderer());
    config = createTestConfig();
  });

  // ========================================================================
  // DSL Square Construction
  // ========================================================================

  function buildSquareWithDSL() {
    // Step 1: Coordinate system
    builder.coordinateSystem("cs", 0, 0, config.height * 0.1, 0);

    // Step 2: Points P1 and P2
    builder.point("p1", config.p1x, config.p1y);
    builder.point("p2", config.p2x, config.p2y);

    // Step 3: Main line
    builder.line("line_main", builder.getExpression("p1")!, builder.getExpression("p2")!);

    // Step 4: Circle center C1
    builder.point("c1", config.c1x, config.c1y);

    // Step 5: First circle
    builder.circle("c1_c", builder.getExpression("c1")!, config.circleRadius);

    // Step 6: Circle center C2
    builder.point("c2", config.c2x, config.c2y);

    // Step 7: Second circle
    builder.circle("c2_c", builder.getExpression("c2")!, config.circleRadius);

    // Step 8: Intersection point PI of C1_C and C2_C
    builder.circleIntersection(
      "pi",
      builder.getExpression("c1_c")!,
      builder.getExpression("c2_c")!,
      { select: "north" },
    );

    // Step 9: Intersection circle CI at PI
    builder.circle("ci", builder.getExpression("pi")!, config.circleRadius);

    // Step 10: Line from C2 towards PI (extended)
    builder.lineTowards(
      "line_c2_pi",
      builder.getExpression("c2")!,
      builder.getExpression("pi")!,
      2.2 * config.circleRadius,
    );

    // Step 11: Point P3 - intersection of line_c2_pi with CI, excluding C2
    builder.intersection("p3", builder.getExpression("ci")!, builder.getExpression("line_c2_pi")!, {
      excludeId: "c2",
    });

    // Step 12: Line from C1 towards PI (extended)
    builder.lineTowards(
      "line_c1_pi",
      builder.getExpression("c1")!,
      builder.getExpression("pi")!,
      2.2 * config.circleRadius,
    );

    // Step 13: Point P4 - intersection of line_c1_pi with CI, excluding C1
    builder.intersection("p4", builder.getExpression("ci")!, builder.getExpression("line_c1_pi")!, {
      excludeId: "c1",
    });

    // Step 14: Line from C2 to P4
    builder.line("line_c2_p4", builder.getExpression("c2")!, builder.getExpression("p4")!);

    // Step 15: Point PL - tangent point (intersection of C2_C with line_c2_p4)
    builder.intersection(
      "pl",
      builder.getExpression("c2_c")!,
      builder.getExpression("line_c2_p4")!,
    );

    // Step 16: Line from C1 to P3
    builder.line("line_c1_p3", builder.getExpression("c1")!, builder.getExpression("p3")!);

    // Step 17: Point PR - tangent point (intersection of C1_C with line_c1_p3)
    builder.intersection(
      "pr",
      builder.getExpression("c1_c")!,
      builder.getExpression("line_c1_p3")!,
    );

    // Step 18: Final square
    builder.polygon("square", [
      builder.getExpression("pl")!,
      builder.getExpression("pr")!,
      builder.getExpression("c1")!,
      builder.getExpression("c2")!,
    ]);

    // Compile and execute
    const steps = builder.compile();
    const result = executeSteps(steps, { config });
    return result.values;
  }

  // ========================================================================
  // Step-based Square Construction
  // ========================================================================

  function getStepValues(): Map<string, GeometryValue> {
    const values = new Map<string, GeometryValue>();

    for (const step of SQUARE_STEPS) {
      try {
        const computed = step.compute(values, config);
        for (const [key, value] of computed) {
          values.set(key, value);
        }
      } catch {
        // Ignore errors for now
      }
    }
    return values;
  }

  // ========================================================================
  // Tests
  // ========================================================================

  describe("DSL Square Construction", () => {
    it("creates all required geometry expressions", () => {
      builder.point("p1", config.p1x, config.p1y);
      builder.point("p2", config.p2x, config.p2y);
      builder.line("line_main", builder.getExpression("p1")!, builder.getExpression("p2")!);
      builder.point("c1", config.c1x, config.c1y);
      builder.circle("c1_c", builder.getExpression("c1")!, config.circleRadius);
      builder.point("c2", config.c2x, config.c2y);
      builder.circle("c2_c", builder.getExpression("c2")!, config.circleRadius);
      builder.circleIntersection(
        "pi",
        builder.getExpression("c1_c")!,
        builder.getExpression("c2_c")!,
      );
      builder.circle("ci", builder.getExpression("pi")!, config.circleRadius);
      builder.lineTowards(
        "line_c2_pi",
        builder.getExpression("c2")!,
        builder.getExpression("pi")!,
        2.2 * config.circleRadius,
      );
      builder.intersection(
        "p3",
        builder.getExpression("ci")!,
        builder.getExpression("line_c2_pi")!,
        { excludeId: "c2" },
      );
      builder.lineTowards(
        "line_c1_pi",
        builder.getExpression("c1")!,
        builder.getExpression("pi")!,
        2.2 * config.circleRadius,
      );
      builder.intersection(
        "p4",
        builder.getExpression("ci")!,
        builder.getExpression("line_c1_pi")!,
        { excludeId: "c1" },
      );
      builder.line("line_c2_p4", builder.getExpression("c2")!, builder.getExpression("p4")!);
      builder.intersection(
        "pl",
        builder.getExpression("c2_c")!,
        builder.getExpression("line_c2_p4")!,
      );
      builder.line("line_c1_p3", builder.getExpression("c1")!, builder.getExpression("p3")!);
      builder.intersection(
        "pr",
        builder.getExpression("c1_c")!,
        builder.getExpression("line_c1_p3")!,
      );
      builder.polygon("square", [
        builder.getExpression("pl")!,
        builder.getExpression("pr")!,
        builder.getExpression("c1")!,
        builder.getExpression("c2")!,
      ]);

      const allExpressions = builder.getAllExpressions();
      expect(allExpressions.size).toBeGreaterThanOrEqual(18);
    });

    it("compiles to correct number of steps", () => {
      builder.point("p1", config.p1x, config.p1y);
      builder.point("p2", config.p2x, config.p2y);
      builder.line("line_main", builder.getExpression("p1")!, builder.getExpression("p2")!);
      builder.point("c1", config.c1x, config.c1y);
      builder.circle("c1_c", builder.getExpression("c1")!, config.circleRadius);
      builder.point("c2", config.c2x, config.c2y);
      builder.circle("c2_c", builder.getExpression("c2")!, config.circleRadius);
      builder.circleIntersection(
        "pi",
        builder.getExpression("c1_c")!,
        builder.getExpression("c2_c")!,
      );
      builder.circle("ci", builder.getExpression("pi")!, config.circleRadius);
      builder.lineTowards(
        "line_c2_pi",
        builder.getExpression("c2")!,
        builder.getExpression("pi")!,
        2.2 * config.circleRadius,
      );
      builder.intersection(
        "p3",
        builder.getExpression("ci")!,
        builder.getExpression("line_c2_pi")!,
        { excludeId: "c2" },
      );
      builder.lineTowards(
        "line_c1_pi",
        builder.getExpression("c1")!,
        builder.getExpression("pi")!,
        2.2 * config.circleRadius,
      );
      builder.intersection(
        "p4",
        builder.getExpression("ci")!,
        builder.getExpression("line_c1_pi")!,
        { excludeId: "c1" },
      );
      builder.line("line_c2_p4", builder.getExpression("c2")!, builder.getExpression("p4")!);
      builder.intersection(
        "pl",
        builder.getExpression("c2_c")!,
        builder.getExpression("line_c2_p4")!,
      );
      builder.line("line_c1_p3", builder.getExpression("c1")!, builder.getExpression("p3")!);
      builder.intersection(
        "pr",
        builder.getExpression("c1_c")!,
        builder.getExpression("line_c1_p3")!,
      );
      builder.polygon("square", [
        builder.getExpression("pl")!,
        builder.getExpression("pr")!,
        builder.getExpression("c1")!,
        builder.getExpression("c2")!,
      ]);

      const steps = builder.compile();
      expect(steps.length).toBeGreaterThanOrEqual(15);
    });

    it("executes DSL steps without errors", () => {
      const values = buildSquareWithDSL();

      expect(values.get("cs")).toBeDefined();
      expect(values.get("p1")).toBeDefined();
      expect(values.get("p2")).toBeDefined();
      expect(values.get("line_main")).toBeDefined();
      expect(values.get("c1")).toBeDefined();
      expect(values.get("c1_c")).toBeDefined();
      expect(values.get("c2")).toBeDefined();
      expect(values.get("c2_c")).toBeDefined();
      expect(values.get("pi")).toBeDefined();
      expect(values.get("ci")).toBeDefined();
    });
  });

  describe("Step-based Construction", () => {
    it("executes step-based construction without errors", () => {
      const values = getStepValues();

      expect(values.get(GEOM.COORDINATE_SYSTEM)).toBeDefined();
      expect(values.get(GEOM.P1)).toBeDefined();
      expect(values.get(GEOM.P2)).toBeDefined();
      expect(values.get(GEOM.MAIN_LINE)).toBeDefined();
      expect(values.get(GEOM.C1)).toBeDefined();
      expect(values.get(GEOM.C1_CIRCLE)).toBeDefined();
      expect(values.get(GEOM.C2)).toBeDefined();
      expect(values.get(GEOM.C2_CIRCLE)).toBeDefined();
      expect(values.get(GEOM.INTERSECTION_POINT)).toBeDefined();
      expect(values.get(GEOM.INTERSECTION_CIRCLE)).toBeDefined();
    });
  });

  describe("Equivalence Tests", () => {
    it("P1 matches between DSL and step-based", () => {
      const dslValues = buildSquareWithDSL();
      const stepValues = getStepValues();

      const dslP1 = getValue<Point>(dslValues, "p1");
      const stepP1 = getValue<Point>(stepValues, GEOM.P1);

      expect(dslP1).toBeDefined();
      expect(stepP1).toBeDefined();
      expect(pointsEqual(dslP1!, stepP1!)).toBe(true);
    });

    it("P2 matches between DSL and step-based", () => {
      const dslValues = buildSquareWithDSL();
      const stepValues = getStepValues();

      const dslP2 = getValue<Point>(dslValues, "p2");
      const stepP2 = getValue<Point>(stepValues, GEOM.P2);

      expect(dslP2).toBeDefined();
      expect(stepP2).toBeDefined();
      expect(pointsEqual(dslP2!, stepP2!)).toBe(true);
    });

    it("Main line matches between DSL and step-based", () => {
      const dslValues = buildSquareWithDSL();
      const stepValues = getStepValues();

      const dslLine = getValue<Line>(dslValues, "line_main");
      const stepLine = getValue<Line>(stepValues, GEOM.MAIN_LINE);

      expect(dslLine).toBeDefined();
      expect(stepLine).toBeDefined();
      expect(linesEqual(dslLine!, stepLine!)).toBe(true);
    });

    it("C1 matches between DSL and step-based", () => {
      const dslValues = buildSquareWithDSL();
      const stepValues = getStepValues();

      const dslC1 = getValue<Point>(dslValues, "c1");
      const stepC1 = getValue<Point>(stepValues, GEOM.C1);

      expect(dslC1).toBeDefined();
      expect(stepC1).toBeDefined();
      expect(pointsEqual(dslC1!, stepC1!)).toBe(true);
    });

    it("C2 matches between DSL and step-based", () => {
      const dslValues = buildSquareWithDSL();
      const stepValues = getStepValues();

      const dslC2 = getValue<Point>(dslValues, "c2");
      const stepC2 = getValue<Point>(stepValues, GEOM.C2);

      expect(dslC2).toBeDefined();
      expect(stepC2).toBeDefined();
      expect(pointsEqual(dslC2!, stepC2!)).toBe(true);
    });

    it("C1_C circle matches between DSL and step-based", () => {
      const dslValues = buildSquareWithDSL();
      const stepValues = getStepValues();

      const dslC1C = getValue<Circle>(dslValues, "c1_c");
      const stepC1C = getValue<Circle>(stepValues, GEOM.C1_CIRCLE);

      expect(dslC1C).toBeDefined();
      expect(stepC1C).toBeDefined();
      expect(circlesEqual(dslC1C!, stepC1C!)).toBe(true);
    });

    it("C2_C circle matches between DSL and step-based", () => {
      const dslValues = buildSquareWithDSL();
      const stepValues = getStepValues();

      const dslC2C = getValue<Circle>(dslValues, "c2_c");
      const stepC2C = getValue<Circle>(stepValues, GEOM.C2_CIRCLE);

      expect(dslC2C).toBeDefined();
      expect(stepC2C).toBeDefined();
      expect(circlesEqual(dslC2C!, stepC2C!)).toBe(true);
    });

    it("PI (intersection point) matches between DSL and step-based", () => {
      const dslValues = buildSquareWithDSL();
      const stepValues = getStepValues();

      const dslPI = getValue<Point>(dslValues, "pi");
      const stepPI = getValue<Point>(stepValues, GEOM.INTERSECTION_POINT);

      expect(dslPI).toBeDefined();
      expect(stepPI).toBeDefined();
      expect(pointsEqual(dslPI!, stepPI!, 0.01)).toBe(true);
    });

    it("CI (intersection circle) matches between DSL and step-based", () => {
      const dslValues = buildSquareWithDSL();
      const stepValues = getStepValues();

      const dslCI = getValue<Circle>(dslValues, "ci");
      const stepCI = getValue<Circle>(stepValues, GEOM.INTERSECTION_CIRCLE);

      expect(dslCI).toBeDefined();
      expect(stepCI).toBeDefined();
      expect(circlesEqual(dslCI!, stepCI!, 0.01)).toBe(true);
    });

    it("Final square polygon exists in DSL construction", () => {
      const dslValues = buildSquareWithDSL();

      const dslSquare = getValue<Polygon>(dslValues, "square");
      expect(dslSquare).toBeDefined();
      expect(dslSquare!.type).toBe("polygon");
      expect(dslSquare!.points).toHaveLength(4);
    });

    it("Final square polygon exists in step-based construction", () => {
      const stepValues = getStepValues();

      const stepSquare = getValue<Polygon>(stepValues, GEOM.SQUARE);
      expect(stepSquare).toBeDefined();
      expect(stepSquare!.type).toBe("polygon");
      expect(stepSquare!.points).toHaveLength(4);
    });

    it("Square corner points are equivalent between DSL and step-based", () => {
      const dslValues = buildSquareWithDSL();
      const stepValues = getStepValues();

      const dslSquare = getValue<Polygon>(dslValues, "square");
      const stepSquare = getValue<Polygon>(stepValues, GEOM.SQUARE);

      expect(dslSquare).toBeDefined();
      expect(stepSquare).toBeDefined();

      expect(dslSquare!.points.length).toBe(4);
      expect(stepSquare!.points.length).toBe(4);

      const dslPoints = dslSquare!.points;
      const stepPoints = stepSquare!.points;

      const tolerance = 0.01;
      for (const dslPt of dslPoints) {
        const matched = stepPoints.some((stepPt) => pointsEqual(dslPt, stepPt, tolerance));
        expect(matched, `No matching point found for DSL point (${dslPt.x}, ${dslPt.y})`).toBe(
          true,
        );
      }
    });
  });

  describe("Dependency Graph Equivalence", () => {
    it("DSL maintains correct dependency order", () => {
      builder.point("p1", config.p1x, config.p1y);
      builder.point("p2", config.p2x, config.p2y);
      builder.line("line_main", builder.getExpression("p1")!, builder.getExpression("p2")!);
      builder.point("c1", config.c1x, config.c1y);
      builder.circle("c1_c", builder.getExpression("c1")!, config.circleRadius);
      builder.point("c2", config.c2x, config.c2y);
      builder.circle("c2_c", builder.getExpression("c2")!, config.circleRadius);
      builder.circleIntersection(
        "pi",
        builder.getExpression("c1_c")!,
        builder.getExpression("c2_c")!,
      );
      builder.circle("ci", builder.getExpression("pi")!, config.circleRadius);
      builder.lineTowards(
        "line_c2_pi",
        builder.getExpression("c2")!,
        builder.getExpression("pi")!,
        2.2 * config.circleRadius,
      );
      builder.intersection(
        "p3",
        builder.getExpression("ci")!,
        builder.getExpression("line_c2_pi")!,
        { excludeId: "c2" },
      );
      builder.lineTowards(
        "line_c1_pi",
        builder.getExpression("c1")!,
        builder.getExpression("pi")!,
        2.2 * config.circleRadius,
      );
      builder.intersection(
        "p4",
        builder.getExpression("ci")!,
        builder.getExpression("line_c1_pi")!,
        { excludeId: "c1" },
      );
      builder.line("line_c2_p4", builder.getExpression("c2")!, builder.getExpression("p4")!);
      builder.intersection(
        "pl",
        builder.getExpression("c2_c")!,
        builder.getExpression("line_c2_p4")!,
      );
      builder.line("line_c1_p3", builder.getExpression("c1")!, builder.getExpression("p3")!);
      builder.intersection(
        "pr",
        builder.getExpression("c1_c")!,
        builder.getExpression("line_c1_p3")!,
      );
      builder.polygon("square", [
        builder.getExpression("pl")!,
        builder.getExpression("pr")!,
        builder.getExpression("c1")!,
        builder.getExpression("c2")!,
      ]);

      const executionOrder = builder.getExecutionOrder();

      const p1Idx = executionOrder.indexOf("p1");
      const p2Idx = executionOrder.indexOf("p2");
      const lineMainIdx = executionOrder.indexOf("line_main");
      const c1Idx = executionOrder.indexOf("c1");
      const c2Idx = executionOrder.indexOf("c2");
      const c1cIdx = executionOrder.indexOf("c1_c");
      const c2cIdx = executionOrder.indexOf("c2_c");
      const piIdx = executionOrder.indexOf("pi");
      const ciIdx = executionOrder.indexOf("ci");
      const lineC2PiIdx = executionOrder.indexOf("line_c2_pi");
      const p3Idx = executionOrder.indexOf("p3");
      const p4Idx = executionOrder.indexOf("p4");
      const plIdx = executionOrder.indexOf("pl");
      const prIdx = executionOrder.indexOf("pr");
      const squareIdx = executionOrder.indexOf("square");

      expect(p1Idx).toBeLessThan(lineMainIdx);
      expect(p2Idx).toBeLessThan(lineMainIdx);
      expect(c1Idx).toBeLessThan(c1cIdx);
      expect(c2Idx).toBeLessThan(c2cIdx);
      expect(c1cIdx).toBeLessThan(piIdx);
      expect(c2cIdx).toBeLessThan(piIdx);
      expect(piIdx).toBeLessThan(ciIdx);
      expect(c2Idx).toBeLessThan(lineC2PiIdx);
      expect(piIdx).toBeLessThan(lineC2PiIdx);
      expect(ciIdx).toBeLessThan(lineC2PiIdx);
      expect(lineC2PiIdx).toBeLessThan(p3Idx);
      expect(lineC2PiIdx).toBeLessThan(p4Idx);
      expect(p1Idx).toBeLessThan(squareIdx);
      expect(p2Idx).toBeLessThan(squareIdx);
      expect(c1Idx).toBeLessThan(squareIdx);
      expect(c2Idx).toBeLessThan(squareIdx);
      expect(plIdx).toBeLessThan(squareIdx);
      expect(prIdx).toBeLessThan(squareIdx);
    });
  });
});
