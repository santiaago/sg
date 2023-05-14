<script>
  import Square from "./lib/Square.svelte";
  import SixFold from "./lib/SixFold.svelte";
  import SixFoldv2 from "./lib/SixFoldv2.svelte";
  import SixFoldv3 from "./lib/SixFoldv3.svelte";
  import SixFoldv4 from "./lib/SixFoldv4.svelte";
  import { store, storev2, storev3, storev4 } from "./store.js";

  import GeometryList from "./GeometryList.svelte";
  const stroke = 0.5;
  const strokeMid = 0.5;
  const strokeBig = 2;
  const strokeLine = 1.4;

  $: stepsv3 = [];
  let currentStepv3 = 0;
  const handleNextClickv3 = () => {
    console.log("next step", currentStepv3, stepsv3.length);
    if (currentStepv3 < stepsv3.length) {
      console.log("inside");
      const step = stepsv3[currentStepv3];
      console.log(step);
      step.draw = true;
      step.drawShapes();
      console.log("after drawShapes");
      currentStepv3 += 1;
    }
  };
  const updateStepsv3 = (newSteps) => {
    console.log("newSteps", newSteps, "stepsv3", stepsv3);
    stepsv3 = newSteps;
  };
  $: stepsv4 = [];
  let currentStepv4 = 0;
  const handleNextClickv4 = () => {
    console.log("next step", currentStepv4, stepsv4.length);
    if (currentStepv4 < stepsv4.length) {
      console.log("inside");
      const step = stepsv4[currentStepv4];
      console.log(step);
      step.draw = true;
      step.drawShapes();
      console.log("after drawShapes");
      currentStepv4 += 1;
    }
  };
  const updateStepsv4 = (newSteps) => {
    console.log("newSteps", newSteps, "stepsv4", stepsv4);
    stepsv4 = newSteps;
  };
</script>

<main>
  <h1>sg</h1>
  <div class="row">
    <div class="title">
      <h1>1/4 Six fold pattern v4</h1>
      <small>14/05/2023</small>
      <p>1/4 Six fold pattern, with input output geometries</p>
    </div>
    <div class="left">
      <SixFoldv4
        store={storev4}
        {stroke}
        {strokeMid}
        {strokeBig}
        {strokeLine}
        steps={stepsv4}
        updateSteps={updateStepsv4}
      />
      <div>
        <button on:click={handleNextClickv4}> next </button>
      </div>
    </div>
    <div class="right">
      <h2>Right pane</h2>
      <p>Current step {currentStepv4}/{stepsv4.length}</p>
      <div>
        <GeometryList
          store={storev4}
          {stroke}
          {strokeMid}
          {strokeBig}
          {strokeLine}
        />
      </div>
    </div>
  </div>
  <div class="row">
    <div class="title">
      <h1>1/4 Six fold pattern v3</h1>
      <small>11/03/2023</small>
      <p>1/4 Six fold pattern, with steps to display geometry incrementally</p>
    </div>
    <div class="left">
      <SixFoldv3
        store={storev3}
        {stroke}
        {strokeMid}
        {strokeBig}
        {strokeLine}
        steps={stepsv3}
        updateSteps={updateStepsv3}
      />
      <div>
        <button on:click={handleNextClickv3}> next </button>
      </div>
    </div>
    <div class="right">
      <h2>Right pane</h2>
      <p>Current step {currentStepv3}/{stepsv3.length}</p>
      <div>
        <GeometryList
          store={storev3}
          {stroke}
          {strokeMid}
          {strokeBig}
          {strokeLine}
        />
      </div>
    </div>
  </div>
  <div class="row">
    <div class="title">
      <h1>1/4 Six fold pattern v2</h1>
      <small>24/12/2022</small>
    </div>
    <div class="left">
      <SixFoldv2
        store={storev2}
        {stroke}
        {strokeMid}
        {strokeBig}
        {strokeLine}
      />
    </div>
    <div class="right">
      <h2>Right pane</h2>
      <div>
        <GeometryList
          store={storev2}
          {stroke}
          {strokeMid}
          {strokeBig}
          {strokeLine}
        />
      </div>
    </div>
  </div>
  <div class="row">
    <div class="title">
      <h1>1/4 Six fold pattern</h1>
      <small>08/10/2022</small>
    </div>
    <div class="left">
      <SixFold {store} {stroke} {strokeMid} {strokeBig} {strokeLine} />
    </div>
    <div class="right">
      <h2>Right pane</h2>
      <div>
        <GeometryList {store} {stroke} {strokeMid} {strokeBig} {strokeLine} />
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
</style>
