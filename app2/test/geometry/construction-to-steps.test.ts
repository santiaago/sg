import { describe, it, expect } from "vitest";
import { Construction } from "../src/geometry/construction";
import { constructionToSteps } from "../src/geometry/construction-to-steps";
import type { Point, Line, Circle, SquareConfig } from "../src/types/geometry";
import type { GeometryStore } from "../src/react-store";
import type { Theme } from "../src/themes";

describe("constructionToSteps", () => {
  it("should convert Construction to Step array", () => {
    const c = new Construction();
    const p1 = c.point(0, 0, "p1");
    const p2 = c.point(10, 10, "p2");
    const l = c.line(p1, p2, "line1");

    const steps = constructionToSteps(c);
    expect(steps).toHaveLength(3);
    expect(steps[0].id).toBe("step_p1");
    expect(steps[1].id).toBe("step_p2");
    expect(steps[2].id).toBe("step_line1");
  });

  it("should map inputs and outputs correctly", () => {
    const c = new Construction();
    const p1 = c.point(0, 0, "p1");
    const p2 = c.point(10, 10, "p2");
    const l = c.line(p1, p2, "line1");

    const steps = constructionToSteps(c);
    const lineStep = steps.find((s) => s.id === "step_line1");
    expect(lineStep).toBeDefined();
    expect(lineStep?.inputs).toContain("p1");
    expect(lineStep?.inputs).toContain("p2");
    expect(lineStep?.outputs).toContain("line1");
  });

  it("should include all geometry in compute output", () => {
    const c = new Construction();
    const p1 = c.point(0, 0, "p1");

    const steps = constructionToSteps(c);
    const inputMap = new Map<string, any>();
    const config = {} as SquareConfig;

    const output = steps[0].compute(inputMap, config);
    expect(output.size).toBe(1);
    expect(output.get("p1")).toBeDefined();
    const pointValue = output.get("p1") as Point;
    expect(pointValue.x).toBe(0);
    expect(pointValue.y).toBe(0);
  });

  it("should handle steps with no dependencies", () => {
    const c = new Construction();
    c.point(0, 0, "p1");
    c.circle(0, 0, 50, "circle1");

    const steps = constructionToSteps(c);
    const pointStep = steps.find((s) => s.id === "step_p1");
    const circleStep = steps.find((s) => s.id === "step_circle1");

    expect(pointStep?.inputs).toEqual([]);
    expect(pointStep?.outputs).toEqual(["p1"]);
    expect(circleStep?.inputs).toEqual([]);
    expect(circleStep?.outputs).toEqual(["circle1"]);
  });

  it("should handle steps with dependencies", () => {
    const c = new Construction();
    const p1 = c.point(0, 0, "p1");
    const p2 = c.point(10, 10, "p2");
    const mid = c.midpoint(p1, p2, "mid");

    const steps = constructionToSteps(c);
    const midStep = steps.find((s) => s.id === "step_mid");

    expect(midStep).toBeDefined();
    expect(midStep?.inputs).toContain("p1");
    expect(midStep?.inputs).toContain("p2");
    expect(midStep?.outputs).toEqual(["mid"]);
  });
});

describe("constructionToSteps with square", () => {
  it("should convert square construction to steps", () => {
    const c = new Construction();

    // Recreate the square construction steps
    // Step 1: Main line
    const ml = c.line(100, 500, 700, 500, "main_line");

    // Step 2: C1 at ratio
    const c1 = c.pointAt(ml, 5 / 8, "c1");

    // Step 3: Circle at C1
    const c1_c = c.circle(c1, 150, "c1_circle");

    // Step 4: C2 at left intersection
    const c2 = c.intersection(c1_c, ml, "left", "c2");

    // Step 5: Circle at C2
    const c1_circle = c.get<Circle>(c1_c);
    const c2_c = c.circle(c2, c1_circle.r, "c2_circle");

    // Step 6: PI - north intersection
    const pi = c.intersection(c1_c, c2_c, "north", "pi");

    // Step 7: Circle at PI
    const ci = c.circle(pi, c1_circle.r, "ci");

    // Step 8-9: Extended lines
    const line_c2_pi = c.lineTowards(c2, pi, 2.2 * c1_circle.r, "line_c2_pi");
    const line_c1_pi = c.lineTowards(c1, pi, 2.2 * c1_circle.r, "line_c1_pi");

    // Step 10-11: P3 and P4
    const p3 = c.intersection(line_c2_pi, ci, { exclude: c2 }, "p3");
    const p4 = c.intersection(line_c1_pi, ci, { exclude: c1 }, "p4");

    // Step 12-13: Connecting lines
    const line_c2_p4 = c.line(c2, p4, "line_c2_p4");
    const line_c1_p3 = c.line(c1, p3, "line_c1_p3");

    // Step 14-15: Tangent points
    const pl = c.intersection(line_c2_p4, c2_c, { exclude: p4 }, "pl");
    const pr = c.intersection(line_c1_p3, c1_c, { exclude: p3 }, "pr");

    // Step 16: Final square
    const square = c.polygon([c1, c2, pr, pl], "square");

    const steps = constructionToSteps(c);
    expect(steps).toHaveLength(16);

    // Verify all expected geometry IDs are present
    const stepIds = steps.map((s) => s.id);
    expect(stepIds).toContain("step_main_line");
    expect(stepIds).toContain("step_c1");
    expect(stepIds).toContain("step_c1_circle");
    expect(stepIds).toContain("step_c2");
    expect(stepIds).toContain("step_pi");
    expect(stepIds).toContain("step_ci");
    expect(stepIds).toContain("step_line_c2_pi");
    expect(stepIds).toContain("step_line_c1_pi");
    expect(stepIds).toContain("step_p3");
    expect(stepIds).toContain("step_p4");
    expect(stepIds).toContain("step_line_c2_p4");
    expect(stepIds).toContain("step_line_c1_p3");
    expect(stepIds).toContain("step_pl");
    expect(stepIds).toContain("step_pr");
    expect(stepIds).toContain("step_square");
  });

  it("should verify step dependencies in square construction", () => {
    const c = new Construction();
    const p1 = c.point(0, 0, "p1");
    const p2 = c.point(10, 10, "p2");
    const l = c.line(p1, p2, "line1");

    const steps = constructionToSteps(c);
    const lineStep = steps.find((s) => s.id === "step_line1");

    expect(lineStep).toBeDefined();
    expect(lineStep?.inputs).toHaveLength(2);
    expect(lineStep?.inputs).toContain("p1");
    expect(lineStep?.inputs).toContain("p2");
  });
});
