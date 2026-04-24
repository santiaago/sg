/**
 * Theme definitions for the application.
 * Each theme contains color values for SVG elements and UI components.
 * The active theme can be toggled at the root level.
 *
 * Light theme matches the EXACT original color constants:
 * - COLOR_PRIMARY = "#506"
 * - COLOR_SECONDARY = "#f06"
 * - COLOR_TEXT = "black"
 * - COLOR_BACKGROUND = "white"
 * - COLOR_CANVAS = "#fff"
 *
 * Dark theme uses slate-based colors for better readability on dark backgrounds.
 */

export interface Theme {
  // Original color constant names preserved
  COLOR_PRIMARY: string;
  COLOR_SECONDARY: string;
  COLOR_TEXT: string;
  COLOR_BACKGROUND: string;
  COLOR_CANVAS: string;
  COLOR_DOT: string;
  // Tooltip colors
  COLOR_TOOLTIP_TEXT: string;
  COLOR_TOOLTIP_BACKGROUND: string;
}

// Light theme - EXACT original colors
export const lightTheme: Theme = {
  COLOR_PRIMARY: "#506",
  COLOR_SECONDARY: "#f06",
  COLOR_TEXT: "black",
  COLOR_BACKGROUND: "white",
  COLOR_CANVAS: "#fff",
  COLOR_DOT: "#000",
  // Tooltip colors - white text on black background (original light theme)
  COLOR_TOOLTIP_TEXT: "white",
  COLOR_TOOLTIP_BACKGROUND: "black",
};

// Dark theme - slate-based colors
export const darkTheme: Theme = {
  COLOR_PRIMARY: "#94a3b8", // slate-400 - light slate for lines
  COLOR_SECONDARY: "#64748b", // slate-500 - medium slate for circles
  COLOR_TEXT: "#334155", // slate-700
  COLOR_BACKGROUND: "#f1f5f9", // slate-100
  COLOR_CANVAS: "#1d293d",
  COLOR_DOT: "#fff",
  // Tooltip colors - opposite of light theme: black text on white background
  COLOR_TOOLTIP_TEXT: "black",
  COLOR_TOOLTIP_BACKGROUND: "white",
};
