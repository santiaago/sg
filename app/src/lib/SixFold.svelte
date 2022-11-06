<script>
  import * as d3 from "d3";
  import { circle, dot, dotWithTooltip, line, rect } from "../draw/basic";
  import { text } from "../draw/text";
  import { onMount } from "svelte";
  import {
    bisect,
    cerclesIntersection,
    directions,
    inteceptCircleLineSeg,
    intersection,
    lineIntersect,
  } from "../math/intersection";
  import { intersect } from "../math/lines";
  import { distance } from "../math/points";

  let el;
  export let stroke = 0.5;
  export let strokeMid;
  export let strokeBig;
  export let strokeLine = (1 + Math.sqrt(5)) / 2;

  const drawSquareFromLine = (
    svg,
    lx1,
    ly1,
    lx2,
    ly2,
    stroke,
    drawDetails,
    drawFinalShape
  ) => {
    // draw right side circle
    const cx1 = lx1 + ((lx2 - lx1) * 5) / 8;
    const cy1 = ly2;
    const r = ((lx2 - lx1) * 2) / 8;
    if (drawDetails) {
      circle(svg, cx1, cy1, r, stroke);
      dot(svg, cx1, cy1);
    }

    // draw left side circle
    const cx2 = cx1 - r;
    const cy2 = cy1;
    if (drawDetails) {
      circle(svg, cx2, cy2, r, stroke);
      dot(svg, cx2, cy2);
    }

    // find intersection point between 2 circles
    let points = intersection(cx1, cy1, r, cx2, cy2, r);
    if (!points) {
      return;
    }
    let px, py;

    const px1 = points[0];
    const py1 = points[1];
    const px2 = points[2];
    const py2 = points[3];
    if (py1 < py2) {
      px = px1;
      py = py1;
    } else {
      px = px2;
      py = py2;
    }

    // draw circle at intersection point
    if (drawDetails) {
      circle(svg, px, py, r, stroke);
      dot(svg, px, py);
    }

    const x1 = cx2;
    const y1 = cy2;

    // looking for intersection of
    // line(center(c2), point(px,py)) AND
    // circle(center(px, py))
    const cx0 = px - r;
    const cy0 = py;
    let angle = Math.atan2(cy0 - y1, cx0 - x1);
    // translate it into the interval [0,2 π] multiply by 2
    let [px3, py3] = bisect(angle * 2, r, px, py);
    if (drawDetails) {
      line(svg, x1, y1, px3, py3, stroke);
      dot(svg, px3, py3);
    }

    // looking for intersection of
    // line(center(c1), point(px,py)) AND
    // circle(center(px, py))
    angle = Math.atan2(cy0 - cy1, cx0 - cx1);
    // translate it into the interval [0,2 π] multiply by 2
    let [px4, py4] = bisect(angle * 2, r, px, py);
    if (drawDetails) {
      dot(svg, px4, py4);
      line(svg, cx1, cy1, px4, py4, stroke);
    }

    // draw lines from cercle(c1) and cercle(c2) with new intersection points
    // p3 and p4
    if (drawDetails) {
      line(svg, cx1, cy1, px3, py3, stroke);
      line(svg, cx2, cy2, px4, py4, stroke);
    }

    // draw line between p3 and p4
    if (drawDetails) {
      line(svg, px3, py3, px4, py4, stroke);
    }

    // draw intersection between center(c2) AND
    // p4
    let cx3, cy3;
    let lp_left = inteceptCircleLineSeg(cx2, cy2, cx2, cy2, px4, py4, r);

    if (lp_left && lp_left.length > 0) {
      [cx3, cy3] = lp_left[0];
      if (drawDetails) {
        dot(svg, cx3, cy3);
      }
    }

    // draw intersection between circle (c1) AND
    // p3
    let cx4, cy4;
    let lp_right = inteceptCircleLineSeg(cx1, cy1, cx1, cy1, px3, py3, r);

    if (lp_right && lp_right.length > 0) {
      [cx4, cy4] = lp_right[0];
      if (drawDetails) {
        dot(svg, cx4, cy4);
      }
    }

    // draw final square
    if (cx3 && cy3 && cx4 && cy4) {
      if (drawFinalShape) {
        line(svg, cx3, cy3, cx4, cy4, strokeLine);
        line(svg, cx2, cy2, cx3, cy3, strokeLine);
        line(svg, cx2, cy2, cx1, cy1, strokeLine);
        line(svg, cx1, cy1, cx4, cy4, strokeLine);
      }
    }

    return [
      [cx1, cy1, r],
      [cx2, cy2, r],
      [cx3, cy3, r],
      [cx4, cy4, r],
    ];
  };

  const drawIntersectionPoints = (
    svg,
    circles,
    stroke,
    drawDetails,
    drawFinalShape
  ) => {
    const [[cx1, cy1, r], [cx2, cy2], [cx3, cy3], [cx4, cy4]] = circles;

    // draw crossing lines of square
    if (drawDetails) {
      circle(svg, cx1, cy1, r, stroke);
      circle(svg, cx2, cy2, r, stroke);
      circle(svg, cx4, cy4, r, stroke);
    }

    const [pic12nx, pic12ny] = cerclesIntersection(
      cx1,
      cy1,
      r,
      cx2,
      cy2,
      r,
      directions.up
    );
    if (drawDetails) dot(svg, pic12nx, pic12ny);

    const [pic14x, pic14y] = cerclesIntersection(
      cx4,
      cy4,
      r,
      cx1,
      cy1,
      r,
      directions.left
    );
    if (drawDetails) {
      dot(svg, pic14x, pic14y);
    }
    if (drawFinalShape) {
      line(svg, cx1, cy1, pic12nx, pic12ny, stroke);
      line(svg, cx1, cy1, pic14x, pic14y, stroke);
    }
    return [
      [pic12nx, pic12ny],
      [pic14x, pic14y],
    ];
  };

  const drawLinesIntersectionPoint = (
    svg,
    circles,
    drawDetails,
    drawFinalShape,
    stroke
  ) => {
    const [[cx1, cy1, r], [cx2, cy2], [cx3, cy3], [cx4, cy4]] = circles;

    if (drawDetails) {
      line(svg, cx1, cy1, cx3, cy3, stroke);
      line(svg, cx2, cy2, cx4, cy4, stroke);
    }

    const [pi2x, pi2y] = lineIntersect(cx1, cy1, cx3, cy3, cx4, cy4, cx2, cy2);
    if (drawFinalShape) {
      dot(svg, pi2x, pi2y);
    }
    return [pi2x, pi2y];
  };

  onMount(() => {
    let svg = d3.select(el).attr("viewBox", "0 0 300 150");

    const width = 300;
    const height = 150;

    rect(svg, width, height);
    dot(svg, 0, 0);

    const border = height / 3;

    const [lx1, ly1, lx2, ly2] = [
      border,
      height - border,
      width - border,
      height - border,
    ];

    // draw first line
    line(svg, lx1, ly1, lx2, ly2, stroke);
    // for debug
    // for (let i = 0; i <= 8; i++) {
    //   dot(svg, lx1 + ((lx2 - lx1) * i) / 8, ly1 + 50);
    // }

    const circles = drawSquareFromLine(
      svg,
      lx1,
      ly1,
      lx2,
      ly2,
      stroke,
      false,
      true
    );

    const [[cx1, cy1, r], [cx2, cy2], [cx3, cy3], [cx4, cy4]] = circles;

    circles.forEach(([cx, cy], i) => {
      dotWithTooltip(svg, cx, cy, `c${i + 1}`, stroke);
    });

    const [[pic12nx, pic12ny], [pic14x, pic14y]] = drawIntersectionPoints(
      svg,
      circles,
      stroke,
      true,
      true
    );
    [
      [pic12nx, pic12ny, "12"],
      [pic14x, pic14y, "14"],
    ].forEach(([x, y, prefix]) => {
      dotWithTooltip(svg, x, y, `pic${prefix}`, strokeBig);
    });

    // draw crossing lines of square
    const [pi2x, pi2y] = drawLinesIntersectionPoint(
      svg,
      circles,
      true,
      true,
      stroke
    );
    // measure distance of intersection points
    const d1 = distance(pic14x, pic14y, pi2x, pi2y);

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

    circles.forEach(([cx, cy], i) => {
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
      dotWithTooltip(svg, x, y, prefix, strokeBig);
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
      dotWithTooltip(svg, prx5, pry5, "prx5", strokeBig);
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
      dotWithTooltip(svg, prx6, pry6, "prx6", strokeBig);
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
        dotWithTooltip(svg, x, y, "c23w", stroke);
        line(svg, pic14x, pic14y, x, y, stroke);
      }

      const [px, py] = lineIntersect(cx2, cy2, cx3, cy3, pic14x, pic14y, x, y);
      //dot(svg, px, py);

      let prx, pry;
      const pi = inteceptCircleLineSeg(cx2, cy2, px, py, cx2, cy2, d1);
      if (pi && pi.length > 0) {
        [prx, pry] = pi[0];
        {
          dotWithTooltip(svg, prx, pry, "c23s", stroke);
        }
      }

      const d2 = distance(px, py, prx, pry);
      circle(svg, px, py, d2, stroke);
      [cx23, cy23] = [px, py];
      dotWithTooltip(svg, cx23, cy23, "c23");
    }
    let cx34, cy34, d2;
    {
      const cx0 = pic12nx - d1;
      const cy0 = pic12ny;
      const angle = Math.atan2(pry6 - cy0, prx6 - cx0);
      // translate it into the interval [0,2 π] multiply by 2
      let [x, y] = bisect(angle * 2, d1, pic12nx, pic12ny);
      {
        dotWithTooltip(svg, x, y, "c34n", stroke);
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
        dotWithTooltip(svg, prx, pry, "c34e", strokeBig);
      }

      d2 = distance(px, py, prx, pry);
      circle(svg, px, py, d2, stroke);
      [cx34, cy34] = [px, py];
      dotWithTooltip(svg, cx34, cy34, "c34", stroke);
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
          dotWithTooltip(svg, pii1x, pii1y, "pii1", strokeBig);
        }
        p = intersect(pi3x, pi3y, x, y, cx2, cy2, cx4, cy4);
        if (p && p.length > 0) {
          [x2, y2] = p;
          [pii2x, pii2y] = p;
          dotWithTooltip(svg, pii2x, pii2y, "pii2", strokeBig);
        }
        if (x1 && y1 && x2 && y2) {
          line(svg, x1, y1, x2, y2, stroke);
        }
        d3_ = distance(cx1, cy1, x1, y1);
        circles.forEach(([x, y], i) => {
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
        dotWithTooltip(svg, pic4x, pic4y, "pic4", strokeBig);
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
        dotWithTooltip(svg, pic2x, pic2y, "pic2", strokeBig);
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
        dotWithTooltip(svg, pic1wx, pic1wy, "pic1w", strokeBig);
      }
      // second point
      let pic34x, pic34y;
      p = inteceptCircleLineSeg(cx34, cy34, cx4, cy4, cx3, cy3, d2);
      if (p && p.length > 0) {
        [pic34x, pic34y] = p[1];
        dotWithTooltip(svg, pic34x, pic34y, `pic34`, stroke);
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
        dotWithTooltip(svg, pic1nx, pic1ny, "pic1n", strokeBig);
      }
      // second point
      let pic23x, pic23y;
      p = inteceptCircleLineSeg(cx23, cy23, cx2, cy2, cx3, cy3, d2);
      if (p && p.length > 0) {
        [pic23x, pic23y] = p[1];
        dotWithTooltip(svg, pic23x, pic23y, "pic23", strokeBig);
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
        dotWithTooltip(svg, pc1wx, pc1wy, "pc1w", stroke);
      }
      // second point
      p = inteceptCircleLineSeg(cx23, cy23, cx2, cy2, cx3, cy3, d2);
      if (p && p.length > 0) {
        [pc23sx, pc23sy] = p[0];
        dotWithTooltip(svg, pc23sx, pc23sy, "pc23s", strokeBig);
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
        dotWithTooltip(svg, pc1nx, pc1ny, "pc1n", strokeBig);
      }
      // second point
      p = inteceptCircleLineSeg(cx34, cy34, cx3, cy3, cx4, cy4, d2);
      if (p && p.length > 0) {
        [pc34ex, pc34ey] = p[1];
        dotWithTooltip(svg, pc34ex, pc34ey, "pc34e", strokeBig);
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
        dotWithTooltip(svg, pc3swx, pc3swy, "pc3sw", strokeBig);
      }
      const p2 = inteceptCircleLineSeg(cx23, cy23, cx23, cy23, cx1, cy1, d2);
      if (p2 && p2.length > 0) {
        [pc23ex, pc23ey] = p2[0];
        dotWithTooltip(svg, pc23ex, pc23ey, "pc23e", strokeBig);
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
        dotWithTooltip(svg, pc34sx, pc34sy, "pc34s", strokeBig);
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
