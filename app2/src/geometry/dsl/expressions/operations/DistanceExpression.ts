// Distance expression for computing distance between two points

import type { GeometryRenderer } from "../../renderers/types";
import type { Step, GeometryValue } from "@/types/geometry";
import { isPoint } from "@/types/geometry";
import { distance as computeDistance } from "@/geometry/constructors";
import type { GeometryExpression } from "../GeometryExpression";
import type { PointLikeExpression } from "../types";
import { createStepId } from "../../utils";

export class DistanceExpression<TConfig> implements GeometryExpression<TConfig, "point"> {
  readonly id: string;
  readonly type = "point" as const;
  readonly isVisual = false;
  readonly dependencies: string[];
  readonly parameters: (keyof TConfig)[] = [];

  private readonly p1Id: string;
  private readonly p2Id: string;

  constructor(id: string, p1: PointLikeExpression<TConfig>, p2: PointLikeExpression<TConfig>) {
    this.id = id;
    this.p1Id = p1.id;
    this.p2Id = p2.id;
    this.dependencies = [p1.id, p2.id];
  }

  get d() {
    return {
      type: "geometry_feature_reference" as const,
      sourceId: this.id,
      property: "x" as const,
    };
  }

  compile(_renderer: GeometryRenderer): Step<TConfig> {
    return {
      id: createStepId(renderer.namespace, this.id),
      inputs: this.dependencies,
      outputs: [this.id],
      parameters: this.parameters,
      compute: (
        inputs: Map<string, GeometryValue>,
        _params: TConfig,
      ): Map<string, GeometryValue> => {
        const p1 = inputs.get(this.p1Id);
        const p2 = inputs.get(this.p2Id);
        if (!p1 || !isPoint(p1))
          throw new Error(`DistanceExpression ${this.id}: missing or invalid first point`);
        if (!p2 || !isPoint(p2))
          throw new Error(`DistanceExpression ${this.id}: missing or invalid second point`);
        const dist = computeDistance(p1, p2);
        return new Map([[this.id, { type: "point" as const, x: dist, y: 0 }]]);
      },
      draw: (): void => {},
    };
  }
}
