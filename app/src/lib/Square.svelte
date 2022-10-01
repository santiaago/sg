<script>
  const ns = "http://www.w3.org/2000/svg";
  let svg = document.createElementNS(ns, "svg");
  svg.setAttributeNS(null, "width", "100%");
  svg.setAttributeNS(null, "height", "100%");
  $: if (svg) draw(svg);
  function draw(svg) {
    const rect = document.createElementNS(ns, "rect");
    rect.setAttributeNS(null, "width", "100");
    rect.setAttributeNS(null, "height", "100");
    rect.setAttributeNS(null, "fill", "#f06");
    svg.appendChild(rect);
  }
</script>

<svg bind:this={svg} />
