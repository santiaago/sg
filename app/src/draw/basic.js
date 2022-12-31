import { text } from "./text";

import * as d3 from "d3";
// @ts-ignore
import { Point } from "../math/points";
// @ts-ignore
import { Line } from "../math/lines";
// @ts-ignore
import { Circle } from "../math/circles";

export const dot = (svg, x, y, stroke = 1.5) => {
  return svg
    .append("circle")
    .style("display", "block")
    .attr("cx", x)
    .attr("cy", y)
    .attr("r", stroke);
};

/**
 * @param {any} svg
 * @param {Point} p
 * @param {number} stroke
 */
export function drawDot(svg, p, stroke) {
  return dot(svg, p.x, p.y, stroke);
}

const addPointTooltipEvents = (selection, tooltip) => {
  return selection
    .on("mouseover", (d) => {
      tooltip.map((x) => x.style("opacity", 1));
      d3.select(d.currentTarget).style("fill", "red");
    })
    .on("mouseleave", (d) => {
      tooltip.map((x) => x.style("opacity", 0));
      d3.select(d.currentTarget).style("fill", "black");
    });
};

export const dotWithTooltip = (svg, x, y, name, stroke) => {
  const tooltip = text(svg, x, y, name);
  tooltip.map((x) => x.style("opacity", 0));
  const d = dot(svg, x, y, stroke);
  d.call(addPointTooltipEvents, tooltip);
  return { dot: d, tooltip };
};
export const pointWithTooltip = (svg, point, name, stroke) => {
  return dotWithTooltip(svg, point.x, point.y, name, stroke);
};

export const line = (svg, x1, y1, x2, y2, stroke = 5, color = "#506") => {
  return svg
    .append("line")
    .style("stroke", color)
    .style("stroke-width", stroke)
    .attr("x1", x1)
    .attr("y1", y1)
    .attr("x2", x2)
    .attr("y2", y2);
};

/**
 * @param {any} svg
 * @param {Line} l
 * @param {any} stroke
 */
export function drawLine(svg, l, stroke) {
  return line(svg, l.p1.x, l.p1.y, l.p2.x, l.p2.y, stroke);
}

export const rect = (svg, width, height) => {
  return svg
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#fff");
};

export const circle = (svg, cx, cy, r, stroke = 1) => {
  return svg
    .append("circle")
    .style("stroke", "#f06")
    .style("stroke-width", stroke)
    .style("fill", "none")
    .attr("cx", cx)
    .attr("cy", cy)
    .attr("r", r);
};

/**
 * @param {any} svg
 * @param {Circle} c
 * @param {any} stroke
 */
export function drawCircle(svg, c, stroke) {
  return circle(svg, c.p.x, c.p.y, c.r, stroke);
}
