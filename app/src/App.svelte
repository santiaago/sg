<script>
  import Square from "./lib/Square.svelte";
  import SixFold from "./lib/SixFold.svelte";
  import { derived, get, writable } from "svelte/store";
  import { store } from "./store.js";

  import * as d3 from "d3";
  const stroke = 0.5;
  const strokeMid = 0.5;
  const strokeBig = 2;
  const strokeLine = 1.4;

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

<main>
  <h1>sg</h1>
  <div class="row">
    <div class="title">
      <h1>1/4 Six fold pattern</h1>
      <small>08/10/2022</small>
    </div>
    <div class="left">
      <SixFold {stroke} {strokeMid} {strokeBig} {strokeLine} />
    </div>
    <div class="right">
      <h2>Right pane</h2>
      <div>
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
      </div>
    </div>
  </div>
  <div class="row">
    <div class="left">
      <Square />
    </div>
  </div>
</main>

<style>
  main {
    display: grid;
    grid-template-columns: repeat(12, [col-start] 1fr);
    gap: 20px;
  }
  main > * {
    grid-column: col-start / span 12;
  }
  .row {
    padding: 2em;
    grid-column: col-start 1 / span 12;
    display: grid;
    grid-template-columns: repeat(12, [col-start] 1fr);
  }
  .row .left {
    grid-column: col-start 1 / span 9;
  }
  .row .right {
    grid-column: col-start 10 / span 12;
    padding-left: 1em;
  }
  .row .title {
    grid-column: col-start 1 / span 12;
  }
  .geometry-item {
    cursor: pointer;
  }
  .geometry-item:hover {
    text-decoration: underline;
  }
</style>
