# number geometry section

01-06-2026

load skills caveman and karpathy-guidelines, read @AGENTS.md then read @backlog/PRD-numbers-geometry-section.md I want you to implement that step by step, BE SURE TO IMPLEMENT WITH INCREMENTAL COMMITS. When done, I want you to look at @AGENTS.md and see if there is anything that would have been useful to know in @AGENTS.md and commit changes if any, be always very brief. git msgs w/ @AGENTS.md conventions, when done create a PR to merge to main, add titel and desc following @AGENTS.md conventions

# smart stepper impl

31-05-2026

load skills caveman and karpathy-guidelines, read @AGENTS.md then read @backlog/prd-migrate-square-sixfold-to-smart-stepper.md I want you to implement that step by step, with incremental commits. When done, I want you to look at @AGENTS.md and see if there is anything that would have been useful to know in @AGENTS.md and commit changes if any, be always very brief. git msgs w/ @AGENTS.md conventions, when done create a PR to merge to main, add titel and desc following @AGENTS.md conventions

# spec for geometry framework v2

I want to create a higher-level declarative geometry framework.

Requirements:

1. Design a higher-level declarative language for geometric constructions that provides a fluid, chainable syntax
2. This must be a facade/abstraction layer on top of the existing step-based architecture - steps still exist underneath and are created automatically from high-level code
3. Create a new SquaresV2 component as proof-of-concept, do not modify existing code
4. Ensure complete separation of concerns between geometry construction logic and SVG rendering
5. No backward compatibility required - this framework is only for future components

example (it is an example you do not need to make this 100% exact)

```ts
ml = line(config.lx1, config.ly1, config.lx2, config.ly2);
c1 = pointAt(ml, C1_POSITION_RATIO);
c1_c = circle(c1, config.circleRadius);
c2 = intersection(c1_c, ml, "left");
```

Things to preserve

1. **Explicit dependencies**: Each step declares `inputs`, `outputs`, `parameters`
2. **Separation of concerns**: `compute()` for math, `draw()` for rendering
3. **Lazy evaluation**: Steps compute only when needed
4. **Type safety**: Geometry types well-defined

Additional Context:

- The existing step system in `app2/src/geometry/` uses lazy evaluation with `compute()` and `draw()` separation
- Reference implementation: squareSteps.ts shows the 16-step square construction we need to replicate with the new API

when done submit a PR (print full URL of PR when done)

# spec for geometry framework

/spec-driven-development from backlog/PLAN geometry-framework.md take as much time as you need

follow conventions in @AGENTS.md for atomic commit messages, take as much time as you need
when done

1. check app
2. submit changed to AGENTS.md to would have improved your work for next time, changes in AGENTS.md should be very minimal
3. submit a PR (print full URL of PR when done)

# code review

/code-review-and-quality based on @backlog/CODE_REVIEW.md section 'React Store & State Management '

follow conventions in @AGENTS.md for atomic commit messages, take as much time as you need
when done

1. check app
2. submit changed to AGENTS.md to would have improved your work for next time, changes in AGENTS.md should be very minimal
3. submit a PR (print full URL of PR when done)

# code review

Please identify a main pieces of the system for app2, create a CODE_REVIEW.md in @backlog/

this document should have a section for each piece of the system, rank them by importance, I will later on follow up with specific code reviews for each of the sections and a global code review later on.

follow conventions in @AGENTS.md for atomic commit messages, take as much time as you need
when done

1. check app
2. submit changed to AGENTS.md to would have improved your work for next time, changes in AGENTS.md should be very minimal
3. submit a PR (print full URL of PR when done)

# testing coordinate system

05/05/2026

In app2, I want to test that changing the coordinate system (cs) if it is the first input of a geometry changes the geometry. For that I want you do create a new component similar to @app2/src/components/SquareSvg.tsx where you rotate the first coordinate system by Pi/16, (the x axis should go down by Pi/16)

There might be some extra logic to add whenever you need to pick between 2 intersections in the past that was done with north, south, that might not be possible anymore...

follow conventions in @AGENTS.md for atomic commit messages, take as much time as you need
when done

1. check app
2. submit changed to AGENTS.md to would have improved your work for next time, changes in AGENTS.md should be very minimal
3. submit a PR (print full URL of PR when done)

