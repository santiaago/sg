# Phase 5: Advanced Features

## Overview

This phase adds advanced features to the geometry framework that enhance its usability and robustness. These features are optional but provide significant value for real-world use.

**Status**: NOT STARTED  
**Priority**: MEDIUM  
**Estimated Duration**: 3-5 days  
**Prerequisites**: Phase 1-4 must be complete

---

## Objectives

By the end of this phase, we will have:

1. ✅ Undo/redo support in Construction
2. ✅ Construction serialization and deserialization (JSON)
3. ✅ Parameter slider integration
4. ✅ Construction validation (pre-flight checks)
5. ✅ Additional test constructions (triangle, hexagon, etc.)

---

## Feature Details

### Feature 1: Undo/Redo Support

**Goal**: Allow users to undo and redo construction steps.

**Implementation**:

```typescript
// In Construction class (app2/src/geometry/construction.ts)

export class Construction {
  // ... existing state ...

  // History stack for undo/redo
  private _history: ConstructionState[] = [];
  private _historyIndex = -1;
  private _maxHistory = 100;

  /**
   * Save current state to history before making changes.
   */
  private _saveToHistory(): void {
    // Remove any redo history
    this._history = this._history.slice(0, this._historyIndex + 1);

    // Save current state
    const state: ConstructionState = {
      values: new Map(this._values),
      steps: [...this._steps],
      stepIndex: this._stepIndex,
    };

    this._history.push(state);
    this._historyIndex = this._history.length - 1;

    // Limit history size
    if (this._history.length > this._maxHistory) {
      this._history.shift();
      this._historyIndex--;
    }
  }

  /**
   * Undo the last operation.
   */
  undo(): void {
    if (this._historyIndex <= 0) return;

    this._historyIndex--;
    const previousState = this._history[this._historyIndex];

    this._values = new Map(previousState.values);
    this._steps = [...previousState.steps];
    this._stepIndex = previousState.stepIndex;
  }

  /**
   * Redo the last undone operation.
   */
  redo(): void {
    if (this._historyIndex >= this._history.length - 1) return;

    this._historyIndex++;
    const nextState = this._history[this._historyIndex];

    this._values = new Map(nextState.values);
    this._steps = [...nextState.steps];
    this._stepIndex = nextState.stepIndex;
  }

  /**
   * Clear history.
   */
  clearHistory(): void {
    this._history = [];
    this._historyIndex = -1;
  }

  /**
   * Get undo/redo state.
   */
  getHistoryState(): { canUndo: boolean; canRedo: boolean } {
    return {
      canUndo: this._historyIndex > 0,
      canRedo: this._historyIndex < this._history.length - 1,
    };
  }
}

interface ConstructionState {
  values: Map<string, GeometryValue>;
  steps: InternalStep[];
  stepIndex: number;
}
```

**Usage Example**:

```typescript
const c = new Construction();
const p1 = c.point(0, 0, "p1");
c.saveToHistory(); // Or automatic on each operation
const p2 = c.point(10, 10, "p2");

c.undo(); // p2 is removed
c.redo(); // p2 is restored
```

**Tests**:

- Test undo removes last operation
- Test redo restores undone operation
- Test multiple undo/redo
- Test history limit
- Test clearHistory

---

### Feature 2: Serialization and Deserialization

**Goal**: Allow Construction to be saved to JSON and loaded from JSON.

**Implementation**:

```typescript
// In Construction class

/**
 * Serialize the construction to a JSON-compatible object.
 */
export function serializeConstruction(construction: Construction): SerializedConstruction {
  return {
    version: 1,
    stepIndex: construction.currentStepIndex,
    geometries: Array.from(construction.getValues().entries()).map(([id, geom]) => ({
      id,
      type: geom.type,
      data: geom,
    })),
  };
}

/**
 * Deserialize a construction from a JSON object.
 */
export function deserializeConstruction(data: SerializedConstruction): Construction {
  const c = new Construction();

  // Recreate all geometries
  for (const geom of data.geometries) {
    switch (geom.type) {
      case "point":
        c.point(geom.data.x, geom.data.y, geom.id);
        break;
      case "line":
        c.line(geom.data.x1, geom.data.y1, geom.data.x2, geom.data.y2, geom.id);
        break;
      case "circle":
        c.circle(geom.data.cx, geom.data.cy, geom.data.r, geom.id);
        break;
      case "polygon":
        // For polygons, we need to recreate the points first
        // This is a simplification - real implementation would need to track point refs
        break;
    }
  }

  // Set step index
  c.goTo(data.stepIndex);

  return c;
}

interface SerializedConstruction {
  version: number;
  stepIndex: number;
  geometries: {
    id: string;
    type: GeometryValue["type"];
    data: GeometryValue;
  }[];
}

// In Construction class
/**
 * Export construction as JSON string.
 */
toJSON(): string {
  return JSON.stringify(serializeConstruction(this));
}

/**
 * Load construction from JSON string.
 */
static fromJSON(json: string): Construction {
  const data = JSON.parse(json) as SerializedConstruction;
  return deserializeConstruction(data);
}
```

