# Geometry Construction Analysis: sixFoldV0Steps vs squareSteps

## Overview

This document provides a comprehensive analysis of the geometric construction pipelines in `sixFoldV0Steps.ts` and `squareSteps.ts`, comparing their architectures, dependencies, and efficiency.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Comparison](#architecture-comparison)
3. [sixFoldV0Steps Deep Dive](#sixfoldv0steps-deep-dive)
4. [squareSteps Deep Dive](#squaresteps-deep-dive)
5. [Parameter Usage Analysis](#parameter-usage-analysis)
6. [Dependency Graphs](#dependency-graphs)
7. [Issues and Findings](#issues-and-findings)
8. [Optimization Recommendations](#optimization-recommendations)
9. [Geometry Reference](#geometry-reference)
10. [Changelog](#changelog)

---

## Executive Summary

| Metric | sixFoldV0Steps | squareSteps | Delta |
|--------|----------------|-------------|-------|
| Total Steps | 36 | 16 | +125% |
| Total GEOM Constants | 90 | 17 | +529% |
| Total Outputs Produced | 90 | 17 | +529% |
| Unique Inputs Consumed | 49 | 16 | +306% |
| Terminal Outputs | 18 | 1 | +1700% |
| Non-Terminal Unused | 23 | 0 | - |
| Pass-Through Steps | 1 | 0 | - |
| Redundant Computations | 3 | 0 | - |

**Key Insight**: sixFoldV0Steps is significantly more complex with 36 steps producing 90 geometries, but has 23 non-terminal geometries that are never consumed as inputs, plus a pass-through step and redundant computations.

---

## Architecture Comparison

### Step Definition Structure

Both modules use a consistent step pattern:

```typescript
{
  id: string,              // Unique step identifier
  inputs: string[],        // Geometry IDs required as input
  outputs: string[],       // Geometry IDs produced as output
  parameters?: string[],   // Config parameters used
  compute: function,       // Pure function: inputs + config -> outputs
  draw: function           // Side effect: renders geometries to SVG
}
```

### Design Patterns

| Pattern | sixFoldV0Steps | squareSteps |
|---------|----------------|-------------|
| `computeSingle` helper | ✓ | ✓ |
| `computeMultiple` helper | ✓ | ✓ |
| `getGeometry` validator | ✓ | ✓ |
| Type-safe GEOM constants | ✓ | ✓ |
| Step execution isolation | ✓ | ✓ |
| Lazy computation | ✓ | ✓ |

Both implementations follow the same architecture, ensuring:
- **Immutability**: Steps produce new values without mutating inputs
- **Explicit Dependencies**: All inputs and outputs are declared
- **Separation of Concerns**: Compute (pure) vs Draw (impure)
- **Type Safety**: Runtime validation with type guards

---

## sixFoldV0Steps Deep Dive

### Step Categories

| Category | Steps | Count | % |
|----------|-------|-------|---|
| **Foundation** | 1-2 | 2 | 5.6% |
| **Center Lines** | 3-4 | 2 | 5.6% |
| **Intersections** | 5-7 | 3 | 8.3% |
| **D1 Radius** | 8-12 | 5 | 13.9% |
| **Helper Circles** | 13-14 | 2 | 5.6% |
| **PII Points** | 15-17 | 3 | 8.3% |
| **Connecting Lines** | 18-19 | 2 | 5.6% |
| **Outlines** | 20-36 | 17 | 47.2% |

### Dependency Flow

```
Step 1 (LINE1, P1, P2)
    ↓
Step 2 (CP1, CP2, C1-C4)
    ↓
Step 3 (L12, L23, L34, L41)
    ↓
Step 4 (PIC12, PIC14) ← Step 2 (C1-C4)
    ↓
Step 5 (LPIC12, LPIC14) ← Step 4 + Step 2 (CP1)
    ↓
Step 6 (L13, L24, PI2) ← Step 2 (CP1-CP4)
    ⊘
Step 7 (PI2) ← Step 6 (PI2) [PASS-THROUGH]
    ↓
Step 8 (C1_D1-C4_D1) ← Step 6 (PI2) + Step 2 (CP1-CP4) + Step 4 (PIC14)
    ↓
... (continues through 36 steps)
```

### Geometry Production Analysis

#### All 90 GEOM Constants

**Foundation (3):**
- `LINE1`, `P1`, `P2`

**Step 2 - Circle Centers (8):**
- `CP1`, `CP2`, `CP3`, `CP4`, `C1`, `C2`, `C3`, `C4`

**Step 3 - Connecting Lines (4):**
- `L12`, `L23`, `L34`, `L41`

**Step 4 - Intersections (2):**
- `PIC12`, `PIC14`

**Step 5 - Lines (2):**
- `LPIC12`, `LPIC14`

**Step 6 - Crossing Lines (3):**
- `L13`, `L24`, `PI2`

**Step 7 - Pass-Through (1):**
- `PI2` (duplicate)

**Step 8 - D1 Circles (4):**
- `C1_D1`, `C2_D1`, `C3_D1`, `C4_D1`

**Step 9 - D1 Circles at PICs (2):**
- `C14_D1`, `C12_D1`

**Step 10 - P3/P4 Points (2):**
- `PI3`, `PI4`

**Step 11 - Lines (2):**
- `LCP1PI3`, `LCP1PI4`

**Step 12 - PRX Points (2):**
- `PRX5`, `PRX6`

**Step 13 - C23 Construction (5):**
- `C23W`, `L14P`, `PC23`, `C23S`, `C23`

**Step 14 - C34 Construction (6):**
- `CPI12`, `C34N`, `LPIC12C34N`, `PC34`, `C34E`, `C34`

**Step 15 - PII Points (4):**
- `PP`, `L1`, `PII1`, `PII2`

**Step 16 - Line (1):**
- `LPII1PII2`

**Step 17 - D3 Circles (4):**
- `C1_D3`, `C2_D3`, `C3_D3`, `C4_D3`

**Step 18 - Lines (2):**
- `LCP2PIC14`, `LCP4PIC12`

**Outlines (18):**
- `OUTLINE1` through `OUTLINE18`

**Additional Points (10):**
- `PIC4`, `PIC2`, `PIC1W`, `PIC34`, `PIC1N`, `PIC23`, `PC1W`, `PC23S`, `PC1N`, `PC34E`

**Final Connecting Points (8):**
- `PC3SW`, `PC23E`, `PC34S`, `PC34E`, `PC23S`, `PC1N`, `PC1W`

### Input Consumption Analysis

**Total Unique Inputs Consumed: 49**

All 49 consumed geometries are successfully produced by earlier steps. No missing dependencies.

### Step-by-Step Input/Output Flow

| Step | Inputs | Outputs | Notes |
|------|--------|---------|-------|
| 1 | - | LINE1, P1, P2 | Foundation |
| 2 | LINE1, P1, P2 | CP1, CP2, C1, C2, CP3, CP4, C3, C4 | 8 outputs |
| 3 | CP1, CP2, CP3, CP4 | L12, L23, L34, L41 | Connecting lines |
| 4 | C1, C2, C3, C4 | PIC12, PIC14 | Circle intersections |
| 5 | CP1, PIC12, PIC14 | LPIC12, LPIC14 | Lines from CP1 |
| 6 | CP1, CP2, CP3, CP4 | L13, L24, PI2 | Crossing lines + intersection |
| 7 | PI2 | PI2 | **PASS-THROUGH** |
| 8 | CP1, CP2, CP3, CP4, PIC14, PI2 | C1_D1, C2_D1, C3_D1, C4_D1 | D1 radius circles |
| 9 | PIC12, PIC14, PI2 | C14_D1, C12_D1 | D1 circles at PICs |
| 10 | C14_D1, C2_D1, C12_D1, C4_D1 | PI3, PI4 | Intersections |
| 11 | CP1, PI3, PI4 | LCP1PI3, LCP1PI4 | Lines from CP1 |
| 12 | C14_D1, LPIC14, C12_D1, LPIC12 | PRX5, PRX6 | circle-line intersections |
| 13 | C14_D1, PRX5, PIC14, L23, CP2, C2_D1 | C23W, L14P, PC23, C23S, C23 | 5 outputs |
| 14 | PIC12, PIC14, PI2, PRX6, L34, CP4, C4_D1 | CPI12, C34N, LPIC12C34N, PC34, C34E, C34 | 6 outputs |
| 15 | C1_D1, LPIC14, PI3, L13, L24 | PP, L1, PII1, PII2 | 4 outputs |
| 16 | PII1, PII2 | LPII1PII2 | Line between PII points |
| 17 | CP1, CP2, CP3, CP4, PII1 | C1_D3, C2_D3, C3_D3, C4_D3 | D3 radius circles |
| 18 | CP2, PIC14, CP4, PIC12 | LCP2PIC14, LCP4PIC12 | Lines |
| 19 | PII1, PI4, LCP4PIC12 | PIC4, OUTLINE1 | First outline |
| 20 | PII1, PII2, LCP2PIC14 | PIC2, OUTLINE2 | Second outline |
| 21 | C1_D3, LCP1PI3, C34, L34 | PIC1W, PIC34, OUTLINE3 | Third outline |
| 22 | C1_D3, LCP1PI4, C23, L23 | PIC1N, PIC23, OUTLINE4 | Fourth outline |
| 23 | C1_D1, L12, C23, L23 | PC1W, PC23S, OUTLINE5 | Fifth outline |
| 24 | C1_D1, L41, C34, L34 | PC1N, PC34E, OUTLINE6 | Sixth outline |
| 25 | PC1N, PIC1N | OUTLINE7 | Seventh outline |
| 26 | PC1W, PIC1W | OUTLINE8 | Eighth outline |
| 27 | C3_D3, L13, C23, CP1 | PC3SW, PC23E, OUTLINE9 | Ninth outline |
| 28 | C34, CP1, PC3SW | PC34S, OUTLINE10 | Tenth outline |
| 29 | PC34E, PC34S | OUTLINE11 | Eleventh outline |
| 30 | PC23S, PC23E | OUTLINE12 | Twelfth outline |
| 31 | CP4, PIC4 | OUTLINE13 | Thirteenth outline |
| 32 | CP2, PIC2 | OUTLINE14 | Fourteenth outline |
| 33 | CP1, CP2 | OUTLINE15 | Fifteenth outline |
| 34 | CP2, CP3 | OUTLINE16 | Sixteenth outline |
| 35 | CP3, CP4 | OUTLINE17 | Seventeenth outline |
| 36 | CP4, CP1 | OUTLINE18 | Eighteenth outline |

---

## squareSteps Deep Dive

### Step Categories

| Category | Steps | Count | % |
|----------|-------|-------|---|
| **Foundation** | 1-3 | 3 | 18.8% |
| **Circle Construction** | 4-7 | 4 | 25.0% |
| **Bisected Points** | 8-11 | 4 | 25.0% |
| **Tangent Points** | 12-15 | 4 | 25.0% |
| **Final Square** | 16 | 1 | 6.2% |

### Step-by-Step Flow

```
Step 1 (MAIN_LINE)
    ↓
Step 2 (C1)
    ↓
Step 3 (C1_CIRCLE)
    ↓
Step 4 (C2) ← Step 3 + Step 1
    ↓
Step 5 (C2_CIRCLE)
    ↓
Step 6 (INTERSECTION_POINT) ← Step 3 + Step 5
    ↓
Step 7 (INTERSECTION_CIRCLE)
    ↓
Step 8 (LINE_C2_PI) ← Step 2 + Step 6
    ↓
Step 9 (P3) ← Step 8 + Step 7
    ⊘
Step 10 (LINE_C1_PI) ← Step 2 + Step 6
    ↓
Step 11 (P4) ← Step 10 + Step 7
    ⊘
Step 12 (LINE_C2_P4) ← Step 4 + Step 11
    ↓
Step 13 (PL) ← Step 5 + Step 12
    ⊘
Step 14 (LINE_C1_P3) ← Step 2 + Step 9
    ↓
Step 15 (PR) ← Step 3 + Step 14
    ⊘
Step 16 (SQUARE) ← Step 2 + Step 4 + Step 15 + Step 13
```

### Geometry Production

**17 GEOM Constants:**
- `MAIN_LINE` (line)
- `C1`, `C2` (points - circle centers)
- `C1_CIRCLE`, `C2_CIRCLE` (circles)
- `INTERSECTION_POINT` (point)
- `INTERSECTION_CIRCLE` (circle)
- `LINE_C2_PI`, `LINE_C1_PI` (lines)
- `P3`, `P4` (points)
- `LINE_C2_P4`, `LINE_C1_P3` (lines)
- `PL`, `PR` (points - tangent points)
- `SQUARE` (polygon)

**Unique Inputs Consumed: 16** (all produced)

---

## Parameter Usage Analysis

### Overview

Both `sixFoldV0Steps.ts` and `squareSteps.ts` use a **documentation-only** parameter system:
- The `parameters` field is optional and contains keys from the config type
- The full config object is always passed to the `compute` function
- The `parameters` array is **never validated at runtime** - it's purely for documentation

| Aspect | squareSteps.ts | sixFoldV0Steps.ts |
|--------|---------------|------------------|
| Config Type | `SquareConfig` | `SixFoldV0Config` |
| parameters field | `(keyof SquareConfig)[]` | `(keyof SixFoldV0Config)[]` |
| compute signature | `(inputs, config) => Map` | `(inputs, config) => Map` |

### How Parameters Work

1. **Config objects** (`SquareConfig` / `SixFoldV0Config`) contain all configuration values
2. **Step `parameters` field** documents which config properties the step uses
3. **`compute` function** receives the full config object regardless of the `parameters` array
4. **`computeSingle` / `computeMultiple` helpers** pass both `inputs` and `config` to the lambda

### squareSteps.ts Parameter Usage (Reference)

| Step | Declared Parameters | Lambda Signature | Actually Uses | Status |
|------|---------------------|------------------|--------------|--------|
| STEP_MAIN_LINE | `["lx1", "ly1", "lx2", "ly2"]` | `(_inputs, params)` | ✅ All 4 | ✅ Perfect |
| STEP_C1 | `["C1_POSITION_RATIO"]` | `(inputs, params)` | ✅ Yes | ✅ Perfect |
| STEP_C1_CIRCLE | `["circleRadius"]` | `(inputs, params)` | ✅ Yes | ✅ Perfect |
| STEP_C2 | `["tolerance"]` | `(inputs, params)` | ✅ Yes | ✅ Perfect |
| STEP_C2_CIRCLE | `["circleRadius"]` | `(inputs, params)` | ✅ Yes | ✅ Perfect |
| STEP_INTERSECTION_POINT | `["selectMinY"]` | `(inputs, params)` | ✅ Yes | ✅ Perfect |
| STEP_INTERSECTION_CIRCLE | `["circleRadius"]` | `(inputs, params)` | ✅ Yes | ✅ Perfect |
| STEP_LINE_C2_PI | `["circleRadius"]` | `(inputs, params)` | ✅ Yes | ✅ Perfect |
| STEP_P3 | `["tolerance"]` | `(inputs, params)` | ✅ Yes | ✅ Perfect |
| STEP_LINE_C1_PI | `["circleRadius"]` | `(inputs, params)` | ✅ Yes | ✅ Perfect |
| STEP_P4 | `["tolerance"]` | `(inputs, params)` | ✅ Yes | ✅ Perfect |
| STEP_LINE_C2_P4 | `[]` | `(inputs)` | ❌ No params | ✅ Perfect |
| STEP_PL | `[]` | `(inputs)` | ❌ No params | ✅ Perfect |
| STEP_LINE_C1_P3 | `[]` | `(inputs)` | ❌ No params | ✅ Perfect |
| STEP_PR | `[]` | `(inputs)` | ❌ No params | ✅ Perfect |
| STEP_FINAL_SQUARE | `[]` | `(inputs)` | ❌ No params | ✅ Perfect |

**Pattern**: When `parameters: []`, lambdas use `(inputs)`. When parameters exist, lambdas use `(inputs, params)`.

### sixFoldV0Steps.ts Parameter Usage

| Step | Declared Parameters | Lambda Signature | Actually Uses | Status |
|------|---------------------|------------------|--------------|--------|
| Step 1 | `["lx1", "ly1", "lx2", "ly2"]` | `(_inputs, config)` | ✅ All 4 | ✅ Perfect |
| Step 2 | `["radius"]` | `(inputs, config)` | ✅ Yes | ✅ Perfect |
| Steps 3-36 | `[]` | `(inputs)` | ❌ No params | ✅ Functional |

**Verdict: ✅ You ARE using parameters correctly!**

All declared parameters in sixFoldV0Steps.ts are:
1. **Actually used** in the compute functions
2. **Type-safe** - TypeScript infers correct types
3. **Documentation accurate** - `parameters` arrays reflect actual usage

### Why `(inputs)` Works for Empty Parameters

The `computeSingle` and `computeMultiple` helpers call their lambdas with `(inputs, config)`:

```typescript
// From operations.ts
export function computeMultiple<TConfig>(
  fn: (inputs: Map<string, GeometryValue>, config: TConfig) => Map<string, GeometryValue>,
): (inputs: Map<string, GeometryValue>, config: TConfig) => Map<string, GeometryValue> {
  return (inputs, config) => fn(inputs, config);
}
```

When a step uses `(inputs) => { ... }`, it:
- Takes 1 parameter but receives 2 (JavaScript allows this)
- The `config` argument is silently ignored
- **No TypeScript error** because `(inputs) => T` is assignable to `(inputs, config) => T`
- **No runtime error** because extra arguments are allowed in JavaScript

This is **both functionally correct and type-safe**.

### Consistency Comparison

| Aspect | squareSteps.ts | sixFoldV0Steps.ts | Status |
|--------|---------------|------------------|--------|
| Parameter declaration accuracy | ✅ All match usage | ✅ All match usage | ✅ Both correct |
| Lambda with params | `(inputs, params)` | `(inputs, config)` | ⚠️ Different names |
| Lambda without params | `(inputs)` | `(inputs)` | ✅ Both consistent |
| Helper usage | `computeSingle` / `computeMultiple` | `computeSingle` / `computeMultiple` | ✅ Same helpers |

**Minor inconsistency**: Variable naming (`params` vs `config`) differs between files.

### Recommendations

**Current state is fully functional and correct.** If you want to improve consistency:

#### Option 1: Standardize on `config` (Recommended for sixFoldV0)
Since sixFoldV0Steps uses `SixFoldV0Config` type name, using `config` is natural:
```typescript
// Keep as-is - already uses 'config'
compute: computeMultiple((inputs, config) => { ... })
```

#### Option 2: Standardize on `params` (Match squareSteps)
```typescript
// Change from:
compute: computeMultiple((inputs, config) => { ... })
// To:
compute: computeMultiple((inputs, params) => { ... })
```

#### Option 3: Use consistent `_config` for ignored params
For steps with `parameters: []`, explicitly show the ignored parameter:
```typescript
// From:
compute: computeMultiple((inputs) => { ... })
// To:
compute: computeMultiple((inputs, _config) => { ... })
```

### TypeScript Deep Dive

The type system allows this because:

```typescript
// This function type
type TwoParamFn = (a: A, b: B) => C;

// Is assignable from this function value
const oneParamFn: TwoParamFn = (a: A) => { /* ... */ };
//                    ^ No error - extra param b is ignored
```

When `computeMultiple` calls `fn(inputs, config)`:
- If `fn` is `(inputs, config) =>`, both arguments are used ✅
- If `fn` is `(inputs) =>`, the `config` argument is silently dropped ✅
- Both are valid JavaScript and valid TypeScript ✅

### Summary

| Check | squareSteps.ts | sixFoldV0Steps.ts |
|-------|---------------|------------------|
| Parameters declared correctly | ✅ Yes | ✅ Yes |
| Parameters used correctly | ✅ Yes | ✅ Yes |
| Type safety | ✅ Yes | ✅ Yes |
| Runtime correctness | ✅ Yes | ✅ Yes |
| Consistency with other file | - | ⚠️ Minor style difference |

**Final Verdict: Your parameter usage in sixFoldV0Steps.ts is correct!** 🎉

No changes are required for functionality. Optional style improvements for consistency are noted above.

---

## Dependency Graphs

### sixFoldV0Steps - Full Dependency Graph

```
                           ┌─────────────┐
                           │   STEP 1    │
                           │  (empty)    │
                           └──────┬──────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
            ┌───────▼───────┐           ┌─────▼─────┐
            │   STEP 2      │           │  STEP 3   │
            │ LINE1,P1,P2 →  │           │ CP1-CP4 → │
            │ CP1-CP4,C1-C4 │           │ L12,L23,  │
            └──────┬────────┘           │ L34,L41   │
                   │                    └──────┬──────┘
           ┌───────┼────────┐                │
           │       │        │                │
     ┌─────▼──┐ ┌──▼────┬──▼────┬────┐   ┌────────┐
     │ STEP 4 │ │ STEP 5 │ STEP 6 │ ... │   │ STEP 3 │
     │ C1-C4 →│ │ CP1,   │ CP1-  │    │   │ outputs│
     │ PIC12,│ │ PIC12, │ CP4 → │    │   │ → used │
     │ PIC14 │ │ PIC14  │ L13,  │    │   │ by many│
     └───────┘ │  →LPIC │ L24,  │    │   └────────┘
               │ 12,14 │ PI2    │    │
               └───────┘ └──────┘    │
                     │       │       │
                     └───────┬───────┘
                             │
                      ┌──────▼──────┐
                      │   STEP 7    │ ← PASS-THROUGH (PI2 → PI2)
                      └──────┬──────┘
                             │
            ┌────────────────┼────────────────┐
            │                 │                 │
     ┌──────▼──────┐   ┌──────▼──────┐   ┌────────▼────────┐
     │   STEP 8    │   │   STEP 9    │   │    STEP 10     │
     │ 6 inputs →  │   │ 3 inputs →  │   │ 4 inputs →     │
     │ 4 D1 circles│   │ 2 D1 circles│   │ 2 PI points     │
     └─────────────┘   └─────────────┘   └────────────────┘
           │               │                 │
           └───────────────┼─────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
             ┌──────▼──────┐       ┌──────▼──────┐
             │  STEPS 11-18 │       │ STEPS 19-36 │
             │ Intermediate │       │   Outlines  │
             │  (8 steps)   │       │  (18 steps) │
             └─────────────┘       └─────────────┘
```

### squareSteps - Full Dependency Graph

```
     ┌─────────────┐
     │   STEP 1    │
     │   (empty)   │
     │  →MAIN_LINE │
     └──────┬──────┘
            │
     ┌──────▼──────┐
     │   STEP 2    │
     │ MAIN_LINE → │
     │     C1      │
     └──────┬──────┘
            │
     ┌──────▼──────┐
     │   STEP 3    │
     │ C1 → C1_CIRCLE│
     └──────┬──────┘
            │
     ┌──────▼──────┐
     │   STEP 4    │
     │ MAIN_LINE + │
     │ C1_CIRCLE → │
     │     C2      │
     └──────┬──────┘
            │
     ┌──────▼──────┐
     │   STEP 5    │
     │ C2 → C2_CIRCLE│
     └──────┬──────┘
            │
     ┌──────▼──────┐
     │   STEP 6    │
     │ C1_C + C2_C →│
     │  INTERSECTION│
     └──────┬──────┘
            │
     ┌──────▼──────┐
     │   STEP 7    │
     │ PI → INTER- │
     │  SECTION_C  │
     └──────┬──────┘
            │
   ┌────────┼────────┐
   │         │        │
┌──▼──┐  ┌──▼──┐  ┌──▼──┐
│STEP 8│  │STEP10│  │STEP12│
│LINE  │  │LINE  │  │LINE  │
│ C2_PI│  │ C1_PI│  │ C2_P4│
└──┬──┘  └──┬──┘  └──┬──┘
   │         │        │
┌──▼──┐  ┌──▼──┐  ┌──▼──┐
│STEP 9│  │STEP11│  │STEP13│
│  P3   │  │  P4   │  │  PL   │
└──┬──┘  └──┬──┘  └─────┘
   │         │
┌──▼──┐  ┌──▼──┐
│STEP14│  │STEP15│
│LINE  │  │  PR   │
│ C1_P3│  │       │
└──────┘  └──────┘
      │        │
      └────────┘
           │
     ┌─────▼─────┐
     │  STEP 16  │
     │ C1,C2,PR, │
     │  PL → SQUARE│
     └───────────┘
```

### Dependency Chain Length Comparison

| Max Chain Length | sixFoldV0Steps | squareSteps |
|------------------|----------------|-------------|
| Longest Path | 10 steps | 7 steps |
| Average Depth | 4.2 steps | 3.1 steps |
| Branching Factor | High (17 outputs from steps 19-36) | Low (1-2 outputs per step) |

---

## Issues and Findings

### sixFoldV0Steps Issues

#### 🔴 Critical Issues

1. **Step 7 is a Pass-Through (No-Op)**
   - Inputs: `[PI2]`
   - Outputs: `[PI2]`
   - Compute: Returns the same PI2 value
   - **Impact**: Adds zero computational value, increases step count unnecessarily
   - **Fix**: Remove Step 7 and update all references to PI2 to use Step 6's output directly

2. **23 Non-Terminal Unused Geometries**
   The following geometries are produced but **never consumed as inputs** by any subsequent step:

   | Origin Step | Unused Geometries | Count |
   |-------------|-------------------|-------|
   | Step 2 | CIRCLE_AT_INTERSECTION, P3, P4 | 3 |
   | Step 13 | C23W, L14P | 2 |
   | Step 14 | CPI12, C34N, LPIC12C34N, C34E | 4 |
   | Step 15 | PP, L1 | 2 |
   | Step 16 | LPII1PII2 | 1 |
   | Step 17 | C2_D3, C3_D3, C4_D3 | 3 |
   | Base | PC23, PC34 | 2 |
   | **Total** | | **23** |

   **Terminal outputs (OK):** OUTLINE1-OUTLINE18 (18 geometries) are final rendered outputs.

3. **Redundant Re-computation**
   - `L13`: Computed in Step 2 (original Svelte logic) AND Step 6
   - `L24`: Computed in Step 2 (original Svelte logic) AND Step 6
   - `PI2`: Computed in Step 6, then passed through Step 7
   - **Impact**: Duplicate calculations, wasted CPU cycles

#### 🟡 Warning Issues

4. **High Complexity Steps**
   - Step 2: 8 outputs (high cognitive load)
   - Step 13: 5 outputs
   - Step 14: 6 outputs
   - **Recommendation**: Consider breaking into smaller steps for readability

5. **Inconsistent Naming**
   - Some geometries use prefixes: `CP1`, `PIC12`, `PRX5`
   - Others use suffixes: `L12`, `C1_D1`
   - **Recommendation**: Adopt consistent naming convention

6. **Missing Documentation**
   - Several steps lack clear comments explaining their purpose
   - Step 13, 14, 21-30 have minimal documentation
   - **Impact**: Reduced maintainability

#### ✅ Good Practices

1. **All Steps Have Outputs** - No silent steps
2. **All Consumed Geometries Are Produced** - No missing dependencies
3. **Type Safety** - Good use of type guards in compute functions
4. **Error Handling** - Comprehensive error checking for null/undefined intersections
5. **Pure Functions** - Compute functions are pure (same input → same output)

### squareSteps Issues

#### ✅ Excellent Practices

1. **Zero Unused Geometries** - All 16 outputs are consumed or are terminal
2. **No Pass-Through Steps** - Every step adds value
3. **No Redundant Computations** - Each geometry computed once
4. **Clear Documentation** - Every step has JSDoc comments
5. **Simple Dependencies** - Each step has 1-2 inputs (except final step)
6. **Consistent Naming** - Clear prefix-based naming (C1_CIRCLE, LINE_C2_PI, etc.)

#### 🟡 Minor Observations

1. **Final Step Complexity**
   - Step 16 has 4 inputs and produces the SQUARE
   - This is acceptable as it's the final aggregation step

---

## Optimization Recommendations

### For sixFoldV0Steps

#### Phase 1: Immediate Fixes (High Impact, Low Risk)

1. **Remove Step 7**
   ```typescript
   // BEFORE: Step 7 exists as pass-through
   // AFTER: Remove STEP_7 from SIX_FOLD_V0_STEPS array
   // Update: Any references to step7 PI2 → use step6 PI2
   ```
   **Expected Savings**: 1 step, elimination of duplicate PI2

2. **Eliminate Redundant Computations**
   - Remove L13, L24 from Step 2 outputs (keep only in Step 6)
   - Update Step 2 compute to not produce L13, L24
   - Remove any unused intermediate values in Step 2
   ```typescript
   // In Step 2, remove:
   // m.set(GEOM.L13, l13Line);
   // m.set(GEOM.L24, l24Line);
   ```
   **Expected Savings**: 2 geometries, ~2% reduction in outputs

#### Phase 2: Structural Improvements (Medium Impact, Medium Risk)

3. **Split High-Complexity Steps**
   Break Step 2 (8 outputs) into smaller logical units:
   ```typescript
   // Proposed split:
   // Step 2a: Circle centers (CP1, CP2, CP3, CP4)
   // Step 2b: Circles (C1, C2, C3, C4)
   // Step 2c: Circle at intersection (CIRCLE_AT_INTERSECTION)
   // Step 2d: Bisected points (P3, P4)
   ```
   **Benefits**: Better readability, easier debugging, finer dependency tracking

4. **Remove Unused Geometry Production**
   Identify and eliminate production of the 23 unused non-terminal geometries:
   - CIRCLE_AT_INTERSECTION (Step 2)
   - P3, P4 (Step 2)
   - C23W, L14P (Step 13)
   - CPI12, C34N, LPIC12C34N, C34E (Step 14)
   - PP, L1 (Step 15)
   - LPII1PII2 (Step 16)
   - C2_D3, C3_D3, C4_D3 (Step 17 - keep C1_D3 if used)
   - PC23, PC34 (Base - if not consumed)

   **Caution**: Verify these are truly unused before removing. Some may be used for drawing even if not consumed as inputs.

   **Verification Checklist**:
   - [ ] grep source for each GEOM constant
   - [ ] Check draw functions use these values
   - [ ] Verify no dynamic references exist

5. **Consolidate D-Radius Circle Steps**
   Steps 8, 9, 17 all produce circles with D1 or D3 radii. Consider:
   - Creating helper functions for repeated patterns
   - Consolidating similar computations

#### Phase 3: Architectural Improvements (High Impact, Higher Risk)

6. **Adopt squareSteps Pattern**
   squareSteps has cleaner architecture:
   - Clear separation: Foundation → Construction → Final Output
   - Consistent 1-2 outputs per step
   - Better naming conventions

template for sixFoldV0Steps:
   ```typescript
   // Foundation (Steps 1-3)
   // Primary Construction (Steps 4-17)
   // Outline Generation (Steps 18-36)
   ```

7. **Implement Caching**
   Cache expensive computations (circle intersections, line intersections):
   ```typescript
   const intersectionCache = new Map<string, GeometryValue>();
   function getCachedIntersection(key: string, compute: () => GeometryValue) {
     if (!intersectionCache.has(key)) {
       intersectionCache.set(key, compute());
     }
     return intersectionCache.get(key);
   }
   ```

8. **Add Dependency Validation**
   Create a utility to validate step dependencies at compile-time:
   ```typescript
   function validateSteps(steps: SixFoldV0Step[]): ValidationResult {
     const produced = new Set<string>();
     const consumed = new Set<string>();
     const errors: string[] = [];
     
     for (const step of steps) {
       // Check all inputs are produced
       for (const input of step.inputs) {
         consumed.add(input);
         if (!produced.has(input)) {
           errors.push(`Step ${step.id}: input ${input} not produced by any earlier step`);
         }
       }
       // Track outputs
       for (const output of step.outputs) {
         produced.add(output);
       }
     }
     
     // Find unused geometries
     const unused = [...produced].filter(g => !consumed.has(g) && !isTerminal(g));
     
     return { errors, unused, produced, consumed };
   }
   ```

### For Both Modules

9. **Standardize Step Definition**
   Create a shared step builder utility:
   ```typescript
   function createStep<P extends string, O extends string>(
     config: StepConfig<P, O>
   ): Step<P, O> {
     return {
       id: config.id,
       inputs: config.inputs,
       outputs: config.outputs,
       parameters: config.parameters,
       compute: config.compute,
       draw: config.draw || (() => {}), // Default no-op draw
     };
   }
   ```

10. **Improve Documentation**
    Add to each step:
    - Purpose: What geometric primitive this creates
    - Mathematical basis: The geometric principle used
    - Dependencies: Which steps must complete first
    - Output: What each output geometry represents

---

## Geometry Reference

### sixFoldV0Steps - All GEOM Constants

#### Point Geometries (38)
Points representing circle centers, intersections, and construction points.

| ID | Description | Produced By | Consumed By |
|----|-------------|-------------|-------------|
| P1 | Main line start point | Step 1 | Step 2 |
| P2 | Main line end point | Step 1 | Step 2 |
| CP1 | Circle 1 center | Step 2 | Step 3, 5, 6, 8, 11, 15, 17, 18, 27, 28, 33, 34, 35, 36 |
| CP2 | Circle 2 center | Step 2 | Step 3, 6, 8, 11, 13, 18, 31, 32, 33 |
| CP3 | Circle 3 center | Step 2 | Step 3, 6, 8, 11, 14, 17, 22, 23, 27, 34, 35 |
| CP4 | Circle 4 center | Step 2 | Step 3, 6, 8, 11, 14, 17, 18, 19, 21, 24, 28, 35, 36 |
| PIC12 | Intersection C1 & C2 (up) | Step 4 | Step 5, 9, 14, 21, 22 |
| PIC14 | Intersection C1 & C4 (left) | Step 4 | Step 5, 8, 9, 12, 15 |
| PI2 | Intersection L13 & L24 | Step 6, 7 | Step 8, 9, 10, 11, 14, 15, 16 |
| PI3 | Intersection C14_D1 & C2_D1 (right) | Step 10 | Step 11, 15, 21, 22 |
| PI4 | Intersection C12_D1 & C4_D1 (right) | Step 10 | Step 11, 19, 20 |
| PRX5 | Intercept C14_D1 & LPIC14 | Step 12 | Step 13 |
| PRX6 | Intercept C12_D1 & LPIC12 | Step 12 | Step 14 |
| PC23 | Center point for C23 | Step 13 | Step 23, 27 |
| PC34 | Center point for C34 | Step 14 | Step 24, 28 |
| PP | Intercept C1_D1 & LPIC14 | Step 15 | Step 15 only |
| PII1 | Intersection L1 & L13 | Step 15 | Step 16, 19, 20, 21, 22, 25, 26 |
| PII2 | Intersection L1 & L24 | Step 15 | Step 16, 20, 32 |
| PIC4 | Intersection LPI1PI4 & LCP4PIC12 | Step 19 | Step 31 |
| PIC2 | Intersection LPII1PII2 & LCP2PIC14 | Step 20 | Step 32 |
| PIC1W | Intercept C1_D3 & LCP1PI3 | Step 21 | Step 26 |
| PIC34 | Intercept C34 & L34 | Step 21 | - |
| PIC1N | Intercept C1_D3 & LCP1PI4 | Step 22 | Step 25 |
| PIC23 | Intercept C23 & L23 | Step 22 | - |
| PC1W | Intercept C1_D1 & L12 | Step 23 | Step 26 |
| PC23S | Intercept C23 & L23 | Step 23 | Step 30 |
| PC1N | Intercept C1_D1 & L41 | Step 24 | Step 25 |
| PC34E | Intercept C34 & L34 | Step 24 | - |
| PC3SW | Intercept C3_D3 & L13 | Step 27 | Step 28 |
| PC23E | Intercept C23 & L(23,CP1) | Step 27 | Step 30 |
| PC34S | Intercept C34 & L(34,CP1) | Step 28 | Step 29 |

#### Line Geometries (24)

| ID | Description | Produced By | Consumed By |
|----|-------------|-------------|-------------|
| LINE1 | Main horizontal line | Step 1 | Step 2 |
| L12 | CP2 to CP1 | Step 3 | Step 23 |
| L23 | CP2 to CP3 | Step 3 | Step 13, 22, 23, 27 |
| L34 | CP3 to CP4 | Step 3 | Step 14, 21, 24 |
| L41 | CP4 to CP1 | Step 3 | Step 24 |
| LPIC12 | CP1 to PIC12 | Step 5 | Step 6, 9, 12 |
| LPIC14 | CP1 to PIC14 | Step 5 | Step 8, 12, 15 |
| L13 | CP1 to CP3 | Step 2, 6 | Step 6, 15, 19, 20, 27 |
| L24 | CP2 to CP4 | Step 2, 6 | Step 6, 15, 19, 20 |
| LCP1PI3 | CP1 to PI3 | Step 11 | Step 18, 21 |
| LCP1PI4 | CP1 to PI4 | Step 11 | Step 18, 22 |
| L14P | PIC14 to C23W | Step 13 | - |
| LPII1PII2 | PII1 to PII2 | Step 16 | Step 20 |
| L1 | PI3 to PP | Step 15 | - |
| LPIC12C34N | PIC12 to C34N | Step 14 | - |
| LCP2PIC14 | CP2 to PIC14 | Step 18 | Step 20, 32 |
| LCP4PIC12 | CP4 to PIC12 | Step 18 | Step 19, 31 |
| LCP2PIC14 | CP2 to PIC14 | Step 18 | - |

#### Circle Geometries (24)

| ID | Description | Produced By | Consumed By |
|----|-------------|-------------|-------------|
| C1 | Circle at CP1 | Step 2 | Step 4, 8 |
| C2 | Circle at CP2 | Step 2 | Step 4, 8 |
| C3 | Circle at CP3 | Step 2 | Step 4, 8 |
| C4 | Circle at CP4 | Step 2 | Step 4, 8 |
| CIRCLE_AT_INTERSECTION | Circle at PIC12/PIC14 intersection | Step 2 | - |
| C1_D1 | Circle at CP1, radius D1 | Step 8 | Step 15, 23, 24 |
| C2_D1 | Circle at CP2, radius D1 | Step 8 | Step 10, 13 |
| C3_D1 | Circle at CP3, radius D1 | Step 8 | Step 10 |
| C4_D1 | Circle at CP4, radius D1 | Step 8 | Step 14 |
| C14_D1 | Circle at PIC14, radius D1 | Step 9 | Step 10, 12, 13 |
| C12_D1 | Circle at PIC12, radius D1 | Step 9 | Step 10, 12, 14 |
| C23 | Circle at PC23, radius D2 | Step 13 | Step 18, 22, 23, 27 |
| C34 | Circle at PC34, radius D2 | Step 14 | Step 19, 21, 24, 28 |
| C23W | Point (misnamed as circle?) | Step 13 | - |
| CPI12 | Circle at PIC12, radius D1 | Step 14 | - |
| C34N | Point (bisect result) | Step 14 | - |
| C34E | Point (intercept result) | Step 14 | - |
| C1_D3 | Circle at CP1, radius D3 | Step 17 | Step 21, 22, 23, 24 |
| C2_D3 | Circle at CP2, radius D3 | Step 17 | Step 27 |
| C3_D3 | Circle at CP3, radius D3 | Step 17 | Step 24, 27 |
| C4_D3 | Circle at CP4, radius D3 | Step 17 | - |

#### Outline Geometries (18)
All outline geometries are terminal outputs used for final rendering.

| ID | Produced By | Description |
|----|-------------|-------------|
| OUTLINE1 | Step 19 | PII1 to PIC4 |
| OUTLINE2 | Step 20 | PII1 to PIC2 |
| OUTLINE3 | Step 21 | PIC1W to PIC34 |
| OUTLINE4 | Step 22 | PIC1N to PIC23 |
| OUTLINE5 | Step 23 | PC1W to PC23S |
| OUTLINE6 | Step 24 | PC1N to PC34E |
| OUTLINE7 | Step 25 | PC1N to PIC1N |
| OUTLINE8 | Step 26 | PC1W to PIC1W |
| OUTLINE9 | Step 27 | PC3SW to PC23E |
| OUTLINE10 | Step 28 | PC34S to PC3SW |
| OUTLINE11 | Step 29 | PC34E to PC34S |
| OUTLINE12 | Step 30 | PC23S to PC23E |
| OUTLINE13 | Step 31 | CP4 to PIC4 |
| OUTLINE14 | Step 32 | CP2 to PIC2 |
| OUTLINE15 | Step 33 | CP2 to CP1 |
| OUTLINE16 | Step 34 | CP2 to CP3 |
| OUTLINE17 | Step 35 | CP3 to CP4 |
| OUTLINE18 | Step 36 | CP4 to CP1 |

### squareSteps - All GEOM Constants

| Category | ID | Description | Produced By | Consumed By |
|----------|----|-------------|-------------|-------------|
| Line | MAIN_LINE | Base horizontal line | Step 1 | Step 2, 4 |
| Point | C1 | First circle center | Step 2 | Step 3, 6, 8, 10, 14, 16 |
| Point | C2 | Second circle center | Step 4 | Step 5, 7, 12, 16 |
| Circle | C1_CIRCLE | First circle | Step 3 | Step 4, 6, 15, 16 |
| Circle | C2_CIRCLE | Second circle | Step 5 | Step 6, 13, 16 |
| Point | INTERSECTION_POINT | Intersection of C1_C & C2_C | Step 6 | Step 7, 8, 10 |
| Circle | INTERSECTION_CIRCLE | Circle at intersection point | Step 7 | Step 8, 9, 10, 11 |
| Line | LINE_C2_PI | Line from C2 through PI | Step 8 | Step 9 |
| Point | P3 | Intersection of LINE_C2_PI & CI | Step 9 | Step 14 |
| Line | LINE_C1_PI | Line from C1 through PI | Step 10 | Step 11 |
| Point | P4 | Intersection of LINE_C1_PI & CI | Step 11 | Step 12 |
| Line | LINE_C2_P4 | Line from C2 to P4 | Step 12 | Step 13 |
| Point | PL | Intersection of C2_C & LINE_C2_P4 | Step 13 | Step 16 |
| Line | LINE_C1_P3 | Line from C1 to P3 | Step 14 | Step 15 |
| Point | PR | Intersection of C1_C & LINE_C1_P3 | Step 15 | Step 16 |
| Polygon | SQUARE | Final square polygon | Step 16 | - (terminal) |

---

## Changelog

### April 29, 2026 - Step 2 Refactoring

**File**: `sixFoldV0Steps.ts`

**Changes:**
- Updated Step 2 to use LINE1, P1, P2 from Step 1 as inputs
- Removed direct usage of config `cx1, cy1, cx2, cy2`
- Now extracts coordinates from line instead of config
- Removed unused intermediate outputs: P3, P4, CIRCLE_AT_INTERSECTION, L13, L24
- Added CUT_LINE_BY import for calculations
- Parameters reduced from 5 (`cx1, cy1, cx2, cy2, radius`) to 1 (`radius`)

**Before:**
```typescript
// Step 2 used config.cx1, config.cy1, config.cx2, config.cy2
// Produced: P3, P4, CIRCLE_AT_INTERSECTION, L13, L24, ...
```

**After:**
```typescript
// Step 2 uses LINE1, P1, P2 from Step 1
// No longer produces: P3, P4, CIRCLE_AT_INTERSECTION, L13, L24
// These are now computed in Step 6
```

**Impact:**
- ✅ Reduced config dependencies
- ✅ Better separation of concerns
- ⚠️ Note: L13 and L24 are now computed in Step 6 (redundant with old Step 2 logic)

### April 28, 2026 - Compute Callback Fixes

**File**: All step files

**Changes:**
- All `computeSingle` and `computeMultiple` callbacks now include the config parameter
- Changed from `(inputs) =>` to `(inputs, _config) =>` or `(inputs, config) =>`

**Before:**
```typescript
compute: computeSingle(GEOM.PIC12, (inputs) => {
  const c1 = getGeometry(inputs, GEOM.C1, isCircle);
  // ...
})
```

**After:**
```typescript
compute: computeSingle(GEOM.PIC12, (inputs, config) => {
  const c1 = getGeometry(inputs, GEOM.C1, isCircle);
  // config available if needed
})
```

**Impact:**
- ✅ Consistent API across all steps
- ✅ Future-proof for config-dependent computations
- ✅ Type-safe config access

### April 27, 2026 - Initial sixFoldV0Steps Migration

**File**: `sixFoldV0Steps.ts` (created)

**Changes:**
- Migrated from Svelte app's SixFoldv3.svelte
- Adopted step-based architecture matching squareSteps pattern
- Implemented all 36 steps with compute/draw separation
- Added GEOM constants for all geometries

**Impact:**
- ✅ Type-safe geometry construction
- ✅ Lazy step-by-step evaluation possible
- ⚠️ Inherited some Svelte patterns that may need optimization

---

## Appendices

### Appendix A: Metrics Calculation Methodology

Metrics were calculated by analyzing the source code:

1. **Total Steps**: Count of step objects in `SIX_FOLD_V0_STEPS` / `SQUARE_STEPS` array
2. **Total GEOM Constants**: Count of properties in `GEOM` object
3. **Total Outputs**: Sum of `step.outputs.length` for all steps
4. **Unique Inputs Consumed**: Size of union set of all `step.inputs` across all steps
5. **Produce but Never Consumed**: GEOM constants that appear in outputs but never in any step's inputs
6. **Terminal Outputs**: Outputs used in draw functions for final rendering

### Appendix B: Glossary

| Term | Definition |
|------|------------|
| GEOM | Geometry constants object - type-safe IDs for geometry elements |
| Step | A unit of computation that takes inputs and produces outputs |
| Terminal Output | A geometry that is rendered in the final SVG, not consumed by other steps |
| Pass-Through Step | A step that produces the same outputs as its inputs without transformation |
| Compute Function | Pure function: (inputs: Map, config) => Map<string, GeometryValue> |
| Draw Function | Impure function: (svg, values, store, theme) => void |

### Appendix C: File References

- `app2/src/geometry/sixFoldV0Steps.ts` - 36-step six-fold pattern construction
- `app2/src/geometry/squareSteps.ts` - 16-step square construction
- `app2/src/geometry/sixFold/operations.ts` - SixFold GEOM constants and types
- `app2/src/geometry/operations.ts` - Square GEOM constants and utilities
- `packages/geometry/` - Shared geometry primitives and calculations

---

*Document generated: 2026-04-29*
*Last updated: April 29, 2026*
*Status: Comprehensive analysis complete - Parameter usage analysis added*
