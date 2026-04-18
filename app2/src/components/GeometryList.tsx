import type { JSX } from "react";

interface GeometryListProps {
  store: any;
  stroke?: number;
  strokeMid?: number;
  strokeBig?: number;
  strokeLine?: number;
}

interface GeometryItem {
  name: string;
  element: any;
  selected: boolean;
  type: string;
  context?: any;
  initialState?: Record<string, string>;
}

export function GeometryList({
  store,
  stroke = 0.5,
  strokeBig = 2,
}: GeometryListProps): JSX.Element {
  const handleClick = (name: string) => {
    const item = store.items[name] as GeometryItem | undefined;
    if (!item) return;

    // Toggle selection state
    store.update(name, { selected: !item.selected });

    // Apply visual feedback to the SVG element
    applyVisualFeedback(item.element, { ...item, selected: !item.selected }, stroke, strokeBig);
  };

  const getItemColor = (name: string) => {
    const item = store.items[name] as GeometryItem | undefined;
    if (item?.selected) {
      return item.context ? "text-red-400" : "text-yellow-400";
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
