# app2 UI Architecture

The React application UI is organized around visualizing and interacting with **Geometric Constructions** through a declarative lens.

## Core Components

### GeometryList

**Purpose:** Displays all **Geometric Construction**s in the current composition.
**Domain mapping:**

- Each list item represents one **Geometric Construction**
- Shows **type** (Point, Line, Circle, Polygon, Coordinate System)
- Supports filtering by name and type
- Highlights inputs when `showInputHighlight` is enabled

### GeometryDetails

**Purpose:** Shows detailed information about a selected **Geometric Construction**.
**Domain mapping:**

- Displays the construction's **name** and **type**
- Shows **inputs** (dependencies on other **Geometric Construction**s)
- Shows **outputs** (what this construction produces)
- Interactive: hovering an input highlights it in the SVG Canvas

### GeometryPlayer

**Purpose:** Controls progression through **Step**s and renders the visualization.
**Domain mapping:**

- `currentStep` / `totalSteps` tracks **Step** progression
- Navigation controls (first, prev, next, last) move between **Step**s
- Wraps the SVG Canvas component
- Optional: play/pause for animated stepping

### SVG Canvas (SixFoldV0Svg, SquareSvg, etc.)

**Purpose:** Visualizes **Primitives** (Point, Line, Circle, Polygon, Coordinate System).
**Domain mapping:**

- Renders each **Primitive** based on its **Geometric Construction** definition
- Responds to highlight events from GeometryDetails
- Shows the current state of all **Step**s up to the current position
