/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { NodeType } from "./nodes/Node";

const d3 = require("d3");
const fs = require("fs");
const { JSDOM } = require("jsdom");

/**
 * @author Dimitri Stallenberg
 */
export function drawGraph(cfg: any, path: string) {
  const width = 2000;
  const height = 2000;
  const offset = 200;

  let count = 0;
  const graph = {
    nodes: [
      ...cfg.nodes.map((n: any) => {
        let name = `(${n.lines[0]})`;

        if (n.description && n.description.length) {
          name = `(${n.lines[0]}: ${n.description})`;
        }

        if (n.type === NodeType.Branch) {
          name += ` ${n.condition.operator}`;
        }

        const node = {
          id: n.id,
          name: name,
          fixed: n.type === NodeType.Root,
          root: n.type === NodeType.Root,
          fx: undefined,
          fy: undefined,
        };

        if (node.root) {
          node.fx = 50 + (count + 1) * offset;
          node.fy = 20;
          count += 1;
        }

        return node;
      }),
    ],
    links: [
      ...cfg.edges.map((e: any) => {
        return {
          id: e.from + "-" + e.to,
          source: e.from,
          target: e.to,
          type: e.branchType,
        };
      }),
    ],
  };

  const dom = new JSDOM(`<!DOCTYPE html><body></body>`);

  const body = d3.select(dom.window.document.querySelector("body"));
  const svg = body
    .append("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("width", width)
    .attr("height", height);

  svg
    .append("defs")
    .append("marker")
    .attr("id", "marker")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M 0,-5 L 10 ,0 L 0,5")
    .attr("fill", "#555")
    .attr("stroke", "#555");

  const color = d3.scaleOrdinal().range(d3.schemeCategory20);

  const simulation = d3
    .forceSimulation()
    .force(
      "charge",
      d3.forceManyBody().strength(-100).distanceMin(10).distanceMax(100)
    )
    .force(
      "link",
      d3
        .forceLink()
        .id(function (d: any) {
          return d.id;
        })
        .distance(30) //.strength(-2)
    )
    // .force("center", d3.forceCenter(250, 250))
    .force("y", d3.forceY(height).strength(0.01))
    .force("x", d3.forceX(width).strength(0.01));
  // .force('y',  d3.forceY(height / 2).strength(0.25))

  simulation.nodes(graph.nodes);

  simulation.force("link").links(graph.links);

  const link = svg
    .append("g")
    .attr("class", "links")
    .selectAll("path")
    .data(graph.links)
    .enter()
    .append("path")
    .attr("stroke-width", "1px")
    .attr("stroke", (d: any) => {
      if (d.type === true) {
        return "#7CFC00";
      } else if (d.type === false) {
        return "#ff0000";
      }
      return "#555";
    })
    .attr("fill", "none")
    .attr("marker-end", "url(#marker)");

  const node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(graph.nodes)
    .enter()
    .append("g");

  const circles1 = node
    .append("circle")
    .attr("r", (d: any) => {
      if (d.final) {
        return 8;
      } else {
        return 4;
      }
    })
    .style("stroke", "#000")
    .style("stroke-width", "1.5px")
    .attr("fill", "#fff");

  const circles2 = node
    .append("circle")
    .attr("r", 5)
    .attr("fill", function (d: any) {
      return color(d.id);
    })
    .style("stroke", "#000")
    .style("stroke-width", "1.5px")
    .style("stroke-dasharray", (d: any) => {
      if (d.root) {
        return "3, 3";
      }
      return null;
    });

  const lables = node
    .append("text")
    .text(function (d: any) {
      return d.name;
    })
    .attr("x", 6)
    .attr("y", 3)
    .style("font-family", "sans-serif")
    .style("font-size", "10px");

  node.append("title").text(function (d: any) {
    return d.id;
  });

  function ticked() {
    // link
    //     .attr("x1", function(d) { return d.source.x; })
    //     .attr("y1", function(d) { return d.source.y; })
    //     .attr("x2", function(d) { return d.target.x; })
    //     .attr("y2", function(d) { return d.target.y; });

    link.attr("d", function (d: any) {
      let x1 = d.source.x,
        y1 = d.source.y,
        x2 = d.target.x,
        y2 = d.target.y,
        dx = x2 - x1,
        dy = y2 - y1,
        dr = Math.sqrt(dx * dx + dy * dy),
        // Defaults for normal edge.
        drx = dr,
        dry = dr,
        xRotation = 0, // degrees
        largeArc = 0, // 1 or 0
        sweep = 1; // 1 or 0

      if (d.type === true) {
        sweep = 0;
      } else if (d.type === undefined) {
        drx = 0;
        dry = 0;
      }

      // Self edge.
      if (x1 === x2 && y1 === y2) {
        // Fiddle with this angle to get loop oriented.
        xRotation = -45;

        // Needs to be 1.
        largeArc = 1;

        // Change sweep to change orientation of loop.
        //sweep = 0;

        // Make drx and dry different to get an ellipse
        // instead of a circle.
        drx = 15;
        dry = 15;

        // For whatever reason the arc collapses to a point if the beginning
        // and ending points of the arc are the same, so kludge it.
        x2 = x2 + 1;
        y2 = y2 + 1;
      }

      return (
        "M" +
        x1 +
        "," +
        y1 +
        "A" +
        drx +
        "," +
        dry +
        " " +
        xRotation +
        "," +
        largeArc +
        "," +
        sweep +
        " " +
        x2 +
        "," +
        y2
      );
    });

    node.attr("transform", function (d: any) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  }

  simulation.on("tick", ticked);

  for (let i = 0; i < 50; i++) {
    simulation.tick();
    ticked();
  }

  fs.writeFileSync(path, body.html());
}
