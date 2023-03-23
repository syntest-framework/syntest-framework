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
import { ControlFlowGraph, NodeType, Node } from "..";

const expect = chai.expect;

describe("CFG Immutability check", function () {
  it("get nodes works properly with immutability", () => {
    const nodes: Node<unknown>[] = [
      new Node("ROOT", NodeType.ENTRY, "ROOT", [], { lineNumbers: [] }),
      new Node("EXIT", NodeType.EXIT, "EXIT", [], { lineNumbers: [] }),
    ];

    for (let i = 65; i < "E".charCodeAt(0) + 1; i++) {
      nodes.push(
        new Node(
          String.fromCharCode(i),
          NodeType.NORMAL,
          String.fromCharCode(i),
          [],
          { lineNumbers: [26] }
        )
      );
    }
    const cfg = new ControlFlowGraph(
      nodes[0],
      nodes[1],
      nodes[1],
      nodes.reduce((map, node) => {
        map.set(node.id, node);
        return map;
      }, new Map<string, Node<unknown>>()),
      []
    );
    const rootNode = cfg.entry;
    expect(rootNode.metadata.lineNumbers).to.empty;
    // nodes.at(0)!.lines = [23]; // <- this will not compile because of readonly
    expect(rootNode.metadata.lineNumbers).to.empty;
    // nodes.at(0)!.lines[0] = 23; <- this will not compile because of readonly
    nodes.push(
      new Node("dummy", NodeType.NORMAL, "dummy", [], { lineNumbers: [] })
    );
    expect(cfg.getNodeById("A")?.metadata.lineNumbers).to.eql([26]);
    expect(cfg.nodes.size).to.not.equal(nodes.length);
    // expect(cfg.get_nodes().at(0)?.lines = [23]).to.throw(); <- this will not compile
  });
});
