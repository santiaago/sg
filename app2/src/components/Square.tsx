import { useEffect, useRef } from "react";
import type { JSX } from "react";
import { bisect, inteceptCircleLineSeg, intersection } from "@sg/geometry";
import type { SvgConfig } from "../config/svgConfig";

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
  store?: any;
  stroke?: number;
  strokeMid?: number;
  strokeBig?: number;
  strokeLine?: number;
  svgConfig: SvgConfig;
  steps?: Step[];
  updateSteps?: (steps: Step[]) => void;
  restartKey?: number;
  currentStep?: number;
}

export function Square({
  store,
  stroke = 0.5,
  strokeMid = 0.5,
  strokeBig = 2,
  strokeLine = (1 + Math.sqrt(5)) / 2,
  svgConfig,
  steps = [],
  updateSteps = () => {},
  restartKey = 0,
  currentStep = 0,
}: SquareProps): JSX.Element {
  // Use parameters to avoid unused warnings
  console.log("Square params:", { stroke, strokeMid, strokeBig, strokeLine, steps });
  const svgRef = useRef<SVGSVGElement>(null);

  // Helper function to draw a dot
  const dot = (svg: SVGSVGElement, x: number, y: number) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("class", "dot");
    circle.setAttribute("cx", x.toString());
    circle.setAttribute("cy", y.toString());
    circle.setAttribute("r", strokeBig.toString()); // Use strokeBig for better visibility
    circle.setAttribute("fill", "black");
    circle.setAttribute("opacity", "1"); // Ensure dot is visible
    svg.appendChild(circle);
    return circle;
  };

  // Helper function to draw a dot with tooltip
  const dotWithTooltip = (
    svg: SVGSVGElement,
    x: number,
    y: number,
    name: string,
  ) => {
    const dotElement = dot(svg, x, y);
    dotElement.setAttribute("data-tooltip", name);
    dotElement.style.cursor = "pointer";

    // Create tooltip element (positioned near the dot)
    const tooltipX = x + 10;
    const tooltipY = y;
    const { tooltip, tooltipBg } = createTooltip(svg, tooltipX, tooltipY, name, 15);

    // Store both tooltip and background
    dotElement.tooltip = tooltip;
    dotElement.tooltipBg = tooltipBg;

    if (store) {
      store.add(name, dotElement, "point");
    }

    return dotElement;
  };

  // Helper function to draw a line
  const line = (
    svg: SVGSVGElement,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    strokeWidth: number = 5,
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
    tooltip.setAttribute("y", (y - 5).toString()); // Adjusted y position
    tooltip.setAttribute("fill", "white"); // White text for contrast
    tooltip.setAttribute("font-size", "10"); // Smaller font to match app
    tooltip.setAttribute("opacity", "0"); // Hidden initially - show only on selection
    tooltip.setAttribute("data-tooltip-text", name);
    tooltip.setAttribute("text-anchor", "middle"); // Center text
    tooltip.setAttribute("dominant-baseline", "middle"); // Center text
    tooltip.textContent = name;

    // Create background rectangle for better visibility
    const tooltipBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const textWidth = name.length * 8;
    const bgX = x - textWidth / 2;
    tooltipBg.setAttribute("x", bgX.toString());
    tooltipBg.setAttribute("y", (y - bgYOffset).toString());
    tooltipBg.setAttribute("width", textWidth.toString());
    tooltipBg.setAttribute("height", "16");
    tooltipBg.setAttribute("fill", "black");
    tooltipBg.setAttribute("opacity", "0"); // Hidden initially
    tooltipBg.setAttribute("rx", "2"); // Slight rounding
    svg.appendChild(tooltipBg);

    // Add both elements to SVG
    svg.appendChild(tooltip);

    return { tooltip, tooltipBg };
  };

  // Helper function to draw a line with tooltip
  const lineWithTooltip = (
    svg: SVGSVGElement,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    name: string,
    strokeWidth: number = 5,
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

    return lineEl;
  };

  // Helper function to draw a rectangle
  const rect = (svg: SVGSVGElement, width: number, height: number) => {
    const rectEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rectEl.setAttribute("width", width.toString());
    rectEl.setAttribute("height", height.toString());
    rectEl.setAttribute("fill", "#fff");
    svg.appendChild(rectEl);
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

  // Helper function to draw a circle with tooltip
  const circleWithTooltip = (
    svg: SVGSVGElement,
    cx: number,
    cy: number,
    r: number,
    name: string,
    stroke: number = 1,
  ) => {
    const circleEl = circle(svg, cx, cy, r, stroke);
    circleEl.style.cursor = "pointer";

    // Create tooltip element (positioned to the right of the circle, moved down slightly)
    const tooltipX = cx + r + 5;
    const tooltipY = cy;
    const { tooltip, tooltipBg } = createTooltip(svg, tooltipX, tooltipY, name, 15);

    // Store both tooltip and background
    circleEl.tooltip = tooltip;
    circleEl.tooltipBg = tooltipBg;

    return circleEl;
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

    let width = svgConfig.width;
    let height = svgConfig.height;
    rect(svg, width, height);

    const border = height / 3;
    const stroke = 0.5;

    const [lx1, ly1, lx2, ly2] = [border, height - border, width - border, height - border];

    // Calculate geometric parameters for better readability
    const lineLength = lx2 - lx1;
    const circleRadius = lineLength * 2 / 8; // 1/4 of line length
    const c1XPosition = lx1 + lineLength * 5 / 8; // c1 at 5/8 from left
    const c2XPosition = c1XPosition - circleRadius; // c2 at 3/8 from left (5/8 - 2/8)
    
    // Circle intersection parameters (calculated once for efficiency)
    const intersectionCx1 = lx1 + ((lx2 - lx1) * 5) / 8;
    const intersectionCy1 = ly2;
    const intersectionCx2 = intersectionCx1 - circleRadius;
    const intersectionCy2 = ly2;

    // Step creator functions (defined inside useEffect where they can access all variables)
    const createLineStep = (x1: number, y1: number, x2: number, y2: number, name: string): Step => ({
      draw: false,
      drawShapes: () => {
        const lineEl = lineWithTooltip(svg, x1, y1, x2, y2, name, stroke);
        if (store) store.add(name, lineEl, "line");
      }
    });

    const createCircleStep = (cx: number, cy: number, r: number, circleName: string): Step => ({
      draw: false,
      drawShapes: () => {
        const circleEl = circleWithTooltip(svg, cx, cy, r, circleName, stroke);
        if (store) {
          store.add(circleName, circleEl, "circle");
        }
      }
    });

    const createDotStep = (cx: number, cy: number, dotName: string): Step => ({
      draw: false,
      drawShapes: () => {
        const dotEl = dotWithTooltip(svg, cx, cy, dotName);
        if (store) {
          store.add(dotName, dotEl, "point");
        }
      }
    });

    // Helper function to get circle intersection point
    const getCircleIntersectionPoint = (): {px: number, py: number} | null => {
      const points = intersection(intersectionCx1, intersectionCy1, circleRadius, intersectionCx2, intersectionCy2, circleRadius);
      if (!points) return null;
      
      const px1 = points[0], py1 = points[1];
      const px2 = points[2], py2 = points[3];
      const px = py1 < py2 ? px1 : px2;
      const py = py1 < py2 ? py1 : py2;
      
      return { px, py };
    };

    const createCircleIntersectionDotStep = (): Step => {
      return {
        draw: false,
        drawShapes: () => {
          const intersectionPoint = getCircleIntersectionPoint();
          if (!intersectionPoint) return;
          
          const { px, py } = intersectionPoint;
          
          // draw dot at intersection point
          const intersectionDot = dotWithTooltip(svg, px, py, "pi");
          if (store) {
            store.add("pi", intersectionDot, "point");
          }
        }
      };
    };

    const createCircleIntersectionCircleStep = (): Step => {
      return {
        draw: false,
        drawShapes: () => {
          const intersectionPoint = getCircleIntersectionPoint();
          if (!intersectionPoint) return;
          
          const { px, py } = intersectionPoint;
          const r = circleRadius;          
          // draw circle at intersection point
          const intersectionCircle = circleWithTooltip(svg, px, py, r, "ci", stroke);
          if (store) {
            store.add("ci", intersectionCircle, "circle");
          }
        }
      };
    };

    const createLinesToIntersectionPointsStep = (): Step => {
      return {
        draw: false,
        drawShapes: () => {
          let points = intersection(intersectionCx1, intersectionCy1, circleRadius, intersectionCx2, intersectionCy2, circleRadius);
          if (!points) return;
          
          let px, py;
          const px1 = points[0], py1 = points[1];
          const px2 = points[2], py2 = points[3];
          px = py1 < py2 ? px1 : px2;
          py = py1 < py2 ? py1 : py2;
          
          const x1 = intersectionCx2, y1 = intersectionCy2;
          const cx0 = px - circleRadius, cy0 = py;
          
          // looking for intersection of line(center(c2), point(px,py)) AND circle(center(px, py))
          let angle = Math.atan2(cy0 - y1, cx0 - x1);
          // translate it into the interval [0,2 π] multiply by 2
          let [px3, py3] = bisect(angle * 2, circleRadius, px, py);
          const line_c2_p3 = lineWithTooltip(svg, x1, y1, px3, py3, "line_c2_p3", stroke);
          const dot_p3 = dotWithTooltip(svg, px3, py3, "p3");
          if (store) {
            store.add("line_c2_p3", line_c2_p3, "line");
            store.add("p3", dot_p3, "point");
          }
          
          // looking for intersection of line(center(c1), point(px,py)) AND circle(center(px, py))
          angle = Math.atan2(cy0 - intersectionCy1, cx0 - intersectionCx1);
          // translate it into the interval [0,2 π] multiply by 2
          let [px4, py4] = bisect(angle * 2, circleRadius, px, py);
          const dot_p4 = dotWithTooltip(svg, px4, py4, "p4");
          const line_c1_p4 = lineWithTooltip(svg, intersectionCx1, intersectionCy1, px4, py4, "line_c1_p4", stroke);
          if (store) {
            store.add("p4", dot_p4, "point");
            store.add("line_c1_p4", line_c1_p4, "line");
          }
        }
      };
    };

    const createLinesBetweenPointsStep = (): Step => {
      return {
        draw: false,
        drawShapes: () => {
          let points = intersection(intersectionCx1, intersectionCy1, circleRadius, intersectionCx2, intersectionCy2, circleRadius);
          if (!points) return;
          
          let px, py;
          const px1 = points[0], py1 = points[1];
          const px2 = points[2], py2 = points[3];
          px = py1 < py2 ? px1 : px2;
          py = py1 < py2 ? py1 : py2;
          
          const cx0 = px - circleRadius, cy0 = py;
          let angle = Math.atan2(cy0 - intersectionCy2, cx0 - intersectionCx2);
          let [px3, py3] = bisect(angle * 2, circleRadius, px, py);
          angle = Math.atan2(cy0 - intersectionCy1, cx0 - intersectionCx1);
          let [px4, py4] = bisect(angle * 2, circleRadius, px, py);
          
          // draw lines from cercle(c1) and cercle(c2) with new intersection points
          // p3 and p4
          const line_c1_p3 = lineWithTooltip(svg, intersectionCx1, intersectionCy1, px3, py3, "line_c1_p3", stroke);
          const line_c2_p4 = lineWithTooltip(svg, intersectionCx2, intersectionCy2, px4, py4, "line_c2_p4", stroke);
          if (store) {
            store.add("line_c1_p3", line_c1_p3, "line");
            store.add("line_c2_p4", line_c2_p4, "line");
          }
        }
      };
    };

    const createLineBetweenP3P4Step = (): Step => {
      return {
        draw: false,
        drawShapes: () => {
          let points = intersection(intersectionCx1, intersectionCy1, circleRadius, intersectionCx2, intersectionCy2, circleRadius);
          if (!points) return;
          
          let px, py;
          const px1 = points[0], py1 = points[1];
          const px2 = points[2], py2 = points[3];
          px = py1 < py2 ? px1 : px2;
          py = py1 < py2 ? py1 : py2;
          
          const cx0 = px - circleRadius, cy0 = py;
          let angle = Math.atan2(cy0 - intersectionCy2, cx0 - intersectionCx2);
          let [px3, py3] = bisect(angle * 2, circleRadius, px, py);
          angle = Math.atan2(cy0 - intersectionCy1, cx0 - intersectionCx1);
          let [px4, py4] = bisect(angle * 2, circleRadius, px, py);
          
          // draw line between p3 and p4
          const line_p3_p4 = lineWithTooltip(svg, px3, py3, px4, py4, "line_p3_p4", stroke);
          if (store) store.add("line_p3_p4", line_p3_p4, "line");
        }
      };
    };

    const createCircleIntersectionsStep = (): Step => {
      return {
        draw: false,
        drawShapes: () => {
          let points = intersection(intersectionCx1, intersectionCy1, circleRadius, intersectionCx2, intersectionCy2, circleRadius);
          if (!points) return;
          
          let px, py;
          const px1 = points[0], py1 = points[1];
          const px2 = points[2], py2 = points[3];
          px = py1 < py2 ? px1 : px2;
          py = py1 < py2 ? py1 : py2;
          
          const cx0 = px - circleRadius, cy0 = py;
          let angle = Math.atan2(cy0 - intersectionCy2, cx0 - intersectionCx2);
          let [px3, py3] = bisect(angle * 2, circleRadius, px, py);
          angle = Math.atan2(cy0 - intersectionCy1, cx0 - intersectionCx1);
          let [px4, py4] = bisect(angle * 2, circleRadius, px, py);
          
          // draw intersection between center(c2) AND
          // p4
          let plx, ply;
          let lp_left = inteceptCircleLineSeg(intersectionCx2, intersectionCy2, intersectionCx2, intersectionCy2, px4, py4, circleRadius);
          if (lp_left && lp_left.length > 0) {
            [plx, ply] = lp_left[0];
            const dot_left_intersection = dotWithTooltip(svg, plx, ply, "pl");
            if (store) store.add("pl", dot_left_intersection, "point");
          }
          
          // draw intersection between center (c1) AND
          // p3
          let prx, pry;
          let lp_right = inteceptCircleLineSeg(intersectionCx1, intersectionCy1, intersectionCx1, intersectionCy1, px3, py3, circleRadius);
          if (lp_right && lp_right.length > 0) {
            [prx, pry] = lp_right[0];
            const dot_right_intersection = dotWithTooltip(svg, prx, pry, "pr");
            if (store) store.add("pr", dot_right_intersection, "point");
          }
        }
      };
    };

    const createFinalSquareStep = (): Step => {
      return {
        draw: false,
        drawShapes: () => {
          let points = intersection(intersectionCx1, intersectionCy1, circleRadius, intersectionCx2, intersectionCy2, circleRadius);
          if (!points) return;
          
          let px, py;
          const px1 = points[0], py1 = points[1];
          const px2 = points[2], py2 = points[3];
          px = py1 < py2 ? px1 : px2;
          py = py1 < py2 ? py1 : py2;
          
          const cx0 = px - circleRadius, cy0 = py;
          let angle = Math.atan2(cy0 - intersectionCy2, cx0 - intersectionCx2);
          let [px3, py3] = bisect(angle * 2, circleRadius, px, py);
          angle = Math.atan2(cy0 - intersectionCy1, cx0 - intersectionCx1);
          let [px4, py4] = bisect(angle * 2, circleRadius, px, py);
          
          let plx, ply, prx, pry;
          let lp_left = inteceptCircleLineSeg(intersectionCx2, intersectionCy2, intersectionCx2, intersectionCy2, px4, py4, circleRadius);
          if (lp_left && lp_left.length > 0) [plx, ply] = lp_left[0];
          let lp_right = inteceptCircleLineSeg(intersectionCx1, intersectionCy1, intersectionCx1, intersectionCy1, px3, py3, circleRadius);
          if (lp_right && lp_right.length > 0) [prx, pry] = lp_right[0];
          
          if (plx && ply && prx && pry) {
            const s = (1 + Math.sqrt(5)) / 2;
            // draw final square
            const square_line1 = lineWithTooltip(svg, plx, ply, prx, pry, "ls1", s);
            const square_line2 = lineWithTooltip(svg, intersectionCx2, intersectionCy2, plx, ply, "ls2", s);
            const square_line3 = lineWithTooltip(svg, intersectionCx2, intersectionCy2, intersectionCx1, intersectionCy1, "ls3", s);
            const square_line4 = lineWithTooltip(svg, intersectionCx1, intersectionCy1, prx, pry, "ls4", s);
            if (store) {
              store.add("ls1", square_line1, "line");
              store.add("ls2", square_line2, "line");
              store.add("ls3", square_line3, "line");
              store.add("ls4", square_line4, "line");
            }
          }
        }
      };
    };

    // Create steps using the cleaner step creator functions with named variables
    const steps = [
      createLineStep(lx1, ly1, lx2, ly2, "line_main"),          // Step 1: Draw main baseline
      createDotStep(c1XPosition, ly2, "c1"),                    // Step 2: Draw right dot (c1)
      createCircleStep(c1XPosition, ly2, circleRadius, "c1_c"),  // Step 3: Draw right circle (c1)
      createDotStep(c2XPosition, ly2, "c2"),                    // Step 4: Draw left dot (c2)
      createCircleStep(c2XPosition, ly2, circleRadius, "c2_c"),  // Step 5: Draw left circle (c2)
      createCircleIntersectionDotStep(),                         // Step 6: Find circle intersection dot (pi)
      createCircleIntersectionCircleStep(),                     // Step 7: Find circle intersection circle (ci)
      createLinesToIntersectionPointsStep(),                    // Step 8: Draw lines to intersection points
      createLinesBetweenPointsStep(),                            // Step 9: Connect circle centers to new points
      createLineBetweenP3P4Step(),                              // Step 10: Connect p3 and p4
      createCircleIntersectionsStep(),                           // Step 11: Find final circle intersections
      createFinalSquareStep()                                    // Step 12: Draw the completed square
    ];

    // Update steps in parent component
    updateSteps(steps);

    // Draw first step immediately
    if (steps.length > 0 && steps[0]) {
      steps[0].draw = true;
      steps[0].drawShapes();
    }
  }, [restartKey]); // Re-run when restartKey changes

  // Handle step execution when currentStep changes
  useEffect(() => {
    if (currentStep > 0 && currentStep <= steps.length) {
      const stepToExecute = steps[currentStep - 1]; // steps are 0-indexed, currentStep is 1-indexed
      if (stepToExecute) {
        stepToExecute.drawShapes();
      }
    }
  }, [currentStep]);

  return (
    <div className={svgConfig.containerClass} style={{ display: 'flex', justifyContent: 'center' }}>
      <svg ref={svgRef} className={svgConfig.svgClass} style={{ display: 'block' }} />
    </div>
  );
}
