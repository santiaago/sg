<script>
  import Square from "./lib/Square.svelte";
  import SixFold from "./lib/SixFold.svelte";
</script>

<main>
  <h1>sg</h1>
  <div class="row">
    <div class="title">
      <h1>Six fold pattern</h1>
      <small>08/10/2022</small>
    </div>
    <div class="left">
      <SixFold stroke={0.5} strokeMid={0.5} strokeBig={0.7} strokeLine={1.4} />
    </div>
    <div class="right">right pane</div>
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
