/**
 * Test data constants for Playwright E2E tests
 * Uses actual geometry names from the app's GEOM constants
 */

// Section identifiers
export const SECTION_SQUARE = 'square';
export const SECTION_SIXFOLD_V0 = 'sixfold-v0';

// Square section geometry names (from GEOM constants in operations.ts)
export const SQUARE_GEOMETRY = {
  MAIN_LINE: 'line_main',
  C1: 'c1',
  C2: 'c2',
  C1_CIRCLE: 'c1_c',
  C2_CIRCLE: 'c2_c',
  INTERSECTION_POINT: 'pi',
  INTERSECTION_CIRCLE: 'ci',
  P3: 'p3',
  P4: 'p4',
  LINE_C2_PI: 'line_c2_pi',
  LINE_C1_PI: 'line_c1_pi',
  LINE_C1_P3: 'line_c1_p3',
  LINE_C2_P4: 'line_c2_p4',
  PL: 'pl',
  PR: 'pr',
  SQUARE: 'square',
} as const;

// SixFold v0 geometry names (from GEOM constants in sixFold/operations.ts)
export const SIXFOLD_V0_GEOMETRY = {
  LINE1: 'line1',
  P1: 'p1',
  P2: 'p2',
  CP1: 'cp1',
  CP2: 'cp2',
  C1: 'c1',
  C2: 'c2',
  PIC12: 'pic12',
  CPIC12: 'cPic12',
  P3: 'p3',
  P4: 'p4',
  L13: 'l13',
  L24: 'l24',
  // Polygon at step 45
  POLYGON_0: 'outline1', // First polygon outline
} as const;

// Step numbers for test data
export const TEST_STEPS = {
  SQUARE: {
    // Step 5 should have multiple geometries including circles
    STEP_WITH_CIRCLES: 5,
    STEP_WITH_SQUARE: 16, // Final step with square
  },
  SIXFOLD_V0: {
    BASELINE: 1,
    STEP_WITH_DEPENDENCIES: 45, // Should have polygon-0 (outline1)
    FINAL_STEP: 93,
  },
} as const;

// SVG configuration
export const SVG_CONFIG = {
  WIDTH: 800,
  HEIGHT: 600,
  VIEWBOX: '0 0 800 600',
  XMLNS: 'http://www.w3.org/2000/svg',
} as const;

// Theme constants
export const THEME = {
  DARK: 'dark',
  LIGHT: 'light',
} as const;

// Geometry types
export const GEOMETRY_TYPES = ['point', 'line', 'circle', 'polygon'] as const;

// Navigation button selectors
export const NAV_BUTTONS = {
  SQUARE: 'Square',
  SIXFOLD_V0: 'SixFold v0',
} as const;

// Button titles
export const BUTTON_TITLES = {
  GO_TO_BEGINNING: 'Go to beginning',
  GO_TO_END: 'Go to end',
  COPY_SVG: 'Copy SVG to clipboard',
  COPY_URL: 'Copy URL to clipboard',
} as const;
