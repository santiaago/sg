/**
 * SixFoldV0 geometry configuration and constants
 * Follows the pattern of Square's operations.ts
 */

import type { GeometryValue } from "../../types/geometry";
import type { GeometryStore } from "../../react-store";
import type { Theme } from "../../themes";
import { getGeometry, computeSingle, computeMultiple } from "../../geometry/operations";

export { getGeometry, computeSingle, computeMultiple };

// Re-export types for convenience
export type { GeometryStore, Theme };

// Constants
export const CUT_LINE_BY = 8;

// Geometry ID constants
export const GEOM = {
  LINE1: "line1",
  P1: "p1",
  P2: "p2",
  C1: "c1",
  C2: "c2",
  C3: "c3",
  C4: "c4",
  CPIC12: "cPic12",
  P3: "p3",
  P4: "p4",
  CP1: "cp1",
  CP2: "cp2",
  CP3: "cp3",
  CP4: "cp4",
  L12: "l12",
  L23: "l23",
  L34: "l34",
  L41: "l41",
  PIC12: "pic12",
  PIC14: "pic14",
  LPIC12: "lpic12",
  LPIC14: "lpic14",
  L13: "l13",
  L24: "l24",
  LCP1CP3: "lcp1cp3",
  LCP2CP4: "lcp2cp4",
  PI2: "pi2",
  C1_D1: "c1_d1",
  C2_D1: "c2_d1",
  C3_D1: "c3_d1",
  C4_D1: "c4_d1",
  C14_D1: "c14_d1",
  C12_D1: "c12_d1",
  PI3: "pi3",
  PI4: "pi4",
  LCP1PI3: "lcp1pi3",
  LCP1PI4: "lcp1pi4",
  PRX5: "prx5",
  PRX6: "prx6",
  C23W: "c23w",
  L14P: "l14p",
  PC23: "pc23",
  C23S: "c23s",
  C23: "c23",
  CPI12: "cpic12",
  C34N: "c34n",
  LPIC12C34N: "lpic12c34n",
  PC34: "pc34",
  C34: "c34",
  C34E: "c34e",
  PP: "pp",
  L1: "l1",
  PII1: "pii1",
  PII2: "pii2",
  LPII1PII2: "lpii1pii2",
  C1_D3: "c1_d3",
  C2_D3: "c2_d3",
  C3_D3: "c3_d3",
  C4_D3: "c4_d3",
  LCP2PIC14: "lcp2pic14",
  LCP4PIC12: "lcp4pic12",
  PIC4: "pic4",
  OUTLINE1: "outline1",
  PIC2: "pic2",
  OUTLINE2: "outline2",
  PIC1W: "pic1w",
  PIC34: "pic34",
  OUTLINE3: "outline3",
  PIC1N: "pic1n",
  PIC23: "pic23",
  OUTLINE4: "outline4",
  PC1W: "pc1w",
  PC23S: "pc23s",
  OUTLINE5: "outline5",
  PC1N: "pc1n",
  PC34E: "pc34e",
  OUTLINE6: "outline6",
  OUTLINE7: "outline7",
  OUTLINE8: "outline8",
  PC3SW: "pc3sw",
  PC23E: "pc23e",
  OUTLINE9: "outline9",
  PC34S: "pc34s",
  OUTLINE10: "outline10",
  OUTLINE11: "outline11",
  OUTLINE12: "outline12",
  OUTLINE13: "outline13",
  OUTLINE14: "outline14",
  OUTLINE15: "outline15",
  OUTLINE16: "outline16",
  OUTLINE17: "outline17",
  OUTLINE18: "outline18",
} as const;

export type GeometryId = (typeof GEOM)[keyof typeof GEOM];

// Local Step type for SixFoldV0 that uses SixFoldV0Config instead of SquareConfig
export interface SixFoldV0Step {
  id: string;
  inputs: string[];
  outputs: string[];
  parameters?: (keyof SixFoldV0Config)[];
  compute: (
    inputs: Map<string, GeometryValue>,
    config: SixFoldV0Config,
  ) => Map<string, GeometryValue>;
  draw: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    store: GeometryStore,
    theme: Theme,
  ) => void;
}

/** Configuration for SixFoldV0 geometry construction */
export interface SixFoldV0Config {
  width: number;
  height: number;
  border: number;
  radius: number;
  lx1: number;
  ly1: number;
  lx2: number;
  ly2: number;
  cx1: number;
  cy1: number;
  cx2: number;
  cy2: number;
  cp1OffsetRatio: number;
}

/**
 * Computes the SixFoldV0 geometry configuration
 * Matches v3 Svelte circlesFromLine logic exactly
 */
export function computeSixFoldV0Config(width: number, height: number): SixFoldV0Config {
  const border = height / 3;
  const lx1 = border;
  const ly1 = height - border;
  const lx2 = width - border;
  const ly2 = height - border;

  // Match v3's circlesFromLine computation
  const lineLength = lx2 - lx1;
  const radius = (lineLength * 2) / CUT_LINE_BY;
  const cx1 = lx1 + (lineLength * 5) / CUT_LINE_BY;
  const cy1 = ly1; // v3 uses line.p2.y which equals ly1
  const cx2 = cx1 - radius;
  const cy2 = cy1;

  // Ensure all values are valid numbers
  function safe(val: number): number {
    if (val !== val || val === Infinity || val === -Infinity) return 0; // Check for NaN and Infinity
    return val;
  }

  return {
    width,
    height,
    border,
    radius,
    lx1: safe(lx1),
    ly1: safe(ly1),
    lx2: safe(lx2),
    ly2: safe(ly2),
    cx1: safe(cx1),
    cy1: safe(cy1),
    cx2: safe(cx2),
    cy2: safe(cy2),
    cp1OffsetRatio: 5 / 8,
  };
}
