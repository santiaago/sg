// app2/src/components/SquaresV2.test.tsx

import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SquaresV2 } from "./SquaresV2";
import { standardSvgConfig } from "../config/svgConfig";
import { darkTheme } from "../themes";
import type { GeometryStore } from "../react-store";
import { Construction } from "../geometry/construction";
import { computeSquareConfig, LINE_EXTENSION_MULTIPLIER, C1_POSITION_RATIO } from "../geometry/operations";
import type { Circle, Polygon } from "../types/geometry";

/**
 * Mock GeometryStore for testing
 */
const createMockStore = (): GeometryStore & {
  add: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
} => ({
  items: {},
  add: vi.fn(),
  update: vi.fn(),
  clear: vi.fn(),
});

describe("SquaresV2", () => {
  const defaultProps = {
    store: createMockStore(),
    svgConfig: standardSvgConfig,
    currentStep: 0,
    theme: darkTheme,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render without errors", () => {
    render(<SquaresV2 {...defaultProps} />);
    expect(screen.getByTestId("squaresv2-svg")).toBeInTheDocument();
  });

  it("should render with currentStep=0 (first step only)", () => {
    render(<SquaresV2 {...defaultProps} currentStep={0} />);
    expect(screen.getByTestId("squaresv2-svg")).toBeInTheDocument();
  });

  it("should render with currentStep=15 (all steps)", () => {
    render(<SquaresV2 {...defaultProps} currentStep={15} />);
    expect(screen.getByTestId("squaresv2-svg")).toBeInTheDocument();
  });

  it("should render with intermediate step", () => {
    render(<SquaresV2 {...defaultProps} currentStep={7} />);
    expect(screen.getByTestId("squaresv2-svg")).toBeInTheDocument();
  });

  it("should update rendering when currentStep changes", () => {
    const { rerender } = render(
      <SquaresV2 {...defaultProps} currentStep={0} />
    );

    // Change step
    rerender(
      <SquaresV2 {...defaultProps} currentStep={5} />
    );

    expect(screen.getByTestId("squaresv2-svg")).toBeInTheDocument();
  });

  it("should update rendering when currentStep changes to final step", () => {
    const { rerender } = render(
      <SquaresV2 {...defaultProps} currentStep={0} />
    );

    // Change to final step
    rerender(
      <SquaresV2 {...defaultProps} currentStep={15} />
    );

    expect(screen.getByTestId("squaresv2-svg")).toBeInTheDocument();
  });

  it("should handle negative currentStep gracefully", () => {
    // Construction.goTo clamps to 0, so negative should be treated as 0
    render(<SquaresV2 {...defaultProps} currentStep={-1} />);
    expect(screen.getByTestId("squaresv2-svg")).toBeInTheDocument();
  });

  it("should handle currentStep beyond total steps", () => {
    // Construction.goTo clamps to max step, so this should render all steps
    render(<SquaresV2 {...defaultProps} currentStep={100} />);
    expect(screen.getByTestId("squaresv2-svg")).toBeInTheDocument();
  });

  it("should work without theme prop", () => {
    const props = {
      ...defaultProps,
      theme: undefined,
    };
    render(<SquaresV2 {...props} />);
    expect(screen.getByTestId("squaresv2-svg")).toBeInTheDocument();
  });

  it("should render with different SVG configurations", () => {
    const customConfig = {
      ...standardSvgConfig,
      width: 400,
      height: 300,
    };
    render(<SquaresV2 {...defaultProps} svgConfig={customConfig} />);
    expect(screen.getByTestId("squaresv2-svg")).toBeInTheDocument();
  });
});

/**
 * Geometry verification tests for SquaresV2 construction
 */
describe("SquaresV2 geometry", () => {
  it("should produce correct construction with all 16 steps", () => {
    const config = computeSquareConfig(800, 600);
    const c = new Construction();

    // Step 1: Main line
    const ml = c.line(config.p1x, config.p1y, config.p2x, config.p2y, "main_line");

    // Step 2: C1
    const c1 = c.pointAt(ml, C1_POSITION_RATIO, "c1");

    // Step 3: C1_C
    const c1_c = c.circle(c1, config.circleRadius, "c1_circle");

    // Step 4: C2
    const c2 = c.intersection(c1_c, ml, "left", "c2");

    // Step 5: C2_C
    const c1_circle = c.get<Circle>(c1_c);
    const c2_c = c.circle(c2, c1_circle.r, "c2_circle");

    // Step 6: PI
    const pi = c.intersection(c1_c, c2_c, "north", "pi");

    // Step 7: CI
    const ci = c.circle(pi, c1_circle.r, "ci");

    // Step 8-9: Extended lines
    const line_c2_pi = c.lineTowards(c2, pi, LINE_EXTENSION_MULTIPLIER * c1_circle.r, "line_c2_pi");
    const line_c1_pi = c.lineTowards(c1, pi, LINE_EXTENSION_MULTIPLIER * c1_circle.r, "line_c1_pi");

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

    // Verify all steps were created
    const allSteps = c.getAllSteps();
    expect(allSteps.length).toBe(16);

    // Verify we can get the square
    const squareValue = c.get<Polygon>(square);
    expect(squareValue.type).toBe("polygon");
    expect(squareValue.points).toHaveLength(4);

    // Verify the square has the expected structure (4 points)
    expect(squareValue.points.length).toBe(4);
  });

  it("should navigate through steps correctly", () => {
    const config = computeSquareConfig(800, 600);
    const c = new Construction();

    // Build the construction
    c.line(config.p1x, config.p1y, config.p2x, config.p2y, "main_line");
    c.pointAt({ id: "main_line" }, C1_POSITION_RATIO, "c1");
    c.circle({ id: "c1" }, config.circleRadius, "c1_circle");

    // Verify initial state
    expect(c.currentStepIndex).toBe(0);

    // Navigate to step 2
    c.goTo(2);
    expect(c.currentStepIndex).toBe(2);

    // Get steps up to current
    const currentSteps = c.getSteps();
    expect(currentSteps.length).toBe(3); // Steps 0, 1, 2

    // Navigate to step 0
    c.goTo(0);
    expect(c.currentStepIndex).toBe(0);

    // Navigate to step 1
    c.next();
    expect(c.currentStepIndex).toBe(1);

    // Navigate back
    c.prev();
    expect(c.currentStepIndex).toBe(0);

    // Reset
    c.reset();
    expect(c.currentStepIndex).toBe(0);
  });
});
