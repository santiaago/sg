# Geometry Feature References

We support GeometryFeatureReference, which allows Parameters to reference numeric properties of other Geometric Constructions (e.g., the radius of a Circle, the x-coordinate of a Point). This enables explicit geometric relationships between constructions and creates automatic dependencies, so when a source construction changes, all constructions referencing its features are automatically recomputed. Without this, constructions would need to be manually recalculated or would lose the ability to dynamically reference other geometry properties.
