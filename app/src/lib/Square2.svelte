<script>
  import { SVG } from "@svgdotjs/svg.js";
  import { onMount } from "svelte";
  let svg;

  onMount(() => {
    let draw = SVG().addTo(svg);
    const rect = draw.rect(100, 100).fill("#f0A");
  });
</script>

<svg bind:this={svg} />
