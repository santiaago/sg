export class Geometry {
  constructor({ inputs = [], outputs = [] }) {
    this.inputs = inputs;
    this.outputs = outputs;
    this.type = "geometry";
  }
}
