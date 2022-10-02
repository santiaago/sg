<script>
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import { intersection } from "../math/intersection";
  let multiplier = 2;
  export let width = 210 * multiplier;
  export let height = 297 * multiplier;
  let el;

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
    const line = svg
      .append("line")
      .style("stroke", "#f06")
      .style("stroke-width", 10)
      .attr("x1", border)
      .attr("y1", height - border)
      .attr("x2", width - border)
      .attr("y2", height - border);

    const cx1 = width - border;
    const cy1 = height - border;
    const r1 = 310;
    const circle1 = svg
      .append("circle")
      .style("stroke", "#f06")
      .style("stroke-width", 10)
      .style("fill", "none")
      .attr("cx", cx1)
      .attr("cy", cy1)
      .attr("r", 310);

    const cx2 = border;
    const cy2 = height - border;
    const r2 = 310;
    const circle2 = svg
      .append("circle")
      .style("stroke", "#f06")
      .style("stroke-width", 10)
      .style("fill", "none")
      .attr("cx", border)
      .attr("cy", height - border)
      .attr("r", 310);

    const points = intersection(cx1, cy1, r1, cx2, cy2, r2);
    if (!points) {
      return;
    }
    const px1 = points[0];
    const py1 = points[1];
    const px2 = points[2];
    const py2 = points[3];
    [
      [px1, py1],
      [px2, py2],
    ].forEach((p) => {
      const [x, y] = p;
      svg
        .append("circle")
        .attr("class", "dot")
        .style("display", "block")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 5);
    });
  });
</script>

<svg bind:this={el} />

<style>
  .dot {
    fill: red;
    r: 5;
  }
</style>
