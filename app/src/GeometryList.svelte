<script>
  import { derived, get, writable } from "svelte/store";

  export let store;
  export let stroke = 0.5;
  export let strokeMid = 0.5;
  export let strokeBig = 2;
  export let strokeLine = 1.4;

  $: names = derived(store, ($s) => Object.keys($s));

  const selectShape = (element, shape) => {
    if (shape.type === "point") {
      if (shape.selected) {
        element.tooltip.map((x) => x.style("opacity", 0));
        element.dot.style("fill", "black").attr("r", stroke);
      } else {
        element.tooltip.map((x) => x.style("opacity", 1));
        element.dot.style("fill", "red").attr("r", strokeBig);
      }
    }
    if (shape.type === "circle" || shape.type === "line") {
      if (shape.selected) {
        element.style("stroke-width", stroke);
      } else {
        element.style("stroke-width", strokeBig);
      }
    }
  };
  const handleClick = (name) => {
    const s = get(store);
    const v = s[name];
    const e = v.element;
    const hasContext = v.context != null;
    console.log(name, "hasContext", hasContext, v);
    selectShape(e, v);
    if (hasContext) {
      const geometry = v.context;
      geometry.inputs.forEach((input) => {
        const currShape = s[input.name];
        const currElement = currShape.element;
        selectShape(currElement, { ...currShape, selected: v.selected });
        console.log("input name", input.name);
        store.update(input.name, { ...currShape, selected: !v.selected });
      });
    }
    store.update(name, { ...v, selected: !v.selected });
  };

  const colorItem = (name) => {
    const shape = get(store)[name];
    const selected = shape.selected;
    if (selected == true) {
      const isOutput = shape.context != null;
      const isInput = shape.context == null;
      if (isOutput) return "red";
      if (isInput) return "yellow";
      console.error("shape is not input or output");
      return "grey";
    } else return "white";
  };
</script>

<ul>
  {#each $names as name}
    <li
      class="geometry-item"
      on:click={() => handleClick(name)}
      on:keydown={() => handleClick(name)}
      style="color: {colorItem(name)}"
    >
      {name} | {get(store)[name].type}
    </li>
  {/each}
</ul>

<style>
  .geometry-item {
    cursor: pointer;
  }
  .geometry-item:hover {
    text-decoration: underline;
  }
</style>
