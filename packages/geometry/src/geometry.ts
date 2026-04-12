export class Geometry {
  inputs: any[];
  outputs: any[];
  type: string;

  constructor({ inputs = [], outputs = [] } = {}) {
    this.inputs = inputs;
    this.outputs = outputs;
    this.type = "geometry";
  }
}
