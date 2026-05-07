// Declarative Geometry Framework
// Public API for the declarative geometry construction system

import { GeometryBuilder, builder } from "./GeometryBuilder";

// Re-export the main classes and utilities
export { GeometryBuilder, builder };

// Re-export types from the existing geometry system
export type { GeometryValue, Point, Line, Circle, Polygon, CoordinateSystem } from "../types/geometry";
export type { Step } from "../types/geometry";

// Export types from our declarative types
export type { GeometryId, AnyGeometryRef } from "./types";
