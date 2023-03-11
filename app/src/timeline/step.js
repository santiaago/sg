export class Step {
  constructor(shapes) {
    this.shapes = shapes;
    this.draw = false;
    this.drawShapes = () => {
      console.log("Step.drawShapes base");
    };
  }
}
