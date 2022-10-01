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
  });
</script>

<div bind:this={svg} />
