# PRD: Construction Macro System

## Problem Statement

The SG Geometry application currently requires duplicating entire construction definitions (like sixfold v1 and v2) when creating variations or placing multiple instances. There is no way to define a reusable **Geometric Construction** template, instantiate it multiple times with different parameters, and have each instance appear as a single unit in the UI. This makes it cumbersome to:
- Place multiple instances of the same construction pattern (e.g., 4 sixfold sections to form a rosa)
- Show only final outputs while hiding intermediate construction geometries
- Position entire constructions with a single step

## Solution

Introduce a Construction Macro system that allows defining reusable **Geometric Construction** templates (ConstructionDefinitions), instantiating them with specific parameters (ConstructionInstances), and having each instance appear as a single entry in GeometryList with expandable outputs. The system integrates seamlessly with the existing DSL framework, requiring minimal changes to existing code.

## User Stories

### Construction Definition

1. As a geometry author, I want to define a ConstructionDefinition that encapsulates a complete construction pattern, so that I can reuse it across multiple sections
2. As a geometry author, I want ConstructionDefinition to accept a prefix parameter for ID namespacing, so that multiple instances don't have ID collisions
3. As a geometry author, I want to mark specific geometries as outputs within my ConstructionDefinition, so that only important final geometries are displayed
4. As a geometry author, I want ConstructionDefinition to be a simple function returning Steps, so that it fits naturally with the existing DSL pattern

### Construction Instantiation

5. As a geometry author, I want to place a construction instance via `builder.useConstruction(name, definition, params)`, so that I can instantiate templates with a fluent API
6. As a geometry author, I want to give each construction instance an explicit name at placement time, so that I can easily identify and debug instances
7. As a geometry author, I want to place 4 construction instances in the same GeometrySection, so that I can compose complex patterns like the sixfold rosa
8. As a geometry author, I want each construction instance to appear as a single step in the stepper, so that placing a whole construction is atomic

### Output Management

9. As a geometry author, I want to mark geometries as outputs using `builder.markAsOutput(expr)`, so that I can explicitly select which geometries are exposed
10. As a geometry author, I want output marking to be independent of geometry creation, so that I can decide outputs after creating all geometries
11. As a geometry author, I want only output geometries to be drawn and displayed in GeometryList, so that intermediate construction steps don't clutter the UI
12. As a geometry author, I want to expand a construction in GeometryList to see its outputs, so that I can inspect the final results
13. As a geometry author, I want intermediate geometries to still be computed (for dependencies), so that outputs can be correctly positioned

### Coordinate System Integration

14. As a geometry author, I want to use `builder.withPrefix(prefix)` to namespace all geometry IDs within a construction, so that multiple instances can coexist without conflicts
15. As a geometry author, I want the prefix to be automatically derived from the construction instance name, so that I don't have to manually manage namespacing
16. As a geometry author, I want the prefix to apply to all geometries created through that builder, so that the entire construction is consistently namespaced

### Parameter Handling

17. As a geometry author, I want each construction instance to use its own parameters, so that instances are isolated from each other
18. As a geometry author, I want construction parameters to be passed at instantiation time via `useConstruction`, so that each instance can have different values
19. As a geometry author, I want construction parameters to be independent of the parent construction's config, so that instances are self-contained

### Rosa Construction

20. As a geometry author, I want to place all 4 sixfold sections with a single step each, so that the rosa can be constructed efficiently
21. As a geometry author, I want to connect the outputs of the 4 sixfold instances to form the rosa pattern, so that the final design is complete
22. As a user, I want to see the rosa constructed by placing 4 compacted constructions, so that I can understand the composition

### Developer Experience

23. As a developer, I want the Construction system to integrate with the existing GeometryBuilder DSL, so that I don't have to learn a new API
24. As a developer, I want minimal changes to existing code, so that the system is easy to adopt
25. As a developer, I want ConstructionStep to implement the standard Step interface, so that it works with the existing step execution engine
26. As a developer, I want clear TypeScript types for ConstructionDefinition, ConstructionExpression, and ConstructionStep, so that the API is type-safe

## Implementation Decisions

### Core Modules

**ConstructionDefinition:**
- A function type that defines a reusable construction template
- Signature: `(renderer?: GeometryRenderer, prefix?: string) => Step<TConfig>[]`
- Existing construction builders like `buildSixfoldDslV2Steps` conform to this with minimal modification (adding optional prefix parameter)
- The prefix parameter enables ID namespacing for multiple instances

**ConstructionExpression:**
- A lazy wrapper that represents an uncompiled construction instance
- Created via `builder.useConstruction(name, definition, params)`
- Stores: instance name, ConstructionDefinition, and instance parameters
- Provides `compile()` method that returns a single ConstructionStep
- compile() calls the definition with the prefix derived from the instance name

**ConstructionStep:**
- A single Step that represents a complete construction instance
- Implements the standard Step interface (`compute`, `draw`)
- Contains: `isConstruction: true` marker, reference to ConstructionDefinition, all sub-Steps
- `compute()`: Executes all sub-steps in order, using the instance's stored parameters (ignoring parent config)
- `draw()`: Only draws geometries marked as outputs; adds parent construction entry and child output entries to GeometryStore

