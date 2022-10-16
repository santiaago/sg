<script>
  import * as d3 from "d3";
  import { circle, dot, line, rect } from "../geometry/basic";
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
  const showDetails = false;

  const stroke_gold = (1 + Math.sqrt(5)) / 2;

  onMount(() => {
    let svg = d3
      .select(el)
      .attr("width", "100%")
      .attr("heigth", "100%")
      .attr("viewBox", "0 0 800 1000")
      .attr("viewBox", "0 0 800 1000");

    let width = 647;
    let height = 400;
    rect(svg, width, height);

    const border = height / 3;
    const stroke = 0.5;

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

    // draw right side circle
    const cx1 = lx1 + ((lx2 - lx1) * 5) / 8;
    const cy1 = ly2;
    const r = ((lx2 - lx1) * 2) / 8;
    circle(svg, cx1, cy1, r, stroke);
    dot(svg, cx1, cy1);

    // draw left side circle
    const cx2 = cx1 - r;
    const cy2 = cy1;
    if (showDetails) {
      circle(svg, cx2, cy2, r, stroke);
    }
    dot(svg, cx2, cy2);

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
    if (showDetails) {
      circle(svg, px, py, r, stroke);
    }
    dot(svg, px, py);

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
    if (showDetails) {
      line(svg, x1, y1, px3, py3, stroke);
      dot(svg, px3, py3);
    }

    // looking for intersection of
    // line(center(c1), point(px,py)) AND
    // circle(center(px, py))
    angle = Math.atan2(cy0 - cy1, cx0 - cx1);
    // translate it into the interval [0,2 π] multiply by 2
    let [px4, py4] = bisect(angle * 2, r, px, py);
    if (showDetails) {
      dot(svg, px4, py4);
      line(svg, cx1, cy1, px4, py4, stroke);
    }

    // draw lines from cercle(c1) and cercle(c2) with new intersection points
    // p3 and p4
    if (showDetails) {
      line(svg, cx1, cy1, px3, py3, stroke);
      line(svg, cx2, cy2, px4, py4, stroke);
    }

    // draw line between p3 and p4
    if (showDetails) {
      line(svg, px3, py3, px4, py4, stroke);
    }

    // draw intersection between center(c2) AND
    // p4
    let plx, ply;
    let lp_left = inteceptCircleLineSeg(cx2, cy2, cx2, cy2, px4, py4, r);

    if (lp_left && lp_left.length > 0) {
      [plx, ply] = lp_left[0];
      dot(svg, plx, ply);
    }

    // draw intersection between center (c1) AND
    // p3
    let prx, pry;
    let lp_right = inteceptCircleLineSeg(cx1, cy1, cx1, cy1, px3, py3, r);

    if (lp_right && lp_right.length > 0) {
      [prx, pry] = lp_right[0];
      dot(svg, prx, pry);
    }

    // draw final square
    if (plx && ply && prx && pry) {
      line(svg, plx, ply, prx, pry, stroke_gold);
      line(svg, cx2, cy2, plx, ply, stroke_gold);
      line(svg, cx2, cy2, cx1, cy1, stroke_gold);
      line(svg, cx1, cy1, prx, pry, stroke_gold);
    }

    // draw crossing lines of square
    const [cx3, cy3, cx4, cy4] = [plx, ply, prx, pry];
    line(svg, cx1, cy1, cx3, cy3, stroke);
    line(svg, cx2, cy2, cx4, cy4, stroke);

    circle(svg, cx2, cy2, r, stroke);
    circle(svg, cx4, cy4, r, stroke);

    line(svg, cx1, cy1, px, py, stroke);

    //
    const [pix, piy] = cerclesIntersection(
      cx4,
      cy4,
      r,
      cx1,
      cy1,
      r,
      directions.left
    );
    dot(svg, pix, piy);
    line(svg, cx1, cy1, pix, piy, stroke);
    const [li1pax, li1pay, li1pbx, lipby] = [cx1, cy1, pix, piy];

    const [pi2x, pi2y] = lineIntersect(cx1, cy1, cx3, cy3, cx4, cy4, cx2, cy2);
    dot(svg, pi2x, pi2y);

    // measure distance of intersetion points
    //const d1 = pi2x - pix;
    const d1 = distance(pix, piy, pi2x, pi2y);

    [
      [cx1, cy1],
      [cx2, cy2],
      [cx3, cy3],
      [cx4, cy4],
    ].forEach(([cx, cy]) => {
      circle(svg, cx, cy, d1, stroke);
    });

    const [cx5, cy5] = [pix, piy];
    const [cx6, cy6] = [px, py];

    [
      [cx5, cy5],
      [cx6, cy6],
    ].forEach(([cx, cy]) => {
      circle(svg, cx, cy, d1, stroke);
    });

    // find intersection point
    const [pi3x, pi3y] = cerclesIntersection(
      cx5,
      cy5,
      d1,
      cx2,
      cy2,
      d1,
      directions.right
    );
    dot(svg, pi3x, pi3y);
    // find intersection point
    const [pi4x, pi4y] = cerclesIntersection(
      cx6,
      cy6,
      d1,
      cx4,
      cy4,
      d1,
      directions.right
    );
    dot(svg, pi4x, pi4y);

    // draw lines
    [
      [pi3x, pi3y],
      [pi4x, pi4y],
    ].forEach(([x, y]) => {
      line(svg, cx1, cy1, x, y, stroke);
    });

    // compute intersection between lines and cercles
    let prx5, pry5;
    let pi5 = inteceptCircleLineSeg(cx5, cy5, cx1, cy1, cx5, cy5, d1);
    if (pi5 && pi5.length > 0) {
      [prx5, pry5] = pi5[0];
      dot(svg, prx, pry, "dot-sm");
    }
    let prx6, pry6;
    let pi6 = inteceptCircleLineSeg(cx6, cy6, cx1, cy1, cx6, cy6, d1);
    if (pi6 && pi6.length > 0) {
      [prx6, pry6] = pi6[0];
      dot(svg, prx, pry, "dot-sm");
    }

    // looking for intersection of
    // line(center(c1), point(px,py)) AND
    // circle(center(px, py))
    let cx23, cy23;
    {
      const cx0 = cx5 - d1;
      const cy0 = cy5;
      const angle = Math.atan2(pry5 - cy0, prx5 - cx0);
      // translate it into the interval [0,2 π] multiply by 2
      let [x, y] = bisect(angle * 2, d1, cx5, cy5);
      dot(svg, x, y);
      line(svg, cx5, cy5, x, y, stroke);

      const [px, py] = lineIntersect(cx2, cy2, cx3, cy3, cx5, cy5, x, y);
      dot(svg, px, py);

      let prx, pry;
      const pi = inteceptCircleLineSeg(cx2, cy2, px, py, cx2, cy2, d1);
      if (pi && pi.length > 0) {
        [prx, pry] = pi[0];
        dot(svg, prx, pry);
      }

      //const d2 = pry - py;
      const d2 = distance(px, py, prx, pry);
      circle(svg, px, py, d2, stroke);
      [cx23, cy23] = [px, py];
    }
    let cx34, cy34, d2;
    {
      const cx0 = cx6 - d1;
      const cy0 = cy6;
      angle = Math.atan2(pry6 - cy0, prx6 - cx0);
      // translate it into the interval [0,2 π] multiply by 2
      let [x, y] = bisect(angle * 2, d1, cx6, cy6);
      dot(svg, x, y);
      line(svg, cx6, cy6, x, y, stroke);

      const [px, py] = lineIntersect(cx3, cy3, cx4, cy4, cx6, cy6, x, y);
      dot(svg, px, py);

      let prx, pry;
      const pi = inteceptCircleLineSeg(cx4, cy4, px, py, cx4, cy4, d1);
      if (pi && pi.length > 0) {
        [prx, pry] = pi[0];
        dot(svg, prx, pry);
      }

      // d2 = prx - px; // todo fix distance here
      d2 = distance(px, py, prx, pry);
      circle(svg, px, py, d2, stroke);
      [cx34, cy34] = [px, py];
    }
    //
    // point: pi3x, pi3y
    // cercle: [cx1, cy1],
    // line: [li1pax, li1pay, li1pbx, lipby]
    let pii1x, pii1y;
    let pii2x, pii2y;
    let d3_;
    {
      const pi = inteceptCircleLineSeg(
        cx1,
        cy1,
        li1pax,
        li1pay,
        li1pbx,
        lipby,
        d1
      );
      if (pi && pi.length > 0) {
        const [x, y] = pi[0];
        dot(svg, x, y);
        let x1, y1, x2, y2;
        let p = intersect(pi3x, pi3y, x, y, cx1, cy1, cx3, cy3);
        if (p && p.length > 0) {
          [x1, y1] = p;
          dot(svg, x1, y1);
          [pii1x, pii1y] = p;
        }
        p = intersect(pi3x, pi3y, x, y, cx2, cy2, cx4, cy4);
        if (p && p.length > 0) {
          [x2, y2] = p;
          dot(svg, x2, y2);
          [pii2x, pii2y] = p;
        }
        if (x1 && y1 && x2 && y2) {
          line(svg, x1, y1, x2, y2, stroke);
        }
        d3_ = distance(cx1, cy1, x1, y1);
        [
          [cx1, cy1],
          [cx2, cy2],
          [cx3, cy3],
          [cx4, cy4],
        ].forEach(([x, y]) => {
          circle(svg, x, y, d3_, stroke);
        });
      }
    }
    // show or hide
    line(svg, cx2, cy2, pix, piy, stroke);
    line(svg, cx4, cy4, px, py, stroke);
    // end
    // find intersection between 2 segments
    // line (pii1x, pii1y) (pi4x, pi4y)
    // line (cx4, cy4) (px, py)
    let pic4x, pic4y;
    {
      let p = intersect(pii1x, pii1y, pi4x, pi4y, cx4, cy4, px, py);
      if (p && p.length > 0) {
        const [x1, y1] = p;
        dot(svg, x1, y1);
        line(svg, pii1x, pii1y, x1, y1, stroke_gold);
        [pic4x, pic4y] = p;
      }
    }

    // find intersection between 2 segments
    // line (pii1x, pii1y), (pii2x, pii2y)
    // line(cx2, cy2) (pix, piy)
    let pic2x, pic2y;
    {
      let p = intersect(pii1x, pii1y, pii2x, pii2y, cx2, cy2, pix, piy);
      if (p && p.length > 0) {
        const [x1, y1] = p;
        dot(svg, x1, y1);
        line(svg, pii1x, pii1y, x1, y1, stroke_gold);
        [pic2x, pic2y] = p;
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
        const [x1, y1] = p[0];
        dot(svg, x1, y1);
        [pic1wx, pic1wy] = p[0];
      }
      // second point
      let pic34x, pic34y;
      p = inteceptCircleLineSeg(cx34, cy34, cx4, cy4, cx3, cy3, d2);
      if (p && p.length > 0) {
        const [x1, y1] = p[1];
        dot(svg, x1, y1);
        [pic34x, pic34y] = p[1];
      }
      if (pic1wx && pic1wy && pic34x && pic34y) {
        line(svg, pic1wx, pic1wy, pic34x, pic34y, stroke_gold);
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
        const [x1, y1] = p[0];
        dot(svg, x1, y1);
        [pic1nx, pic1ny] = p[0];
      }
      // second point
      let pic23x, pic23y;
      p = inteceptCircleLineSeg(cx23, cy23, cx2, cy2, cx3, cy3, d2);
      if (p && p.length > 0) {
        const [x1, y1] = p[1];
        dot(svg, x1, y1);
        [pic23x, pic23y] = p[1];
      }
      if (pic1nx && pic1ny && pic23x && pic23y) {
        line(svg, pic1nx, pic1ny, pic23x, pic23y, stroke_gold);
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
        const [x1, y1] = p[0];
        dot(svg, x1, y1);
        [pc1wx, pc1wy] = p[0];
      }
      // second point
      p = inteceptCircleLineSeg(cx23, cy23, cx2, cy2, cx3, cy3, d2);
      if (p && p.length > 0) {
        const [x1, y1] = p[0];
        dot(svg, x1, y1);
        [pc23sx, pc23sy] = p[0];
      }
      if (pc1wx && pc1wy && pc23sx && pc23sy) {
        line(svg, pc1wx, pc1wy, pc23sx, pc23sy, stroke_gold);
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
        const [x1, y1] = p[0];
        dot(svg, x1, y1);
        [pc1nx, pc1ny] = p[0];
      }
      // second point
      p = inteceptCircleLineSeg(cx34, cy34, cx3, cy3, cx4, cy4, d2);
      if (p && p.length > 0) {
        const [x1, y1] = p[1];
        dot(svg, x1, y1);
        [pc34ex, pc34ey] = p[1];
      }
      if (pc1nx && pc1ny && pc34ex && pc34ey) {
        line(svg, pc1nx, pc1ny, pc34ex, pc34ey, stroke_gold);
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
        line(svg, pc1nx, pc1ny, pic1nx, pic1ny, stroke_gold);
      }
      if (pc1wx && pc1wy && pic1wx && pic1wy) {
        line(svg, pc1wx, pc1wy, pic1wx, pic1wy, stroke_gold);
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
        const [x1, y1] = p[0];
        dot(svg, x1, y1);
        [pc3swx, pc3swy] = p[0];
      }
      const p2 = inteceptCircleLineSeg(cx23, cy23, cx23, cy23, cx1, cy1, d2);
      if (p2 && p2.length > 0) {
        const [x1, y1] = p2[0];
        dot(svg, x1, y1);
        [pc23ex, pc23ey] = p2[0];
      }
      if (pc3swx && pc3swy && pc23ex && pc23ey) {
        line(svg, pc3swx, pc3swy, pc23ex, pc23ey, stroke_gold);
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
        const [x1, y1] = p[0];
        dot(svg, x1, y1);
        [pc34sx, pc34sy] = p[0];
      }
      if (pc3swx && pc3swy && pc34sx && pc34sy) {
        line(svg, pc34sx, pc34sy, pc3swx, pc3swy, stroke_gold);
      }
    }
    // line between
    // point 1:
    //    point(pc34ex, pc34ey)
    // point 2:
    //    point(pc34sx, pc34sy)
    {
      if (pc34ex && pc34ey && pc34sx && pc34sy) {
        line(svg, pc34ex, pc34ey, pc34sx, pc34sy, stroke_gold);
      }
    }
    // line between
    // point 1:
    //    point(pc23sx, pc23sy)
    // point 2:
    //    point(pc23ex, pc23ey)
    {
      if (pc23sx && pc23sy && pc23ex && pc23ey) {
        line(svg, pc23sx, pc23sy, pc23ex, pc23ey, stroke_gold);
      }
    }
    // line between
    // point 1:
    //    point(pic4x, pic4y)
    //    point(cx4, cy4)
    {
      if (pic4x && pic4y && cx4 && cy4) {
        line(svg, cx4, cy4, pic4x, pic4y, stroke_gold);
      }
    }
    // line between
    // point 1:
    //  point(pic2x, pic2y)
    // point 2:
    //  point(cx2, cy2)
    {
      if (pic2x && pic2y && cx4 && cy4) {
        line(svg, cx2, cy2, pic2x, pic2y, stroke_gold);
      }
    }
  });
</script>

<h1>Six fold pattern</h1>
<small>08/10/2022</small>
<svg bind:this={el} />

<style>
  .dot {
    fill: red;
    r: 5;
  }
  .dot-sm {
    fill: greenyellow;
    r: 5/2;
  }
</style>
