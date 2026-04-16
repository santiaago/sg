import { useEffect, useRef } from "react";
import type { JSX } from "react";
import { bisect, inteceptCircleLineSeg, intersection } from "@sg/geometry";
import type { SvgConfig } from "../config/svgConfig";
import type { GeometryStore } from "../react-store";

// Magic number constants
const TOOLTIP_OFFSET_X = 10;
const TOOLTIP_OFFSET_Y = -5;
const TOOLTIP_BG_HEIGHT = 16;
const TOOLTIP_FONT_SIZE = 10;
const TOOLTIP_TEXT_WIDTH_PER_CHAR = 8;
const TOOLTIP_BG_ROUNDING = 2;
const DEFAULT_STROKE_WIDTH = 5;
const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

// Extend SVG element types to include custom tooltip properties
declare global {
  interface SVGCircleElement {
    tooltip?: SVGTextElement;
    tooltipBg?: SVGRectElement;
  }

  interface SVGLineElement {
    tooltip?: SVGTextElement;
    tooltipBg?: SVGRectElement;
  }
}

interface Step {
  draw: boolean;
  drawShapes: () => void;
}

interface SquareProps {
  store?: GeometryStore;
  strokeBig: number;
  svgConfig: SvgConfig;
  steps?: Step[];
  updateSteps?: (steps: Step[]) => void;
  restartKey?: number;
  currentStep?: number;
}

// Type aliases for geometry functions to allow dependency injection
type IntersectionFn = typeof intersection;
type BisectFn = typeof bisect;
type InteceptCircleLineSegFn = typeof inteceptCircleLineSeg;