### Output Management

**Builder Registry Pattern:**
- GeometryBuilder maintains a Set of output geometry IDs
- `builder.markAsOutput(expr)` adds the expression's ID to the output Set
- When `builder.compile()` creates Steps, it copies the `isOutput` flag from the registry to each Step
- ConstructionStep collects all Steps with `isOutput: true` as its output geometry IDs

### ID Namespacing

**Immutable Builder Pattern:**
- `builder.withPrefix(prefix)` returns a NEW GeometryBuilder instance with the prefix set
- All geometry creation methods (point, line, circle, etc.) on the prefixed builder automatically apply the prefix to IDs
- Original builder remains unchanged, enabling multiple prefixed builders from the same source
- Construction instances pass their name as prefix: `builder.withPrefix("sixfold_top_left_")`

### Parameter Isolation

**Instance Parameters:**
- Each ConstructionInstance stores its own parameters
- ConstructionStep's `compute()` method uses the instance's stored parameters for sub-steps, ignoring the parent's config parameter
- This ensures construction instances are self-contained and isolated

### GeometryStore Structure

**Parent-Child Model:**
- ConstructionStep's `draw()` method adds a parent GeometryItem with `isConstruction: true`
- Output geometries are added as child GeometryItems with `parentConstructionId` referencing the parent
- GeometryList displays parent constructions as single entries
- When expanded, GeometryList shows child items where `parentConstructionId` matches the parent
- Non-output geometries are not added to GeometryStore (or are added with a hidden flag)

### Module Modifications

**GeometryBuilder:**
- Add `withPrefix(prefix: string): GeometryBuilder` method
- Add `outputIds: Set<string>` private field
- Add `markAsOutput(expr: GeometryExpression<TConfig, any>): void` method
- Modify `compile()` to set `isOutput: boolean` on each Step based on the outputIds registry
- Add all geometry creation methods to apply prefix to IDs when builder has a prefix set

**New Modules:**
- ConstructionExpression class (lazy wrapper for uncompiled instances)
- ConstructionStep class (implements Step interface for compiled instances)

**GeometryBuilder extension:**
- Add `useConstruction<TConfig>(name: string, definition: ConstructionDefinition<TConfig>, params: TConfig): ConstructionExpression<TConfig>` method

### Type Definitions

**ConstructionDefinition:**
```typescript
type ConstructionDefinition<TConfig> = (
  renderer?: GeometryRenderer,
  prefix?: string
) => Step<TConfig>[];
```

**Step Interface Extension:**
```typescript
interface Step<TConfig> {
  // ... existing fields
  isOutput?: boolean;  // NEW: marks geometry as construction output
}
```

**GeometryItem Extension:**
```typescript
interface GeometryItem {
  // ... existing fields
  isConstruction?: boolean;
  parentConstructionId?: string;
}
```

## Testing Decisions

### Test Philosophy
- Test external behavior only: construction instantiation, output marking, namespacing
- Do not test internal implementation details of ConstructionStep or ConstructionExpression
- Focus on: correct geometry values, correct output filtering, correct ID namespacing

### Modules to Test

**ConstructionExpression:**
- Test that `compile()` returns a ConstructionStep
- Test that the ConstructionStep contains all sub-steps from the definition
- Test that the ConstructionStep has the correct output IDs
- Test that prefix is correctly applied to all geometry IDs

**ConstructionStep:**
- Test that `compute()` returns all geometry values (including intermediates)
- Test that `draw()` only adds output geometries to GeometryStore
- Test that `draw()` adds parent construction entry to GeometryStore
- Test that child geometries have correct `parentConstructionId`

**GeometryBuilder extensions:**
- Test that `withPrefix()` returns a new builder with correct prefix application
- Test that `markAsOutput()` correctly registers output IDs
- Test that `compile()` correctly propagates `isOutput` to Steps
- Test that prefixed builder creates geometries with prefixed IDs

### Prior Art
- Existing tests in `app2/src/__tests__/` for GeometryBuilder and Step execution
- Existing tests for GeometryList and GeometryStore interactions
- Pattern: test external behavior via store inspection and SVG element verification

## Out of Scope

- Modifying existing GeometrySection component behavior
- Adding new UI controls specifically for constructions (use existing GeometryList expand/collapse)
- Supporting nested constructions (constructions within constructions) - this is a future enhancement
- Modifying the stepper to show sub-steps of constructions - constructions appear as single steps
- Creating a visual macro editor or GUI for construction definition
- Persisting construction definitions to a database or file system
- Versioning or diffing construction definitions
- Sharing construction definitions between projects

## Further Notes

- The term "macro" was rejected in favor of using the existing **Geometric Construction** terminology from CONTEXT.md
- Construction instances are placed via the DSL framework, maintaining consistency with the existing API
- The first mode showing only outputs allows placing 4 constructions and drawing the rosa with minimal visual clutter
- ConstructionDefinition functions like `buildSixfoldDslV2Steps` require only minor modifications (adding optional prefix parameter)
- The system is designed to be backward compatible: existing constructions work unchanged
