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
import { EdgeType, contractControlFlowProgram } from "@syntest/cfg";

const expect = chai.expect;

function cfgHelper(source: string) {
  const generator = new AbstractSyntaxTreeFactory();
  const ast = generator.convert("", source);

  const visitor = new ControlFlowGraphVisitor("");
  traverse(ast, visitor);

  return visitor.cfg;
}

describe("ControlFlowGraphVisitor test", () => {
  it("simple statements", () => {
    const source = `
        const x = 0
        const y = 1
        const z = 2
      `;

    const cfg = cfgHelper(source);

    expect(cfg.graph.nodes).to.have.lengthOf(6);
    expect(cfg.graph.edges).to.have.lengthOf(4);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const constX = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(constX)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constX)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(constX)[0].target;

    expect(cfg.graph.getIncomingEdges(constY)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constY)).to.have.lengthOf(1);

    const constZ = cfg.graph.getOutgoingEdges(constY)[0].target;

    expect(cfg.graph.getIncomingEdges(constZ)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constZ)).to.have.lengthOf(1);

    const exit = cfg.graph.getOutgoingEdges(constZ)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });

  it("if statements", () => {
    const source = `
        if (true) {
          const x = 0
        }
        const y = 1
      `;

    const cfg = cfgHelper(source);
    expect(cfg.graph.nodes).to.have.lengthOf(7);
    expect(cfg.graph.edges).to.have.lengthOf(6);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const ifStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(ifStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(ifStatement)).to.have.lengthOf(2);

    // const x = 0
    const trueBranch = cfg.graph.getOutgoingEdges(ifStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(trueBranch)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(trueBranch)).to.have.lengthOf(1);

    const falseBranch = cfg.graph.getOutgoingEdges(ifStatement)[1].target;

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

  it("if else statements", () => {
    const source = `
        if (true) {
          const x = 0
        } else {
          const y = 1
        }
        const z = 1
      `;

    const cfg = cfgHelper(source);
    expect(cfg.graph.nodes).to.have.lengthOf(7);
    expect(cfg.graph.edges).to.have.lengthOf(6);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const ifStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(ifStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(ifStatement)).to.have.lengthOf(2);

    // const x = 0
    const trueBranch = cfg.graph.getOutgoingEdges(ifStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(trueBranch)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(trueBranch)).to.have.lengthOf(1);

    // const y = 1
    const falseBranch = cfg.graph.getOutgoingEdges(ifStatement)[1].target;

    expect(cfg.graph.getIncomingEdges(falseBranch)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(falseBranch)).to.have.lengthOf(1);

    const constZtrue = cfg.graph.getOutgoingEdges(trueBranch)[0].target;
    const constZfalse = cfg.graph.getOutgoingEdges(falseBranch)[0].target;

    expect(constZtrue).to.equal(constZfalse);

    expect(cfg.graph.getIncomingEdges(constZfalse)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(constZfalse)).to.have.lengthOf(1);

    const exit = cfg.graph.getOutgoingEdges(constZfalse)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });

  it("if block statements", () => {
    const source = `
        if (true) {
          const x = 0
          const z = 1
        }
        const y = 1
      `;

    const cfg = cfgHelper(source);
    expect(cfg.graph.nodes).to.have.lengthOf(8);
    expect(cfg.graph.edges).to.have.lengthOf(7);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const ifStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(ifStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(ifStatement)).to.have.lengthOf(2);

    // const x = 0
    // true
    expect(cfg.graph.getOutgoingEdges(ifStatement)[0].type).to.equal(
      EdgeType.CONDITIONAL_TRUE
    );
    const trueBranch = cfg.graph.getOutgoingEdges(ifStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(trueBranch)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(trueBranch)).to.have.lengthOf(1);

    // const z = 1
    const zConst = cfg.graph.getOutgoingEdges(trueBranch)[0].target;

    expect(cfg.graph.getIncomingEdges(zConst)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(zConst)).to.have.lengthOf(1);

    // false
    expect(cfg.graph.getOutgoingEdges(ifStatement)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const falseBranch = cfg.graph.getOutgoingEdges(ifStatement)[1].target;

    expect(cfg.graph.getIncomingEdges(falseBranch)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(falseBranch)).to.have.lengthOf(1);

    const constYtrue = cfg.graph.getOutgoingEdges(zConst)[0].target;
    const constYfalse = cfg.graph.getOutgoingEdges(falseBranch)[0].target;

    expect(constYtrue).to.equal(constYfalse);

    expect(cfg.graph.getIncomingEdges(constYfalse)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(constYfalse)).to.have.lengthOf(1);

    const exit = cfg.graph.getOutgoingEdges(constYfalse)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });

  it("do while statements", () => {
    const source = `
        do {
          const x = 0
        } while (true)
        const y = 1
      `;

    const cfg = cfgHelper(source);

    expect(cfg.graph.nodes).to.have.lengthOf(6);
    expect(cfg.graph.edges).to.have.lengthOf(5);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const constX = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(constX)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(constX)).to.have.lengthOf(1);

    const doWhileStatement = cfg.graph.getOutgoingEdges(constX)[0].target;

    expect(cfg.graph.getIncomingEdges(doWhileStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)).to.have.lengthOf(2);

    // true
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)[0].type).to.equal(
      EdgeType.CONDITIONAL_TRUE
    );
    const bodyRepeat = cfg.graph.getOutgoingEdges(doWhileStatement)[0].target;
    // false
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const constY = cfg.graph.getOutgoingEdges(doWhileStatement)[1].target;

    expect(constX).to.equal(bodyRepeat);

    const exit = cfg.graph.getOutgoingEdges(constY)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });

  it("do while statements without block", () => {
    const source = `
        do {

        } while (true)
        const y = 1
      `;

    const cfg = cfgHelper(source);

    expect(cfg.graph.nodes).to.have.lengthOf(6);
    expect(cfg.graph.edges).to.have.lengthOf(5);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const constX = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(constX)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(constX)).to.have.lengthOf(1);

    const doWhileStatement = cfg.graph.getOutgoingEdges(constX)[0].target;

    expect(cfg.graph.getIncomingEdges(doWhileStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)).to.have.lengthOf(2);

    // true
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)[0].type).to.equal(
      EdgeType.CONDITIONAL_TRUE
    );
    const bodyRepeat = cfg.graph.getOutgoingEdges(doWhileStatement)[0].target;
    // false
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const constY = cfg.graph.getOutgoingEdges(doWhileStatement)[1].target;

    expect(constX).to.equal(bodyRepeat);

    const exit = cfg.graph.getOutgoingEdges(constY)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });

  it("do while statements without after", () => {
    const source = `
        do {
          const x = 0
        } while (true)
        
      `;

    const cfg = cfgHelper(source);

    expect(cfg.graph.nodes).to.have.lengthOf(5);
    expect(cfg.graph.edges).to.have.lengthOf(4);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const constX = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(constX)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(constX)).to.have.lengthOf(1);

    const doWhileStatement = cfg.graph.getOutgoingEdges(constX)[0].target;

    expect(cfg.graph.getIncomingEdges(doWhileStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)).to.have.lengthOf(2);

    // true
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)[0].type).to.equal(
      EdgeType.CONDITIONAL_TRUE
    );
    const bodyRepeat = cfg.graph.getOutgoingEdges(doWhileStatement)[0].target;

    // false
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const exit = cfg.graph.getOutgoingEdges(doWhileStatement)[1].target;

    expect(constX).to.equal(bodyRepeat);

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });

  it("do while statements continue", () => {
    const source = `
        do {
          continue
        } while (true)
        const y = 1
      `;

    const cfg = cfgHelper(source);

    expect(cfg.graph.nodes).to.have.lengthOf(6);
    expect(cfg.graph.edges).to.have.lengthOf(5);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const continueStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(continueStatement)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(continueStatement)).to.have.lengthOf(1);

    const doWhileStatement =
      cfg.graph.getOutgoingEdges(continueStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(doWhileStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)).to.have.lengthOf(2);

    // true
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)[0].type).to.equal(
      EdgeType.CONDITIONAL_TRUE
    );
    const bodyRepeat = cfg.graph.getOutgoingEdges(doWhileStatement)[0].target;
    // false
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const constY = cfg.graph.getOutgoingEdges(doWhileStatement)[1].target;

    expect(continueStatement).to.equal(bodyRepeat);

    const exit = cfg.graph.getOutgoingEdges(constY)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });

  it("do while statements break", () => {
    const source = `
        do {
          break
        } while (true)
        const y = 1
      `;

    const cfg = cfgHelper(source);

    expect(cfg.graph.nodes).to.have.lengthOf(6);
    expect(cfg.graph.edges).to.have.lengthOf(5);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const breakStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(breakStatement)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(breakStatement)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(breakStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(constY)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(constY)).to.have.lengthOf(1);

    const exit = cfg.graph.getOutgoingEdges(constY)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);

    // the while loop is dead code here
    const doWhileStatement =
      cfg.graph.getIncomingEdges(breakStatement)[1].source;

    expect(cfg.graph.getIncomingEdges(doWhileStatement)).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)).to.have.lengthOf(2);

    // true
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)[0].type).to.equal(
      EdgeType.CONDITIONAL_TRUE
    );
    const bodyRepeat = cfg.graph.getOutgoingEdges(doWhileStatement)[0].target;

    // false
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const exit2 = cfg.graph.getOutgoingEdges(doWhileStatement)[1].target;

    expect(breakStatement).to.equal(bodyRepeat);

    expect(exit2).to.equal(constY);
  });

  it("do while statements if break", () => {
    const source = `
        do {
          if (true) {   // 24:65
            break       // 48:53
          }             // placeholder-24:65
        } while (true)  // 9:88
        const y = 1     // 97:108
      `;

    const cfg = cfgHelper(source);

    expect(cfg.graph.nodes).to.have.lengthOf(8);
    expect(cfg.graph.edges).to.have.lengthOf(8);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const ifStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(ifStatement)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(ifStatement)).to.have.lengthOf(2);

    // true
    expect(cfg.graph.getOutgoingEdges(ifStatement)[0].type).to.equal(
      EdgeType.CONDITIONAL_TRUE
    );
    const breakStatement = cfg.graph.getOutgoingEdges(ifStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(breakStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(breakStatement)).to.have.lengthOf(1);

    const constYBreak = cfg.graph.getOutgoingEdges(breakStatement)[0].target;

    // false
    expect(cfg.graph.getOutgoingEdges(ifStatement)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const placeHolderNode = cfg.graph.getOutgoingEdges(ifStatement)[1].target;

    expect(cfg.graph.getIncomingEdges(placeHolderNode)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(placeHolderNode)).to.have.lengthOf(1);

    const whileStatement =
      cfg.graph.getOutgoingEdges(placeHolderNode)[0].target;

    expect(cfg.graph.getIncomingEdges(whileStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(whileStatement)).to.have.lengthOf(2);

    // true while
    expect(cfg.graph.getOutgoingEdges(whileStatement)[0].type).to.equal(
      EdgeType.CONDITIONAL_TRUE
    );
    const bodyRepeat = cfg.graph.getOutgoingEdges(whileStatement)[0].target;

    // false while
    expect(cfg.graph.getOutgoingEdges(whileStatement)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const constYWhile = cfg.graph.getOutgoingEdges(whileStatement)[1].target;

    expect(ifStatement).to.equal(bodyRepeat);
    expect(constYBreak).to.equal(constYWhile);

    expect(cfg.graph.getIncomingEdges(constYWhile)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(constYWhile)).to.have.lengthOf(1);

    const exit = cfg.graph.getOutgoingEdges(constYWhile)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
  });

  it("while statements", () => {
    const source = `
        while (true) {
          const x = 0
        }
        const y = 1
      `;

    const cfg = cfgHelper(source);
    expect(cfg.graph.nodes).to.have.lengthOf(6);
    expect(cfg.graph.edges).to.have.lengthOf(5);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const whileStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(whileStatement)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(whileStatement)).to.have.lengthOf(2);

    // true
    expect(cfg.graph.getOutgoingEdges(whileStatement)[0].type).to.equal(
      EdgeType.CONDITIONAL_TRUE
    );
    const constX = cfg.graph.getOutgoingEdges(whileStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(constX)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constX)).to.have.lengthOf(1);

    const backEdge = cfg.graph.getOutgoingEdges(constX)[0].target;

    expect(whileStatement).to.equal(backEdge);

    // false
    expect(cfg.graph.getOutgoingEdges(whileStatement)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const constY = cfg.graph.getOutgoingEdges(whileStatement)[1].target;

    expect(cfg.graph.getIncomingEdges(constY)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constY)).to.have.lengthOf(1);

    const exit = cfg.graph.getOutgoingEdges(constY)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });

  it("while statements no block", () => {
    const source = `
        while (true) {

        }
        const y = 1
      `;

    const cfg = cfgHelper(source);
    expect(cfg.graph.nodes).to.have.lengthOf(6);
    expect(cfg.graph.edges).to.have.lengthOf(5);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const whileStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(whileStatement)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(whileStatement)).to.have.lengthOf(2);

    // true
    expect(cfg.graph.getOutgoingEdges(whileStatement)[0].type).to.equal(
      EdgeType.CONDITIONAL_TRUE
    );
    const constX = cfg.graph.getOutgoingEdges(whileStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(constX)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constX)).to.have.lengthOf(1);

    const backEdge = cfg.graph.getOutgoingEdges(constX)[0].target;

    expect(whileStatement).to.equal(backEdge);

    // false
    expect(cfg.graph.getOutgoingEdges(whileStatement)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const constY = cfg.graph.getOutgoingEdges(whileStatement)[1].target;

    expect(cfg.graph.getIncomingEdges(constY)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constY)).to.have.lengthOf(1);

    const exit = cfg.graph.getOutgoingEdges(constY)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });

  // it("for i loop", () => {
  //   const source = `
  //       for (let i = 0; i < 10; i++) {
  //         const x = 1
  //       }
  //       const y = 1
  //     `;

  //   const cfg = cfgHelper(source);

  //   expect(cfg.graph.nodes).to.have.lengthOf(10);
  //   expect(cfg.graph.edges).to.have.lengthOf(9);

  //   expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
  //   expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

  //   const initExpression = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

  //   expect(cfg.graph.getIncomingEdges(initExpression)).to.have.lengthOf(1);
  //   expect(cfg.graph.getOutgoingEdges(initExpression)).to.have.lengthOf(1);

  //   const testExpression = cfg.graph.getOutgoingEdges(initExpression)[0].target;

  //   expect(cfg.graph.getIncomingEdges(testExpression)).to.have.lengthOf(2);
  //   expect(cfg.graph.getOutgoingEdges(testExpression)).to.have.lengthOf(2);

  //   // true
  //   const constX = cfg.graph.getOutgoingEdges(testExpression)[0].target;

  //   expect(cfg.graph.getIncomingEdges(constX)).to.have.lengthOf(1);
  //   expect(cfg.graph.getOutgoingEdges(constX)).to.have.lengthOf(1);

  //   const updateExpression = cfg.graph.getOutgoingEdges(constX)[0].target;

  //   expect(cfg.graph.getIncomingEdges(updateExpression)).to.have.lengthOf(1);
  //   expect(cfg.graph.getOutgoingEdges(updateExpression)).to.have.lengthOf(1);

  //   // TODO check this
  //   // const backEdge = cfg.graph.getOutgoingEdges(updateExpression)[0].target;

  //   // expect(testExpression).to.equal(backEdge);

  //   // false
  //   const constY = cfg.graph.getOutgoingEdges(testExpression)[1].target;

  //   expect(cfg.graph.getIncomingEdges(constY)).to.have.lengthOf(1);
  //   expect(cfg.graph.getOutgoingEdges(constY)).to.have.lengthOf(1);

  //   const exit = cfg.graph.getOutgoingEdges(constY)[0].target;

  //   expect(exit).to.equal("SUCCESS_EXIT");
  //   expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
  //   expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  // });

  // it("for i loop no block", () => {
  //   const source = `
  //       for (let i = 0; i < 10; i++) {

  //       }
  //       const y = 1
  //     `;

  //   const cfg = cfgHelper(source);
  //   expect(cfg.graph.nodes).to.have.lengthOf(10);
  //   expect(cfg.graph.edges).to.have.lengthOf(9);

  //   expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
  //   expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

  //   const initExpression = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

  //   expect(cfg.graph.getIncomingEdges(initExpression)).to.have.lengthOf(1);
  //   expect(cfg.graph.getOutgoingEdges(initExpression)).to.have.lengthOf(1);

  //   const testExpression = cfg.graph.getOutgoingEdges(initExpression)[0].target;

  //   expect(cfg.graph.getIncomingEdges(testExpression)).to.have.lengthOf(2);
  //   expect(cfg.graph.getOutgoingEdges(testExpression)).to.have.lengthOf(2);

  //   // true
  //   const trueCase = cfg.graph.getOutgoingEdges(testExpression)[0].target;

  //   expect(cfg.graph.getIncomingEdges(trueCase)).to.have.lengthOf(1);
  //   expect(cfg.graph.getOutgoingEdges(trueCase)).to.have.lengthOf(1);

  //   const updateExpression = cfg.graph.getOutgoingEdges(trueCase)[0].target;

  //   expect(cfg.graph.getIncomingEdges(updateExpression)).to.have.lengthOf(1);
  //   expect(cfg.graph.getOutgoingEdges(updateExpression)).to.have.lengthOf(1);

  //   const backEdge = cfg.graph.getOutgoingEdges(updateExpression)[0].target;

  //   expect(testExpression).to.equal(backEdge);

  //   // false
  //   const constY = cfg.graph.getOutgoingEdges(testExpression)[1].target;

  //   expect(cfg.graph.getIncomingEdges(constY)).to.have.lengthOf(1);
  //   expect(cfg.graph.getOutgoingEdges(constY)).to.have.lengthOf(1);

  //   const exit = cfg.graph.getOutgoingEdges(constY)[0].target;

  //   expect(exit).to.equal("SUCCESS_EXIT");
  //   expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
  //   expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  // });

  it("for in loop", () => {
    const source = `
        for (let i in a) {
          const x = 1
        }
        const y = 1
      `;

    const cfg = cfgHelper(source);
    expect(cfg.graph.nodes).to.have.lengthOf(7);
    expect(cfg.graph.edges).to.have.lengthOf(6);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const forTest = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(forTest)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(forTest)).to.have.lengthOf(2);

    // true
    const constX = cfg.graph.getOutgoingEdges(forTest)[0].target;

    expect(cfg.graph.getIncomingEdges(constX)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constX)).to.have.lengthOf(1);

    const backEdge = cfg.graph.getOutgoingEdges(constX)[0].target;

    expect(forTest).to.equal(backEdge);

    // false
    const placeholder = cfg.graph.getOutgoingEdges(forTest)[1].target;

    expect(cfg.graph.getIncomingEdges(placeholder)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(placeholder)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(placeholder)[0].target;

    expect(cfg.graph.getIncomingEdges(constY)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constY)).to.have.lengthOf(1);

    const exit = cfg.graph.getOutgoingEdges(constY)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });

  it("for in loop no block", () => {
    const source = `
        for (let i in a) {

        }
        const y = 1
      `;

    const cfg = cfgHelper(source);
    expect(cfg.graph.nodes).to.have.lengthOf(7);
    expect(cfg.graph.edges).to.have.lengthOf(6);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const forTest = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(forTest)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(forTest)).to.have.lengthOf(2);

    // true
    const trueCase = cfg.graph.getOutgoingEdges(forTest)[0].target;

    expect(cfg.graph.getIncomingEdges(trueCase)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(trueCase)).to.have.lengthOf(1);

    const backEdge = cfg.graph.getOutgoingEdges(trueCase)[0].target;

    expect(forTest).to.equal(backEdge);

    // false
    const falseCase = cfg.graph.getOutgoingEdges(forTest)[1].target;

    expect(cfg.graph.getIncomingEdges(falseCase)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(falseCase)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(falseCase)[0].target;

    expect(cfg.graph.getIncomingEdges(constY)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constY)).to.have.lengthOf(1);

    const exit = cfg.graph.getOutgoingEdges(constY)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });

  it("for of loop", () => {
    const source = `
        for (let i of a) {
          const x = 1
        }
        const y = 1
      `;

    const cfg = cfgHelper(source);
    expect(cfg.graph.nodes).to.have.lengthOf(7);
    expect(cfg.graph.edges).to.have.lengthOf(6);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const forTest = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(forTest)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(forTest)).to.have.lengthOf(2);

    // true
    const constX = cfg.graph.getOutgoingEdges(forTest)[0].target;

    expect(cfg.graph.getIncomingEdges(constX)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constX)).to.have.lengthOf(1);

    const backEdge = cfg.graph.getOutgoingEdges(constX)[0].target;

    expect(forTest).to.equal(backEdge);

    // false
    const placeholder = cfg.graph.getOutgoingEdges(forTest)[1].target;

    expect(cfg.graph.getIncomingEdges(placeholder)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(placeholder)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(placeholder)[0].target;

    expect(cfg.graph.getIncomingEdges(constY)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constY)).to.have.lengthOf(1);

    const exit = cfg.graph.getOutgoingEdges(constY)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });

  it("for of loop no block", () => {
    const source = `
        for (let i of a) {

        }
        const y = 1
      `;

    const cfg = cfgHelper(source);
    expect(cfg.graph.nodes).to.have.lengthOf(7);
    expect(cfg.graph.edges).to.have.lengthOf(6);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const forTest = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(forTest)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(forTest)).to.have.lengthOf(2);

    // true
    const trueCase = cfg.graph.getOutgoingEdges(forTest)[0].target;

    expect(cfg.graph.getIncomingEdges(trueCase)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(trueCase)).to.have.lengthOf(1);

    const backEdge = cfg.graph.getOutgoingEdges(trueCase)[0].target;
    expect(forTest).to.equal(backEdge);

    // false
    const falseCase = cfg.graph.getOutgoingEdges(forTest)[1].target;

    expect(cfg.graph.getIncomingEdges(falseCase)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(falseCase)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(falseCase)[0].target;

    expect(cfg.graph.getIncomingEdges(constY)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constY)).to.have.lengthOf(1);

    const exit = cfg.graph.getOutgoingEdges(constY)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });

  // switch
  it("switch", () => {
    const source = `
      switch (a) {      // 007:374
        case 1:         // 044:121
          const x = 1   // 081:092
          break         // 116:121
        case 2:         // 149:156 // placeholder-149:156
        case 3: {       // 207:278
          break         // 244:249
        }               // 
        default:        // 305:348
          break;        // 342:348
      }                 //
      `;

    const cfg = cfgHelper(source);

    expect(cfg.graph.nodes).to.have.lengthOf(13);
    expect(cfg.graph.edges).to.have.lengthOf(14);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const switchStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(switchStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(switchStatement)).to.have.lengthOf(1);

    const case1 = cfg.graph.getOutgoingEdges(switchStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(case1)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(case1)).to.have.lengthOf(2);

    // true case 1
    const constX = cfg.graph.getOutgoingEdges(case1)[0].target;

    expect(cfg.graph.getIncomingEdges(constX)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constX)).to.have.lengthOf(1);

    const breakStatementCase1 = cfg.graph.getOutgoingEdges(constX)[0].target;

    expect(cfg.graph.getIncomingEdges(breakStatementCase1)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(breakStatementCase1)).to.have.lengthOf(1);

    // false case 1
    const case2 = cfg.graph.getOutgoingEdges(case1)[1].target;

    expect(cfg.graph.getIncomingEdges(case2)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(case2)).to.have.lengthOf(2);

    // true case 2
    const placeholderCase2 = cfg.graph.getOutgoingEdges(case2)[0].target;

    expect(cfg.graph.getIncomingEdges(placeholderCase2)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(placeholderCase2)).to.have.lengthOf(1);

    const case3Placeholder =
      cfg.graph.getOutgoingEdges(placeholderCase2)[0].target;

    // false case 2
    const case3 = cfg.graph.getOutgoingEdges(case2)[1].target;

    expect(case3).to.equal(case3Placeholder);

    expect(cfg.graph.getIncomingEdges(case3)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(case3)).to.have.lengthOf(2);

    // true case 3
    const breakStatementCase3 = cfg.graph.getOutgoingEdges(case3)[0].target;

    expect(cfg.graph.getIncomingEdges(breakStatementCase3)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(breakStatementCase3)).to.have.lengthOf(1);

    // false case 3
    const defaultCase = cfg.graph.getOutgoingEdges(case3)[1].target;

    expect(cfg.graph.getIncomingEdges(defaultCase)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(defaultCase)).to.have.lengthOf(1);

    const breakStatementDefault =
      cfg.graph.getOutgoingEdges(defaultCase)[0].target;

    expect(cfg.graph.getIncomingEdges(breakStatementDefault)).to.have.lengthOf(
      1
    );
    expect(cfg.graph.getOutgoingEdges(breakStatementDefault)).to.have.lengthOf(
      1
    );

    const exitBreak1 =
      cfg.graph.getOutgoingEdges(breakStatementCase1)[0].target;
    const exitBreak3 =
      cfg.graph.getOutgoingEdges(breakStatementCase3)[0].target;
    const exit = cfg.graph.getOutgoingEdges(breakStatementDefault)[0].target;

    expect(exitBreak1).to.equal(exitBreak3);
    expect(exitBreak1).to.equal(exit);
    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(3);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });

  // functions
  it("function simple block", () => {
    const source = `
      function a () {
        const x = 1;
        const y = 1;
        const z = 1;
      }
      `;

    const cfg = cfgHelper(source);

    expect(cfg);
  });

  it("function simple block", () => {
    const source = `
    function after(n, func) {
      if (typeof func !== 'function') {
        throw new TypeError('Expected a function')
      }
    
      n = n || 0
    
      return function(...args) {
        if (--n < 1) {
          return func.apply(this, args)
        }
      }
    }
    
    export default after
    
      `;

    const cfg = contractControlFlowProgram(cfgHelper(source));

    console.log(cfg.functions[0].graph);
    expect(cfg.functions);
  });

  it("function short arrow", () => {
    const source = `const at = (object, ...paths) => baseAt(object, baseFlatten(paths, 1))
export default at
      `;

    const cfg = contractControlFlowProgram(cfgHelper(source));

    console.log(cfg);
    expect(cfg.functions);
  });
});
