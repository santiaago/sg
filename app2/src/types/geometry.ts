// Type definitions for geometry operations and dependency tracking.
// These types enable:
// - Explicit declaration of geometry inputs and outputs
// - Lazy step-by-step calculation
// - Dependency graph tracking for visualization

// Geometry Value Types

export interface Point {
  type: "point";
  x: number;
  y: number;
}

export interface Line {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Circle {
  type: "circle";
  cx: number;
  cy: number;
  r: number;
}

export interface Rectangle {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Polygon {
  type: "polygon";
  points: { x: number; y: number }[];
}

// Union type for all geometry values
export type GeometryValue = Point | Line | Circle | Rectangle | Polygon;

// Geometry Node (for dependency tracking)

export interface GeometryNode {
  id: string;
  type: GeometryValue["type"];
  value?: GeometryValue;
  // IDs of input geometries
  dependsOn: string[];
}

// Step Definition (for lazy execution)

export interface StepConfig {
  width: number;
  height: number;
  stroke: number;
  strokeBig: number;
  circleRadius: number;
  // Geometry positions
  c1x: number;
  c2x: number;
  ly1: number;
  ly2: number;
  lx1: number;
  lx2: number;
}

// Represents a single step in the geometric construction.
// Each step:
// 1. Declares its input geometry IDs (dependencies)
// 2. Declares its output geometry IDs (what it produces)
// 3. Provides a compute function to calculate outputs from inputs
// 4. Provides a draw function to render the geometries
// This design enables lazy calculation, automatic dependency tracking,
// and separation of calculation and rendering
export interface Step {
  // Unique identifier for this step
  id: string;

  // IDs of geometries this step requires as input
  inputs: string[];

  // IDs of geometries this step produces as output
  outputs: string[];

  // Computes output geometries from input geometries.
  // Called only when this step becomes current.
  // inputs - Map of input geometry IDs to their values
  // config - SVG configuration and styling values
  // returns Map of output geometry IDs to their computed values
  compute: (inputs: Map<string, GeometryValue>, config: StepConfig) => Map<string, GeometryValue>;

  // Draws the geometries for this step.
  // Called after compute() to render the step's output.
  // svg - The SVG element to draw into
  // values - Map of ALL geometry values (including those from previous steps)
  // store - Optional store for managing SVG elements and tooltips
  draw: (svg: SVGSVGElement, values: Map<string, GeometryValue>, store?: any) => void;
}

// Dependency Graph Types

export interface DependencyEdge {
  source: string; // Geometry ID that is depended upon
  target: string; // Geometry ID that depends on source
}

export interface DependencyGraph {
  nodes: GeometryNode[];
  edges: DependencyEdge[];
}

// Utility Types

export type GeometryType = GeometryValue["type"];

export function isPoint(value: GeometryValue): value is Point {
  return value.type === "point";
}

export function isLine(value: GeometryValue): value is Line {
  return value.type === "line";
}

export function isCircle(value: GeometryValue): value is Circle {
  return value.type === "circle";
}

export function isRectangle(value: GeometryValue): value is Rectangle {
  return value.type === "rectangle";
}

export function point(x: number, y: number): Point {
  return { type: "point", x, y };
}

export function line(x1: number, y1: number, x2: number, y2: number): Line {
  return { type: "line", x1, y1, x2, y2 };
}

export function circle(cx: number, cy: number, r: number): Circle {
  return { type: "circle", cx, cy, r };
}

export function rectangle(x: number, y: number, width: number, height: number): Rectangle {
  return { type: "rectangle", x, y, width, height };
}

export function polygon(points: { x: number; y: number }[]): Polygon {
  return { type: "polygon", points };
}

export function isPolygon(value: GeometryValue): value is Polygon {
  return value.type === "polygon";
}
