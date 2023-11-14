/*
 * Copyright 2020-2023 SynTest contributors
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
import { contractControlFlowProgram, EdgeType } from "@syntest/cfg";
import { isFailure, unwrap } from "@syntest/diagnostics";
import * as chai from "chai";

import { AbstractSyntaxTreeFactory } from "../../lib/ast/AbstractSyntaxTreeFactory";
import { ControlFlowGraphVisitor } from "../../lib/cfg/ControlFlowGraphVisitor";

const expect = chai.expect;

function cfgHelper(source: string) {
  const generator = new AbstractSyntaxTreeFactory();
  const result = generator.convert("", source);
  if (isFailure(result)) throw result.error;
  const ast = unwrap(result);

  const visitor = new ControlFlowGraphVisitor("", false);
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
    expect(cfg.graph.nodes).to.have.lengthOf(8);
    expect(cfg.graph.edges).to.have.lengthOf(7);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const ifStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(ifStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(ifStatement)).to.have.lengthOf(1);

    const test = cfg.graph.getOutgoingEdges(ifStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(test)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(test)).to.have.lengthOf(2);

    // const x = 0
    const trueBranch = cfg.graph.getOutgoingEdges(test)[0].target;

    expect(cfg.graph.getIncomingEdges(trueBranch)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(trueBranch)).to.have.lengthOf(1);

    const falseBranch = cfg.graph.getOutgoingEdges(test)[1].target;

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
    expect(cfg.graph.nodes).to.have.lengthOf(8);
    expect(cfg.graph.edges).to.have.lengthOf(7);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const ifStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(ifStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(ifStatement)).to.have.lengthOf(1);

    const test = cfg.graph.getOutgoingEdges(ifStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(test)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(test)).to.have.lengthOf(2);

    // const x = 0
    const trueBranch = cfg.graph.getOutgoingEdges(test)[0].target;

    expect(cfg.graph.getIncomingEdges(trueBranch)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(trueBranch)).to.have.lengthOf(1);

    // const y = 1
    const falseBranch = cfg.graph.getOutgoingEdges(test)[1].target;

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
    expect(cfg.graph.nodes).to.have.lengthOf(9);
    expect(cfg.graph.edges).to.have.lengthOf(8);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const ifStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(ifStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(ifStatement)).to.have.lengthOf(1);

    const test = cfg.graph.getOutgoingEdges(ifStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(test)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(test)).to.have.lengthOf(2);

    // const x = 0
    // true
    expect(cfg.graph.getOutgoingEdges(test)[0].type).to.equal(
      EdgeType.CONDITIONAL_TRUE
    );
    const trueBranch = cfg.graph.getOutgoingEdges(test)[0].target;

    expect(cfg.graph.getIncomingEdges(trueBranch)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(trueBranch)).to.have.lengthOf(1);

    // const z = 1
    const zConst = cfg.graph.getOutgoingEdges(trueBranch)[0].target;

    expect(cfg.graph.getIncomingEdges(zConst)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(zConst)).to.have.lengthOf(1);

    // false
    expect(cfg.graph.getOutgoingEdges(test)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const falseBranch = cfg.graph.getOutgoingEdges(test)[1].target;

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

    expect(cfg.graph.nodes).to.have.lengthOf(10);
    expect(cfg.graph.edges).to.have.lengthOf(9);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const doWhileStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(doWhileStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)).to.have.lengthOf(1);

    const constX = cfg.graph.getOutgoingEdges(doWhileStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(constX)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(constX)).to.have.lengthOf(1);

    const test = cfg.graph.getOutgoingEdges(constX)[0].target;

    expect(cfg.graph.getIncomingEdges(test)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(test)).to.have.lengthOf(2);

    // true
    expect(cfg.graph.getOutgoingEdges(test)[0].type).to.equal(
      EdgeType.CONDITIONAL_TRUE
    );

    const truePlaceholder = cfg.graph.getOutgoingEdges(test)[0].target;

    expect(cfg.graph.getIncomingEdges(truePlaceholder)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(truePlaceholder)).to.have.lengthOf(1);

    const bodyRepeat = cfg.graph.getOutgoingEdges(truePlaceholder)[0].target;
    expect(bodyRepeat).to.equal(constX);

    // false
    expect(cfg.graph.getOutgoingEdges(test)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const falsePlaceholder = cfg.graph.getOutgoingEdges(test)[1].target;

    expect(cfg.graph.getIncomingEdges(falsePlaceholder)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(falsePlaceholder)).to.have.lengthOf(1);

    const loopExit = cfg.graph.getOutgoingEdges(falsePlaceholder)[0].target;

    expect(cfg.graph.getIncomingEdges(loopExit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(loopExit)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(loopExit)[0].target;

    expect(cfg.graph.getIncomingEdges(constY)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constY)).to.have.lengthOf(1);

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

    expect(cfg.graph.nodes).to.have.lengthOf(10);
    expect(cfg.graph.edges).to.have.lengthOf(9);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const doWhileStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(doWhileStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)).to.have.lengthOf(1);

    const constX = cfg.graph.getOutgoingEdges(doWhileStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(constX)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(constX)).to.have.lengthOf(1);

    const test = cfg.graph.getOutgoingEdges(constX)[0].target;

    expect(cfg.graph.getIncomingEdges(test)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(test)).to.have.lengthOf(2);

    // true
    expect(cfg.graph.getOutgoingEdges(test)[0].type).to.equal(
      EdgeType.CONDITIONAL_TRUE
    );

    const truePlaceholder = cfg.graph.getOutgoingEdges(test)[0].target;

    expect(cfg.graph.getIncomingEdges(truePlaceholder)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(truePlaceholder)).to.have.lengthOf(1);

    const bodyRepeat = cfg.graph.getOutgoingEdges(truePlaceholder)[0].target;
    expect(bodyRepeat).to.equal(constX);

    // false
    expect(cfg.graph.getOutgoingEdges(test)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const falsePlaceholder = cfg.graph.getOutgoingEdges(test)[1].target;

    expect(cfg.graph.getIncomingEdges(falsePlaceholder)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(falsePlaceholder)).to.have.lengthOf(1);

    const loopExit = cfg.graph.getOutgoingEdges(falsePlaceholder)[0].target;

    expect(cfg.graph.getIncomingEdges(loopExit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(loopExit)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(loopExit)[0].target;

    expect(cfg.graph.getIncomingEdges(constY)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constY)).to.have.lengthOf(1);

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

    expect(cfg.graph.nodes).to.have.lengthOf(9);
    expect(cfg.graph.edges).to.have.lengthOf(8);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const doWhileStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(doWhileStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)).to.have.lengthOf(1);

    const constX = cfg.graph.getOutgoingEdges(doWhileStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(constX)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(constX)).to.have.lengthOf(1);

    const test = cfg.graph.getOutgoingEdges(constX)[0].target;

    expect(cfg.graph.getIncomingEdges(test)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(test)).to.have.lengthOf(2);

    // true
    expect(cfg.graph.getOutgoingEdges(test)[0].type).to.equal(
      EdgeType.CONDITIONAL_TRUE
    );

    const truePlaceholder = cfg.graph.getOutgoingEdges(test)[0].target;

    expect(cfg.graph.getIncomingEdges(truePlaceholder)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(truePlaceholder)).to.have.lengthOf(1);

    const bodyRepeat = cfg.graph.getOutgoingEdges(truePlaceholder)[0].target;
    expect(bodyRepeat).to.equal(constX);

    // false
    expect(cfg.graph.getOutgoingEdges(test)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const falsePlaceholder = cfg.graph.getOutgoingEdges(test)[1].target;

    expect(cfg.graph.getIncomingEdges(falsePlaceholder)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(falsePlaceholder)).to.have.lengthOf(1);

    const loopExit = cfg.graph.getOutgoingEdges(falsePlaceholder)[0].target;

    expect(cfg.graph.getIncomingEdges(loopExit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(loopExit)).to.have.lengthOf(1);

    const exit = cfg.graph.getOutgoingEdges(loopExit)[0].target;

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

    expect(cfg.graph.nodes).to.have.lengthOf(10);
    expect(cfg.graph.edges).to.have.lengthOf(9);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const doWhileStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(doWhileStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)).to.have.lengthOf(1);

    const continueStatement =
      cfg.graph.getOutgoingEdges(doWhileStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(continueStatement)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(continueStatement)).to.have.lengthOf(1);

    const test = cfg.graph.getOutgoingEdges(continueStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(test)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(test)).to.have.lengthOf(2);

    const truePlaceholderTest = cfg.graph.getOutgoingEdges(test)[0].target;

    expect(cfg.graph.getIncomingEdges(truePlaceholderTest)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(truePlaceholderTest)).to.have.lengthOf(1);

    const continueStatement_ =
      cfg.graph.getOutgoingEdges(truePlaceholderTest)[0].target;
    expect(continueStatement).to.equal(continueStatement_);

    const falsePlaceholderTest = cfg.graph.getOutgoingEdges(test)[1].target;

    expect(cfg.graph.getIncomingEdges(falsePlaceholderTest)).to.have.lengthOf(
      1
    );
    expect(cfg.graph.getOutgoingEdges(falsePlaceholderTest)).to.have.lengthOf(
      1
    );

    const loopExit = cfg.graph.getOutgoingEdges(falsePlaceholderTest)[0].target;

    expect(cfg.graph.getIncomingEdges(loopExit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(loopExit)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(loopExit)[0].target;

    expect(cfg.graph.getIncomingEdges(constY)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constY)).to.have.lengthOf(1);

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
    expect(cfg.graph.nodes).to.have.lengthOf(10);
    expect(cfg.graph.edges).to.have.lengthOf(9);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const whileStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(whileStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(whileStatement)).to.have.lengthOf(1);

    const breakStatement = cfg.graph.getOutgoingEdges(whileStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(breakStatement)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(breakStatement)).to.have.lengthOf(1);

    const truePlaceholder =
      cfg.graph.getIncomingEdges(breakStatement)[1].source;

    expect(cfg.graph.getIncomingEdges(truePlaceholder)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(truePlaceholder)).to.have.lengthOf(1);

    const test = cfg.graph.getIncomingEdges(truePlaceholder)[0].source;

    expect(cfg.graph.getIncomingEdges(test)).to.have.lengthOf(0); // dead code
    expect(cfg.graph.getOutgoingEdges(test)).to.have.lengthOf(2);

    const falsePlaceholder = cfg.graph.getOutgoingEdges(test)[1].target;

    expect(cfg.graph.getIncomingEdges(falsePlaceholder)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(falsePlaceholder)).to.have.lengthOf(1);

    const loopExit = cfg.graph.getOutgoingEdges(falsePlaceholder)[0].target;
    const loopExit_ = cfg.graph.getOutgoingEdges(breakStatement)[0].target;
    expect(loopExit).to.equal(loopExit_);

    expect(cfg.graph.getIncomingEdges(loopExit)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(loopExit)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(loopExit)[0].target;

    expect(cfg.graph.getIncomingEdges(constY)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constY)).to.have.lengthOf(1);

    const exit = cfg.graph.getOutgoingEdges(constY)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
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

    expect(cfg.graph.nodes).to.have.lengthOf(13);
    expect(cfg.graph.edges).to.have.lengthOf(13);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const doWhileStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(doWhileStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(doWhileStatement)).to.have.lengthOf(1);

    const doWhileBodyIfStatement =
      cfg.graph.getOutgoingEdges(doWhileStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(doWhileBodyIfStatement)).to.have.lengthOf(
      2
    );
    expect(cfg.graph.getOutgoingEdges(doWhileBodyIfStatement)).to.have.lengthOf(
      1
    );

    const test = cfg.graph.getOutgoingEdges(doWhileBodyIfStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(test)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(test)).to.have.lengthOf(2);

    // true
    expect(cfg.graph.getOutgoingEdges(test)[0].type).to.equal(
      EdgeType.CONDITIONAL_TRUE
    );
    const breakStatement = cfg.graph.getOutgoingEdges(test)[0].target;

    expect(cfg.graph.getIncomingEdges(breakStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(breakStatement)).to.have.lengthOf(1);

    // false
    expect(cfg.graph.getOutgoingEdges(test)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const placeHolderNode = cfg.graph.getOutgoingEdges(test)[1].target;

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
    const truePlaceholder =
      cfg.graph.getOutgoingEdges(whileStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(truePlaceholder)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(truePlaceholder)).to.have.lengthOf(1);

    const bodyRepeat = cfg.graph.getOutgoingEdges(truePlaceholder)[0].target;
    expect(bodyRepeat).to.equal(doWhileBodyIfStatement);

    // false while
    expect(cfg.graph.getOutgoingEdges(whileStatement)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const falsePlaceholder2 =
      cfg.graph.getOutgoingEdges(whileStatement)[1].target;

    expect(cfg.graph.getIncomingEdges(falsePlaceholder2)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(falsePlaceholder2)).to.have.lengthOf(1);

    const loopExit = cfg.graph.getOutgoingEdges(falsePlaceholder2)[0].target;

    expect(cfg.graph.getIncomingEdges(loopExit)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(loopExit)).to.have.lengthOf(1);

    const constYWhile = cfg.graph.getOutgoingEdges(loopExit)[0].target;

    expect(cfg.graph.getIncomingEdges(constYWhile)).to.have.lengthOf(1);
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
    expect(cfg.graph.nodes).to.have.lengthOf(9);
    expect(cfg.graph.edges).to.have.lengthOf(8);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const whileStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(whileStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(whileStatement)).to.have.lengthOf(1);

    const test = cfg.graph.getOutgoingEdges(whileStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(test)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(test)).to.have.lengthOf(2);

    // true
    expect(cfg.graph.getOutgoingEdges(test)[0].type).to.equal(
      EdgeType.CONDITIONAL_TRUE
    );
    const constX = cfg.graph.getOutgoingEdges(test)[0].target;

    expect(cfg.graph.getIncomingEdges(constX)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constX)).to.have.lengthOf(1);

    const backEdge = cfg.graph.getOutgoingEdges(constX)[0].target;

    expect(test).to.equal(backEdge);

    // false
    expect(cfg.graph.getOutgoingEdges(test)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const falsePlaceholder = cfg.graph.getOutgoingEdges(test)[1].target;

    const loopExit = cfg.graph.getOutgoingEdges(falsePlaceholder)[0].target;

    expect(cfg.graph.getIncomingEdges(loopExit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(loopExit)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(loopExit)[0].target;

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
    expect(cfg.graph.nodes).to.have.lengthOf(9);
    expect(cfg.graph.edges).to.have.lengthOf(8);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const whileStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(whileStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(whileStatement)).to.have.lengthOf(1);

    const test = cfg.graph.getOutgoingEdges(whileStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(test)).to.have.lengthOf(2);
    expect(cfg.graph.getOutgoingEdges(test)).to.have.lengthOf(2);

    // true
    expect(cfg.graph.getOutgoingEdges(test)[0].type).to.equal(
      EdgeType.CONDITIONAL_TRUE
    );
    const constX = cfg.graph.getOutgoingEdges(test)[0].target;

    expect(cfg.graph.getIncomingEdges(constX)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constX)).to.have.lengthOf(1);

    const backEdge = cfg.graph.getOutgoingEdges(constX)[0].target;

    expect(test).to.equal(backEdge);

    // false
    expect(cfg.graph.getOutgoingEdges(test)[1].type).to.equal(
      EdgeType.CONDITIONAL_FALSE
    );
    const falsePlaceholder = cfg.graph.getOutgoingEdges(test)[1].target;

    const loopExit = cfg.graph.getOutgoingEdges(falsePlaceholder)[0].target;

    expect(cfg.graph.getIncomingEdges(loopExit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(loopExit)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(loopExit)[0].target;

    expect(cfg.graph.getIncomingEdges(constY)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constY)).to.have.lengthOf(1);

    const exit = cfg.graph.getOutgoingEdges(constY)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(exit)).to.have.lengthOf(0);
  });

  it("for in loop", () => {
    const source = `
        for (let i in a) {
          const x = 1
        }
        const y = 1
      `;

    const cfg = cfgHelper(source);
    expect(cfg.graph.nodes).to.have.lengthOf(9);
    expect(cfg.graph.edges).to.have.lengthOf(8);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const forLoop = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(forLoop)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(forLoop)).to.have.lengthOf(1);

    const forTest = cfg.graph.getOutgoingEdges(forLoop)[0].target;

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

    const loopExit = cfg.graph.getOutgoingEdges(placeholder)[0].target;

    expect(cfg.graph.getIncomingEdges(loopExit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(loopExit)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(loopExit)[0].target;

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
    expect(cfg.graph.nodes).to.have.lengthOf(9);
    expect(cfg.graph.edges).to.have.lengthOf(8);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const forLoop = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(forLoop)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(forLoop)).to.have.lengthOf(1);

    const forTest = cfg.graph.getOutgoingEdges(forLoop)[0].target;

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

    const loopExit = cfg.graph.getOutgoingEdges(falseCase)[0].target;

    expect(cfg.graph.getIncomingEdges(loopExit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(loopExit)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(loopExit)[0].target;

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
    expect(cfg.graph.nodes).to.have.lengthOf(9);
    expect(cfg.graph.edges).to.have.lengthOf(8);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const forLoop = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(forLoop)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(forLoop)).to.have.lengthOf(1);

    const forTest = cfg.graph.getOutgoingEdges(forLoop)[0].target;

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

    const loopExit = cfg.graph.getOutgoingEdges(placeholder)[0].target;

    expect(cfg.graph.getIncomingEdges(loopExit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(loopExit)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(loopExit)[0].target;

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
    expect(cfg.graph.nodes).to.have.lengthOf(9);
    expect(cfg.graph.edges).to.have.lengthOf(8);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const forLoop = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(forLoop)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(forLoop)).to.have.lengthOf(1);

    const forTest = cfg.graph.getOutgoingEdges(forLoop)[0].target;

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

    const loopExit = cfg.graph.getOutgoingEdges(falseCase)[0].target;

    expect(cfg.graph.getIncomingEdges(loopExit)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(loopExit)).to.have.lengthOf(1);

    const constY = cfg.graph.getOutgoingEdges(loopExit)[0].target;

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
      case 3:         // 207:214 // placeholder-149:156
      case 4: {       // 265:336
        break         // 302:307
      }               // 
      default:        // 363:406
        break;        // 400:406
    }                 //
      `;

    const cfg = cfgHelper(source);
    expect(cfg.graph.nodes).to.have.lengthOf(22);
    expect(cfg.graph.edges).to.have.lengthOf(24);

    expect(cfg.graph.getIncomingEdges("ENTRY")).to.have.lengthOf(0);
    expect(cfg.graph.getOutgoingEdges("ENTRY")).to.have.lengthOf(1);

    const switchStatement = cfg.graph.getOutgoingEdges("ENTRY")[0].target;

    expect(cfg.graph.getIncomingEdges(switchStatement)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(switchStatement)).to.have.lengthOf(1);

    const test = cfg.graph.getOutgoingEdges(switchStatement)[0].target;

    expect(cfg.graph.getIncomingEdges(test)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(test)).to.have.lengthOf(1);

    // case 1
    const case1 = cfg.graph.getOutgoingEdges(test)[0].target;

    expect(cfg.graph.getIncomingEdges(case1)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(case1)).to.have.lengthOf(2);

    // true case 1
    const trueCase1 = cfg.graph.getOutgoingEdges(case1)[0].target;

    expect(cfg.graph.getIncomingEdges(trueCase1)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(trueCase1)).to.have.lengthOf(1);

    const constX = cfg.graph.getOutgoingEdges(trueCase1)[0].target;

    expect(cfg.graph.getIncomingEdges(constX)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(constX)).to.have.lengthOf(1);

    const breakStatementCase1 = cfg.graph.getOutgoingEdges(constX)[0].target;

    expect(cfg.graph.getIncomingEdges(breakStatementCase1)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(breakStatementCase1)).to.have.lengthOf(1);

    // false case 1
    const falseCase1 = cfg.graph.getOutgoingEdges(case1)[1].target;

    expect(cfg.graph.getIncomingEdges(falseCase1)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(falseCase1)).to.have.lengthOf(1);

    // case 2
    const case2 = cfg.graph.getOutgoingEdges(falseCase1)[0].target;

    expect(cfg.graph.getIncomingEdges(case2)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(case2)).to.have.lengthOf(2);

    // true case 2
    const trueCase2 = cfg.graph.getOutgoingEdges(case2)[0].target;

    expect(cfg.graph.getIncomingEdges(trueCase2)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(trueCase2)).to.have.lengthOf(1);

    // false case 2
    const falseCase2 = cfg.graph.getOutgoingEdges(case2)[1].target;

    expect(cfg.graph.getIncomingEdges(falseCase2)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(falseCase2)).to.have.lengthOf(1);

    // case 3
    const case3 = cfg.graph.getOutgoingEdges(falseCase2)[0].target;

    expect(cfg.graph.getIncomingEdges(case3)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(case3)).to.have.lengthOf(2);

    // true case 3
    const trueCase3 = cfg.graph.getOutgoingEdges(case3)[0].target;

    expect(cfg.graph.getIncomingEdges(trueCase3)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(trueCase3)).to.have.lengthOf(1);

    // false case 3
    const falseCase3 = cfg.graph.getOutgoingEdges(case3)[1].target;

    expect(cfg.graph.getIncomingEdges(falseCase3)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(falseCase3)).to.have.lengthOf(1);

    // case 4
    const case4 = cfg.graph.getOutgoingEdges(falseCase3)[0].target;

    expect(cfg.graph.getIncomingEdges(case4)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(case4)).to.have.lengthOf(2);

    // true case 4
    const trueCase4 = cfg.graph.getOutgoingEdges(case4)[0].target;

    expect(cfg.graph.getIncomingEdges(trueCase4)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(trueCase4)).to.have.lengthOf(1);

    const breakCase4 = cfg.graph.getOutgoingEdges(trueCase4)[0].target;
    const breakCase4_ = cfg.graph.getOutgoingEdges(trueCase3)[0].target;
    const breakCase4__ = cfg.graph.getOutgoingEdges(trueCase2)[0].target;

    expect(breakCase4).to.equal(breakCase4_);
    expect(breakCase4).to.equal(breakCase4__);
    expect(cfg.graph.getIncomingEdges(breakCase4)).to.have.lengthOf(3);
    expect(cfg.graph.getOutgoingEdges(breakCase4)).to.have.lengthOf(1);

    // false case 4
    const falseCase4 = cfg.graph.getOutgoingEdges(case4)[1].target;

    expect(cfg.graph.getIncomingEdges(falseCase4)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(falseCase4)).to.have.lengthOf(1);

    // default case
    const defaultCase = cfg.graph.getOutgoingEdges(falseCase4)[0].target;

    expect(cfg.graph.getIncomingEdges(defaultCase)).to.have.lengthOf(1);
    expect(cfg.graph.getOutgoingEdges(defaultCase)).to.have.lengthOf(1);

    const switchExit = cfg.graph.getOutgoingEdges(defaultCase)[0].target;

    expect(cfg.graph.getIncomingEdges(switchExit)).to.have.lengthOf(3);
    expect(cfg.graph.getOutgoingEdges(switchExit)).to.have.lengthOf(1);

    const switchExit_ = cfg.graph.getOutgoingEdges(breakCase4)[0].target;
    const switchExit__ =
      cfg.graph.getOutgoingEdges(breakStatementCase1)[0].target;

    expect(switchExit).to.equal(switchExit_);
    expect(switchExit).to.equal(switchExit__);

    const exit = cfg.graph.getOutgoingEdges(switchExit)[0].target;

    expect(exit).to.equal("SUCCESS_EXIT");
    expect(cfg.graph.getIncomingEdges(exit)).to.have.lengthOf(1);
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

    const result = contractControlFlowProgram(cfgHelper(source));

    if (isFailure(result)) throw result.error;

    const cfg = unwrap(result);

    expect(cfg.functions);
  });

  it("function short arrow", () => {
    const source = `const at = (object, ...paths) => baseAt(object, baseFlatten(paths, 1))
export default at
      `;

    const result = contractControlFlowProgram(cfgHelper(source));

    if (isFailure(result)) throw result.error;

    const cfg = unwrap(result);

    expect(cfg.functions);
  });
});
