# phase 4
04/05/2026

do @backlog/geometry-framework-PHASE4.md 

I want to merge branch into `sas/002-geo-framework-v0`

follow conventions in @AGENTS.md for atomic commit messages, take as much time as you need
when done

1. check app
2. submit changed to AGENTS.md to would have improved your work for next time, changes in AGENTS.md should be very minimal
2. submit a PR (remember I want to merge into `sas/002-geo-framework-v0` NOT `main`)

---

# phase 3

do @backlog/geometry-framework-PHASE3.md 
--

# add CICD steps

04/05/2026

for app2, I want you to add CI steps that can be run when a PR is submitted

follow conventions in @AGENTS.md for atomic commit messages, take as much time as you need
when done

1. check app
2. submit changed to AGENTS.md to would have improved your work for next time, changes in AGENTS.md should be very minimal
2. submit a PR


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
2. submit a PR


---

# Geometry player component

in app2, I want to extract a Geometry player component, this component should have the svg canvas, the player buttons it already has. The work is more around refactoring than anything else

follow conventions in @AGENTS.md for commit messages, take as much time as you need
when done
1. check app
2. submit changed to AGENTS.md to would have improved your work for next time, changes in AGENTS.md should be very minimal
2. submit a PR

---

# extra playwright
in app2, there are playwright tests, but they only cover a small part, I want you to create a md file under backlog with name EXTRA_PLAYWRIGHT.md
go through the full functionality of the app2 and list what should we add as e2e tests. I want minimal tests not too verbose but I want to cover all main cases please
take as much time as you need,
follow conventions in @AGENTS.md for commit messages, take as much time as you need
when done
1. check app
2. submit changed to AGENTS.md to would have improved your work for next time, changes in AGENTS.md should be very minimal
2. submit a PR

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
2. submit a PR


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