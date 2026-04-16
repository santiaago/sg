import { useEffect, useRef } from "react";
import type { JSX } from "react";
import { bisect, inteceptCircleLineSeg, intersection } from "@sg/geometry";
import type { SvgConfig } from "../config/svgConfig";
import type { GeometryStore } from "../react-store";
import { rect, dotWithTooltip, lineWithTooltip, circleWithTooltip } from "../svgElements";

const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;

// Helper to set up SVG element with dimensions from config
function setupSvg(svg: SVGSVGElement, config: SvgConfig): void {
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
  svg.setAttribute("viewBox", config.viewBox);
  svg.setAttribute("width", config.width.toString());
  svg.setAttribute("height", config.height.toString());
}

// Geometry configuration computed from width and height
function computeSquareGeometry(width: number, height: number) {
  const STROKE = 0.5;
  const BORDER = height / 3;
  const LINE_LENGTH = width - 2 * BORDER;
  const CIRCLE_RADIUS = LINE_LENGTH / 4;
  const C1_X_POSITION = BORDER + LINE_LENGTH * (5 / 8);
  const C2_X_POSITION = C1_X_POSITION - CIRCLE_RADIUS;
  const ly2 = height - BORDER;

  return {
    STROKE,
    BORDER,
    LINE_LENGTH,
    CIRCLE_RADIUS,
    C1_X_POSITION,
    C2_X_POSITION,
    lx1: BORDER,
    ly1: ly2,
    lx2: width - BORDER,
    ly2,
  };
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

  // Helper function to get circle intersection point
  const getCircleIntersectionPoint = (
    cx1: number,
    cy1: number,
    cx2: number,
    cy2: number,
    r: number,
  ): { px: number; py: number } | null => {
    const points = intersection(cx1, cy1, r, cx2, cy2, r);
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
  ): { px3: number; py3: number; px4: number; py4: number } => {
    const cx0 = px - circleRadius,
      cy0 = py;

    const angle1 = Math.atan2(cy0 - c2y, cx0 - c2x);
    const [px3, py3] = bisect(angle1 * 2, circleRadius, px, py);

    const angle2 = Math.atan2(cy0 - c1y, cx0 - c1x);
    const [px4, py4] = bisect(angle2 * 2, circleRadius, px, py);

    return { px3, py3, px4, py4 };
  };

  // Create steps for incremental drawing
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    setupSvg(svg, svgConfig);

    const width = svgConfig.width;
    const height = svgConfig.height;
    rect(svg, width, height);

    // Compute all geometry configuration once
    const geom = computeSquareGeometry(width, height);

    // Circle intersection parameters
    const intersectionCx1 = geom.C1_X_POSITION;
    const intersectionCy1 = geom.ly2;
    const intersectionCx2 = geom.C2_X_POSITION;
    const intersectionCy2 = geom.ly2;

    const stroke = geom.STROKE;

    // Step creator functions with all dependencies passed as parameters
    const createLineStep = (
      svg: SVGSVGElement,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      name: string,
      strokeWidth: number,
      store?: GeometryStore,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        lineWithTooltip(svg, x1, y1, x2, y2, name, strokeWidth, store);
      },
    });

    const createCircleStep = (
      svg: SVGSVGElement,
      cx: number,
      cy: number,
      r: number,
      circleName: string,
      strokeWidth: number,
      store?: GeometryStore,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        circleWithTooltip(svg, cx, cy, r, circleName, strokeWidth, store);
      },
    });

    const createDotStep = (
      svg: SVGSVGElement,
      cx: number,
      cy: number,
      dotName: string,
      radius: number,
      store?: GeometryStore,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        dotWithTooltip(svg, cx, cy, dotName, radius, store);
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
      store?: GeometryStore,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        const intersectionPoint = getCircleIntersectionPoint(cx1, cy1, cx2, cy2, radius);
        if (!intersectionPoint) return;
        const { px, py } = intersectionPoint;
        dotWithTooltip(svg, px, py, name, dotRadius, store);
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
      store?: GeometryStore,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        const intersectionPoint = getCircleIntersectionPoint(cx1, cy1, cx2, cy2, radius);
        if (!intersectionPoint) return;
        const { px, py } = intersectionPoint;
        circleWithTooltip(svg, px, py, radius, name, strokeWidth, store);
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
      store?: GeometryStore,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        const intersectionPoint = getCircleIntersectionPoint(c1x, c1y, c2x, c2y, radius);
        if (!intersectionPoint) return;
        const { px, py } = intersectionPoint;
        const { px3, py3, px4, py4 } = getBisectedPoints(px, py, c1x, c1y, c2x, c2y, radius);

        lineWithTooltip(svg, c2x, c2y, px3, py3, "line_c2_p3", strokeWidth, store);
        dotWithTooltip(svg, px3, py3, "p3", dotRadius, store);
        dotWithTooltip(svg, px4, py4, "p4", dotRadius, store);
        lineWithTooltip(svg, c1x, c1y, px4, py4, "line_c1_p4", strokeWidth, store);
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
      store?: GeometryStore,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        const intersectionPoint = getCircleIntersectionPoint(c1x, c1y, c2x, c2y, radius);
        if (!intersectionPoint) return;
        const { px, py } = intersectionPoint;
        const { px3, py3, px4, py4 } = getBisectedPoints(px, py, c1x, c1y, c2x, c2y, radius);

        lineWithTooltip(svg, c1x, c1y, px3, py3, "line_c1_p3", strokeWidth, store);
        lineWithTooltip(svg, c2x, c2y, px4, py4, "line_c2_p4", strokeWidth, store);
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
      store?: GeometryStore,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        const intersectionPoint = getCircleIntersectionPoint(c1x, c1y, c2x, c2y, radius);
        if (!intersectionPoint) return;
        const { px, py } = intersectionPoint;
        const { px3, py3, px4, py4 } = getBisectedPoints(px, py, c1x, c1y, c2x, c2y, radius);

        lineWithTooltip(svg, px3, py3, px4, py4, "line_p3_p4", strokeWidth, store);
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
      store?: GeometryStore,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        const intersectionPoint = getCircleIntersectionPoint(c1x, c1y, c2x, c2y, radius);
        if (!intersectionPoint) return;
        const { px, py } = intersectionPoint;
        const { px3, py3, px4, py4 } = getBisectedPoints(px, py, c1x, c1y, c2x, c2y, radius);

        const lp_left = inteceptCircleLineSeg(c2x, c2y, c2x, c2y, px4, py4, radius);
        if (lp_left && lp_left.length > 0) {
          const [plx, ply] = lp_left[0];
          dotWithTooltip(svg, plx, ply, "pl", dotRadius, store);
        }

        const lp_right = inteceptCircleLineSeg(c1x, c1y, c1x, c1y, px3, py3, radius);
        if (lp_right && lp_right.length > 0) {
          const [prx, pry] = lp_right[0];
          dotWithTooltip(svg, prx, pry, "pr", dotRadius, store);
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
      store?: GeometryStore,
    ): Step => ({
      draw: true,
      drawShapes: () => {
        const intersectionPoint = getCircleIntersectionPoint(c1x, c1y, c2x, c2y, radius);
        if (!intersectionPoint) return;
        const { px, py } = intersectionPoint;
        const { px3, py3, px4, py4 } = getBisectedPoints(px, py, c1x, c1y, c2x, c2y, radius);

        let plx: number | undefined,
          ply: number | undefined,
          prx: number | undefined,
          pry: number | undefined;
        const lp_left = inteceptCircleLineSeg(c2x, c2y, c2x, c2y, px4, py4, radius);
        if (lp_left && lp_left.length > 0) {
          [plx, ply] = lp_left[0];
        }
        const lp_right = inteceptCircleLineSeg(c1x, c1y, c1x, c1y, px3, py3, radius);
        if (lp_right && lp_right.length > 0) {
          [prx, pry] = lp_right[0];
        }

        if (plx !== undefined && ply !== undefined && prx !== undefined && pry !== undefined) {
          const s = goldenRatio;
          lineWithTooltip(svg, plx, ply, prx, pry, "ls1", s, store);
          lineWithTooltip(svg, c2x, c2y, plx, ply, "ls2", s, store);
          lineWithTooltip(svg, c2x, c2y, c1x, c1y, "ls3", s, store);
          lineWithTooltip(svg, c1x, c1y, prx, pry, "ls4", s, store);
        }
      },
    });

    // Create steps with all dependencies passed explicitly
    const steps = [
      createLineStep(svg, geom.lx1, geom.ly1, geom.lx2, geom.ly2, "line_main", stroke, store),
      createDotStep(svg, geom.C1_X_POSITION, geom.ly2, "c1", strokeBig, store),
      createCircleStep(
        svg,
        geom.C1_X_POSITION,
        geom.ly2,
        geom.CIRCLE_RADIUS,
        "c1_c",
        stroke,
        store,
      ),
      createDotStep(svg, geom.C2_X_POSITION, geom.ly2, "c2", strokeBig, store),
      createCircleStep(
        svg,
        geom.C2_X_POSITION,
        geom.ly2,
        geom.CIRCLE_RADIUS,
        "c2_c",
        stroke,
        store,
      ),
      createCircleIntersectionDotStep(
        svg,
        intersectionCx1,
        intersectionCy1,
        intersectionCx2,
        intersectionCy2,
        geom.CIRCLE_RADIUS,
        "pi",
        strokeBig,
        store,
      ),
      createCircleIntersectionCircleStep(
        svg,
        intersectionCx1,
        intersectionCy1,
        intersectionCx2,
        intersectionCy2,
        geom.CIRCLE_RADIUS,
        "ci",
        stroke,
        store,
      ),
      createLinesToIntersectionPointsStep(
        svg,
        intersectionCx1,
        intersectionCy1,
        intersectionCx2,
        intersectionCy2,
        geom.CIRCLE_RADIUS,
        stroke,
        strokeBig,
        store,
      ),
      createLinesBetweenPointsStep(
        svg,
        intersectionCx1,
        intersectionCy1,
        intersectionCx2,
        intersectionCy2,
        geom.CIRCLE_RADIUS,
        stroke,
        store,
      ),
      createLineBetweenP3P4Step(
        svg,
        intersectionCx1,
        intersectionCy1,
        intersectionCx2,
        intersectionCy2,
        geom.CIRCLE_RADIUS,
        stroke,
        store,
      ),
      createCircleIntersectionsStep(
        svg,
        intersectionCx1,
        intersectionCy1,
        intersectionCx2,
        intersectionCy2,
        geom.CIRCLE_RADIUS,
        strokeBig,
        store,
      ),
      createFinalSquareStep(
        svg,
        intersectionCx1,
        intersectionCy1,
        intersectionCx2,
        intersectionCy2,
        geom.CIRCLE_RADIUS,
        GOLDEN_RATIO,
        store,
      ),
    ];

    // Update steps in parent component
    updateSteps(steps);
  }, [restartKey]); // Re-run when restartKey changes

  // Handle step execution when currentStep, steps, or restartKey changes
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;

    // Clear the store
    if (store && store.clear) {
      store.clear();
    }

    setupSvg(svg, svgConfig);

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
