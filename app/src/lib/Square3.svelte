<script>
  import { SVG } from "@svgdotjs/svg.js";
  import { onMount } from "svelte";
  export let size;
  let svg;

  onMount(() => {
    let draw = SVG().addTo(svg);
    const rect = draw.rect(size, size).fill("#f0A");
  });
</script>

<svg bind:this={svg} />
