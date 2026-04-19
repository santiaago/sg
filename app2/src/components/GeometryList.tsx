import { useState, useEffect } from "react";
import type { JSX } from "react";
import type { GeometryItem } from "../react-store";

interface GeometryListProps {
  store: any;
  stroke?: number;
  strokeMid?: number;
  strokeBig?: number;
  strokeLine?: number;
  showInputHighlight?: boolean;
}

export function GeometryList({
  store,
  stroke = 0.5,
  strokeBig = 2,
  showInputHighlight = false,
}: GeometryListProps): JSX.Element {
  const [highlightedInputs, setHighlightedInputs] = useState<Set<string>>(new Set());

  // Clear highlighted inputs when toggle is turned OFF
  useEffect(() => {
    if (!showInputHighlight) {
      setHighlightedInputs(new Set());
    }
  }, [showInputHighlight]);

  // Apply orange styles to SVG elements for highlighted inputs
  useEffect(() => {
    if (!showInputHighlight) return;

    const items = store.items || {};
    Object.values(items).forEach((item: unknown) => {
      const geometryItem = item as GeometryItem;
      if (!geometryItem.element) return;

      if (highlightedInputs.has(geometryItem.name)) {
        applyInputVisualFeedback(geometryItem.element, geometryItem, strokeBig);
      } else if (!geometryItem.selected) {
        restoreInitialState(geometryItem.element, geometryItem);
      }
    });
  }, [highlightedInputs, showInputHighlight, store.items, strokeBig]);

  const handleClick = (name: string) => {
    const item = store.items[name] as GeometryItem | undefined;
    if (!item) return;

    // Deselect all first for single selection mode
    Object.keys(store.items).forEach((key) => {
      const existingItem = store.items[key] as GeometryItem | undefined;
      if (existingItem) {
        store.update(key, { selected: false });
        // Restore visual state for deselected items
        applyVisualFeedback(existingItem.element, { ...existingItem, selected: false }, stroke, strokeBig);
      }
    });

    // Select the clicked one
    store.update(name, { selected: true });

    // Update highlighted inputs based on selection
    if (showInputHighlight) {
      // Highlight this item's dependencies
      setHighlightedInputs(new Set(item.dependsOn || []));
    }

    // Apply visual feedback to the clicked SVG element
    applyVisualFeedback(item.element, { ...item, selected: true }, stroke, strokeBig);
  };

  const getItemColor = (name: string) => {
    const item = store.items[name] as GeometryItem | undefined;
    if (!item) return "text-white";

    if (item.selected) {
      return item.context ? "text-red-400" : "text-yellow-400";
    }

    // Highlight inputs in orange when feature is enabled
    if (showInputHighlight && highlightedInputs.has(name)) {
      return "text-orange-400";
    }

    return "text-white";
  };

  return (
    <div className="geometry-list">
      <h3>Geometry Items</h3>
      <p>Store has {Object.keys(store.items || {}).length} items</p>
      <ul>
        {store.items &&
          Object.entries(store.items).map(([key, item]) => (
            <li
              key={key}
              onClick={() => handleClick(key)}
              className={`cursor-pointer hover:underline ${getItemColor(key)}`}
            >
              {(item as GeometryItem).name} | {(item as GeometryItem).type}
            </li>
          ))}
      </ul>
    </div>
  );
}

// Apply orange visual feedback to SVG elements for highlighted input dependencies
export function applyInputVisualFeedback(element: any, shape: GeometryItem, scale: number) {
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

// Restore an SVG element to its initial state
export function restoreInitialState(element: any, shape: GeometryItem) {
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

// Apply visual feedback to SVG elements based on selection state
function applyVisualFeedback(
  element: any,
  shape: GeometryItem,
  _stroke: number,
  strokeBig: number,
) {
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
