<script>
  import { Polygon } from "@svgdotjs/svg.js";
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import {
    bisect,
    inteceptCircleLineSeg,
    intersection,
  } from "../math/intersection";

  let el;

  const dot = (svg, x, y) => {
    svg
      .append("circle")
      .attr("class", "dot")
      .style("display", "block")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", 2);
  };

  const line = (svg, x1, y1, x2, y2, stroke = 5) => {
    svg
      .append("line")
      .style("stroke", "#506")
      .style("stroke-width", stroke)
      .attr("x1", x1)
      .attr("y1", y1)
      .attr("x2", x2)
      .attr("y2", y2);
  };

  const rect = (svg, width, height) => {
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#fff");
  };

  const circle = (svg, cx, cy, r, stroke = 1) => {
    svg
      .append("circle")
      .style("stroke", "#f06")
      .style("stroke-width", stroke)
      .style("fill", "none")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", r);
  };

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
    circle(svg, cx2, cy2, r, stroke);
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
    circle(svg, px, py, r, stroke);
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
    line(svg, x1, y1, px3, py3, stroke);
    dot(svg, px3, py3);

    // looking for intersection of
    // line(center(c1), point(px,py)) AND
    // circle(center(px, py))
    angle = Math.atan2(cy0 - cy1, cx0 - cx1);
    // translate it into the interval [0,2 π] multiply by 2
    let [px4, py4] = bisect(angle * 2, r, px, py);
    dot(svg, px4, py4);
    line(svg, cx1, cy1, px4, py4, stroke);

    // draw lines from cercle(c1) and cercle(c2) with new intersection points
    // p3 and p4
    line(svg, cx1, cy1, px3, py3, stroke);
    line(svg, cx2, cy2, px4, py4, stroke);

    // draw line between p3 and p4
    line(svg, px3, py3, px4, py4, stroke);

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
      const s = (1 + Math.sqrt(5)) / 2;
      line(svg, plx, ply, prx, pry, s);
      line(svg, cx2, cy2, plx, ply, s);
      line(svg, cx2, cy2, cx1, cy1, s);
      line(svg, cx1, cy1, prx, pry, s);
    }
  });
</script>

<h1>Drawing a square</h1>
<small>08/10/2022</small>
<a href="https://www.youtube.com/watch?v=RSP5sm1e--4" target="_blank"
  >inspired by</a
>
<svg bind:this={el} />

<style>
  .dot {
    fill: red;
    r: 5;
  }
</style>
