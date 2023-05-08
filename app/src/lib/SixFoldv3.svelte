<script>
  import * as d3 from "d3";
  import {
    drawCircle,
    drawDot,
    drawLine,
    pointWithTooltip,
    rect,
  } from "../draw/basic";
  import { text } from "../draw/text";
  import { onMount } from "svelte";
  import {
    bisectCircleAndPoint,
    circlesIntersection,
    circlesIntersectionPoint,
    directions,
    interceptCircleAndLine,
    linesIntersection,
  } from "../math/intersection";
  import { intersectLines, Line } from "../math/lines";
  import { distance, Point } from "../math/points";
  import { Circle } from "../math/circles";
  import { Step } from "../timeline/step";

  let el;
  export let store;
  export let stroke = 0.5;
  export let strokeMid = 0.5;
  export let strokeBig = 2;
  export let strokeLine = (1 + Math.sqrt(5)) / 2;
  export let debug = false;
  export let steps = [];

  // from a line
  // draw a square where the 2 points are a side of the square
  // returns an array with 4 elements
  // each element is the coordinates of each side of the square
  //
  const drawSquareFromLine = (svg, line, stroke, drawDetails) => {
    // draw right side circle
    const cx1 = line.p1.x + ((line.p2.x - line.p1.x) * 5) / 8;
    const cy1 = line.p2.y;
    const r = ((line.p2.x - line.p1.x) * 2) / 8;

    // draw left side circle
    const cx2 = cx1 - r;
    const cy2 = cy1;

    // find intersection point between 2 circles
    const cp1 = new Point(cx1, cy1);
    const cp2 = new Point(cx2, cy2);
    const c1 = new Circle(cp1, r, "c1");
    const c2 = new Circle(cp2, r, "c2");

    let points = circlesIntersection(c1, c2);
    if (!points) {
      return;
    }

    let p1 = points[0];
    let p2 = points[1];
    let p;
    // only pick top intersection
    if (p1.y < p2.y) {
      p = p1;
    } else {
      p = p2;
    }

    const circleAtIntersection = new Circle(p, r);
    // draw circle at intersection point
    if (drawDetails) {
      drawCircle(svg, circleAtIntersection, stroke);
      drawDot(svg, circleAtIntersection.p, stroke);
    }

    // looking for intersection of
    // line(center(c2), point(px,py)) AND
    // circle(center(px, py))
    const p3 = bisectCircleAndPoint(circleAtIntersection, c2.p);
    if (drawDetails) {
      const l = new Line(c2.p, p3);
      drawLine(svg, l, stroke);
      drawDot(svg, p3, stroke);
    }

    // looking for intersection of
    // line(center(c1), point(px,py)) AND
    // circle(center(px, py))
    const p4 = bisectCircleAndPoint(circleAtIntersection, c1.p);
    if (drawDetails) {
      drawDot(svg, p4, stroke);
      const l = new Line(c1.p, p4);
      drawLine(svg, l, stroke);
    }

    // draw lines from cercle(c1) and cercle(c2) with new intersection points
    // p3 and p4
    const l13 = new Line(c1.p, p3);
    const l24 = new Line(c2.p, p4);
    const l34 = new Line(p3, p4);
    if (drawDetails) {
      drawLine(svg, l13, stroke);
      drawLine(svg, l24, stroke);
      drawLine(svg, l34, stroke);
    }

    // draw intersection between center(c2) AND
    // p4
    let cp24;
    let c3;
    {
      const tmp_points = interceptCircleAndLine(c2, l24);
      if (tmp_points && tmp_points.length > 0) {
        cp24 = tmp_points[0];
        c3 = new Circle(cp24, r, "c3");
        if (drawDetails) {
          drawDot(svg, cp24, stroke);
        }
      }
    }

    // draw intersection between circle (c1) AND
    // p3
    let cp13;
    let c4;
    {
      const tmp_points = interceptCircleAndLine(c1, l13);
      if (tmp_points && tmp_points.length > 0) {
        cp13 = tmp_points[0];
        c4 = new Circle(cp13, r, "c4");
        if (drawDetails) {
          drawDot(svg, cp13, stroke);
        }
      }
    }

    return [c1, c2, c3, c4];
  };

  // from a set of 4 circles
  // calculate the intersection 3 of these circles in space
  // returns the 2 points coordinates that intersect the circles
  //
  const drawIntersectionPoints = (svg, circles) => {
    const pic12 = circlesIntersectionPoint(
      circles[0],
      circles[1],
      directions.up
    );

    const pic14 = circlesIntersectionPoint(
      circles[3],
      circles[0],
      directions.left
    );

    return [pic12, pic14];
  };

  const isPointCloseToCircleBorder = (mouseEvent, c) => {
    const [px, py] = d3.pointer(mouseEvent);
    const dist = distance(px, py, c.p.x, c.p.y);
    // epsilons for distance in and out of circle border
    const eOut = 0.1;
    const eIn = 1.4;
    const r = c.r;
    return (
      (r - eOut) * (r - eOut) <= dist * dist &&
      dist * dist <= (r + eIn) * (r + eIn)
    );
  };

  const addCircleTooltipEvents = (selection, tooltip, c, stroke) => {
    selection
      .on("mouseover", (d) => {
        if (isPointCloseToCircleBorder(d, c)) {
          tooltip.map((x) => x.style("opacity", 1));
          d3.select(d.currentTarget).style("stroke-width", strokeMid);
        }
      })
      .on("mouseleave", (d) => {
        if (isPointCloseToCircleBorder(d, c)) {
        } else {
          tooltip.map((x) => x.style("opacity", 0));
          d3.select(d.currentTarget)
            .style("fill", "transparent")
            .style("opacity", 1)
            .style("stroke-width", stroke);
        }
      });
  };

  const intersectLinesAndStore = (svg, line1, line2, name) => {
    let point = intersectLines(line1, line2);
    if (point != null) {
      point.name = name;
      store.add(point, pointWithTooltip(svg, point, stroke));
    }
    return point;
  };

  // todo: remove store part
  const interceptCircleLineAndStore = (svg, circle, line, name, pointIndex) => {
    let points = interceptCircleAndLine(circle, line);
    if (points && points.length > 0) {
      const point = points[pointIndex];
      point.name = name;
      //store.add(point, pointWithTooltip(svg, point, stroke));
      return point;
    }
    return null;
  };

  onMount(() => {
    let svg = d3.select(el).attr("viewBox", "0 0 300 150");

    const drawAndStorePoint = (point) => {
      store.add(point, pointWithTooltip(svg, point, stroke));
    };
    const drawAndStoreLine = (line) => {
      const svgline = drawLine(svg, line, stroke);
      store.add(line, svgline);
    };
    const drawAndStoreCircle = (circle) => {
      const csvg = drawCircle(svg, circle, stroke);

      const drawTooltip = false;
      if (drawTooltip) {
        const tooltip = text(svg, circle.p.x, circle.p.y, circle.name);
        tooltip.map((x) => x.style("opacity", 0));
        csvg.call(addCircleTooltipEvents, tooltip, circle, stroke);
      }

      store.add(circle, csvg);
    };

    const addDrawShapesToAllSteps = (steps) => {
      steps.forEach((step) => {
        step.drawShapes = function () {
          console.log("inside prototype drawShapes");
          this.shapes.forEach((shape) => {
            if (!this.draw) return;
            if (shape.type == "point") {
              drawAndStorePoint(shape);
              return;
            }
            if (shape.type == "line") {
              drawAndStoreLine(shape);
              return;
            }
            if (shape.type == "circle") {
              drawAndStoreCircle(shape);
              return;
            }
            console.error("unknown shape type: " + shape.type);
          });
        };
      });
    };

    const width = 300;
    const height = 150;

    rect(svg, width, height);

    const border = height / 3;

    const [lx1, ly1, lx2, ly2] = [
      border,
      height - border,
      width - border,
      height - border,
    ];
    const p1 = new Point(lx1, ly1, "p1");
    const p2 = new Point(lx2, ly2, "p2");
    const line1 = new Line(p1, p2);

    if (debug) {
      for (let i = 0; i <= 8; i++) {
        pointWithTooltip(svg, lx1 + ((lx2 - lx1) * i) / 8, ly1 + 50);
      }
    }
    const step1 = new Step([p1, p2, line1]);
    steps.push(step1);

    // step 1 finished here

    const circles = drawSquareFromLine(svg, line1, stroke, false);

    const [[cx1, cy1], [cx2, cy2], [cx3, cy3], [cx4, cy4]] = circles.map(
      (c) => [c.p.x, c.p.y, c.r]
    );
    const cp1 = new Point(cx1, cy1, "cp1");
    const cp2 = new Point(cx2, cy2, "cp2");
    const cp3 = new Point(cx3, cy3, "cp3");
    const cp4 = new Point(cx4, cy4, "cp4");

    const step2 = new Step([cp1, cp2, cp3, cp4, ...circles]);
    steps.push(step2);

    const l12 = new Line(cp1, cp2, "l12");
    const l23 = new Line(cp2, cp3, "l23");
    const l34 = new Line(cp3, cp4, "l34");
    const l41 = new Line(cp4, cp1, "l41");

    const step3 = new Step([l12, l23, l34, l41]);
    steps.push(step3);

    const [pic12, pic14] = drawIntersectionPoints(svg, circles);
    pic12.name = "pic12";
    pic14.name = "pic14";

    const step4 = new Step([pic12, pic14]);
    steps.push(step4);

    const lpic12 = new Line(cp1, pic12, "lpic12");
    const lpic14 = new Line(cp1, pic14, "lpic14");

    const step5 = new Step([lpic12, lpic14]);
    steps.push(step5);

    // draw crossing lines of square
    const l13 = new Line(cp1, cp3, "l13");
    const l24 = new Line(cp2, cp4, "l24");

    const step6 = new Step([l13, l24]);
    steps.push(step6);

    let pi2;
    {
      pi2 = linesIntersection(l13, l24);
      pi2.name = "pi2";
      const step7 = new Step([pi2]);
      steps.push(step7);
    }

    // measure distance of intersection points
    const d1 = pic14.distanceToPoint(pi2);

    const c1 = new Circle(cp1, d1, "c1_d1");
    const c2 = new Circle(cp2, d1, "c2_d1");
    const c3 = new Circle(cp3, d1, "c3_d1");
    const c4 = new Circle(cp4, d1, "c4_d1");

    const step8 = new Step([c1, c2, c3, c4]);
    steps.push(step8);

    const c14 = new Circle(pic14, d1, "c14_d1");
    const c12 = new Circle(pic12, d1, "c12_d1");

    const step9 = new Step([c14, c12]);
    steps.push(step9);

    // finish step 4

    // find intersection points
    const pi3 = circlesIntersectionPoint(c14, c2, directions.right);
    const pi4 = circlesIntersectionPoint(c12, c4, directions.right);
    pi3.name = "pi3";
    pi4.name = "pi4";

    const step10 = new Step([pi3, pi4]);
    steps.push(step10);

    // draw lines
    const lcp1pi3 = new Line(cp1, pi3, "lcp1pi3");
    const lcp1pi4 = new Line(cp1, pi4, "lcp1pi4");

    const step11 = new Step([lcp1pi3, lcp1pi4]);
    steps.push(step11);

    // compute intersection between lines and cercles
    let pi5 = interceptCircleLineAndStore(svg, c14, lpic14, "prx5", 0);
    let pi6 = interceptCircleLineAndStore(svg, c12, lpic12, "prx6", 0);

    const step12 = new Step([pi5, pi6]);
    steps.push(step12);

    // finish step 5

    let c23;
    {
      const c23w = bisectCircleAndPoint(c14, pi5);
      c23w.name = "c23w";
      const l14p = new Line(pic14, c23w, "l14p");
      //[l14p].forEach(drawAndStorePoint);
      //drawAndStorePoint(c23w);

      const pc23 = linesIntersection(l23, l14p);
      pc23.name = "pc23";

      const c23s = interceptCircleLineAndStore(
        svg,
        c2,
        new Line(pc23, cp2),
        "c23s",
        0
      );
      //[pc23, c23s].forEach(drawAndStorePoint);

      const d2 = pc23.distanceToPoint(c23s);
      c23 = new Circle(pc23, d2, "c23_d2");
    }

    const step13 = new Step([c23, c23.p]);
    steps.push(step13);

    let c34, d2;
    {
      const cpic12 = new Circle(pic12, d1, "cpic12_d1");
      //[cpic12].forEach(drawAndStoreCircle);
      const c34n = bisectCircleAndPoint(cpic12, pi6);
      c34n.name = "c34n";
      const lpic12c34n = new Line(pic12, c34n);
      //[lpic12c34n].forEach(drawAndStoreLine);
      //[c34n].forEach(drawAndStorePoint);

      const pc34 = linesIntersection(l34, lpic12c34n);
      pc34.name = "pc34";

      const c34e = interceptCircleLineAndStore(
        svg,
        c4,
        new Line(pc34, cp4),
        "c34e",
        0
      );
      //[pc34, c34e].forEach(drawAndStorePoint);

      d2 = pc34.distanceToPoint(c34e);
      c34 = new Circle(pc34, d2, "c34_d2");
    }

    const step14 = new Step([c34, c34.p]);
    steps.push(step14);

    let pii1, pii2;
    {
      const pi = interceptCircleAndLine(c1, lpic14);

      if (pi && pi.length > 0) {
        const pp = pi[0];
        //[pp].forEach(drawAndStorePoint);

        pii1 = linesIntersection(new Line(pi3, pp), l13);
        pii1.name = "pii1";
        pii2 = linesIntersection(new Line(pi3, pp), l24);
        pii2.name = "pii2";
      }
    }

    const step15 = new Step([pii1, pii2]);
    steps.push(step15);

    const lpii1pii2 = new Line(pii1, pii2, "lpii1pii2");

    const step16 = new Step([lpii1pii2]);
    steps.push(step16);

    const d3_ = pii1.distanceToPoint(cp1);

    const c1d3 = new Circle(c1.p, d3_, "c1_d3");
    const c2d3 = new Circle(c2.p, d3_, "c2_d3");
    const c3d3 = new Circle(c3.p, d3_, "c3_d3");
    const c4d3 = new Circle(c4.p, d3_, "c4_d3");

    const step17 = new Step([c1d3, c2d3, c3d3, c4d3]);
    steps.push(step17);

    // finish step 7

    const lcp2pic14 = new Line(cp2, pic14, "lcp2pic14");
    const lcp4pic12 = new Line(cp4, pic12, "lcp4pic12");

    const step18 = new Step([lcp4pic12, lcp2pic14]);
    steps.push(step18);

    const lpii1pi4 = new Line(pii1, pi4);
    const pic4 = linesIntersection(lpii1pi4, lcp4pic12);
    pic4.name = "pic4";
    //const pic4 = intersectLinesAndStore(svg, lpii1pi4, lcp4pic12, "pic4");
    //[lpii1pi4].forEach(drawAndStoreLine);
    //[pic4].forEach(drawAndStorePoint);

    const step19 = new Step([lpii1pi4, pic4]);
    steps.push(step19);

    // finish step 8

    const ol1 = new Line(pii1, pic4);

    const pic2 = linesIntersection(lpii1pii2, lcp2pic14);
    pic2.name = "pic2";
    const ol2 = new Line(pii1, pic2);

    const pic1w = interceptCircleLineAndStore(svg, c1d3, lcp1pi3, "pic1w", 0);
    const pic34 = interceptCircleLineAndStore(svg, c34, l34, "pic34", 0);
    const ol3 = new Line(pic1w, pic34);

    const pic1n = interceptCircleLineAndStore(svg, c1d3, lcp1pi4, "pic1n", 0);
    const pic23 = interceptCircleLineAndStore(svg, c23, l23, "pic23", 1);
    const ol4 = new Line(pic1n, pic23);

    const pc1w = interceptCircleLineAndStore(svg, c1, l12, "pc1w", 0);
    const pc23s = interceptCircleLineAndStore(svg, c23, l23, "pc23s", 0);
    const ol5 = new Line(pc1w, pc23s);

    const pc1n = interceptCircleLineAndStore(svg, c1, l41, "pc1n", 0);
    const pc34e = interceptCircleLineAndStore(svg, c34, l34, "pc34e", 1);
    const ol6 = new Line(pc1n, pc34e);

    const ol7 = new Line(pc1n, pic1n);
    const ol8 = new Line(pc1w, pic1w);

    const step20 = new Step([ol1, ol2, ol3, ol4, ol5, ol6, ol7, ol8]);

    steps.push(step20);

    const pc3sw = interceptCircleLineAndStore(svg, c3d3, l13, "pc3sw", 0);
    const pc23e = interceptCircleLineAndStore(
      svg,
      c23,
      new Line(c23.p, cp1),
      "pc23e",
      0
    );

    const ol9 = new Line(pc3sw, pc23e);

    const pc34s = interceptCircleLineAndStore(
      svg,
      c34,
      new Line(c34.p, cp1),
      "pc34s",
      0
    );
    const ol10 = new Line(pc34s, pc3sw);
    const ol11 = new Line(pc34e, pc34s);
    const ol12 = new Line(pc23s, pc23e);
    const ol13 = new Line(cp4, pic4);
    const ol14 = new Line(cp2, pic2);

    const step21 = new Step([ol9, ol10, ol11, ol12, ol13, ol14]);

    steps.push(step21);
    addDrawShapesToAllSteps(steps);
  });
</script>

<svg bind:this={el} />

<style>
  :global(text) {
    font-family: "monaco", sans-serif;
    font-size: 5px;
    font-weight: bold;
    fill: #fff;
  }
</style>
