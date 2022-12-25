<script>
  import { derived, get, writable } from "svelte/store";

  export let store;
  export let stroke = 0.5;
  export let strokeMid = 0.5;
  export let strokeBig = 2;
  export let strokeLine = 1.4;

  $: names = derived(store, ($s) => Object.keys($s));

  const handleClick = (name) => {
    const s = get(store);
    const v = s[name];
    const e = v.element;
    if (v.type === "point") {
      if (v.selected) {
        e.tooltip.map((x) => x.style("opacity", 0));
        e.dot.style("fill", "black").attr("r", stroke);
      } else {
        e.tooltip.map((x) => x.style("opacity", 1));
        e.dot.style("fill", "red").attr("r", strokeBig);
      }
    }
    if (v.type === "circle" || v.type === "line") {
      if (v.selected) {
        e.style("stroke-width", stroke);
      } else {
        e.style("stroke-width", strokeBig);
      }
    }
    store.update(name, { ...v, selected: !v.selected });
  };
</script>

<ul>
  {#each $names as name}
    <li
      class="geometry-item"
      on:click={() => handleClick(name)}
      on:keydown={() => handleClick(name)}
      style="color: {get(store)[name].selected ? 'red' : 'white'}"
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