# reducing playwright tests

I suspect that there are too many playwright tests, can you look into that and see if there are test that are redundant? and if so remove them.

follow conventions in @AGENTS.md for atomic commit messages, take as much time as you need
when done

1. check app
2. submit changed to AGENTS.md to would have improved your work for next time, changes in AGENTS.md should be very minimal
3. submit a PR (print full URL of PR when done)

# phase 4

04/05/2026

do @backlog/geometry-framework-PHASE4.md

I want to merge branch into `sas/002-geo-framework-v0`

follow conventions in @AGENTS.md for atomic commit messages, take as much time as you need
when done

1. check app
2. submit changed to AGENTS.md to would have improved your work for next time, changes in AGENTS.md should be very minimal
3. submit a PR (remember I want to merge into `sas/002-geo-framework-v0` NOT `main`)

---

# phase 3

## do @backlog/geometry-framework-PHASE3.md

# add CICD steps

04/05/2026

for app2, I want you to add CI steps that can be run when a PR is submitted

follow conventions in @AGENTS.md for atomic commit messages, take as much time as you need
when done

1. check app
2. submit changed to AGENTS.md to would have improved your work for next time, changes in AGENTS.md should be very minimal
3. submit a PR

---

# add coordinate system before any geometry

04/05/2026

in app2, I want you to add a coordinate system before adding any geometry in Square or Sixfold components.

1. coordinate system (cs) should be shown in geometry list pane and should be selectable
2. cs should be clickable, it should be the default cs of svg
3. it should be displayed in svg canvas, by 2 arrows showing x and x directions
4. use same strokes than for lines
5. further steps that use cs should have cs as input
6. name of coordinate system should start with `cs`
7. cs should be hoverable in geometry details pane

follow conventions in @AGENTS.md for atomic commit messages, take as much time as you need
when done

1. check app
2. submit changed to AGENTS.md to would have improved your work for next time, changes in AGENTS.md should be very minimal
3. submit a PR

---

# Geometry player component

in app2, I want to extract a Geometry player component, this component should have the svg canvas, the player buttons it already has. The work is more around refactoring than anything else

follow conventions in @AGENTS.md for commit messages, take as much time as you need
when done

1. check app
2. submit changed to AGENTS.md to would have improved your work for next time, changes in AGENTS.md should be very minimal
3. submit a PR

---

# extra playwright

in app2, there are playwright tests, but they only cover a small part, I want you to create a md file under backlog with name EXTRA_PLAYWRIGHT.md
go through the full functionality of the app2 and list what should we add as e2e tests. I want minimal tests not too verbose but I want to cover all main cases please
take as much time as you need,
follow conventions in @AGENTS.md for commit messages, take as much time as you need
when done

1. check app
2. submit changed to AGENTS.md to would have improved your work for next time, changes in AGENTS.md should be very minimal
3. submit a PR

---

# unselect geometries

in app2 I want to be able to unselect geometries when clicking again in a geometry twice in the right side pane called geometry list
follow conventions in @AGENTS.md for commit messages, take as much time as you need
when done check app then submit a PR,

---

# reactive change theme on svg canvas

in app2, I want that when I change the theme the svg canvases change right away, right now, they change when I click next or back but not on theme change.
follow conventions in @AGENTS.md for commit messages, take as much time as you need
when done check app then submit a PR,

in app2, I want to be able to hover or click on an input or output in the geometry detail component and this should highlight the said geometry in the svg canvas in the same way clicking on a geometry on the geometry list highlights a geometry

---

# Play button to draw geometrys

in app2, I want to be able to click a play button, it should live between prev and next, it should start drawing the current geometry step by step, there should be a small delay between step so geometries are not drawn too quickly.

follow conventions in @AGENTS.md for commit messages, take as much time as you need
when done

1. check app
2. submit changed to AGENTS.md to would have improved your work for next time, changes in AGENTS.md should be very minimal
3. submit a PR

# playwright tests for player

in app2, I want you to add playwright tests that test the sixfoldv0 and square components and test that you

- can click next, next all the way up until the end
- can click fast forward
- can click back
- can click all the way to the begining with backwards

all that for both components square and sixfoldv0, with no errors or warnings

follow conventions in @AGENTS.md for commit messages, take as much time as you need
when done check app then submit a PR

---
