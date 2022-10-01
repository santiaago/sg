<script>
  import Counter from "./lib/Counter.svelte";
  import Square from "./lib/Square.svelte";
  import Square2 from "./lib/Square2.svelte";
  import Square3 from "./lib/Square3.svelte";
</script>

<main>
  <h1>sg</h1>

  <div class="card">
    <Counter />
  </div>
  <div class="card">
    <Square />
  </div>
  <div class="card">
    <Square2 />
  </div>
  <div class="card">
    <Square3 size={50} />
  </div>
</main>

<style>
</style>
