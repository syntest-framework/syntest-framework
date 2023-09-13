/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest JavaScript.
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
import { traverse } from "@babel/core";
import * as chai from "chai";

import { AbstractSyntaxTreeFactory } from "../../lib/ast/AbstractSyntaxTreeFactory";
import { ControlFlowGraphVisitor } from "../../lib/cfg/ControlFlowGraphVisitor";

const expect = chai.expect;

function cfgHelper(source: string) {
  const generator = new AbstractSyntaxTreeFactory();
  const ast = generator.convert("", source);

  const visitor = new ControlFlowGraphVisitor("", false);
  traverse(ast, visitor);

  return visitor.cfg;
}

describe("ControlFlowGraphVisitor test for ternary statements", () => {
  it("ternary statements", () => {
    const source = `
        const x = true ? 0 : 1
        const y = 0
      `;

    const cfg = cfgHelper(source);

    expect(cfg.graph.nodes).to.have.lengthOf(9);
    expect(cfg.graph.edges).to.have.lengthOf(8);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const variableDeclaration = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(variableDeclaration)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(variableDeclaration)).to.have.lengthOf(1);

    const assignment =
      cfg.graph.getOutgoingEdges(variableDeclaration)[0].target;

    expect(cfg.graph.getIncomingEdges(assignment)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(assignment)).to.have.lengthOf(1);

    const ternary = cfg.graph.getOutgoingEdges(assignment)[0].target;

    expect(cfg.graph.getIncomingEdges(ternary)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(ternary)).to.have.lengthOf(2);

    // const x = 0
    const trueBranch = cfg.graph.getOutgoingEdges(ternary)[0].target;

    expect(cfg.graph.getIncomingEdges(trueBranch)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(trueBranch)).to.have.lengthOf(1);

    const falseBranch = cfg.graph.getOutgoingEdges(ternary)[1].target;

    expect(cfg.graph.getIncomingEdges(falseBranch)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(falseBranch)).to.have.lengthOf(1);

    const constYtrue = cfg.graph.getOutgoingEdges(trueBranch)[0].target;
    const constYfalse = cfg.graph.getOutgoingEdges(falseBranch)[0].target;

    expect(constYtrue).to.equal(constYfalse);

    expect(cfg.graph.getIncomingEdges(constYfalse)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(constYfalse)).to.have.lengthOf(1);

    const exit = cfg.graph.getOutgoingEdges(constYfalse)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });
});
