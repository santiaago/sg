import * as d3 from "d3";

export const text = (svg, x, y, prefix, index) => {
  const r = svg.append("rect").attr("x", x).attr("y", y).style("fill", "black");
  const t = svg
    .append("text")
    .text(`${prefix}${index ? index : ""}`)
    .attr("x", x)
    .attr("y", y)
    .attr("dx", 5)
    .attr("dy", 7);

  const computedWidth = t.node().getComputedTextLength();
  r.attr("height", 10).attr("width", computedWidth + 10);

  return [r, t];
};
