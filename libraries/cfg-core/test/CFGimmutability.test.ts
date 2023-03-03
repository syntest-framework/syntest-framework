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
import * as chai from "chai";

import { ControlFlowGraph, NodeType, RootNode, Node } from "../lib";

const expect = chai.expect;

describe("CFG Immutability check", function () {
  it("get nodes works properly with immutability", () => {
    const nodes: Node[] = [
      {
        type: NodeType.Root,
        id: "ROOT",
        lines: [],
        statements: [],
      },
    ];

    for (let i = 65; i < "E".charCodeAt(0) + 1; i++) {
      nodes.push({
        type: NodeType.Intermediary,
        id: String.fromCharCode(i),
        lines: [26],
        statements: [],
      });
    }
    const cfg = new ControlFlowGraph(nodes, []);
    const retrievedNodes: Node[] = cfg.nodes;
    const rootNode = cfg.nodes.at(0);
    expect(rootNode?.lines).to.empty;
    // nodes.at(0)!.lines = [23]; // <- this will not compile because of readonly
    expect(nodes.at(0)!.lines).to.empty;
    // nodes.at(0)!.lines[0] = 23; <- this will not compile because of readonly
    nodes.push({
      type: NodeType.Normal,
      id: "dummy",
      lines: [],
      statements: [],
    });
    expect(cfg.nodes.at(1)?.lines).to.eql([26]);
    expect(cfg.nodes.length).to.not.equal(nodes.length);
    // expect(cfg.get_nodes().at(0)?.lines = [23]).to.throw(); <- this will not compile

    console.log(retrievedNodes);
  });
});
