import type { GeometryItem } from "../react-store";

/**
 * Apply orange visual feedback to SVG elements for highlighted input dependencies
 */
export function applyInputVisualFeedback(
  element: any,
  shape: GeometryItem,
  scale: number,
): void {
  if (!element) return;

  try {
    if (shape.type === "point") {
      element.setAttribute("fill", "orange");
      element.setAttribute("r", scale.toString());
    } else if (shape.type === "circle" || shape.type === "line" || shape.type === "polygon") {
      element.setAttribute("stroke", "orange");
      element.setAttribute("stroke-width", scale.toString());
    }

    // Show tooltip and background for highlighted inputs
    if (element.tooltip) {
      element.tooltip.setAttribute("opacity", "1");
    }
    if (element.tooltipBg) {
      element.tooltipBg.setAttribute("opacity", "1");
    }
  } catch (error) {
    console.error("Error applying input visual feedback:", error);
  }
}

/**
 * Restore an SVG element to its initial state
 */
export function restoreInitialState(element: any, shape: GeometryItem): void {
  if (!element) return;

  try {
    if (shape.initialState) {
      Object.entries(shape.initialState).forEach(([attr, value]) => {
        element.setAttribute(attr, value);
      });
    }

    // Hide tooltips
    if (element.tooltip) {
      element.tooltip.setAttribute("opacity", "0");
    }
    if (element.tooltipBg) {
      element.tooltipBg.setAttribute("opacity", "0");
    }
  } catch (error) {
    console.error("Error restoring initial state:", error);
  }
}

/**
 * Apply visual feedback to SVG elements based on selection state
 */
export function applyVisualFeedback(
  element: any,
  shape: GeometryItem,
  stroke: number,
  strokeBig: number,
): void {
  if (!element) return;

  try {
    if (shape.selected) {
      // Apply selection styles (consistent red highlighting)
      if (shape.type === "point") {
        element.setAttribute("fill", "red");
        element.setAttribute("r", strokeBig.toString());
        // Show tooltip and background when selected
        if (element.tooltip) {
          element.tooltip.setAttribute("opacity", "1");
        }
        if (element.tooltipBg) {
          element.tooltipBg.setAttribute("opacity", "1");
        }
      } else if (shape.type === "circle" || shape.type === "line" || shape.type === "polygon") {
        element.setAttribute("stroke-width", strokeBig.toString());
        element.setAttribute("stroke", "red");
        // Show tooltip and background when selected
        if (element.tooltip) {
          element.tooltip.setAttribute("opacity", "1");
        }
        if (element.tooltipBg) {
          element.tooltipBg.setAttribute("opacity", "1");
        }
      }
    } else {
      // Restore original state from store
      if (shape.initialState) {
        Object.entries(shape.initialState).forEach(([attr, value]) => {
          element.setAttribute(attr, value);
        });
      }

      // Hide tooltips for all geometry types when unselected
      if (element.tooltip) {
        element.tooltip.setAttribute("opacity", "0");
      }
      if (element.tooltipBg) {
        element.tooltipBg.setAttribute("opacity", "0");
      }
    }
  } catch (error) {
    console.error("Error applying visual feedback:", error);
  }
}

/**
 * Highlight a specific geometry by name in the store
 * This applies the selection visual feedback to the geometry element
 */
export function highlightGeometry(
  store: { items: Record<string, GeometryItem> },
  geometryName: string,
  stroke: number,
  strokeBig: number,
): void {
  const item = store.items[geometryName] as GeometryItem | undefined;
  if (!item || !item.element) return;

  // Deselect all first
  Object.keys(store.items).forEach((key) => {
    const existingItem = store.items[key] as GeometryItem | undefined;
    if (existingItem && existingItem.element) {
      restoreInitialState(existingItem.element, existingItem);
    }
  });

  // Apply visual feedback to the selected geometry
  applyVisualFeedback(item.element, { ...item, selected: true }, stroke, strokeBig);
}

/**
 * Apply hover-style highlighting to a geometry (orange, similar to input highlighting)
 */
export function applyHoverHighlight(
  element: any,
  shape: GeometryItem,
  scale: number,
): void {
  if (!element) return;

  try {
    if (shape.type === "point") {
      element.setAttribute("fill", "orange");
      element.setAttribute("r", scale.toString());
    } else if (shape.type === "circle" || shape.type === "line" || shape.type === "polygon") {
      element.setAttribute("stroke", "orange");
      element.setAttribute("stroke-width", scale.toString());
    }

    // Show tooltip and background for hovered items
    if (element.tooltip) {
      element.tooltip.setAttribute("opacity", "1");
    }
    if (element.tooltipBg) {
      element.tooltipBg.setAttribute("opacity", "1");
    }
  } catch (error) {
    console.error("Error applying hover highlight:", error);
  }
}

/**
 * Remove hover highlighting from a geometry
 */
export function removeHoverHighlight(element: any, shape: GeometryItem): void {
  if (!element) return;

  try {
    if (shape.initialState) {
      Object.entries(shape.initialState).forEach(([attr, value]) => {
        element.setAttribute(attr, value);
      });
    }

    // Hide tooltips
    if (element.tooltip) {
      element.tooltip.setAttribute("opacity", "0");
    }
    if (element.tooltipBg) {
      element.tooltipBg.setAttribute("opacity", "0");
    }
  } catch (error) {
    console.error("Error removing hover highlight:", error);
  }
}
