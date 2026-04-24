import { useState, useCallback, useMemo } from "react";

export interface GeometryItem {
  name: string;
  element: any;
  selected: boolean;
  type: string;
  context?: any;
  // Store original attributes
  initialState?: Record<string, string>;
  // IDs of geometries this item depends on
  dependsOn: string[];
  // Which step created this geometry
  stepId: string;
  // Parameter values used in creation
  parameterValues: Record<string, unknown>;
}

export interface GeometryStore {
  items: Record<string, GeometryItem>;
  add: (name: string, element: any, type: string, dependsOn: string[]) => void;
  update: (key: string, object: Partial<GeometryItem>) => void;
  clear: () => void;
}

interface GeometryStorev2v3v4 {
  items: Record<string, GeometryItem>;
  add: (name: string, element: any, type: string, dependsOn: string[], context?: any) => void;
  update: (key: string, object: Partial<GeometryItem>) => void;
  clear: () => void;
}

// Attributes to preserve for each geometry type
const ATTRIBUTES_TO_PRESERVE: Record<string, string[]> = {
  point: ["fill", "r", "cx", "cy"],
  line: ["stroke", "stroke-width", "x1", "y1", "x2", "y2"],
  circle: ["stroke", "stroke-width", "cx", "cy", "r"],
  polygon: ["stroke", "stroke-width", "fill", "points"],
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

  const add = useCallback((name: string, element: any, type: string, dependsOn: string[]) => {
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
        dependsOn: existingItem?.dependsOn ?? dependsOn,
        stepId: "",
        parameterValues: {},
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

  const add = useCallback((name: string, element: any, type: string, dependsOn: string[]) => {
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
        dependsOn: existingItem?.dependsOn ?? dependsOn,
        stepId: "",
        parameterValues: {},
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

  const add = useCallback(
    (name: string, element: any, type: string, dependsOn: string[], context?: any) => {
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
          context,
          initialState:
            Object.keys(initialState).length > 0 ? initialState : existingItem?.initialState,
          dependsOn: existingItem?.dependsOn ?? dependsOn,
          stepId: "",
          parameterValues: {},
        };
        return newItems;
      });
    },
    [],
  );

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
