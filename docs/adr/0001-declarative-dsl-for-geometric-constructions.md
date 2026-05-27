# Declarative DSL for Geometric Constructions

We use a declarative DSL (GeometryBuilder, GeometryExpressions) to define geometric constructions instead of writing imperative step code directly. This enables explicit dependency tracking between Steps, improves readability of complex constructions, allows constructions to be parameterized and reused, and significantly reduces the lines of code written by developers as they can focus on the recipe rather than execution details. The DSL compiles to Steps for execution by the step engine.
