# SG Geometry

A declarative framework for constructing and manipulating geometric patterns through composite geometric constructions.

## Language

**Geometric Construction**:
A composite structure that has inputs (parameters) and outputs (resulting geometric entities).
_Avoid_: Geometry, construction, figure, shape

### Primitives

**Point**:
A zero-dimensional location in space defined by x and y coordinates.

**Line**:
A one-dimensional infinite straight path defined by two **Point**s.

**Circle**:
A two-dimensional curve where all points are equidistant from a center **Point**.

**Polygon**:
A closed plane figure bounded by straight line segments.

**Coordinate System**:
A reference frame that defines origin, orientation, and scale for positioning **Geometric Construction**s.

### Construction Elements

**Step**:
A single operation that creates one **Geometric Construction**. Steps are ordered by their dependencies.

**Parameter**:
A non-geometry configuration value used by a **Step** (e.g., `radius`). In the future, a **Parameter** may also reference a **Feature** of another **Geometric Construction** (e.g., the radius of a **Circle**).

**Geometry Expression**:
A declarative definition of a **Geometric Construction** that can be compiled into a **Step**.

**Feature**:
A numeric property of a **Geometric Construction** (e.g., radius of a **Circle**, x-coordinate of a **Point**) that can be referenced by other **Geometric Construction**s, creating a dependency between them.

### Operations

**Intersection**:
The **Point** or **Point**s where two geometric entities meet.

## Example Dialogue

**Dev**: How do I create a circle whose radius equals the distance between two points?

**Expert**: You'd create a **Geometry Expression** for each **Point**, then compute the distance between them. That distance becomes a **Feature** value. Your **Circle** **Geometric Construction** then references that **Feature** as a **Parameter**. When compiled, this creates a **Step** that depends on the **Step**s that created the **Point**s.

**Dev**: And if I want to find where two circles intersect?

**Expert**: Use an **Intersection** operation. It produces **Point**s where the **Circle**s meet, which you can then use as inputs to other **Geometric Construction**s.