**Usage Example**:

```typescript
// Save
const json = construction.toJSON();
localStorage.setItem("my-construction", json);

// Load
const savedJson = localStorage.getItem("my-construction");
if (savedJson) {
  const construction = Construction.fromJSON(savedJson);
}
```

**Tests**:

- Test serialize/deserialize round-trip
- Test with all geometry types
- Test with different step indices
- Test version compatibility

---

### Feature 3: Parameter Slider Integration

**Goal**: Allow construction parameters to be controlled via sliders.

**Implementation**:

```typescript
// Extend Construction to support parameters

export class Construction {
  // ... existing state ...

  private _parameters = new Map<string, number>();

  /**
   * Set a parameter value.
   */
  setParameter(name: string, value: number): void {
    this._parameters.set(name, value);
  }

  /**
   * Get a parameter value.
   */
  getParameter(name: string): number {
    const value = this._parameters.get(name);
    if (value === undefined) {
      throw new Error(`Parameter not found: ${name}`);
    }
    return value;
  }

  /**
   * Get all parameters.
   */
  getParameters(): Map<string, number> {
    return new Map(this._parameters);
  }
}

// Update operations to use parameters
// For example, in circle creation:
export class Construction {
  circle(center: PointRef, radiusParamOrValue: number | string, name?: string): CircleRef {
    const radius =
      typeof radiusParamOrValue === "string"
        ? this.getParameter(radiusParamOrValue)
        : radiusParamOrValue;

    // ... rest of implementation
  }
}

// Usage in SquaresV2:
const c = new Construction();
c.setParameter("circleRadius", 150);
c.setParameter("lineExtension", 2.2);

const c1_c = c.circle(c1, "circleRadius", "c1_circle");
const line_c2_pi = c.lineTowards(c2, pi, "lineExtension" * 150, "line_c2_pi");
```

**Tests**:

- Test parameter setting and getting
- Test parameter usage in geometry operations
- Test parameter changes update geometry

---

### Feature 4: Construction Validation (Pre-flight Checks)

**Goal**: Validate a construction before attempting to render it.

**Implementation**:

```typescript
// In Construction class

export class Construction {
  // ... existing state ...

  /**
   * Validate the construction for potential errors.
   * Checks:
   * - All dependencies exist
   * - All geometry values are valid
   * - No division by zero in operations
   * - All intersection operations have valid inputs
   */
  validateFull(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check all geometries exist
    for (const step of this._steps) {
      for (const dep of step.dependencies) {
        if (!this._values.has(dep)) {
          errors.push({
            type: "missing_dependency",
            stepId: step.id,
            message: `Missing dependency: ${dep}`,
            severity: "error",
          });
        }
      }
    }

    // Check for zero-length lines
    for (const [id, geom] of this._values) {
      if (geom.type === "line") {
        const dx = geom.x2 - geom.x1;
        const dy = geom.y2 - geom.y1;
        if (dx === 0 && dy === 0) {
          warnings.push({
            type: "zero_length_line",
            geometryId: id,
            message: `Line ${id} has zero length`,
            severity: "warning",
          });
        }
      }
    }

    // Check for zero-radius circles
    for (const [id, geom] of this._values) {
      if (geom.type === "circle" && geom.r === 0) {
        warnings.push({
          type: "zero_radius_circle",
          geometryId: id,
          message: `Circle ${id} has zero radius`,
          severity: "warning",
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  type: string;
  stepId?: string;
  geometryId?: string;
  message: string;
  severity: "error";
}

interface ValidationWarning {
  type: string;
  stepId?: string;
  geometryId?: string;
  message: string;
  severity: "warning";
}
```

**Usage Example**:

```typescript
const c = new Construction();
// ... build construction ...

const result = c.validateFull();
if (!result.valid) {
  console.error("Construction has errors:");
  for (const error of result.errors) {
    console.error(`- ${error.message}`);
  }
}

if (result.warnings.length > 0) {
  console.warn("Construction has warnings:");
  for (const warning of result.warnings) {
    console.warn(`- ${warning.message}`);
  }
}
```

