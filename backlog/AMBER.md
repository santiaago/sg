# AMBER.md - Change Dark Mode Outline to Warm Orange

## Goal
Change the outline color in dark mode from grey to warm orange, and improve the color naming.

## Current State
- Outline color is controlled by `theme.COLOR_PRIMARY` 
- In dark mode: `COLOR_PRIMARY = "#94a3b8"` (slate-400, grey)
- Used for all line/outline geometries (OUTLINE1-18) and polygon strokes

## Problem
1. Color is grey instead of warm orange in dark mode
2. `COLOR_PRIMARY` is a poor name - doesn't describe what it colors (outlines/strokes)

## Solution Options

### Option A: Minimal - Change Color Only
- File: `app2/src/themes.ts:44`
- Change: `"#94a3b8"` → `"#fb923c"`
- Keeps existing naming, minimal change

### Option B: Recommended - Rename + Change Color
Rename `COLOR_PRIMARY` to `COLOR_STROKE` and update to warm orange.

**Files to modify:**
1. `app2/src/themes.ts` - Interface and both theme definitions
2. `app2/src/svgElements.ts:148` - line() function usage
3. `app2/src/geometry/squareSteps.ts:441-442` - polygon usage + comment
4. `app2/src/components/READABLE-quick-start.md` - 3 documentation references

**Changes:**
- `COLOR_PRIMARY` → `COLOR_STROKE` (interface + all usages)
- Dark theme: `#94a3b8` → `#fb923c` (warm amber)
- Light theme: `#506` stays (purple, original color)

## Warm Orange Color Options
| Hex | Tailwind | Description |
|-----|----------|-------------|
| `#fb923c` | amber-400 | Warm amber, good contrast |
| `#f97316` | orange-500 | Intense orange |
| `#ea580c` | orange-600 | Deep orange |
| `#fbbf24` | amber-300 | Lighter, softer |

**Recommended:** `#fb923c` - warm, vibrant, good visibility on dark canvas

## Impact
- All line/outline geometries in dark mode: warm orange
- All polygon strokes in dark mode: warm orange
- Light mode unchanged (keeps original purple `#506`)
- Circle strokes use `COLOR_SECONDARY`, unaffected
