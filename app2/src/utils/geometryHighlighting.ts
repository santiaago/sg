import type { GeometryItem } from "../react-store";
import type { GeometryStore } from "../react-store";
import { POINT_HIGHLIGHT_RADIUS } from "../config/geometryConfig";

// Color constants for highlighting - these match the Theme interface values
const COLOR_INPUT_HIGHLIGHT = "orange";
const COLOR_HOVER_DETAILS = "cyan";
const COLOR_SELECTED = "red";

/**
 * SVG element types that support tooltip properties.
 * Extends standard SVG elements with custom tooltip and tooltipBg properties.
 * Note: Only types with global type extensions in svgElements.ts are included.
 */
type SvgWithTooltips = SVGCircleElement | SVGLineElement | SVGGElement;

/**
 * Element type for highlighting functions - accepts SVG elements with tooltips or null.
 */
type HighlightElement = SvgWithTooltips | null;

/**
 * Update the arrowhead marker color for a specific coordinate system or all
 * @param svg - The SVG element
 * @param color - The color to set
 * @param geomId - Optional geometry ID to target specific marker (e.g., "cs", "cs2")
 */
function updateArrowheadMarkerColor(
  svg: SVGSVGElement | null,
  color: string,
  geomId?: string,
): void {
  console.log(`[updateArrowheadMarkerColor] color=${color}, geomId=${geomId}, svg=${!!svg}`);
  if (!svg) return;
  if (geomId) {
    // Update only the specific coordinate system's arrowhead marker
    const marker = svg.querySelector(`#arrowhead-${geomId} polygon`);
    console.log(
      `[updateArrowheadMarkerColor] marker found=${!!marker}, selector=#arrowhead-${geomId} polygon`,
    );
    if (marker) {
      console.log(`[updateArrowheadMarkerColor] Setting marker fill to ${color}`);
      marker.setAttribute("fill", color);
      return;
    }
    // If specific marker not found, fall through to update all
    console.log(`[updateArrowheadMarkerColor] Specific marker not found, will try all`);
  }
  // Fallback: update all arrowhead markers (for backward compatibility or when geomId not provided)
  const arrowheads = svg.querySelectorAll("[id^='arrowhead-'] polygon");
  console.log(`[updateArrowheadMarkerColor] Found ${arrowheads.length} arrowheads to update`);
  arrowheads.forEach((a) => {
    console.log(`[updateArrowheadMarkerColor] Setting arrowhead fill to ${color}`);
    a.setAttribute("fill", color);
  });
}

/**
 * Get the SVG element from a geometry item's element
 */
function getSvgFromElement(element: HighlightElement): SVGSVGElement | null {
  if (!element || !(element instanceof Element)) return null;
  // Walk up the DOM to find the SVG element
  let current: Element | null = element;
  while (current && current.tagName !== "svg") {
    current = current.parentElement;
  }
  return current as SVGSVGElement | null;
}

/**
 * Apply styling to coordinate system arrow and label child elements.
 * Lines use stroke, text labels use fill.
 */
function applyToCsArrows(element: HighlightElement, strokeColor: string, fillColor?: string): void {
  if (!element) return;
  const color = fillColor ?? strokeColor;

  // Apply to the group itself
  console.log(
    `[applyToCsArrows] Applying to group element, tag=${element.tagName}, stroke=${strokeColor}, fill=${fillColor}`,
  );

  // Also apply to child arrow lines and axis labels
  const csElements = element.querySelectorAll
    ? element.querySelectorAll("[data-cs-arrow], [data-cs-label]")
    : [];
  console.log(`[applyToCsArrows] Found ${csElements.length} child elements`);
  csElements.forEach((el: Element) => {
    const tagName = el.tagName.toLowerCase();
    const isArrow = el.getAttribute("data-cs-arrow") !== null;
    const isLabel = el.getAttribute("data-cs-label") !== null;
    console.log(`[applyToCsArrows] Processing ${tagName}, isArrow=${isArrow}, isLabel=${isLabel}`);

    if (tagName === "line" || isArrow) {
      console.log(`[applyToCsArrows] Setting stroke=${strokeColor} on line/arrow`);
      el.setAttribute("stroke", strokeColor);
    } else if (tagName === "text" || isLabel) {
      console.log(`[applyToCsArrows] Setting fill=${color} on text/label`);
      el.setAttribute("fill", color);
    }
  });
}

