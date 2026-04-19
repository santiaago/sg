import type { JSX } from "react";
import type { GeometryStore } from "../react-store";
import type { GeometryItem } from "../react-store";

export interface GeometryDetailsProps {
  store: GeometryStore;
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

// Get outputs - geometries that depend on the given geometry ID
function getOutputs(store: GeometryStore, geometryId: string): GeometryItem[] {
  const outputs: GeometryItem[] = [];
  for (const [, item] of Object.entries(store.items)) {
    if (item.dependsOn?.includes(geometryId)) {
      outputs.push(item as GeometryItem);
    }
  }
  return outputs;
}

// Get the display name for a parameter type
function getParameterType(paramName: string): string {
  return PARAMETER_TYPES[paramName] || "unknown";
}

export function GeometryDetails({ store }: GeometryDetailsProps): JSX.Element {
  const selectedGeometry = getSelectedGeometry(store);

  if (!selectedGeometry) {
    return <></>;
  }

  const outputs = getOutputs(store, selectedGeometry.name);

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
                  <span className="text-white">{depName}</span>
                  {depItem.type && <span className="text-gray-400"> : {depItem.type}</span>}
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
        {selectedGeometry.parameterValues && Object.keys(selectedGeometry.parameterValues).length > 0 ? (
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
                <span className="text-white">{output.name}</span>
                {output.type && <span className="text-gray-400"> : {output.type}</span>}
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
