import { useState, useCallback, useMemo } from "react";
import type {
  GeometryValue,
  GeometryNode,
  DependencyEdge,
  DependencyGraph,
} from "../types/geometry.js";

export interface GeometryItem {
  name: string;
  element: any;
  selected: boolean;
  type: string;
  context?: any;
  // Store original attributes
  initialState?: Record<string, string>;
}

export interface GeometryStore {
  items: Record<string, GeometryItem>;
  add: (name: string, element: any, type: string) => void;
  update: (key: string, object: Partial<GeometryItem>) => void;
  clear: () => void;
}

interface GeometryStorev2v3v4 {
  items: Record<string, GeometryItem>;
  add: (shape: { name: string; type: string; context?: any }, element: any) => void;
  update: (key: string, object: Partial<GeometryItem>) => void;
  clear: () => void;
}

// Geometry Store with Dependency Tracking (v5)

export interface GeometryValueStore {
  // Map of geometry IDs to their computed values
  geometries: Map<string, GeometryValue>;

  // Map of geometry IDs to their dependency information
  dependencies: Map<string, GeometryNode>;

  // Records a computed geometry value and its dependencies.
  // id - Unique identifier for the geometry
  // value - The computed geometry value
  // type - The geometry type
  // dependsOn - IDs of geometries this one depends on
  addGeometry: (id: string, value: GeometryValue, type: string, dependsOn: string[]) => void;

  // Retrieves a geometry value by ID.
  // id - Geometry ID
  // returns The geometry value or undefined if not found
  getGeometry: (id: string) => GeometryValue | undefined;

  // Retrieves dependency information for a geometry.
  // id - Geometry ID
  // returns The geometry node or undefined if not found
  getNode: (id: string) => GeometryNode | undefined;

  // Gets all geometry nodes.
  getAllNodes: () => GeometryNode[];

  // Gets the complete dependency graph for visualization.
  getDependencyGraph: () => DependencyGraph;

  // Clears all stored geometries and dependencies.
  clear: () => void;
}

// Implementation of GeometryValueStore as a React hook.
export function useGeometryValueStore(): GeometryValueStore {
  const [geometries, setGeometries] = useState<Map<string, GeometryValue>>(new Map());
  const [dependencies, setDependencies] = useState<Map<string, GeometryNode>>(new Map());

  const addGeometry = useCallback(
    (id: string, value: GeometryValue, type: string, dependsOn: string[]) => {
      setGeometries((prev) => {
        const newMap = new Map(prev);
        newMap.set(id, value);
        return newMap;
      });

      setDependencies((prev) => {
        const newMap = new Map(prev);
        newMap.set(id, {
          id,
          type: type as GeometryValue["type"],
          value,
          dependsOn,
        });
        return newMap;
      });
    },
    [],
  );

  const getGeometry = useCallback(
    (id: string): GeometryValue | undefined => {
      return geometries.get(id);
    },
    [geometries],
  );

  const getNode = useCallback(
    (id: string): GeometryNode | undefined => {
      return dependencies.get(id);
    },
    [dependencies],
  );

  const getAllNodes = useCallback((): GeometryNode[] => {
    return Array.from(dependencies.values());
  }, [dependencies]);

  const getDependencyGraph = useCallback((): DependencyGraph => {
    const nodes = Array.from(dependencies.values());
    const edges: DependencyEdge[] = [];

    for (const node of nodes) {
      for (const depId of node.dependsOn) {
        edges.push({
          source: depId,
          target: node.id,
        });
      }
    }

    return { nodes, edges };
  }, [dependencies]);

  const clear = useCallback(() => {
    setGeometries(new Map());
    setDependencies(new Map());
  }, []);

  return useMemo(
    () => ({
      geometries,
      dependencies,
      addGeometry,
      getGeometry,
      getNode,
      getAllNodes,
      getDependencyGraph,
      clear,
    }),
    [
      geometries,
      dependencies,
      addGeometry,
      getGeometry,
      getNode,
      getAllNodes,
      getDependencyGraph,
      clear,
    ],
  );
}

// Combined Store (for backward compatibility + new features)

export interface GeometryStoreEnhanced extends GeometryStore {
  // Geometry value store for dependency tracking
  geometryValues: GeometryValueStore;
}

// Creates a combined store that supports both features.
export function useGeometryStoreEnhanced(): GeometryStoreEnhanced {
  const baseStore = useGeometryStorev2();
  const geometryValues = useGeometryValueStore();

  return useMemo(
    () => ({
      ...baseStore,
      geometryValues,
    }),
    [baseStore, geometryValues],
  );
}