/**
 * Apply orange visual feedback to SVG elements for highlighted input dependencies
 */
export function applyInputVisualFeedback(
  element: HighlightElement,
  shape: GeometryItem,
  scale: number,
): void {
  if (!element) return;

  try {
    if (shape.type === "point") {
      element.setAttribute("fill", COLOR_INPUT_HIGHLIGHT);
      element.setAttribute("r", POINT_HIGHLIGHT_RADIUS.toString());
    } else if (shape.type === "circle" || shape.type === "line" || shape.type === "polygon") {
      element.setAttribute("stroke", COLOR_INPUT_HIGHLIGHT);
      element.setAttribute("stroke-width", scale.toString());
    } else if (shape.type === "coordinate_system") {
      applyToCsArrows(element, COLOR_INPUT_HIGHLIGHT, COLOR_INPUT_HIGHLIGHT);
      // Also update arrowhead marker color
      const svg = getSvgFromElement(element);
      const geomId = element.getAttribute("data-geom-id");
      updateArrowheadMarkerColor(svg, COLOR_INPUT_HIGHLIGHT, geomId || undefined);
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
export function restoreInitialState(element: HighlightElement, shape: GeometryItem): void {
  if (!element) return;

  try {
    if (shape.initialState) {
      Object.entries(shape.initialState).forEach(([attr, value]) => {
        element.setAttribute(attr, value);
      });
    }

    // For coordinate system, also restore child arrow and label states
    if (shape.type === "coordinate_system") {
      const csElements = element.querySelectorAll
        ? element.querySelectorAll("[data-cs-arrow], [data-cs-label]")
        : [];
      csElements.forEach((el: Element) => {
        if (shape.initialState) {
          Object.entries(shape.initialState).forEach(([attr, value]) => {
            el.setAttribute(attr, value);
          });
        }
        // Restore original colors from data attributes
        const tagName = el.tagName.toLowerCase();
        if (tagName === "line" || el.getAttribute("data-cs-arrow") !== null) {
          const originalStroke =
            el.getAttribute("data-original-stroke") || el.getAttribute("stroke");
          if (originalStroke) {
            el.setAttribute("stroke", originalStroke);
          }
        } else if (tagName === "text" || el.getAttribute("data-cs-label") !== null) {
          const originalFill = el.getAttribute("data-original-fill") || el.getAttribute("fill");
          if (originalFill) {
            el.setAttribute("fill", originalFill);
          }
        }
      });
      // Restore arrowhead marker to original stroke color
      if (element && element.querySelector) {
        const xArrow = element.querySelector("[data-cs-arrow]");
        if (xArrow) {
          const originalStroke =
            xArrow.getAttribute("data-original-stroke") || xArrow.getAttribute("stroke");
          if (originalStroke) {
            const svg = getSvgFromElement(element);
            const geomId = element.getAttribute("data-geom-id");
            updateArrowheadMarkerColor(svg, originalStroke, geomId || undefined);
          }
        }
      }
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
 * Select a geometry item and apply visual feedback.
 * Always deselects all other geometries and selects the clicked one.
 * Used by both GeometryList and GeometryDetails for consistent selection behavior.
 */
export function selectGeometry(
  store: GeometryStore,
  geometryName: string,
  strokeBig: number,
): void {
  console.log(`[selectGeometry] Selecting ${geometryName}`);
  const item = store.items[geometryName] as GeometryItem | undefined;
  if (!item || !item.element) {
    console.log(`[selectGeometry] Item not found for ${geometryName}`);
    return;
  }
  console.log(
    `[selectGeometry] Item found, type=${item.type}, currently selected=${item.selected}`,
  );

  // Deselect all first
  Object.keys(store.items).forEach((key) => {
    const existingItem = store.items[key] as GeometryItem | undefined;
    if (existingItem && existingItem.element) {
      console.log(`[selectGeometry] Deselecting ${key}, type=${existingItem.type}`);
      store.update(key, { selected: false });
      applyVisualFeedback(existingItem.element, { ...existingItem, selected: false }, strokeBig);
    }
  });

  // Select the clicked one - use original element but with fresh selected state
  store.update(geometryName, { selected: true });
  // Use item.element (known valid) with fresh selected - avoid stale properties from async store
  console.log(`[selectGeometry] Re-selecting ${geometryName}, type=${item.type}`);
  applyVisualFeedback(item.element, { ...item, selected: true }, strokeBig);
}

/**
 * Apply visual feedback to SVG elements based on selection state
 */
export function applyVisualFeedback(
  element: HighlightElement,
  shape: GeometryItem,
  strokeBig: number,
): void {
  if (!element) return;

  try {
    if (shape.selected) {
      // Apply selection styles (consistent red highlighting)
      // For points, use configured highlight radius for better visibility
      if (shape.type === "point") {
        element.setAttribute("fill", COLOR_SELECTED);
        element.setAttribute("r", POINT_HIGHLIGHT_RADIUS.toString());
        // Show tooltip and background when selected
        if (element.tooltip) {
          element.tooltip.setAttribute("opacity", "1");
        }
        if (element.tooltipBg) {
          element.tooltipBg.setAttribute("opacity", "1");
        }
      } else if (shape.type === "circle" || shape.type === "line" || shape.type === "polygon") {
        element.setAttribute("stroke-width", strokeBig.toString());
        element.setAttribute("stroke", COLOR_SELECTED);
        // Show tooltip and background when selected
        if (element.tooltip) {
          element.tooltip.setAttribute("opacity", "1");
        }
        if (element.tooltipBg) {
          element.tooltipBg.setAttribute("opacity", "1");
        }
      } else if (shape.type === "coordinate_system") {
        console.log(
          `[applyVisualFeedback] SELECTING coordinate_system, geomId=${element.getAttribute("data-geom-id")}`,
        );
        applyToCsArrows(element, COLOR_SELECTED, COLOR_SELECTED);
        // Also update arrowhead marker color
        const svg = getSvgFromElement(element);
        const geomId = element.getAttribute("data-geom-id");
        console.log(`[applyVisualFeedback] Will update arrowhead for geomId=${geomId}`);
        updateArrowheadMarkerColor(svg, COLOR_SELECTED, geomId || undefined);
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

      // For coordinate system, also restore arrowhead marker and arrow strokes to original color
      if (shape.type === "coordinate_system") {
        console.log(
          `[applyVisualFeedback] DESELECTING coordinate_system, geomId=${element.getAttribute("data-geom-id")}`,
        );
        if (element && element.querySelector) {
          const xArrow = element.querySelector("[data-cs-arrow]");
          if (xArrow) {
            const originalStroke =
              xArrow.getAttribute("data-original-stroke") || xArrow.getAttribute("stroke");
            console.log(
              `[applyVisualFeedback] originalStroke=${originalStroke}, data-original-stroke=${xArrow.getAttribute("data-original-stroke")}, stroke=${xArrow.getAttribute("stroke")}`,
            );
            if (originalStroke) {
              // Restore stroke color to all arrow lines and fill to labels
              applyToCsArrows(element, originalStroke, originalStroke);
              // Restore arrowhead marker color
              const svg = getSvgFromElement(element);
              const geomId = element.getAttribute("data-geom-id");
              console.log(
                `[applyVisualFeedback] Will restore arrowhead for geomId=${geomId} to color=${originalStroke}`,
              );
              updateArrowheadMarkerColor(svg, originalStroke, geomId || undefined);
            } else {
              console.log(`[applyVisualFeedback] No originalStroke found!`);
            }
          } else {
            console.log(`[applyVisualFeedback] No xArrow found!`);
          }
        }
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
  applyVisualFeedback(item.element, { ...item, selected: true }, strokeBig);
}

// Color for tooltip background when hovering in GeometryDetails
// Matches Theme.COLOR_TOOLTIP_HOVER_BG
const COLOR_TOOLTIP_HOVER_BG = "#00ffff";

/**
 * Apply hover-style highlighting to a geometry.
 * Uses the specified color (defaults to orange for backward compatibility).
 * GeometryDetails should pass COLOR_HOVER_DETAILS for distinct hover color.
 * For GeometryDetails hover, the tooltip background color is changed for better visibility.
 */
export function applyHoverHighlight(
  element: HighlightElement,
  shape: GeometryItem,
  scale: number,
  color: string = COLOR_INPUT_HIGHLIGHT,
): void {
  if (!element) return;

  try {
    if (shape.type === "point") {
      element.setAttribute("fill", color);
      element.setAttribute("r", POINT_HIGHLIGHT_RADIUS.toString());
    } else if (shape.type === "circle" || shape.type === "line" || shape.type === "polygon") {
      element.setAttribute("stroke", color);
      element.setAttribute("stroke-width", scale.toString());
    } else if (shape.type === "coordinate_system") {
      applyToCsArrows(element, color, color);
      // Also update arrowhead marker color
      const svg = getSvgFromElement(element);
      const geomId = element.getAttribute("data-geom-id");
      updateArrowheadMarkerColor(svg, color, geomId || undefined);
    }

    // Show tooltip and background for hovered items
    if (element.tooltip) {
      element.tooltip.setAttribute("opacity", "1");
    }
    if (element.tooltipBg) {
      element.tooltipBg.setAttribute("opacity", "1");
      // Change tooltip background color for GeometryDetails hover to distinguish it
      if (color === COLOR_HOVER_DETAILS) {
        element.tooltipBg.setAttribute("fill", COLOR_TOOLTIP_HOVER_BG);
      }
    }
  } catch (error) {
    console.error("Error applying hover highlight:", error);
  }
}

/**
 * Remove hover highlighting from a geometry.
 * If the item is selected, re-applies selection visual feedback instead of restoring to initial state.
 * This ensures selection state persists even when hover ends.
 */
export function removeHoverHighlight(
  element: HighlightElement,
  shape: GeometryItem,
  strokeBig: number,
): void {
  if (!element) return;

  try {
    // If the item is selected, re-apply selection feedback instead of clearing
    if (shape.selected) {
      applyVisualFeedback(element, shape, strokeBig);
      // Restore tooltipBg fill to original color
      if (element.tooltipBg && typeof element.tooltipBg.getAttribute === "function") {
        const originalFill = element.tooltipBg.getAttribute("data-original-fill");
        if (originalFill) {
          element.tooltipBg.setAttribute("fill", originalFill);
        }
      }
      return;
    }

    // If the item is input-highlighted, re-apply input highlighting instead of clearing
    // This preserves input labels when hovering in GeometryDetails
    if (shape.isInputHighlighted) {
      applyInputVisualFeedback(element, shape, strokeBig);
      // Restore tooltipBg fill to original color
      if (element.tooltipBg && typeof element.tooltipBg.getAttribute === "function") {
        const originalFill = element.tooltipBg.getAttribute("data-original-fill");
        if (originalFill) {
          element.tooltipBg.setAttribute("fill", originalFill);
        }
      }
      return;
    }

    // Otherwise restore to initial state
    if (shape.initialState) {
      Object.entries(shape.initialState).forEach(([attr, value]) => {
        element.setAttribute(attr, value);
      });
    }

    // Hide tooltips and restore tooltipBg fill to original color
    if (element.tooltip) {
      element.tooltip.setAttribute("opacity", "0");
    }
    if (element.tooltipBg) {
      element.tooltipBg.setAttribute("opacity", "0");
      if (typeof element.tooltipBg.getAttribute === "function") {
        const originalFill = element.tooltipBg.getAttribute("data-original-fill");
        if (originalFill) {
          element.tooltipBg.setAttribute("fill", originalFill);
        }
      }
    }
  } catch (error) {
    console.error("Error removing hover highlight:", error);
  }
}
