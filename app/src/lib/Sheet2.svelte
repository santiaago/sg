<script>
  import { Polygon } from "@svgdotjs/svg.js";
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import {
    bisect,
    inteceptCircleLineSeg,
    intersection,
  } from "../math/intersection";
  let multiplier = 2;
  export let width = 210 * multiplier;
  export let height = 297 * multiplier;
  let el;

  const dot = (svg, x, y) => {
    svg
      .append("circle")
      .attr("class", "dot")
      .style("display", "block")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", 3);
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

  onMount(() => {
    let svg = d3
      .select(el)
      .attr("width", "100%")
      .attr("heigth", "100%")
      .attr("viewBox", "0 0 800 1000")
      .attr("viewBox", "0 0 800 1000");

    const rect = svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#fff");

    const border = 50;
    const stroke = 1;
    line(svg, border, height - border, width - border, height - border, stroke);

    const cx1 = width - border;
    const cy1 = height - border;
    const r = 200;
    const circle1 = svg
      .append("circle")
      .style("stroke", "#f06")
      .style("stroke-width", stroke)
      .style("fill", "none")
      .attr("cx", cx1)
      .attr("cy", cy1)
      .attr("r", r);

    const cx2 = cx1 - r;
    const cy2 = cy1;
    const circle2 = svg
      .append("circle")
      .style("stroke", "#f06")
      .style("stroke-width", stroke)
      .style("fill", "none")
      .attr("cx", cx2)
      .attr("cy", cy2)
      .attr("r", r);

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

    const circle3 = svg
      .append("circle")
      .style("stroke", "#f06")
      .style("stroke-width", stroke)
      .style("fill", "none")
      .attr("cx", px)
      .attr("cy", py)
      .attr("r", r);

    const x1 = cx2;
    const y1 = cy2;
    dot(svg, x1, y1);

    dot(svg, px, py);
    const cx0 = px - r;
    const cy0 = py;
    let angle = Math.atan2(cy0 - y1, cx0 - x1);
    // translate it into the interval [0,2 π] multiply by 2
    let [px3, py3] = bisect(angle * 2, r, px, py);
    dot(svg, px3, py3);
    line(svg, x1, y1, px3, py3, stroke);

    dot(svg, cx1, cy1);
    angle = Math.atan2(cy0 - cy1, cx0 - cx1);
    let [px4, py4] = bisect(angle * 2, r, px, py);
    dot(svg, px4, py4);
    line(svg, cx1, cy1, px4, py4, stroke);
    line(svg, x1, y1, px4, py4, stroke);
    line(svg, cx1, cy1, px3, py3, stroke);
    line(svg, px3, py3, px4, py4, stroke);
    let plx, ply, prx, pry;
    let lp_left = inteceptCircleLineSeg(cx2, cy2, cx2, cy2, px4, py4, r);
    console.log(lp_left);
    if (lp_left && lp_left.length > 0) {
      [plx, ply] = lp_left[0];
      console.log("got", plx, ply, cx2, cy2);
      dot(svg, plx, ply);
    }
    let lp_right = inteceptCircleLineSeg(cx1, cy1, cx1, cy1, px3, py3, r);
    console.log(lp_right);
    if (lp_right && lp_right.length > 0) {
      [prx, pry] = lp_right[0];
      console.log("got", prx, pry, cx2, cy2);
      dot(svg, prx, pry);
    }
    if (plx && ply && prx && pry) {
      line(svg, plx, ply, prx, pry, 2);
      line(svg, cx2, cy2, plx, ply, 2);
      line(svg, cx2, cy2, cx1, cy1, 2);
      line(svg, cx1, cy1, prx, pry, 2);
    }
  });
</script>

<svg bind:this={el} />

<style>
  .dot {
    fill: red;
    r: 5;
  }
</style>