// Attributes to preserve for each geometry type
const ATTRIBUTES_TO_PRESERVE: Record<string, string[]> = {
  point: ["fill", "r", "cx", "cy"],
  line: ["stroke", "stroke-width", "x1", "y1", "x2", "y2"],
  circle: ["stroke", "stroke-width", "cx", "cy", "r"],
};

// Capture the initial state of an SVG element by preserving relevant attributes
// element - The SVG element
// type - The geometry type
// name - The element name (for error reporting)
// returns Record of attribute names and their original values
function captureInitialState(element: any, type: string, name: string): Record<string, string> {
  const initialState: Record<string, string> = {};
  const attributes = ATTRIBUTES_TO_PRESERVE[type] || [];

  attributes.forEach((attr) => {
    try {
      const value = element?.getAttribute?.(attr);
      if (value) {
        initialState[attr] = value;
      }
    } catch (error) {
      console.warn(`Could not get attribute ${attr} for element ${name}:`, error);
    }
  });

  return initialState;
}

export function useGeometryStore(): GeometryStore {
  const [items, setItems] = useState<Record<string, GeometryItem>>({});

  const add = useCallback((name: string, element: any, type: string) => {
    setItems((old) => {
      const newItems = { ...old };
      const initialState = captureInitialState(element, type, name);
      const existingItem = old[name];

      newItems[name] = {
        name,
        element,
        // Preserve existing selected state if this item already exists
        selected: existingItem?.selected ?? false,
        type,
        initialState:
          Object.keys(initialState).length > 0 ? initialState : existingItem?.initialState,
      };
      return newItems;
    });
  }, []);

  const update = useCallback((k: string, o: Partial<GeometryItem>) => {
    setItems((old) => {
      const newItems = { ...old };
      newItems[k] = {
        ...old[k],
        ...o,
      };
      return newItems;
    });
  }, []);

  const clear = useCallback(() => {
    setItems({});
  }, []);

  return useMemo(() => ({ items, add, update, clear }), [items, add, update, clear]);
}

export function useGeometryStoreSquare(): GeometryStore {
  const [items, setItems] = useState<Record<string, GeometryItem>>({});

  const add = useCallback((name: string, element: any, type: string) => {
    setItems((old) => {
      const newItems = { ...old };
      const initialState = captureInitialState(element, type, name);
      const existingItem = old[name];

      newItems[name] = {
        name,
        element,
        // Preserve existing selected state if this item already exists
        selected: existingItem?.selected ?? false,
        type,
        initialState:
          Object.keys(initialState).length > 0 ? initialState : existingItem?.initialState,
      };
      return newItems;
    });
  }, []);

  const update = useCallback((k: string, o: Partial<GeometryItem>) => {
    setItems((old) => {
      const newItems = { ...old };
      newItems[k] = {
        ...old[k],
        ...o,
      };
      return newItems;
    });
  }, []);

  const clear = useCallback(() => {
    setItems({});
  }, []);

  return useMemo(() => ({ items, add, update, clear }), [items, add, update, clear]);
}

export function useGeometryStorev2(): GeometryStorev2v3v4 {
  const [items, setItems] = useState<Record<string, GeometryItem>>({});

  const add = useCallback((shape: { name: string; type: string; context?: any }, element: any) => {
    setItems((old) => {
      const newItems = { ...old };
      const initialState = captureInitialState(element, shape.type, shape.name);
      const existingItem = old[shape.name];

      newItems[shape.name] = {
        name: shape.name,
        element,
        // Preserve existing selected state if this item already exists
        selected: existingItem?.selected ?? false,
        type: shape.type,
        context: shape.context,
        initialState:
          Object.keys(initialState).length > 0 ? initialState : existingItem?.initialState,
      };
      return newItems;
    });
  }, []);

  const update = useCallback((k: string, o: Partial<GeometryItem>) => {
    setItems((old) => {
      const newItems = { ...old };
      newItems[k] = {
        ...old[k],
        ...o,
      };
      return newItems;
    });
  }, []);

  const clear = useCallback(() => {
    setItems({});
  }, []);

  const remove = useCallback((key: string) => {
    setItems((old) => {
      const newItems = { ...old };
      delete newItems[key];
      return newItems;
    });
  }, []);

  return useMemo(
    () => ({ items, add, update, clear, remove }),
    [items, add, update, clear, remove],
  );
}

export function useGeometryStorev3(): GeometryStorev2v3v4 {
  return useGeometryStorev2();
}

export function useGeometryStorev4(): GeometryStorev2v3v4 {
  return useGeometryStorev2();
}
