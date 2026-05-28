# Architecture Decision Records (ADRs)

ADRs document architectural decisions for the SG Geometry monorepo. Each ADR captures a significant decision that is hard to reverse, surprising without context, and the result of a real trade-off.

## List of ADRs

| Number                                                      | Title                                       | Description                                                                        |
| ----------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| [0001](0001-declarative-dsl-for-geometric-constructions.md) | Declarative DSL for Geometric Constructions | Why we use GeometryBuilder and GeometryExpressions instead of imperative step code |
| [0002](0002-hierarchical-coordinate-systems.md)             | Hierarchical Coordinate Systems             | Support for nested, transformable coordinate systems (cs, cs2, etc.)               |
| [0003](0003-temporary-dual-type-system.md)                  | Temporary Dual Type System                  | app2's types vs @sg/geometry classes (to be consolidated after Svelte app removal) |
| [0004](0004-geometry-feature-references.md)                 | Geometry Feature References                 | Allowing Parameters to reference numeric properties of other constructions         |

## Domain Language

For domain terminology (Geometric Construction, Step, Parameter, Feature, etc.), see the [`CONTEXT.md`](../../CONTEXT.md) at the repo root.

## When to Add an ADR

Only create an ADR when all three criteria are met:

1. **Hard to reverse** - Costly to change later
2. **Surprising without context** - Future readers will wonder "why this way?"
3. **Real trade-off** - Multiple alternatives existed, one was chosen for specific reasons

If a decision doesn't meet all three, document it in code comments or commit messages instead.

## Format

ADRs are single-paragraph markdown files. See [ADR-FORMAT.md](../../.vibe/skills/grill-with-docs/ADR-FORMAT.md) for the full template.
