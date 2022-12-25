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
    rect,
  } from "../draw/basic";
  import { text } from "../draw/text";
  import { onMount } from "svelte";
  import {
    bisect,
    bisectCircleAndPoint,
    cerclesIntersection,
    circlesIntersection,
    directions,
    inteceptCircleLineSeg,
    interceptCircleAndLine,
    lineIntersect,
  } from "../math/intersection";
  import { intersect, Line } from "../math/lines";
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
    const [[cx1, cy1, r], [cx2, cy2], [], [cx4, cy4]] = circles;

    const [pic12nx, pic12ny] = cerclesIntersection(
      cx1,
      cy1,
      r,
      cx2,
      cy2,
      r,
      directions.up
    );

    const [pic14x, pic14y] = cerclesIntersection(
      cx4,
      cy4,
      r,
      cx1,
      cy1,
      r,
      directions.left
    );

    return [
      [pic12nx, pic12ny],
      [pic14x, pic14y],
    ];
  };

  // from set of 4 points find the intersection point
  //
  const drawLinesIntersectionPoint = (svg, circles) => {
    const [[cx1, cy1, r], [cx2, cy2], [cx3, cy3], [cx4, cy4]] = circles;

    const [pi2x, pi2y] = lineIntersect(cx1, cy1, cx3, cy3, cx4, cy4, cx2, cy2);

    return [pi2x, pi2y];
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
      store.add(n, dotWithTooltip(svg, c.p.x, c.p.y, n, stroke), "point");
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

    const [[pic12nx, pic12ny], [pic14x, pic14y]] = drawIntersectionPoints(
      svg,
      circles.map((c) => [c.p.x, c.p.y, c.r])
    );
    [
      [pic12nx, pic12ny, "12"],
      [pic14x, pic14y, "14"],
    ].forEach(([x, y, prefix]) => {
      const n = `pic${prefix}`;
      store.add(n, dotWithTooltip(svg, x, y, n, stroke), "point");
    });
    [
      [pic12nx, pic12ny, "12"],
      [pic14x, pic14y, "14"],
    ].forEach(([x, y, prefix]) => {
      const n = `pic${prefix}`;
      const l = line(svg, cx1, cy1, x, y, stroke);
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

    const [pi2x, pi2y] = drawLinesIntersectionPoint(
      svg,
      circles.map((c) => [c.p.x, c.p.y, c.r])
    );
    {
      const name = `pi2`;
      store.add(name, dotWithTooltip(svg, pi2x, pi2y, name, stroke), "point");
    }
    // <---- we are here
    // measure distance of intersection points
    const d1 = distance(pic14x, pic14y, pi2x, pi2y);

    circles.forEach((c, i) => {
      const cx = c.p.x;
      const cy = c.p.y;
      const tooltip = text(svg, cx, cy, `c${i}-d1`);
      tooltip.map((x) => x.style("opacity", 0));
      circle(svg, cx, cy, d1, stroke).call(
        addCircleTooltipEvents,
        tooltip,
        cx,
        cy,
        d1,
        stroke
      );
    });

    [
      [pic14x, pic14y, "pic14"],
      [pic12nx, pic12ny, "pic12"],
    ].forEach(([cx, cy, prefix]) => {
      const tooltip = text(svg, cx, cy, `${prefix}-d1`);
      tooltip.map((x) => x.style("opacity", 0));
      circle(svg, cx, cy, d1, stroke).call(
        addCircleTooltipEvents,
        tooltip,
        cx,
        cy,
        d1,
        stroke
      );
    });

    // find intersection point
    const [pi3x, pi3y] = cerclesIntersection(
      pic14x,
      pic14y,
      d1,
      cx2,
      cy2,
      d1,
      directions.right
    );
    // find intersection point
    const [pi4x, pi4y] = cerclesIntersection(
      pic12nx,
      pic12ny,
      d1,
      cx4,
      cy4,
      d1,
      directions.right
    );

    [
      [pi3x, pi3y, "pi3"],
      [pi4x, pi4y, "pi4"],
    ].forEach(([x, y, prefix]) => {
      store.add(prefix, dotWithTooltip(svg, x, y, prefix, stroke), "point");
    });

    // draw lines
    [
      [pi3x, pi3y],
      [pi4x, pi4y],
    ].forEach(([x, y]) => {
      line(svg, cx1, cy1, x, y, stroke);
    });

    // compute intersection between lines and cercles
    let prx5, pry5;
    let pi5 = inteceptCircleLineSeg(
      pic14x,
      pic14y,
      cx1,
      cy1,
      pic14x,
      pic14y,
      d1
    );
    if (pi5 && pi5.length > 0) {
      [prx5, pry5] = pi5[0];
      const name = "prx5";
      store.add(name, dotWithTooltip(svg, prx5, pry5, name, stroke), "point");
    }
    let prx6, pry6;
    let pi6 = inteceptCircleLineSeg(
      pic12nx,
      pic12ny,
      cx1,
      cy1,
      pic12nx,
      pic12ny,
      d1
    );
    if (pi6 && pi6.length > 0) {
      [prx6, pry6] = pi6[0];
      const n = "prx6";
      store.add(n, dotWithTooltip(svg, prx6, pry6, n, stroke), "point");
    }

    // looking for intersection of
    // line(center(c1), point(px,py)) AND
    // circle(center(px, py))
    let cx23, cy23;
    {
      const cx0 = pic14x - d1;
      const cy0 = pic14y;
      const angle = Math.atan2(pry5 - cy0, prx5 - cx0);
      // translate it into the interval [0,2 π] multiply by 2
      let [x, y] = bisect(angle * 2, d1, pic14x, pic14y);
      {
        const n = "c23w";
        store.add(n, dotWithTooltip(svg, x, y, n, stroke), "point");
        line(svg, pic14x, pic14y, x, y, stroke);
      }

      const [px, py] = lineIntersect(cx2, cy2, cx3, cy3, pic14x, pic14y, x, y);
      //dot(svg, px, py);

      let prx, pry;
      const pi = inteceptCircleLineSeg(cx2, cy2, px, py, cx2, cy2, d1);
      if (pi && pi.length > 0) {
        [prx, pry] = pi[0];
        {
          const n = "c23s";
          store.add(n, dotWithTooltip(svg, prx, pry, n, stroke), "point");
        }
      }

      const d2 = distance(px, py, prx, pry);
      circle(svg, px, py, d2, stroke);
      [cx23, cy23] = [px, py];
      const n = "c23";
      store.add(n, dotWithTooltip(svg, cx23, cy23, n, stroke), "point");
    }
    let cx34, cy34, d2;
    {
      const cx0 = pic12nx - d1;
      const cy0 = pic12ny;
      const angle = Math.atan2(pry6 - cy0, prx6 - cx0);
      // translate it into the interval [0,2 π] multiply by 2
      let [x, y] = bisect(angle * 2, d1, pic12nx, pic12ny);
      {
        const n = "c34n";
        store.add(n, dotWithTooltip(svg, x, y, n, stroke), "point");
        line(svg, pic12nx, pic12ny, x, y, stroke);
      }

      const [px, py] = lineIntersect(
        cx3,
        cy3,
        cx4,
        cy4,
        pic12nx,
        pic12ny,
        x,
        y
      );
      //dot(svg, px, py);

      let prx, pry;
      const pi = inteceptCircleLineSeg(cx4, cy4, px, py, cx4, cy4, d1);
      if (pi && pi.length > 0) {
        [prx, pry] = pi[0];
        const n = "c34e";
        store.add(n, dotWithTooltip(svg, prx, pry, n, stroke), "point");
      }

      d2 = distance(px, py, prx, pry);
      circle(svg, px, py, d2, stroke);
      [cx34, cy34] = [px, py];
      const n = "c34";
      store.add(n, dotWithTooltip(svg, cx34, cy34, n, stroke), "point");
    }
    //
    // point: pi3x, pi3y
    // cercle: [cx1, cy1],
    // line: [li1pax, li1pay, li1pbx, lipby]
    let pii1x, pii1y;
    let pii2x, pii2y;
    let d3_;
    {
      const pi = inteceptCircleLineSeg(cx1, cy1, cx1, cy1, pic14x, pic14y, d1);
      if (pi && pi.length > 0) {
        const [x, y] = pi[0];
        dot(svg, x, y);
        let x1, y1, x2, y2;
        let p = intersect(pi3x, pi3y, x, y, cx1, cy1, cx3, cy3);
        if (p && p.length > 0) {
          [x1, y1] = p;
          [pii1x, pii1y] = p;
          const n = "pii1";
          store.add(n, dotWithTooltip(svg, pii1x, pii1y, n, stroke), "point");
        }
        p = intersect(pi3x, pi3y, x, y, cx2, cy2, cx4, cy4);
        if (p && p.length > 0) {
          [x2, y2] = p;
          [pii2x, pii2y] = p;
          const n = "pii2";
          store.add(n, dotWithTooltip(svg, pii2x, pii2y, n, stroke), "point");
        }
        if (x1 && y1 && x2 && y2) {
          line(svg, x1, y1, x2, y2, stroke);
        }
        d3_ = distance(cx1, cy1, x1, y1);
        circles.forEach((c, i) => {
          const x = c.p.x;
          const y = c.p.y;
          const tooltip = text(svg, x, y, `c${i + 1}-d3`);
          tooltip.map((x) => x.style("opacity", 0));
          circle(svg, x, y, d3_, stroke).call(
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
    line(svg, cx2, cy2, pic14x, pic14y, stroke);
    line(svg, cx4, cy4, pic12nx, pic12ny, stroke);
    // end
    // find intersection between 2 segments
    // line (pii1x, pii1y) (pi4x, pi4y)
    // line (cx4, cy4) (px, py)
    let pic4x, pic4y;
    {
      let p = intersect(pii1x, pii1y, pi4x, pi4y, cx4, cy4, pic12nx, pic12ny);
      if (p && p.length > 0) {
        [pic4x, pic4y] = p;
        line(svg, pii1x, pii1y, pic4x, pic4y, strokeLine);
        const n = "pic4";
        store.add(n, dotWithTooltip(svg, pic4x, pic4y, n, stroke), "point");
      }
    }

    // find intersection between 2 segments
    // line (pii1x, pii1y), (pii2x, pii2y)
    // line(cx2, cy2) (pix, piy)
    let pic2x, pic2y;
    {
      let p = intersect(pii1x, pii1y, pii2x, pii2y, cx2, cy2, pic14x, pic14y);
      if (p && p.length > 0) {
        [pic2x, pic2y] = p;
        line(svg, pii1x, pii1y, pic2x, pic2y, strokeLine);
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
    let pic1wx, pic1wy;
    {
      // first point
      let p = inteceptCircleLineSeg(cx1, cy1, cx1, cy1, pi3x, pi3y, d3_);
      if (p && p.length > 0) {
        [pic1wx, pic1wy] = p[0];
        const n = "pic1w";
        store.add(n, dotWithTooltip(svg, pic1wx, pic1wy, n, stroke), "point");
      }
      // second point
      let pic34x, pic34y;
      p = inteceptCircleLineSeg(cx34, cy34, cx4, cy4, cx3, cy3, d2);
      if (p && p.length > 0) {
        [pic34x, pic34y] = p[1];
        const n = "pic34";
        store.add(n, dotWithTooltip(svg, pic34x, pic34y, n, stroke), "point");
      }
      if (pic1wx && pic1wy && pic34x && pic34y) {
        line(svg, pic1wx, pic1wy, pic34x, pic34y, strokeLine);
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
    let pic1nx, pic1ny;
    {
      // first point
      let p = inteceptCircleLineSeg(cx1, cy1, cx1, cy1, pi4x, pi4y, d3_);
      if (p && p.length > 0) {
        [pic1nx, pic1ny] = p[0];
        const n = "pic1n";
        store.add(n, dotWithTooltip(svg, pic1nx, pic1ny, n, stroke), "point");
      }
      // second point
      let pic23x, pic23y;
      p = inteceptCircleLineSeg(cx23, cy23, cx2, cy2, cx3, cy3, d2);
      if (p && p.length > 0) {
        [pic23x, pic23y] = p[1];
        const n = "pic23";
        store.add(n, dotWithTooltip(svg, pic23x, pic23y, n, stroke), "point");
      }
      if (pic1nx && pic1ny && pic23x && pic23y) {
        line(svg, pic1nx, pic1ny, pic23x, pic23y, strokeLine);
      }
    }
    // lines between
    //  point 1:
    //    circle(cx1, cy1, d1)
    //    line(cx1, cy1, cx2, cy2)
    //  point 2:
    //    circle(cx23, cy23, d2)
    //    line(cx2, cy2, cx3, cy3)
    let pc1wx, pc1wy;
    let pc23sx, pc23sy;
    {
      // first point
      let p = inteceptCircleLineSeg(cx1, cy1, cx1, cy1, cx2, cy2, d1);
      if (p && p.length > 0) {
        [pc1wx, pc1wy] = p[0];
        const n = "pc1w";
        store.add(n, dotWithTooltip(svg, pc1wx, pc1wy, n, stroke), "point");
      }
      // second point
      p = inteceptCircleLineSeg(cx23, cy23, cx2, cy2, cx3, cy3, d2);
      if (p && p.length > 0) {
        [pc23sx, pc23sy] = p[0];
        const n = "pc23s";
        store.add(n, dotWithTooltip(svg, pc23sx, pc23sy, n, stroke), "point");
      }
      if (pc1wx && pc1wy && pc23sx && pc23sy) {
        line(svg, pc1wx, pc1wy, pc23sx, pc23sy, strokeLine);
      }
    }
    // lines between
    //  point 1:
    //    circle(cx1, cy1, d1)
    //    line(cx1, cy1, cx4, cy4)
    //  point 2:
    //    circle(cx34, cy34, d2)
    //    line(cx4, cy4, cx3, cy3)
    let pc1nx, pc1ny;
    let pc34ex, pc34ey;
    {
      // first point
      let p = inteceptCircleLineSeg(cx1, cy1, cx1, cy1, cx4, cy4, d1);
      if (p && p.length > 0) {
        [pc1nx, pc1ny] = p[0];
        const n = "pc1n";
        store.add(n, dotWithTooltip(svg, pc1nx, pc1ny, n, stroke), "point");
      }
      // second point
      p = inteceptCircleLineSeg(cx34, cy34, cx3, cy3, cx4, cy4, d2);
      if (p && p.length > 0) {
        [pc34ex, pc34ey] = p[1];
        const n = "pc34e";
        store.add(n, dotWithTooltip(svg, pc34ex, pc34ey, n, stroke), "point");
      }
      if (pc1nx && pc1ny && pc34ex && pc34ey) {
        line(svg, pc1nx, pc1ny, pc34ex, pc34ey, strokeLine);
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
      if (pc1nx && pc1ny && pic1nx && pic1ny) {
        line(svg, pc1nx, pc1ny, pic1nx, pic1ny, strokeLine);
      }
      if (pc1wx && pc1wy && pic1wx && pic1wy) {
        line(svg, pc1wx, pc1wy, pic1wx, pic1wy, strokeLine);
      }
    }
    // line between
    //  point 1:
    //    circle(cx3, cy3, d3_)
    //    line(cx3, cy, cx1, cy1)
    //  point 2:
    //    circle(c23x, c23y, d3_)
    //    line(c23x, c23y, cx0, cy0)
    let pc3swx, pc3swy;
    let pc23ex, pc23ey;
    {
      const p = inteceptCircleLineSeg(cx3, cy3, cx3, cy3, cx1, cy1, d3_);
      if (p && p.length > 0) {
        [pc3swx, pc3swy] = p[0];
        const n = "pc3sw";
        store.add(n, dotWithTooltip(svg, pc3swx, pc3swy, n, stroke), "point");
      }
      const p2 = inteceptCircleLineSeg(cx23, cy23, cx23, cy23, cx1, cy1, d2);
      if (p2 && p2.length > 0) {
        [pc23ex, pc23ey] = p2[0];
        const n = "pc23e";
        store.add(n, dotWithTooltip(svg, pc23ex, pc23ey, n, stroke), "point");
      }
      if (pc3swx && pc3swy && pc23ex && pc23ey) {
        line(svg, pc3swx, pc3swy, pc23ex, pc23ey, strokeLine);
      }
    }
    // lines between
    //  point 1:
    //    circle(c34x, c34y, d3_)
    //    line(c34x, c34y, c1x, c1y)
    //  point 2:
    //    point(pc3swx, pc3swy)
    let pc34sx, pc34sy;
    {
      const p = inteceptCircleLineSeg(cx34, cy34, cx34, cy34, cx1, cy1, d2);
      if (p && p.length > 0) {
        [pc34sx, pc34sy] = p[0];
        const n = "pc34s";
        store.add(n, dotWithTooltip(svg, pc34sx, pc34sy, n, stroke), "point");
      }
      if (pc3swx && pc3swy && pc34sx && pc34sy) {
        line(svg, pc34sx, pc34sy, pc3swx, pc3swy, strokeLine);
      }
    }
    // line between
    // point 1:
    //    point(pc34ex, pc34ey)
    // point 2:
    //    point(pc34sx, pc34sy)
    {
      if (pc34ex && pc34ey && pc34sx && pc34sy) {
        line(svg, pc34ex, pc34ey, pc34sx, pc34sy, strokeLine);
      }
    }
    // line between
    // point 1:
    //    point(pc23sx, pc23sy)
    // point 2:
    //    point(pc23ex, pc23ey)
    {
      if (pc23sx && pc23sy && pc23ex && pc23ey) {
        line(svg, pc23sx, pc23sy, pc23ex, pc23ey, strokeLine);
      }
    }
    // line between
    // point 1:
    //    point(pic4x, pic4y)
    //    point(cx4, cy4)
    {
      if (pic4x && pic4y && cx4 && cy4) {
        line(svg, cx4, cy4, pic4x, pic4y, strokeLine);
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
