import { useState, useEffect, useCallback } from "react";
import type { JSX } from "react";
import type { GeometryStore } from "../react-store";
import type { GeometryItem } from "../react-store";
import type { Step } from "../types/geometry";
import {
  applyVisualFeedback,
  restoreInitialState,
  applyHoverHighlight,
  removeHoverHighlight,
} from "../utils/geometryHighlighting";

export interface GeometryDetailsProps {
  store: GeometryStore;
  stroke?: number;
  strokeBig?: number;
  steps?: readonly Step[];
}

interface GeometryDetailsItemProps {
  name: string;
  type?: string;
  store: GeometryStore;
  stroke: number;
  strokeBig: number;
  isHovered: boolean;
  onHoverStart: (name: string) => void;
  onHoverEnd: () => void;
  onClick: (name: string) => void;
}

function GeometryDetailsItem({
  name,
  type,
  store,
  stroke,
  strokeBig,
  isHovered,
  onHoverStart,
  onHoverEnd,
  onClick,
}: GeometryDetailsItemProps): JSX.Element {
  const item = store.items[name] as GeometryItem | undefined;
  const itemName = item?.name || name;
  const itemType = item?.type || type || "";

  return (
    <span
      onClick={() => onClick(name)}
      onMouseEnter={() => onHoverStart(name)}
      onMouseLeave={onHoverEnd}
      className={`cursor-pointer hover:underline ${
        isHovered ? "text-orange-400" : "text-gray-300"
      }`}
    >
      <span className={isHovered ? "text-orange-400" : "text-white"}>{itemName}</span>
      {itemType && <span className="text-gray-400"> : {itemType}</span>}
    </span>
  );
}

// Parameter type mapping for Square construction
const PARAMETER_TYPES: Record<string, string> = {
  lx1: "number",
  ly1: "number",
  lx2: "number",
  ly2: "number",
  circleRadius: "number",
  C1_POSITION_RATIO: "number",
  tolerance: "number",
  selectMinY: "boolean",
};

// Get the selected geometry item from the store
function getSelectedGeometry(store: GeometryStore): GeometryItem | null {
  const items = store.items;
  for (const [, item] of Object.entries(items)) {
    if (item.selected) {
      return item as GeometryItem;
    }
  }
  return null;
}

// Get outputs - geometries output by the same step that created the selected geometry
function getOutputs(store: GeometryStore, stepId: string, steps?: readonly Step[]): GeometryItem[] {
  const outputs: GeometryItem[] = [];

  if (!steps) return outputs;

  // Find the step that created this geometry
  const step = steps.find((s) => s.id === stepId);
  if (!step || !step.outputs) return outputs;

  // For each output of that step, find the corresponding item in the store
  for (const outputId of step.outputs) {
    const outputItem = store.items[outputId] as GeometryItem | undefined;
    if (outputItem) {
      outputs.push(outputItem);
    }
  }

  return outputs;
}

// Get the display name for a parameter type
function getParameterType(paramName: string): string {
  return PARAMETER_TYPES[paramName] || "unknown";
}

