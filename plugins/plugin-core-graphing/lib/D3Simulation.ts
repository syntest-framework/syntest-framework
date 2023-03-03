/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core.
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
import fs = require("fs");

import { ControlFlowGraph } from "@syntest/cfg-core";
import * as d3 from "d3";

import { cfgToD3Graph, D3Node } from "./cfgToD3Graph";
import { getBodyObject, getSVGObject } from "./getSVGObject";

export function createSimulation(cfg: ControlFlowGraph) {
  const width = 2000;
  const height = 2000;
  const offset = 200;

  const graph = cfgToD3Graph(cfg, offset);
  const body = getBodyObject();
  const svg = getSVGObject(body, width, height);

  const color = d3.scaleOrdinal().range(d3.schemeCategory10);

  const chargeForce = d3
    .forceManyBody()
    .strength(-100)
    .distanceMin(10)
    .distanceMax(100);

  const linkForce = d3
    .forceLink()
    .id((d: D3Node) => d.id)
    .distance(30);

  const forceY = d3.forceY(height).strength(0.01);

  const forceX = d3.forceY(width).strength(0.01);

  const simulation = d3
    .forceSimulation()
    .force("charge", chargeForce)
    .force("link", linkForce)
    .force("y", forceY)
    .force("x", forceX);

  simulation.nodes(graph.nodes);
  (<any>simulation.force("link")).links(graph.links);

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
      const x1 = d.source.x;
      const y1 = d.source.y;
      let x2 = d.target.x;
      let y2 = d.target.y;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dr = Math.sqrt(dx * dx + dy * dy);
      // Defaults for normal edge.
      let drx = dr;
      let dry = dr;
      let xRotation = 0; // degrees
      let largeArc = 0; // 1 or 0
      let sweep = 1; // 1 or 0

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

  return body.html();
}
