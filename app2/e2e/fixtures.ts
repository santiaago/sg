/**
 * Test data constants for Playwright E2E tests
 * Uses actual geometry names from the app's GEOM constants
 */

// Section identifiers
export const SECTION_SQUARE_DSL = "square-dsl";
export const SECTION_SIXFOLD_DSL = "sixfold-dsl";
export const SECTION_SIXFOLD_DSL_V1 = "sixfold-dsl-v1";
export const SECTION_SIXFOLD_DSL_V2 = "sixfold-dsl-v2";

// Square DSL section geometry names (from DSL construction)
export const SQUARE_DSL_GEOMETRY = {
  MAIN_LINE: "line_main",
  C1: "c1",
  C2: "c2",
  C1_CIRCLE: "c1_c",
  C2_CIRCLE: "c2_c",
  INTERSECTION_POINT: "pi",
  INTERSECTION_CIRCLE: "ci",
  P3: "p3",
  P4: "p4",
  LINE_C2_PI: "line_c2_pi",
  LINE_C1_PI: "line_c1_pi",
  LINE_C1_P3: "line_c1_p3",
  LINE_C2_P4: "line_c2_p4",
  PL: "pl",
  PR: "pr",
  SQUARE: "square",
} as const;

// Step numbers for test data
export const TEST_STEPS = {
  SQUARE_DSL: {
    // Step 5 should have multiple geometries including circles
    STEP_WITH_CIRCLES: 5,
    STEP_WITH_SQUARE: 16, // Final step with square
  },
  SIXFOLD_DSL_V1: {
    BASELINE: 1,
    STEP_WITH_DEPENDENCIES: 45,
    FINAL_STEP: 96,
  },
} as const;

// SVG configuration
export const SVG_CONFIG = {
  WIDTH: 800,
  HEIGHT: 600,
  VIEWBOX: "0 0 800 600",
  XMLNS: "http://www.w3.org/2000/svg",
} as const;

// Theme constants
export const THEME = {
  DARK: "dark",
  LIGHT: "light",
} as const;

// Geometry types
export const GEOMETRY_TYPES = ["point", "line", "circle", "polygon"] as const;

// Navigation button selectors
export const NAV_BUTTONS = {
  SQUARE_DSL: "Square DSL",
  SIXFOLD_DSL: "SixFold DSL",
  SIXFOLD_DSL_V1: "SixFold DSL v1",
  SIXFOLD_DSL_V2: "SixFold DSL v2",
} as const;

// Button titles
export const BUTTON_TITLES = {
  GO_TO_BEGINNING: "Go to beginning",
  GO_TO_END: "Go to end",
  COPY_SVG: "Copy SVG to clipboard",
  COPY_URL: "Copy URL to clipboard",
} as const;
