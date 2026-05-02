# Plan: Remove Legacy SixFold Components (v1-v4)

## Objective

Remove legacy SixFold components (v1-v4) from app2, consolidating to SixFoldV0 as the sole implementation. This reduces technical debt, eliminates duplicate code (~37KB), and simplifies navigation.

## Rationale

- v1-v4 are outdated implementations with no active development
- SixFoldV0 is the current, maintained version with proper step management
- Simplifies user experience from 6 sections to 2
- Removes ~37KB of unused code

---

## ⚠️ PRE-REMOVAL VERIFICATION

**Run these commands from repo root:**

```bash
# Verify no other files reference legacy components
grep -r "SixFold[^V]" app2/ --include="*.ts*" --include="*.tsx"
grep -r "SixFoldv[2-4]" app2/ --include="*.ts*" --include="*.tsx"
grep -r "sixfold-v[1-4]" app2/ --include="*.ts*" --include="*.tsx"
grep -r "useGeometryStore[2-4]" app2/ --include="*.ts*" --include="*.tsx"
```

**Expected**: Only matches should be in files listed below. If other files match, add them to the modification list.

---

## 🗑️ DELETION TASKS (4 files)

| #   | File                                | Action                    |
| --- | ----------------------------------- | ------------------------- |
| 1   | `app2/src/components/SixFold.tsx`   | Delete entire file (27KB) |
| 2   | `app2/src/components/SixFoldv2.tsx` | Delete entire file (674B) |
| 3   | `app2/src/components/SixFoldv3.tsx` | Delete entire file (911B) |
| 4   | `app2/src/components/SixFoldv4.tsx` | Delete entire file (911B) |

---

## 📝 MODIFICATION TASKS

### 1. `app2/src/App.tsx`

#### **A. Remove Imports (Lines 4-14)**

```typescript
// REMOVE:
import {
  useGeometryStore,
  useGeometryStorev2,
  useGeometryStorev3,
  useGeometryStorev4,
} from "./react-store";
import { SixFold } from "./components/SixFold";
import { SixFoldv2 } from "./components/SixFoldv2";
import { SixFoldv3 } from "./components/SixFoldv3";
import { SixFoldv4 } from "./components/SixFoldv4";
import { sixFoldSvgConfig } from "./config/svgConfig";
```

#### **B. Update Type Definitions (Lines 52-66)**

**BEFORE:**

```typescript
const [activeSection, setActiveSection] = useState<
  "sixfold-v4" | "sixfold-v3" | "sixfold-v2" | "sixfold-v1" | "sixfold-v0" | "square"
>("sixfold-v4");

const sectionRefs = {
  "sixfold-v4": useRef<HTMLDivElement>(null),
  "sixfold-v3": useRef<HTMLDivElement>(null),
  "sixfold-v2": useRef<HTMLDivElement>(null),
  "sixfold-v1": useRef<HTMLDivElement>(null),
  "sixfold-v0": useRef<HTMLDivElement>(null),
  square: useRef<HTMLDivElement>(null),
};
```

**AFTER:**

```typescript
const [activeSection, setActiveSection] = useState<"sixfold-v0" | "square">("sixfold-v0");

const sectionRefs = {
  "sixfold-v0": useRef<HTMLDivElement>(null),
  square: useRef<HTMLDivElement>(null),
};
```

#### **C. Update `scrollToSection` Type (Line 66)**

**BEFORE:** `sectionId: "sixfold-v4" | "sixfold-v3" | "sixfold-v2" | "sixfold-v1" | "sixfold-v0" | "square",`
**AFTER:** `sectionId: "sixfold-v0" | "square",`

#### **D. Update `handleHashChange` (Lines 82-110)**

**BEFORE:**

```typescript
const hash = window.location.hash.substring(1) as
  | "sixfold-v4"
  | "sixfold-v3"
  | "sixfold-v2"
  | "sixfold-v1"
  | "sixfold-v0"
  | "square"
  | "";

const validSections = [
  "sixfold-v4",
  "sixfold-v3",
  "sixfold-v2",
  "sixfold-v1",
  "sixfold-v0",
  "square",
] as const;
```

**AFTER:**

```typescript
const hash = window.location.hash.substring(1) as "sixfold-v0" | "square" | "";

const validSections = ["sixfold-v0", "square"] as const;
```

#### **E. Remove Store Declarations (Lines 126-130)**

```typescript
// REMOVE:
const store = useGeometryStore();
const storev2 = useGeometryStorev2();
const storev3 = useGeometryStorev3();
const storev4 = useGeometryStorev4();
```

#### **F. Remove v3 State and Handlers (Lines ~133-175)**

```typescript
// REMOVE all:
const [stepsv3, setStepsv3]
const [currentStepv3, setCurrentStepv3]
const [restartKeyv3, setRestartKeyv3]
function handleNextClickv3
function handleRestartv3
const updateStepsv3
```

