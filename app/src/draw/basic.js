import { text } from "./text";

import * as d3 from "d3";

export const dot = (svg, x, y, stroke = 1.5) => {
  return svg
    .append("circle")
    .style("display", "block")
    .attr("cx", x)
    .attr("cy", y)
    .attr("r", stroke);
};

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
  return { dot: d, tooltip, visible: false };
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
