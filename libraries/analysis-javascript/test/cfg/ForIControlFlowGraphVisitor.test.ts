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

  const visitor = new ControlFlowGraphVisitor("");
  traverse(ast, visitor);

  return visitor.cfg;
}

describe("ControlFlowGraphVisitor test for for i statements", () => {
  it("for i loop", () => {
    const source = `
        for (let i = 0; i < 10; i++) {
          const x = 1
        }
        const y = 1
      `;

    const cfg = cfgHelper(source);
    console.log(cfg.graph);

    expect(cfg.graph.nodes).to.have.lengthOf(9);
    expect(cfg.graph.edges).to.have.lengthOf(8);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const initExpression = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(initExpression)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(initExpression)).to.have.lengthOf(1);

    const testExpression = cfg.graph.getOutgoingEdges(initExpression)[0].target;

    expect(cfg.graph.getIncomingEdges(testExpression)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(testExpression)).to.have.lengthOf(2);

    // true
    const constX = cfg.graph.getOutgoingEdges(testExpression)[0].target;

    expect(cfg.graph.getIncomingEdges(constX)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constX)).to.have.lengthOf(1);

    const updateExpression = cfg.graph.getOutgoingEdges(constX)[0].target;

    expect(cfg.graph.getIncomingEdges(updateExpression)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(updateExpression)).to.have.lengthOf(1);

    // TODO check this
    const backEdge = cfg.graph.getOutgoingEdges(updateExpression)[0].target;

    expect(testExpression).to.equal(backEdge);

    // false
    const placeholderFalse =
      cfg.graph.getOutgoingEdges(testExpression)[1].target;

    expect(cfg.graph.getIncomingEdges(placeholderFalse)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(placeholderFalse)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(placeholderFalse)[0].target;

    expect(cfg.graph.getIncomingEdges(constY)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constY)).to.have.lengthOf(1);

    const exit = cfg.graph.getOutgoingEdges(constY)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });

  it("for i loop no block", () => {
    const source = `
        for (let i = 0; i < 10; i++) {

        }
        const y = 1
      `;

    const cfg = cfgHelper(source);
    expect(cfg.graph.nodes).to.have.lengthOf(9);
    expect(cfg.graph.edges).to.have.lengthOf(8);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const initExpression = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(initExpression)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(initExpression)).to.have.lengthOf(1);

    const testExpression = cfg.graph.getOutgoingEdges(initExpression)[0].target;

    expect(cfg.graph.getIncomingEdges(testExpression)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(testExpression)).to.have.lengthOf(2);

    // true
    const trueCase = cfg.graph.getOutgoingEdges(testExpression)[0].target;

    expect(cfg.graph.getIncomingEdges(trueCase)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(trueCase)).to.have.lengthOf(1);

    const updateExpression = cfg.graph.getOutgoingEdges(trueCase)[0].target;

    expect(cfg.graph.getIncomingEdges(updateExpression)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(updateExpression)).to.have.lengthOf(1);

    const backEdge = cfg.graph.getOutgoingEdges(updateExpression)[0].target;

    expect(testExpression).to.equal(backEdge);

    // false
    const placeholderFalse =
      cfg.graph.getOutgoingEdges(testExpression)[1].target;

    expect(cfg.graph.getIncomingEdges(placeholderFalse)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(placeholderFalse)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(placeholderFalse)[0].target;

    expect(cfg.graph.getIncomingEdges(constY)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constY)).to.have.lengthOf(1);

    const exit = cfg.graph.getOutgoingEdges(constY)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });
});
