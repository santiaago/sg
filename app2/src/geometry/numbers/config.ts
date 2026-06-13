/**
 * Number geometry configuration
 * Follows pattern of SquareConfig and SixFoldV0Config
 */

/** Configuration for number geometry construction */
export interface NumberConfig {
  width: number;
  height: number;
  border: number;
  // P1 and P2 are the endpoints of line1
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
  /** Arrow length for coordinate system */
  coordinateSystemArrowLength: number;
}

/**
 * Computes the number geometry configuration from SVG dimensions.
 * Matches sixfold-dsl-v1 pattern: p1 at (border, height - border),
 * p2 at (width - border, height - border), with border = height / 3.
 */
export function computeNumberConfig(width: number, height: number): NumberConfig {
  const border = height / 3;
  const p1x = border;
  const p1y = height - border;
  const p2x = width - border;
  const p2y = height - border;

  return {
    width,
    height,
    border,
    p1x,
    p1y,
    p2x,
    p2y,
    coordinateSystemArrowLength: height / 24,
  };
}
