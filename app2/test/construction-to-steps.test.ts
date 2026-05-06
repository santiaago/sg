// Unit tests for construction-to-steps adapter

import { describe, it, expect } from "vitest";
import { Construction } from "../src/geometry/construction";
import { constructionToSteps, constructionToStepsUpTo, getCurrentStep } from "../src/geometry/construction-to-steps";

describe("construction-to-steps adapter", () => {
  describe("constructionToSteps()", () => {
    it("converts Construction to Step array", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.line(0, 0, 10, 10, "l1");
      c.circle(5, 5, 5, "c1");

      const steps = constructionToSteps(c);
      expect(steps).toHaveLength(3);
      expect(steps[0].id).toBe("step_p1");
      expect(steps[1].id).toBe("step_l1");
      expect(steps[2].id).toBe("step_c1");
    });

    it("preserves dependencies", () => {
      const c = new Construction();
      const p1 = c.point(0, 0, "p1");
      const p2 = c.point(10, 10, "p2");
      const l = c.line(p1, p2, "line");

      const steps = constructionToSteps(c);
      expect(steps).toHaveLength(3);
      expect(steps[2].inputs).toContain("p1");
      expect(steps[2].inputs).toContain("p2");
    });

    it("each step has correct outputs", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.line(0, 0, 10, 10, "l1");

      const steps = constructionToSteps(c);
      expect(steps[0].outputs).toEqual(["p1"]);
      expect(steps[1].outputs).toEqual(["l1"]);
    });

    it("compute function returns geometry value", () => {
      const c = new Construction();
      c.point(5, 5, "p1");

      const steps = constructionToSteps(c);
      const result = steps[0].compute(new Map(), {});
      expect(result.size).toBe(1);
      expect(result.get("p1")).toBeDefined();
      const geom = result.get("p1");
      expect(geom?.type).toBe("point");
      expect((geom as any).x).toBe(5);
      expect((geom as any).y).toBe(5);
    });
  });

  describe("constructionToStepsUpTo()", () => {
    it("converts only up to specified step index", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      c.point(20, 20, "p3");

      const steps = constructionToStepsUpTo(c, 1);
      expect(steps).toHaveLength(2);
      expect(steps[0].id).toBe("step_p1");
      expect(steps[1].id).toBe("step_p2");
    });

    it("returns empty array for negative index", () => {
      const c = new Construction();
      c.point(0, 0, "p1");

      const steps = constructionToStepsUpTo(c, -1);
      expect(steps).toHaveLength(0);
    });

    it("returns all steps when index exceeds count", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");

      const steps = constructionToStepsUpTo(c, 100);
      expect(steps).toHaveLength(2);
    });
  });

  describe("getCurrentStep()", () => {
    it("returns undefined for empty construction", () => {
      const c = new Construction();
      const step = getCurrentStep(c);
      expect(step).toBeUndefined();
    });

    it("returns the last step in current steps", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      c.goTo(0); // Only first step is "current"

      const step = getCurrentStep(c);
      expect(step).toBeDefined();
      expect(step?.id).toBe("step_p1");
    });

    it("returns correct step with multiple steps", () => {
      const c = new Construction();
      c.point(0, 0, "p1");
      c.point(10, 10, "p2");
      c.point(20, 20, "p3");
      c.goTo(1);

      const step = getCurrentStep(c);
      expect(step).toBeDefined();
      expect(step?.id).toBe("step_p2");
    });
  });
});
