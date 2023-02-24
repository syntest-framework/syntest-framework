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
    // nodes.at(0).lines = [23]; <- this will not compile because of readonly
    // nodes.at(0).lines[0] = 23; <- this will not compile because of readonly
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
