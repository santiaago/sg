# Hierarchical Coordinate Systems

We support nested, transformable coordinate systems (cs, cs2, etc.) rather than a single global coordinate system. This enables geometries defined within a child coordinate system to automatically inherit its transformations (translation, rotation), allowing entire constructions to be moved or rotated as a single unit with zero code changes to the geometry definitions. This is essential for reusable, parameterized constructions like SixFold V1 where the pattern needs to be positioned and oriented dynamically.