export function GeometryDetails({ store, stroke = 0.5, strokeBig = 2, steps }: GeometryDetailsProps): JSX.Element {
  const selectedGeometry = getSelectedGeometry(store);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Clean up hover highlighting when component unmounts or hovered item changes
  useEffect(() => {
    return () => {
      if (hoveredItem) {
        const item = store.items[hoveredItem] as GeometryItem | undefined;
        if (item?.element) {
          removeHoverHighlight(item.element, item);
        }
      }
    };
  }, [hoveredItem, store.items]);

  const handleHoverStart = useCallback(
    (name: string) => {
      setHoveredItem(name);
      const item = store.items[name] as GeometryItem | undefined;
      if (item?.element) {
        applyHoverHighlight(item.element, item, strokeBig);
      }
    },
    [store.items, strokeBig],
  );

  const handleHoverEnd = useCallback(() => {
    if (hoveredItem) {
      const item = store.items[hoveredItem] as GeometryItem | undefined;
      if (item?.element) {
        // Check if the item is selected
        if (item.selected) {
          applyVisualFeedback(item.element, item, stroke, strokeBig);
        } else {
          removeHoverHighlight(item.element, item);
        }
      }
    }
    setHoveredItem(null);
  }, [hoveredItem, store.items, stroke, strokeBig]);

  const handleClick = useCallback(
    (name: string) => {
      const item = store.items[name] as GeometryItem | undefined;
      if (!item) return;

      // Deselect all first
      Object.keys(store.items).forEach((key) => {
        const existingItem = store.items[key] as GeometryItem | undefined;
        if (existingItem && existingItem.element) {
          store.update(key, { selected: false });
          restoreInitialState(existingItem.element, existingItem);
        }
      });

      // Select the clicked one
      store.update(name, { selected: true });
      applyVisualFeedback(item.element, { ...item, selected: true }, stroke, strokeBig);
    },
    [store, stroke, strokeBig],
  );

  if (!selectedGeometry) {
    return <></>;
  }

  const outputs = getOutputs(store, selectedGeometry.stepId, steps);

  return (
    <div className="mb-4 p-3 bg-slate-800 rounded border border-slate-700">
      <h3 className="text-sm font-medium text-gray-200 mb-3">Details</h3>

      {/* Geometry Section */}
      <div className="mb-3">
        <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-1">Geometry</h4>
        <div className="text-sm">
          <span className="text-white">{selectedGeometry.name || ""}</span>
          <span className="text-gray-400"> : {selectedGeometry.type || ""}</span>
        </div>
        {selectedGeometry.stepId && (
          <div className="text-xs text-gray-500 mt-0.5">
            Created by step: {selectedGeometry.stepId}
          </div>
        )}
      </div>

      {/* Inputs Section */}
      <div className="mb-3">
        <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-1">Inputs</h4>
        {selectedGeometry.dependsOn && selectedGeometry.dependsOn.length > 0 ? (
          <ul className="text-xs space-y-0.5">
            {selectedGeometry.dependsOn.map((depName) => {
              const depItem = store.items[depName] as GeometryItem | undefined;
              if (!depItem) return null;
              return (
                <li key={depName} className="text-gray-300">
                  <GeometryDetailsItem
                    name={depName}
                    type={depItem.type}
                    store={store}
                    stroke={stroke}
                    strokeBig={strokeBig}
                    isHovered={hoveredItem === depName}
                    onHoverStart={handleHoverStart}
                    onHoverEnd={handleHoverEnd}
                    onClick={handleClick}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-gray-500 italic">No inputs</p>
        )}
      </div>

      {/* Parameters Section */}
      <div className="mb-3">
        <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-1">Parameters</h4>
        {selectedGeometry.parameterValues &&
        Object.keys(selectedGeometry.parameterValues).length > 0 ? (
          <ul className="text-xs space-y-0.5">
            {Object.entries(selectedGeometry.parameterValues).map(([name, value]) => {
              const paramType = getParameterType(name);
              return (
                <li key={name} className="text-gray-300">
                  <span className="text-white">{name}</span>
                  <span className="text-gray-400"> : </span>
                  <span className="text-gray-300">{String(value)}</span>
                  <span className="text-gray-500"> ({paramType})</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-gray-500 italic">No parameters</p>
        )}
      </div>

      {/* Outputs Section */}
      <div className="mb-0">
        <h4 className="text-xs text-gray-400 uppercase tracking-wider mb-1">Outputs</h4>
        {outputs.length > 0 ? (
          <ul className="text-xs space-y-0.5">
            {outputs.map((output) => (
              <li key={output.name} className="text-gray-300">
                <GeometryDetailsItem
                  name={output.name}
                  type={output.type}
                  store={store}
                  stroke={stroke}
                  strokeBig={strokeBig}
                  isHovered={hoveredItem === output.name}
                  onHoverStart={handleHoverStart}
                  onHoverEnd={handleHoverEnd}
                  onClick={handleClick}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-500 italic">No outputs</p>
        )}
      </div>
    </div>
  );
}