#### **G. Remove v4 State and Handlers (Lines ~177-220)**

```typescript
// REMOVE all:
const [stepsv4, setStepsv4]
const [currentStepv4, setCurrentStepv4]
const [restartKeyv4, setRestartKeyv4]
function handleNextClickv4
function handleRestartv4
const updateStepsv4
```

#### **H. Remove JSX Sections**

Remove these 4 complete `<div>` blocks (each ~50-70 lines):

- v4 Section: starts at `ref={sectionRefs["sixfold-v4"]}` (~line 311)
- v3 Section: starts at `ref={sectionRefs["sixfold-v3"]}` (~line 378)
- v2 Section: starts at `ref={sectionRefs["sixfold-v2"]}` (~line 447)
- v1 Section: starts at `ref={sectionRefs["sixfold-v1"]}` (~line 489)

#### **I. Fix v0 Section Title Bug**

**BEFORE:** `<h1>1/4 Six fold pattern v3</h1>`
**AFTER:** `<h1>1/4 Six fold pattern v0</h1>`

---

### 2. `app2/src/react-store.ts`

#### **A. Remove Interface (Lines 31-37)**

```typescript
// REMOVE entire interface:
interface GeometryStorev2v3v4 {
  items: Record<string, GeometryItem>;
  add: (name: string, element: any, type: string, dependsOn: string[], context?: any) => void;
  update: (key: string, object: Partial<GeometryItem>) => void;
  clear: () => void;
}
```

#### **B. Remove All Legacy Store Hooks**

```typescript
// REMOVE (Lines 80-118):
export function useGeometryStore(): GeometryStore { ... }

// REMOVE (Lines 174-245):
export function useGeometryStorev2(): GeometryStorev2v3v4 { ... }
export function useGeometryStorev3(): GeometryStorev2v3v4 { ... }
export function useGeometryStorev4(): GeometryStorev2v3v4 { ... }
```

**Keep:** `useGeometryStoreSquare`, `useGeometryStoreSixFoldV0`

---

### 3. `app2/src/components/Navigation.tsx`

#### **A. Update Types (Lines 6-14)**

**BEFORE:**

```typescript
type SectionId =
  | "sixfold-v4"
  | "sixfold-v3"
  | "sixfold-v2"
  | "sixfold-v1"
  | "sixfold-v0"
  | "square";
```

**AFTER:**

```typescript
type SectionId = "sixfold-v0" | "square";
```

#### **B. Remove Navigation Buttons (Lines 40-88)**

Remove these 4 `<li>` blocks:

- SixFold v4 button (lines ~40-47)
- SixFold v3 button (lines ~52-59)
- SixFold v2 button (lines ~64-71)
- SixFold v1 button (lines ~76-83)

---

### 4. `app2/test/react-store.test.tsx`

#### **A. Remove Imports (Lines 6-8)**

```typescript
// REMOVE from import statement:
useGeometryStore,
useGeometryStorev2,
useGeometryStorev3,
useGeometryStorev4,
```

#### **B. Remove Tests (Lines 23-76)**

Remove these 4 test blocks:

- `useGeometryStore should return stable reference across renders`
- `useGeometryStorev2 should return stable reference across renders`
- `useGeometryStorev3 should return stable reference (delegates to v2)`
- `useGeometryStorev4 should return stable reference (delegates to v2)`

---

### 5. `app2/src/types/geometry.ts`

#### **Remove LegacyStep Interface (Line 21)**

```typescript
// REMOVE:
export interface LegacyStep {
  draw: boolean;
  drawShapes: () => void;
}
```

---

### 6. `app2/README.md`

#### **Update Components Section (Line 23)**

**BEFORE:** `- SixFold (v1-v4)`
**AFTER:** `- SixFoldV0`

---

## ✅ VERIFICATION CHECKLIST

### Automated Checks

```bash
pnpm type-check:app2
pnpm lint
pnpm format
pnpm test
```

### Manual Checks

- [ ] Navigation only shows **SixFold v0** and **Square**
- [ ] Hash navigation works: `#sixfold-v0`, `#square`
- [ ] Default section on load is `sixfold-v0`
- [ ] No console errors in browser
- [ ] All buttons work in remaining sections
- [ ] Git status shows only intended changes

---

## 🚨 CONTINGENCY

If any step fails:

```bash
git checkout .
```

All changes are isolated to app2/ — no shared package modifications.

---

## 📊 IMPACT SUMMARY

| Metric              | Before | After | Change |
| ------------------- | ------ | ----- | ------ |
| Component files     | 6      | 2     | -4     |
| LOC removed         | ~1,200 | 0     | -1,200 |
| Nav items           | 6      | 2     | -4     |
| Store hooks         | 7      | 3     | -4     |
| File size reduction | -      | -     | ~37KB  |
