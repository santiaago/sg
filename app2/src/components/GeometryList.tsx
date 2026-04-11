import type { JSX } from 'react'

interface GeometryListProps {
  store: any
  stroke?: number
  strokeMid?: number
  strokeBig?: number
  strokeLine?: number
}

interface GeometryItem {
  name: string
  element: any
  selected: boolean
  type: string
  context?: any
}

export function GeometryList({ store, stroke = 0.5, strokeBig = 2 }: GeometryListProps): JSX.Element {
  
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
      return item.context ? 'text-red-400' : 'text-yellow-400';
    }
    return 'text-white';
  };

  return (
    <div className="geometry-list">
      <h3>Geometry Items</h3>
      <p>Store has {Object.keys(store.items || {}).length} items</p>
      <ul>
        {store.items && Object.entries(store.items).map(([key, item]) => (
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
  )
}

// Apply visual feedback to SVG elements based on selection state
function applyVisualFeedback(element: any, shape: GeometryItem, stroke: number, strokeBig: number) {
  if (!element) return;
  
  try {
    if (shape.type === "point") {
      if (shape.selected) {
        element.setAttribute('fill', 'black');
        element.setAttribute('r', stroke.toString());
        // Show tooltip and background when selected
        if (element.tooltip) {
          element.tooltip.setAttribute('opacity', '1');
        }
        if (element.tooltipBg) {
          element.tooltipBg.setAttribute('opacity', '1');
        }
      } else {
        element.setAttribute('fill', 'red');
        element.setAttribute('r', strokeBig.toString());
        // Hide tooltip and background when not selected
        if (element.tooltip) {
          element.tooltip.setAttribute('opacity', '0');
        }
        if (element.tooltipBg) {
          element.tooltipBg.setAttribute('opacity', '0');
        }
      }
    }
    else if (shape.type === "circle" || shape.type === "line") {
      if (shape.selected) {
        element.setAttribute('stroke-width', strokeBig.toString());
        element.setAttribute('stroke', 'red');  // Make selected items red for visibility
      } else {
        element.setAttribute('stroke-width', stroke.toString());
        element.setAttribute('stroke', '#f06');  // Original color
      }
    }
  } catch (error) {
    console.error('Error applying visual feedback:', error);
  }
}