export function Square({
  store,
  strokeBig,
  svgConfig,
  steps = [],
  updateSteps = () => {},
  restartKey = 0,
  currentStep = 0,
}: SquareProps): JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);

  // Helper function to create tooltip elements
  const createTooltip = (
    svg: SVGSVGElement,
    x: number,
    y: number,
    name: string,
    bgYOffset: number = 15,
  ) => {
    // Create tooltip element
    const tooltip = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tooltip.setAttribute("x", x.toString());
    tooltip.setAttribute("y", (y + TOOLTIP_OFFSET_Y).toString());
    tooltip.setAttribute("fill", "white");
    tooltip.setAttribute("font-size", TOOLTIP_FONT_SIZE.toString());
    tooltip.setAttribute("opacity", "0");
    tooltip.setAttribute("data-tooltip-text", name);
    tooltip.setAttribute("text-anchor", "middle");
    tooltip.setAttribute("dominant-baseline", "middle");
    tooltip.textContent = name;

    // Create background rectangle for better visibility
    const tooltipBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const textWidth = name.length * TOOLTIP_TEXT_WIDTH_PER_CHAR;
    const bgX = x - textWidth / 2;
    tooltipBg.setAttribute("x", bgX.toString());
    tooltipBg.setAttribute("y", (y - bgYOffset).toString());
    tooltipBg.setAttribute("width", textWidth.toString());
    tooltipBg.setAttribute("height", TOOLTIP_BG_HEIGHT.toString());
    tooltipBg.setAttribute("fill", "black");
    tooltipBg.setAttribute("opacity", "0");
    tooltipBg.setAttribute("rx", TOOLTIP_BG_ROUNDING.toString());
    svg.appendChild(tooltipBg);

    // Add both elements to SVG
    svg.appendChild(tooltip);

    return { tooltip, tooltipBg };
  };

  // Helper function to draw a rectangle
  const rect = (svg: SVGSVGElement, width: number, height: number) => {
    const rectEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rectEl.setAttribute("width", width.toString());
    rectEl.setAttribute("height", height.toString());
    rectEl.setAttribute("fill", "#fff");
    svg.appendChild(rectEl);
  };

  // Helper function to draw a dot
  const dot = (svg: SVGSVGElement, x: number, y: number, radius: number) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("class", "dot");
    circle.setAttribute("cx", x.toString());
    circle.setAttribute("cy", y.toString());
    circle.setAttribute("r", radius.toString());
    circle.setAttribute("fill", "black");
    circle.setAttribute("opacity", "1");
    svg.appendChild(circle);
    return circle;
  };

  // Helper function to draw a line
  const line = (
    svg: SVGSVGElement,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeWidth: number = DEFAULT_STROKE_WIDTH,
  ) => {
    const lineEl = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineEl.setAttribute("stroke", "#506");
    lineEl.setAttribute("stroke-width", strokeWidth.toString());
    lineEl.setAttribute("x1", x1.toString());
    lineEl.setAttribute("y1", y1.toString());
    lineEl.setAttribute("x2", x2.toString());
    lineEl.setAttribute("y2", y2.toString());
    svg.appendChild(lineEl);
    return lineEl;
  };

  // Helper function to draw a circle
  const circle = (svg: SVGSVGElement, cx: number, cy: number, r: number, stroke: number = 1) => {
    const circleEl = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circleEl.setAttribute("stroke", "#f06");
    circleEl.setAttribute("stroke-width", stroke.toString());
    circleEl.setAttribute("fill", "none");
    circleEl.setAttribute("cx", cx.toString());
    circleEl.setAttribute("cy", cy.toString());
    circleEl.setAttribute("r", r.toString());
    svg.appendChild(circleEl);
    return circleEl;
  };

  // Helper function to draw a dot with tooltip
  const dotWithTooltip = (
    svg: SVGSVGElement,
    x: number,
    y: number,
    name: string,
    radius: number,
    _store?: GeometryStore,
  ) => {
    const dotElement = dot(svg, x, y, radius);
    dotElement.setAttribute("data-tooltip", name);
    dotElement.style.cursor = "pointer";

    // Create tooltip element (positioned near the dot)
    const tooltipX = x + TOOLTIP_OFFSET_X;
    const tooltipY = y;
    const { tooltip, tooltipBg } = createTooltip(svg, tooltipX, tooltipY, name, 15);

    // Store both tooltip and background
    dotElement.tooltip = tooltip;
    dotElement.tooltipBg = tooltipBg;

    if (_store) {
      _store.add(name, dotElement, "point");
    }

    return dotElement;
  };

  // Helper function to draw a line with tooltip
  const lineWithTooltip = (
    svg: SVGSVGElement,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    name: string,
    strokeWidth: number = DEFAULT_STROKE_WIDTH,
    _store?: GeometryStore,
  ) => {
    const lineEl = line(svg, x1, y1, x2, y2, strokeWidth);
    lineEl.style.cursor = "pointer";

    // Create tooltip element (positioned at midpoint)
    const midpointX = (x1 + x2) / 2;
    const midpointY = (y1 + y2) / 2;
    const { tooltip, tooltipBg } = createTooltip(svg, midpointX, midpointY, name, 15);

    // Store both tooltip and background
    lineEl.tooltip = tooltip;
    lineEl.tooltipBg = tooltipBg;

    if (_store) {
      _store.add(name, lineEl, "line");
    }

    return lineEl;
  };

  // Helper function to draw a circle with tooltip
  const circleWithTooltip = (
    svg: SVGSVGElement,
    cx: number,
    cy: number,
    r: number,
    name: string,
    stroke: number = 1,
    _store?: GeometryStore,
  ) => {
    const circleEl = circle(svg, cx, cy, r, stroke);
    circleEl.style.cursor = "pointer";

    // Create tooltip element (positioned to the right of the circle)
    const tooltipX = cx + r + TOOLTIP_OFFSET_X;
    const tooltipY = cy;
    const { tooltip, tooltipBg } = createTooltip(svg, tooltipX, tooltipY, name, 15);

    // Store both tooltip and background
    circleEl.tooltip = tooltip;
    circleEl.tooltipBg = tooltipBg;

    if (_store) {
      _store.add(name, circleEl, "circle");
    }

    return circleEl;
  };

  // Helper function to get circle intersection point
  const getCircleIntersectionPoint = (
    cx1: number,
    cy1: number,
    cx2: number,
    cy2: number,
    r: number,
    intersectionFn: IntersectionFn,
  ): { px: number; py: number } | null => {
    const points = intersectionFn(cx1, cy1, r, cx2, cy2, r);
    if (!points) return null;

    const px1 = points[0],
      py1 = points[1];
    const px2 = points[2],
      py2 = points[3];
    const px = py1 < py2 ? px1 : px2;
    const py = py1 < py2 ? py1 : py2;

    return { px, py };
  };

  // Helper function to get bisected points
  const getBisectedPoints = (
    px: number,
    py: number,
    c1x: number,
    c1y: number,
    c2x: number,
    c2y: number,
    circleRadius: number,
    bisectFn: BisectFn,
  ): { px3: number; py3: number; px4: number; py4: number } => {
    const cx0 = px - circleRadius,
      cy0 = py;

    const angle1 = Math.atan2(cy0 - c2y, cx0 - c2x);
    const [px3, py3] = bisectFn(angle1 * 2, circleRadius, px, py);

    const angle2 = Math.atan2(cy0 - c1y, cx0 - c1x);
    const [px4, py4] = bisectFn(angle2 * 2, circleRadius, px, py);

    return { px3, py3, px4, py4 };
  };

  // Create steps for incremental drawing
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    // Clear any existing content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Set up SVG dimensions to match the actual content size
    svg.setAttribute("viewBox", svgConfig.viewBox);
    svg.setAttribute("width", svgConfig.width.toString());
    svg.setAttribute("height", svgConfig.height.toString());

    const width = svgConfig.width;
    const height = svgConfig.height;
    rect(svg, width, height);

    const border = height / 3;
    const stroke = 0.5;

    const [lx1, ly1, lx2, ly2] = [border, height - border, width - border, height - border];

    // Calculate geometric parameters for better readability
    const lineLength = lx2 - lx1;
    const circleRadius = (lineLength * 2) / 8; // 1/4 of line length
    const c1XPosition = lx1 + (lineLength * 5) / 8; // c1 at 5/8 from left
    const c2XPosition = c1XPosition - circleRadius; // c2 at 3/8 from left (5/8 - 2/8)

    // Circle intersection parameters (calculated once for efficiency)
    const intersectionCx1 = lx1 + ((lx2 - lx1) * 5) / 8;
    const intersectionCy1 = ly2;
    const intersectionCx2 = intersectionCx1 - circleRadius;
    const intersectionCy2 = ly2;

    // Step creator functions with all dependencies passed as parameters
    const createLineStep = (
      svg: SVGSVGElement,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      name: string,
      strokeWidth: number,
      _store?: GeometryStore,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        lineWithTooltip(svg, x1, y1, x2, y2, name, strokeWidth, _store);
      },
    });

    const createCircleStep = (
      svg: SVGSVGElement,
      cx: number,
      cy: number,
      r: number,
      circleName: string,
      strokeWidth: number,
      _store?: GeometryStore,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        circleWithTooltip(svg, cx, cy, r, circleName, strokeWidth, _store);
      },
    });

    const createDotStep = (
      svg: SVGSVGElement,
      cx: number,
      cy: number,
      dotName: string,
      radius: number,
      _store?: GeometryStore,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        dotWithTooltip(svg, cx, cy, dotName, radius, _store);
      },
    });

    const createCircleIntersectionDotStep = (
      svg: SVGSVGElement,
      cx1: number,
      cy1: number,
      cx2: number,
      cy2: number,
      radius: number,
      name: string,
      dotRadius: number,
      _store?: GeometryStore,
      intersectionFn: IntersectionFn = intersection,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        const intersectionPoint = getCircleIntersectionPoint(
          cx1,
          cy1,
          cx2,
          cy2,
          radius,
          intersectionFn,
        );
        if (!intersectionPoint) return;

        const { px, py } = intersectionPoint;
        dotWithTooltip(svg, px, py, name, dotRadius, _store);
      },
    });

    const createCircleIntersectionCircleStep = (
      svg: SVGSVGElement,
      cx1: number,
      cy1: number,
      cx2: number,
      cy2: number,
      radius: number,
      name: string,
      strokeWidth: number,
      _store?: GeometryStore,
      intersectionFn: IntersectionFn = intersection,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        const intersectionPoint = getCircleIntersectionPoint(
          cx1,
          cy1,
          cx2,
          cy2,
          radius,
          intersectionFn,
        );
        if (!intersectionPoint) return;

        const { px, py } = intersectionPoint;
        circleWithTooltip(svg, px, py, radius, name, strokeWidth, _store);
      },
    });

    const createLinesToIntersectionPointsStep = (
      svg: SVGSVGElement,
      c1x: number,
      c1y: number,
      c2x: number,
      c2y: number,
      radius: number,
      strokeWidth: number,
      dotRadius: number,
      _store?: GeometryStore,
      intersectionFn: IntersectionFn = intersection,
      bisectFn: BisectFn = bisect,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        const intersectionPoint = getCircleIntersectionPoint(
          c1x,
          c1y,
          c2x,
          c2y,
          radius,
          intersectionFn,
        );
        if (!intersectionPoint) return;
        const { px, py } = intersectionPoint;

        const { px3, py3, px4, py4 } = getBisectedPoints(
          px,
          py,
          c1x,
          c1y,
          c2x,
          c2y,
          radius,
          bisectFn,
        );

        lineWithTooltip(svg, c2x, c2y, px3, py3, "line_c2_p3", strokeWidth, _store);
        dotWithTooltip(svg, px3, py3, "p3", dotRadius, _store);

        dotWithTooltip(svg, px4, py4, "p4", dotRadius, _store);
        lineWithTooltip(svg, c1x, c1y, px4, py4, "line_c1_p4", strokeWidth, _store);
      },
    });

    const createLinesBetweenPointsStep = (
      svg: SVGSVGElement,
      c1x: number,
      c1y: number,
      c2x: number,
      c2y: number,
      radius: number,
      strokeWidth: number,
      _store?: GeometryStore,
      intersectionFn: IntersectionFn = intersection,
      bisectFn: BisectFn = bisect,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        const intersectionPoint = getCircleIntersectionPoint(
          c1x,
          c1y,
          c2x,
          c2y,
          radius,
          intersectionFn,
        );
        if (!intersectionPoint) return;
        const { px, py } = intersectionPoint;

        const { px3, py3, px4, py4 } = getBisectedPoints(
          px,
          py,
          c1x,
          c1y,
          c2x,
          c2y,
          radius,
          bisectFn,
        );

        lineWithTooltip(svg, c1x, c1y, px3, py3, "line_c1_p3", strokeWidth, _store);
        lineWithTooltip(svg, c2x, c2y, px4, py4, "line_c2_p4", strokeWidth, _store);
      },
    });

    const createLineBetweenP3P4Step = (
      svg: SVGSVGElement,
      c1x: number,
      c1y: number,
      c2x: number,
      c2y: number,
      radius: number,
      strokeWidth: number,
      _store?: GeometryStore,
      intersectionFn: IntersectionFn = intersection,
      bisectFn: BisectFn = bisect,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        const intersectionPoint = getCircleIntersectionPoint(
          c1x,
          c1y,
          c2x,
          c2y,
          radius,
          intersectionFn,
        );
        if (!intersectionPoint) return;
        const { px, py } = intersectionPoint;

        const { px3, py3, px4, py4 } = getBisectedPoints(
          px,
          py,
          c1x,
          c1y,
          c2x,
          c2y,
          radius,
          bisectFn,
        );

        lineWithTooltip(svg, px3, py3, px4, py4, "line_p3_p4", strokeWidth, _store);
      },
    });

    const createCircleIntersectionsStep = (
      svg: SVGSVGElement,
      c1x: number,
      c1y: number,
      c2x: number,
      c2y: number,
      radius: number,
      dotRadius: number,
      _store?: GeometryStore,
      intersectionFn: IntersectionFn = intersection,
      bisectFn: BisectFn = bisect,
      inteceptCircleLineSegFn: InteceptCircleLineSegFn = inteceptCircleLineSeg,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        const intersectionPoint = getCircleIntersectionPoint(
          c1x,
          c1y,
          c2x,
          c2y,
          radius,
          intersectionFn,
        );
        if (!intersectionPoint) return;
        const { px, py } = intersectionPoint;

        const { px3, py3, px4, py4 } = getBisectedPoints(
          px,
          py,
          c1x,
          c1y,
          c2x,
          c2y,
          radius,
          bisectFn,
        );

        const lp_left = inteceptCircleLineSegFn(
          c2x,
          c2y,
          c2x,
          c2y,
          px4,
          py4,
          radius,
        );
        if (lp_left && lp_left.length > 0) {
          const [plx, ply] = lp_left[0];
          dotWithTooltip(svg, plx, ply, "pl", dotRadius, _store);
        }

        const lp_right = inteceptCircleLineSegFn(
          c1x,
          c1y,
          c1x,
          c1y,
          px3,
          py3,
          radius,
        );
        if (lp_right && lp_right.length > 0) {
          const [prx, pry] = lp_right[0];
          dotWithTooltip(svg, prx, pry, "pr", dotRadius, _store);
        }
      },
    });

    const createFinalSquareStep = (
      svg: SVGSVGElement,
      c1x: number,
      c1y: number,
      c2x: number,
      c2y: number,
      radius: number,
      goldenRatio: number,
      _store?: GeometryStore,
      intersectionFn: IntersectionFn = intersection,
      bisectFn: BisectFn = bisect,
      inteceptCircleLineSegFn: InteceptCircleLineSegFn = inteceptCircleLineSeg,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        const intersectionPoint = getCircleIntersectionPoint(
          c1x,
          c1y,
          c2x,
          c2y,
          radius,
          intersectionFn,
        );
        if (!intersectionPoint) return;
        const { px, py } = intersectionPoint;

        const { px3, py3, px4, py4 } = getBisectedPoints(
          px,
          py,
          c1x,
          c1y,
          c2x,
          c2y,
          radius,
          bisectFn,
        );

        let plx: number | undefined, ply: number | undefined, prx: number | undefined, pry: number | undefined;
        const lp_left = inteceptCircleLineSegFn(
          c2x,
          c2y,
          c2x,
          c2y,
          px4,
          py4,
          radius,
        );
        if (lp_left && lp_left.length > 0) {
          [plx, ply] = lp_left[0];
        }
        const lp_right = inteceptCircleLineSegFn(
          c1x,
          c1y,
          c1x,
          c1y,
          px3,
          py3,
          radius,
        );
        if (lp_right && lp_right.length > 0) {
          [prx, pry] = lp_right[0];
        }

        if (plx !== undefined && ply !== undefined && prx !== undefined && pry !== undefined) {
          const s = goldenRatio;
          lineWithTooltip(svg, plx, ply, prx, pry, "ls1", s, _store);
          lineWithTooltip(svg, c2x, c2y, plx, ply, "ls2", s, _store);
          lineWithTooltip(svg, c2x, c2y, c1x, c1y, "ls3", s, _store);
          lineWithTooltip(svg, c1x, c1y, prx, pry, "ls4", s, _store);
        }
      },
    });

    // Create steps with all dependencies passed explicitly
    const steps = [
      createLineStep(svg, lx1, ly1, lx2, ly2, "line_main", stroke, store),
      createDotStep(svg, c1XPosition, ly2, "c1", strokeBig, store),
      createCircleStep(svg, c1XPosition, ly2, circleRadius, "c1_c", stroke, store),
      createDotStep(svg, c2XPosition, ly2, "c2", strokeBig, store),
      createCircleStep(svg, c2XPosition, ly2, circleRadius, "c2_c", stroke, store),
      createCircleIntersectionDotStep(svg, intersectionCx1, intersectionCy1, intersectionCx2, intersectionCy2, circleRadius, "pi", strokeBig, store),
      createCircleIntersectionCircleStep(svg, intersectionCx1, intersectionCy1, intersectionCx2, intersectionCy2, circleRadius, "ci", stroke, store),
      createLinesToIntersectionPointsStep(svg, intersectionCx1, intersectionCy1, intersectionCx2, intersectionCy2, circleRadius, stroke, strokeBig, store),
      createLinesBetweenPointsStep(svg, intersectionCx1, intersectionCy1, intersectionCx2, intersectionCy2, circleRadius, stroke, store),
      createLineBetweenP3P4Step(svg, intersectionCx1, intersectionCy1, intersectionCx2, intersectionCy2, circleRadius, stroke, store),
      createCircleIntersectionsStep(svg, intersectionCx1, intersectionCy1, intersectionCx2, intersectionCy2, circleRadius, strokeBig, store),
      createFinalSquareStep(svg, intersectionCx1, intersectionCy1, intersectionCx2, intersectionCy2, circleRadius, GOLDEN_RATIO, store),
    ];

    // Update steps in parent component
    updateSteps(steps);
  }, [restartKey]); // Re-run when restartKey changes

  // Handle step execution when currentStep, steps, or restartKey changes
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;

    // Clear existing content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Clear the store
    if (store && store.clear) {
      store.clear();
    }

    // Reset SVG dimensions
    svg.setAttribute("viewBox", svgConfig.viewBox);
    svg.setAttribute("width", svgConfig.width.toString());
    svg.setAttribute("height", svgConfig.height.toString());

    const width = svgConfig.width;
    const height = svgConfig.height;
    rect(svg, width, height);

    // Draw all steps up to currentStep
    if (currentStep > 0 && steps && steps.length > 0) {
      const stepsToDraw = Math.min(currentStep, steps.length);
      for (let i = 0; i < stepsToDraw; i++) {
        const step = steps[i];
        if (step && step.drawShapes) {
          step.drawShapes();
        }
      }
    }
  }, [currentStep, restartKey, steps]);

  return (
    <div className={svgConfig.containerClass} style={{ display: "flex", justifyContent: "center" }}>
      <svg ref={svgRef} className={svgConfig.svgClass} style={{ display: "block" }} />
    </div>
  );
}