**Tests**:

- Test validation with valid construction
- Test validation catches missing dependencies
- Test validation catches zero-length lines
- Test validation catches zero-radius circles
- Test validation catches other edge cases

---

### Feature 5: Additional Test Constructions

**Goal**: Create additional construction examples to validate the framework works for various geometries.

**Implementations**:

#### Triangle Construction

```typescript
// app2/src/geometry/test-constructions/triangle.ts

export function createTriangleConstruction(c: Construction, width: number, height: number): void {
  // Base line
  const base = c.line(0, height - 50, width, height - 50, "base");

  // Two circles at ends
  const radius = width / 4;
  const p1 = c.point(0, height - 50, "p1");
  const p2 = c.point(width, height - 50, "p2");
  const c1 = c.circle(p1, radius, "c1");
  const c2 = c.circle(p2, radius, "c2");

  // Intersection points
  const p3 = c.intersection(c1, c2, "north", "p3");
  const p4 = c.intersection(c1, c2, "south", "p4");

  // Connect points to form triangle
  const side1 = c.line(p1, p3, "side1");
  const side2 = c.line(p2, p3, "side2");
  const triangle = c.polygon([p1, p2, p3], "triangle");
}
```

#### Hexagon Construction

```typescript
// app2/src/geometry/test-constructions/hexagon.ts

export function createHexagonConstruction(
  c: Construction,
  centerX: number,
  centerY: number,
  radius: number,
): void {
  const center = c.point(centerX, centerY, "center");
  const circle = c.circle(center, radius, "hex_circle");

  // Create 6 points around the circle
  const points: PointRef[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    const p = c.point(x, y, `hex_p${i}`);
    points.push(p);
  }

  // Connect points in order
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    c.line(points[i], points[j], `hex_side${i}`);
  }

  // Create hexagon polygon
  c.polygon(points, "hexagon");
}
```

#### Test File

```typescript
// app2/src/geometry/test-constructions/index.ts

export * from "./triangle";
export * from "./hexagon";
export * from "./pentagon";
```

**Tests**:

- Test triangle construction renders correctly
- Test hexagon construction renders correctly
- Test constructions with various parameters

---

## Implementation Checklist

### Feature 1: Undo/Redo

- [ ] Add history state to Construction class
- [ ] Implement \_saveToHistory method
- [ ] Implement undo method
- [ ] Implement redo method
- [ ] Implement clearHistory method
- [ ] Implement getHistoryState method
- [ ] Add tests for undo/redo

### Feature 2: Serialization

- [ ] Add serializeConstruction function
- [ ] Add deserializeConstruction function
- [ ] Add toJSON method to Construction
- [ ] Add fromJSON static method to Construction
- [ ] Add SerializedConstruction interface
- [ ] Add tests for serialization

### Feature 3: Parameter Sliders

- [ ] Add parameter storage to Construction
- [ ] Implement setParameter method
- [ ] Implement getParameter method
- [ ] Implement getParameters method
- [ ] Update geometry operations to support parameter references
- [ ] Add tests for parameters

### Feature 4: Validation

- [ ] Add ValidationResult, ValidationError, ValidationWarning interfaces
- [ ] Implement validateFull method
- [ ] Implement checks for missing dependencies
- [ ] Implement checks for zero-length lines
- [ ] Implement checks for zero-radius circles
- [ ] Add tests for validation

### Feature 5: Test Constructions

- [ ] Create test-constructions directory
- [ ] Implement triangle construction
- [ ] Implement hexagon construction
- [ ] Implement pentagon construction (optional)
- [ ] Create index.ts for exports
- [ ] Add tests for test constructions

---

## Success Criteria

Phase 5 is complete when:

- [ ] All 5 advanced features are implemented
- [ ] All new code compiles without errors
- [ ] All new tests pass (`pnpm test`)
- [ ] TypeScript compilation succeeds (`pnpm type-check`)
- [ ] No circular dependencies introduced
- [ ] Code follows project conventions (Oxlint/Oxfmt pass)

---

## Next Phase

Once Phase 5 is complete, proceed to **Phase 6: Documentation & Cleanup** (`backlog/geometry-framework-PHASE6.md`)

---

## See Also

- `backlog/PLAN geometry-framework.md` - Full architecture overview
- `backlog/geometry-framework-PHASE4.md` - Previous phase (Proof of Concept)
- `backlog/geometry-framework-PHASE6.md` - Next phase (Documentation & Cleanup)
- `app2/src/geometry/construction.ts` - Construction class
- `app2/src/components/SquaresV2.tsx` - Reference component
