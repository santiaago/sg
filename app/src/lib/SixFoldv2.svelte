<script>
  import * as d3 from "d3";
  import {
    circle,
    dot,
    dotWithTooltip,
    drawCircle,
    drawDot,
    drawLine,
    line,
    pointWithTooltip,
    rect,
  } from "../draw/basic";
  import { text } from "../draw/text";
  import { onMount } from "svelte";
  import {
    bisect,
    bisectCircleAndPoint,
    cerclesIntersection,
    circlesIntersection,
    circlesIntersectionPoint,
    directions,
    inteceptCircleLineSeg,
    interceptCircleAndLine,
    lineIntersect,
    linesIntersection,
  } from "../math/intersection";
  import { intersect, intersectLines, Line } from "../math/lines";
  import { distance, Point } from "../math/points";
  import { Circle } from "../math/circles";

  let el;
  export let store;
  export let stroke = 0.5;
  export let strokeMid = 0.5;
  export let strokeBig = 2;
  export let strokeLine = (1 + Math.sqrt(5)) / 2;

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
    const c1 = new Circle(cp1, r);
    const c2 = new Circle(cp2, r);

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
    let cp3;
    let c3;
    {
      const tmp_points = interceptCircleAndLine(c2, l24);
      if (tmp_points && tmp_points.length > 0) {
        cp3 = tmp_points[0];
        c3 = new Circle(cp3, r);
        if (drawDetails) {
          drawDot(svg, cp3, stroke);
        }
      }
    }

    // draw intersection between circle (c1) AND
    // p3
    let cp4;
    let c4;
    {
      const tmp_points = interceptCircleAndLine(c1, l13);
      if (tmp_points && tmp_points.length > 0) {
        cp4 = tmp_points[0];
        c4 = new Circle(cp4, r);
        if (drawDetails) {
          drawDot(svg, cp4, stroke);
        }
      }
    }

    return [c1, c2, c3, c4];
  };

  // from a set of 4 points
  // calculate the intersection 3 of these circles in space
  // circles has shape [[cx, cy, r],... ]
  // returns the 2 coordinates that intersect the circles
  //
  const drawIntersectionPoints = (svg, circles) => {
    //const [[cx1, cy1, r], [cx2, cy2], [], [cx4, cy4]] = circles;

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

  const isPointCloseToCircleBorder = (mouseEvent, cx, cy, r) => {
    const [px, py] = d3.pointer(mouseEvent);
    const dist = distance(px, py, cx, cy);
    // epsilons for distance in and out of circle border
    const eOut = 0.1;
    const eIn = 1.4;
    return (
      (r - eOut) * (r - eOut) <= dist * dist &&
      dist * dist <= (r + eIn) * (r + eIn)
    );
  };

  const addCircleTooltipEvents = (selection, tooltip, cx, cy, d1, stroke) => {
    selection
      .on("mouseover", (d) => {
        if (isPointCloseToCircleBorder(d, cx, cy, d1)) {
          tooltip.map((x) => x.style("opacity", 1));
          d3.select(d.currentTarget).style("stroke-width", strokeMid);
        }
      })
      .on("mouseleave", (d) => {
        if (isPointCloseToCircleBorder(d, cx, cy, d1)) {
        } else {
          tooltip.map((x) => x.style("opacity", 0));
          d3.select(d.currentTarget)
            .style("fill", "transparent")
            .style("opacity", 1)
            .style("stroke-width", stroke);
        }
      });
  };

  onMount(() => {
    let svg = d3.select(el).attr("viewBox", "0 0 300 150");

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
    const p1 = new Point(lx1, ly1);
    const p2 = new Point(lx2, ly2);
    const line1 = new Line(p1, p2);
    // draw first line
    drawLine(svg, line1, stroke);
    // for debug
    // for (let i = 0; i <= 8; i++) {
    //   dot(svg, lx1 + ((lx2 - lx1) * i) / 8, ly1 + 50);
    // }

    const circles = drawSquareFromLine(svg, line1, stroke, false);

    const [[cx1, cy1, r], [cx2, cy2], [cx3, cy3], [cx4, cy4]] = circles.map(
      (c) => [c.p.x, c.p.y, c.r]
    );

    circles.forEach((c, i) => {
      const n = `c${i + 1}`;
      store.add(n, pointWithTooltip(svg, c.p, n, stroke), "point");
    });
    circles.forEach((c, i) => {
      const n = `c${i + 1}`;
      const csvg = circle(svg, c.p.x, c.p.y, r, stroke);
      store.add(`${n}_c`, csvg, "circle");
    });

    {
      [
        line(svg, cx2, cy2, cx1, cy1, strokeLine),
        line(svg, cx2, cy2, cx3, cy3, strokeLine),
        line(svg, cx3, cy3, cx4, cy4, strokeLine),
        line(svg, cx1, cy1, cx4, cy4, strokeLine),
      ].forEach((l, i) => {
        store.add(`l${i}_l`, l, "line");
      });
    }

    const [pic12, pic14] = drawIntersectionPoints(svg, circles);
    [
      { p: pic12, prefix: "12" },
      { p: pic14, prefix: "14" },
    ].forEach((e) => {
      const n = `pic${e.prefix}`;
      store.add(n, pointWithTooltip(svg, e.p, n, stroke), "point");
    });

    [
      { p: pic12, prefix: "12" },
      { p: pic14, prefix: "14" },
    ].forEach((e) => {
      const n = `pic${e.prefix}`;
      const l = line(svg, cx1, cy1, e.p.x, e.p.y, stroke);
      store.add(`${n}_l`, l, "line");
    });

    // draw crossing lines of square
    {
      [
        [line(svg, cx1, cy1, cx3, cy3, stroke), "l13"],
        [line(svg, cx2, cy2, cx4, cy4, stroke), "l24"],
      ].forEach(([l, name], i) => {
        store.add(`${name}_l`, l, "line");
      });
    }

    let pi2;
    {
      const line1 = new Line(circles[0].p, circles[2].p);
      const line2 = new Line(circles[1].p, circles[3].p);
      pi2 = linesIntersection(line1, line2);
    }
    {
      const name = `pi2`;
      store.add(name, pointWithTooltip(svg, pi2, name, stroke), "point");
    }
    // measure distance of intersection points
    const d1 = pic14.distanceToPoint(pi2);

    circles.forEach((c, i) => {
      const cx = c.p.x;
      const cy = c.p.y;
      const tooltip = text(svg, cx, cy, `c${i}-d1`);
      tooltip.map((x) => x.style("opacity", 0));
      drawCircle(svg, new Circle(c.p, d1), stroke).call(
        addCircleTooltipEvents,
        tooltip,
        cx,
        cy,
        d1,
        stroke
      );
    });

    const c14 = new Circle(pic14, d1);
    const c12 = new Circle(pic12, d1);

    [
      { c: c14, prefix: "pic14" },
      { c: c12, prefix: "pic12" },
    ].forEach((e) => {
      const tooltip = text(svg, e.c.p.x, e.c.p.y, `${e.prefix}-d1`);
      tooltip.map((x) => x.style("opacity", 0));
      drawCircle(svg, e.c, stroke).call(
        addCircleTooltipEvents,
        tooltip,
        e.c.p.x,
        e.c.p.y,
        d1,
        stroke
      );
    });

    // find intersection point
    const pi3 = circlesIntersectionPoint(
      c14,
      new Circle(new Point(cx2, cy2), d1),
      directions.right
    );

    // find intersection point
    const pi4 = circlesIntersectionPoint(
      c12,
      new Circle(new Point(cx4, cy4), d1),
      directions.right
    );

    [
      { p: pi3, prefix: "pi3" },
      { p: pi4, prefix: "pi4" },
    ].forEach((e) => {
      store.add(
        e.prefix,
        dotWithTooltip(svg, e.p.x, e.p.y, e.prefix, stroke),
        "point"
      );
    });

    // draw lines
    [pi3, pi4].forEach((p) => {
      drawLine(svg, new Line(new Point(cx1, cy1), p), stroke);
    });

    // compute intersection between lines and cercles
    let pi5;
    {
      const points = interceptCircleAndLine(
        c14,
        new Line(new Point(cx1, cy1), pic14)
      );
      if (points && points.length > 0) {
        pi5 = points[0];
        const name = "prx5";
        store.add(
          name,
          dotWithTooltip(svg, pi5.x, pi5.y, name, stroke),
          "point"
        );
      }
    }

    let pi6;
    {
      const points = interceptCircleAndLine(
        c12,
        new Line(new Point(cx1, cy1), pic12)
      );
      if (points && points.length > 0) {
        pi6 = points[0];
        const n = "prx6";
        store.add(n, dotWithTooltip(svg, pi6.x, pi6.y, n, stroke), "point");
      }
    }

    // looking for intersection of
    // line(center(c1), point(px,py)) AND
    // circle(center(px, py))
    let c23;
    {
      const cx0 = pic14.x - d1;
      const cy0 = pic14.y;
      const angle = Math.atan2(pi5.y - cy0, pi5.x - cx0);
      // translate it into the interval [0,2 π] multiply by 2
      let [x, y] = bisect(angle * 2, d1, pic14.x, pic14.y);
      {
        const n = "c23w";
        store.add(n, dotWithTooltip(svg, x, y, n, stroke), "point");
        line(svg, pic14.x, pic14.y, x, y, stroke);
      }

      const l23 = new Line(new Point(cx2, cy2), new Point(cx3, cy3));
      const l14p = new Line(pic14, new Point(x, y));
      c23 = linesIntersection(l23, l14p);

      let c23s;
      const pi = interceptCircleAndLine(
        new Circle(new Point(cx2, cy2), d1),
        new Line(c23, new Point(cx2, cy2))
      );

      if (pi && pi.length > 0) {
        c23s = pi[0];
        {
          const n = "c23s";
          store.add(n, dotWithTooltip(svg, c23s.x, c23s.y, n, stroke), "point");
        }
      }

      const d2 = c23.distanceToPoint(c23s);
      drawCircle(svg, new Circle(c23, d2), stroke);
      const n = "c23";
      store.add(n, dotWithTooltip(svg, c23.x, c23.y, n, stroke), "point");
    }

    let c34, d2;
    {
      const cx0 = pic12.x - d1;
      const cy0 = pic12.y;
      const angle = Math.atan2(pi6.y - cy0, pi6.x - cx0);
      // translate it into the interval [0,2 π] multiply by 2
      let [x, y] = bisect(angle * 2, d1, pic12.x, pic12.y);
      {
        const n = "c34n";
        store.add(n, dotWithTooltip(svg, x, y, n, stroke), "point");
        drawLine(svg, new Line(pic12, new Point(x, y)), stroke);
      }

      c34 = linesIntersection(
        new Line(new Point(cx3, cy3), new Point(cx4, cy4)),
        new Line(pic12, new Point(x, y))
      );

      let c34e;
      const pi = interceptCircleAndLine(
        new Circle(new Point(cx4, cy4), d1),
        new Line(c34, new Point(cx4, cy4))
      );
      if (pi && pi.length > 0) {
        c34e = pi[0];
        const n = "c34e";
        store.add(n, dotWithTooltip(svg, c34e.x, c34e.y, n, stroke), "point");
      }

      d2 = c34.distanceToPoint(c34e);
      drawCircle(svg, new Circle(c34, d2), stroke);
      const n = "c34";
      store.add(n, dotWithTooltip(svg, c34.x, c34.y, n, stroke), "point");
    }

    //
    // point: pi3x, pi3y
    // cercle: [cx1, cy1],
    // line: [li1pax, li1pay, li1pbx, lipby]
    //let pii1x, pii1y;
    //let pii2x, pii2y;
    let pii1, pii2;
    let d3_;
    {
      const pi = interceptCircleAndLine(
        new Circle(new Point(cx1, cy1), d1),
        new Line(new Point(cx1, cy1), pic14)
      );

      if (pi && pi.length > 0) {
        const pp = pi[0];
        dot(svg, pp.x, pp.y);

        pii1 = intersectLines(
          new Line(pi3, pp),
          new Line(new Point(cx1, cy1), new Point(cx3, cy3))
        );
        if (pii1 != null) {
          const n = "pii1";
          store.add(n, dotWithTooltip(svg, pii1.x, pii1.y, n, stroke), "point");
        }
        pii2 = intersectLines(
          new Line(pi3, pp),
          new Line(new Point(cx2, cy2), new Point(cx4, cy4))
        );
        if (pii2 != null) {
          const n = "pii2";
          store.add(n, dotWithTooltip(svg, pii2.x, pii2.y, n, stroke), "point");
        }
        if (pii1 && pii2) {
          drawLine(svg, new Line(pii1, pii2), stroke);
        }
        d3_ = pii1.distanceToPoint(new Point(cx1, cy1));

        circles.forEach((c, i) => {
          const x = c.p.x;
          const y = c.p.y;
          const tooltip = text(svg, x, y, `c${i + 1}-d3`);
          tooltip.map((x) => x.style("opacity", 0));
          drawCircle(svg, new Circle(c.p, d3_), stroke).call(
            addCircleTooltipEvents,
            tooltip,
            x,
            y,
            d3_,
            stroke
          );
        });
      }
    }

    // show or hide
    drawLine(svg, new Line(new Point(cx2, cy2), pic14), stroke);
    drawLine(svg, new Line(new Point(cx4, cy4), pic12), stroke);

    // end
    // find intersection between 2 segments
    // line (pii1x, pii1y) (pi4x, pi4y)
    // line (cx4, cy4) (px, py)
    let pic4;
    {
      pic4 = intersectLines(
        new Line(pii1, pi4),
        new Line(new Point(cx4, cy4), pic12)
      );
      if (pic4 != null) {
        drawLine(svg, new Line(pii1, pic4), strokeLine);
        const n = "pic4";
        store.add(n, dotWithTooltip(svg, pic4.x, pic4.y, n, stroke), "point");
      }
    }

    // find intersection between 2 segments
    // line (pii1x, pii1y), (pii2x, pii2y)
    // line(cx2, cy2) (pix, piy)
    let pic2x, pic2y;
    let pic2;
    {
      pic2 = intersectLines(
        new Line(pii1, pii2),
        new Line(new Point(cx2, cy2), pic14)
      );
      if (pic2 != null) {
        drawLine(svg, new Line(pii1, pic2), strokeLine);
        const n = "pic2";
        store.add(n, dotWithTooltip(svg, pic2x, pic2y, n, stroke), "point");
      }
    }

    // points for crossing
    //  first point
    //    intersection between
    //    cercle (cx1, cy1, d3_?)
    //    line (cx1, cy1, pi3x, pi3y)
    //  second point
    //    line(cx4, cy4, cx3, cy3)
    //    cercle(cx34, cy34 d2)
    let pic1w;
    let pic34;
    {
      // first point
      let points = interceptCircleAndLine(
        new Circle(new Point(cx1, cy1), d3_),
        new Line(new Point(cx1, cy1), pi3)
      );
      if (points != null && points.length > 0) {
        pic1w = points[0];
        const n = "pic1w";
        store.add(n, dotWithTooltip(svg, pic1w.x, pic1w.y, n, stroke), "point");
      }
      // second point
      points = interceptCircleAndLine(
        new Circle(c34, d2),
        new Line(new Point(cx4, cy4), new Point(cx3, cy3))
      );
      if (points && points.length > 0) {
        pic34 = points[1];
        const n = "pic34";
        store.add(n, dotWithTooltip(svg, pic34.x, pic34.y, n, stroke), "point");
      }
      if (pic1w && pic34) {
        drawLine(svg, new Line(pic1w, pic34), strokeLine);
      }
    }
    // lines between
    //  first point
    //    intersection between
    //    cercle (cx1, cy1, d3_?)
    //    line (cx1, cy1, pi4x, pi4y)
    //  second point
    //    line(cx2, cy2, cx3, cy3)
    //    cercle(cx23, cy23 d2)
    let pic1n, pic23;

    {
      // first point
      let points = interceptCircleAndLine(
        new Circle(new Point(cx1, cy1), d3_),
        new Line(new Point(cx1, cy1), pi4)
      );
      if (points != null && points.length > 0) {
        pic1n = points[0];
        const n = "pic1n";
        store.add(n, dotWithTooltip(svg, pic1n.x, pic1n.y, n, stroke), "point");
      }
      // second point
      points = interceptCircleAndLine(
        new Circle(c23, d2),
        new Line(new Point(cx2, cy2), new Point(cx3, cy3))
      );
      if (points != null && points.length > 0) {
        pic23 = points[1];
        const n = "pic23";
        store.add(n, dotWithTooltip(svg, pic23.x, pic23.y, n, stroke), "point");
      }
      if (pic1n && pic23) {
        drawLine(svg, new Line(pic1n, pic23), strokeLine);
      }
    }
    // lines between
    //  point 1:
    //    circle(cx1, cy1, d1)
    //    line(cx1, cy1, cx2, cy2)
    //  point 2:
    //    circle(cx23, cy23, d2)
    //    line(cx2, cy2, cx3, cy3)
    let pc1w, pc23s;
    {
      // first point
      let points = interceptCircleAndLine(
        new Circle(new Point(cx1, cy1), d1),
        new Line(new Point(cx1, cy1), new Point(cx2, cy2))
      );
      if (points && points.length > 0) {
        pc1w = points[0];
        const n = "pc1w";
        store.add(n, dotWithTooltip(svg, pc1w.x, pc1w.y, n, stroke), "point");
      }
      // second point
      points = interceptCircleAndLine(
        new Circle(c23, d2),
        new Line(new Point(cx2, cy2), new Point(cx3, cy3))
      );
      if (points && points.length > 0) {
        //[pc23sx, pc23sy] = p[0];
        pc23s = points[0];
        const n = "pc23s";
        store.add(n, dotWithTooltip(svg, pc23s.x, pc23s.y, n, stroke), "point");
      }
      if (pc1w && pc23s) {
        drawLine(svg, new Line(pc1w, pc23s), strokeLine);
      }
    }
    // lines between
    //  point 1:
    //    circle(cx1, cy1, d1)
    //    line(cx1, cy1, cx4, cy4)
    //  point 2:
    //    circle(cx34, cy34, d2)
    //    line(cx4, cy4, cx3, cy3)
    let pc1n, pc34e;
    {
      // first point
      let points = interceptCircleAndLine(
        new Circle(new Point(cx1, cy1), d1),
        new Line(new Point(cx1, cy1), new Point(cx4, cy4))
      );
      if (points && points.length > 0) {
        pc1n = points[0];
        const n = "pc1n";
        store.add(n, dotWithTooltip(svg, pc1n.x, pc1n.y, n, stroke), "point");
      }
      // second point
      points = interceptCircleAndLine(
        new Circle(c34, d2),
        new Line(new Point(cx3, cy3), new Point(cx4, cy4))
      );
      if (points && points.length > 0) {
        pc34e = points[1];
        const n = "pc34e";
        store.add(n, dotWithTooltip(svg, pc34e.x, pc34e.y, n, stroke), "point");
      }
      if (pc1n && pc34e) {
        drawLine(svg, new Line(pc1n, pc34e), strokeLine);
      }
    }
    // line between
    //  point 1:
    //    point(pc1nx, pc1ny)
    //    point(pic1nx, pic1ny)
    //  point 2:
    //    point(pc1wx, pc1wy)
    //    point(pic1wx, pic1wy)
    {
      if (pc1n && pic1n) {
        drawLine(svg, new Line(pc1n, pic1n), strokeLine);
      }
      if (pc1w && pic1w) {
        drawLine(svg, new Line(pc1w, pic1w), strokeLine);
      }
    }
    // line between
    //  point 1:
    //    circle(cx3, cy3, d3_)
    //    line(cx3, cy, cx1, cy1)
    //  point 2:
    //    circle(c23x, c23y, d3_)
    //    line(c23x, c23y, cx0, cy0)
    let pc3sw, pc23e;
    {
      let points = interceptCircleAndLine(
        new Circle(new Point(cx3, cy3), d3_),
        new Line(new Point(cx3, cy3), new Point(cx1, cy1))
      );
      if (points && points.length > 0) {
        pc3sw = points[0];
        const n = "pc3sw";
        store.add(n, dotWithTooltip(svg, pc3sw.x, pc3sw.y, n, stroke), "point");
      }
      points = interceptCircleAndLine(
        new Circle(c23, d2),
        new Line(c23, new Point(cx1, cy1))
      );

      if (points && points.length > 0) {
        pc23e = points[0];
        const n = "pc23e";
        store.add(n, dotWithTooltip(svg, pc23e.x, pc23e.y, n, stroke), "point");
      }
      if (pc3sw && pc23e) {
        drawLine(svg, new Line(pc3sw, pc23e), strokeLine);
      }
    }
    // lines between
    //  point 1:
    //    circle(c34x, c34y, d3_)
    //    line(c34x, c34y, c1x, c1y)
    //  point 2:
    //    point(pc3swx, pc3swy)
    //let pc34sx, pc34sy;
    let pc34s;
    {
      let points = interceptCircleAndLine(
        new Circle(c34, d2),
        new Line(c34, new Point(cx1, cy1))
      );
      // const p = inteceptCircleLineSeg(c34.x, c34.y, c34.x, c34.y, cx1, cy1, d2);
      if (points && points.length > 0) {
        pc34s = points[0];
        //[pc34sx, pc34sy] = p[0];
        const n = "pc34s";
        store.add(n, dotWithTooltip(svg, pc34s.x, pc34s.y, n, stroke), "point");
      }
      if (pc3sw && pc34s) {
        drawLine(svg, new Line(pc34s, pc3sw), strokeLine);
      }
    }
    // line between
    // point 1:
    //    point(pc34ex, pc34ey)
    // point 2:
    //    point(pc34sx, pc34sy)
    {
      if (pc34e && pc34s) {
        drawLine(svg, new Line(pc34e, pc34s), strokeLine);
      }
    }
    // line between
    // point 1:
    //    point(pc23sx, pc23sy)
    // point 2:
    //    point(pc23ex, pc23ey)
    {
      if (pc23s && pc23e) {
        drawLine(svg, new Line(pc23s, pc23e), strokeLine);
      }
    }
    // line between
    // point 1:
    //    point(pic4x, pic4y)
    //    point(cx4, cy4)
    {
      if (pic4 && cx4 && cy4) {
        drawLine(svg, new Line(new Point(cx4, cy4), pic4), strokeLine);
      }
    }
    // line between
    // point 1:
    //  point(pic2x, pic2y)
    // point 2:
    //  point(cx2, cy2)
    {
      if (pic2x && pic2y && cx4 && cy4) {
        line(svg, cx2, cy2, pic2x, pic2y, strokeLine);
      }
    }
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
