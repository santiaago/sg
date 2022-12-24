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
  const handleClick = (n) => {
    const s = get(store);
    const v = s[n];
    if (v.visible) {
      v.tooltip.map((x) => x.style("opacity", 0));
      v.dot.style("fill", "black").attr("r", stroke);
    } else {
      v.tooltip.map((x) => x.style("opacity", 1));
      v.dot.style("fill", "red").attr("r", strokeBig);
    }
    store.update(n, { ...v, visible: !v.visible });
  };
</script>

<main>
  <h1>sg</h1>
  <div class="row">
    <div class="title">
      <h1>Six fold pattern</h1>
      <small>08/10/2022</small>
    </div>
    <div class="left">
      <SixFold {stroke} {strokeMid} {strokeBig} {strokeLine} />
    </div>
    <div class="right">
      <h2>right pane</h2>
      <div>
        <ul>
          {#each $names as n}
            <li on:click={() => handleClick(n)}>{n}</li>
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
  }
  .row .title {
    grid-column: col-start 1 / span 12;
  }
</style>
