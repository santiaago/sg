<script>
  import { SVG } from "@svgdotjs/svg.js";
  import { onMount } from "svelte";
  let multiplier = 2;
  export let width = 210 * multiplier;
  export let height = 297 * multiplier;
  let svg;

  onMount(() => {
    let draw = SVG().size("100%", "100%").viewbox(0, 0, 800, 1000).addTo(svg);
    const rect = draw.rect(width, height).fill("#fff");
    const border = 50;
    const line = draw
      .line(border, height - border, width - border, height - border)
      .stroke({ color: "#f06", width: 10, linecap: "round" });

    const circle1 = draw
      .circle()
      .fill("none")
      .stroke({ color: "#f06", width: 10 })
      .radius(310)
      .center(width - border, height - border);
    const circle2 = draw
      .circle()
      .fill("none")
      .stroke({ color: "#f06", width: 10 })
      .radius(310)
      .center(border, height - border);
  });
</script>

<div bind:this={svg} />
