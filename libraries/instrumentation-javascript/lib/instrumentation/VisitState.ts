/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Javascript.
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

import { createHash } from "crypto";

import { SourceCoverage } from "./source-coverage";

const SHA = "sha1";

// pattern for istanbul to ignore a section
const COMMENT_RE = /^\s*istanbul\s+ignore\s+(if|else|next)(?=\W|$)/;
// source map URL pattern
const SOURCE_MAP_RE = /[#@]\s*sourceMappingURL=(.*)\s*$/m;

// generate a variable name from hashing the supplied file path
function genVar(filename) {
  const hash = createHash(SHA);
  hash.update(filename);
  return "cov_" + parseInt(hash.digest("hex").substr(0, 12), 16).toString(36);
}

// VisitState holds the state of the visitor, provides helper functions
// and is the `this` for the individual coverage visitors.
export class VisitState {
  public varName: string;
  public metaVarName: string;
  public attrs: any;
  public nextIgnore: any;
  public cov: any;

  public ignoreClassMethods: any;
  public types: any;
  public sourceMappingURL: any;
  public reportLogic: any;

  constructor(
    types,
    sourceFilePath,
    inputSourceMap,
    ignoreClassMethods = [],
    reportLogic = false
  ) {
    this.varName = genVar(sourceFilePath);
    this.metaVarName = this.varName.replace("cov_", "meta_");
    this.attrs = {};
    this.nextIgnore = null;
    this.cov = new SourceCoverage(sourceFilePath);

    if (typeof inputSourceMap !== "undefined") {
      this.cov.inputSourceMap(inputSourceMap);
    }
    this.ignoreClassMethods = ignoreClassMethods;
    this.types = types;
    this.sourceMappingURL = null;
    this.reportLogic = reportLogic;
  }

  // should we ignore the node? Yes, if specifically ignoring
  // or if the node is generated.
  shouldIgnore(path) {
    return this.nextIgnore || !path.node.loc;
  }

  // extract the ignore comment hint (next|if|else) or null
  hintFor(node) {
    let hint = null;
    if (node.leadingComments) {
      node.leadingComments.forEach((c) => {
        const v = (
          c.value || /* istanbul ignore next: paranoid check */ ""
        ).trim();
        const groups = v.match(COMMENT_RE);
        if (groups) {
          hint = groups[1];
        }
      });
    }
    return hint;
  }

  // extract a source map URL from comments and keep track of it
  maybeAssignSourceMapURL(node) {
    const extractURL = (comments) => {
      if (!comments) {
        return;
      }
      comments.forEach((c) => {
        const v = (
          c.value || /* istanbul ignore next: paranoid check */ ""
        ).trim();
        const groups = v.match(SOURCE_MAP_RE);
        if (groups) {
          this.sourceMappingURL = groups[1];
        }
      });
    };
    extractURL(node.leadingComments);
    extractURL(node.trailingComments);
  }

  // for these expressions the statement counter needs to be hoisted, so
  // function name inference can be preserved
  counterNeedsHoisting(path) {
    return (
      path.isFunctionExpression() ||
      path.isArrowFunctionExpression() ||
      path.isClassExpression()
    );
  }

  // all the generic stuff that needs to be done on enter for every node
  onEnter(path) {
    const n = path.node;

    this.maybeAssignSourceMapURL(n);

    // if already ignoring, nothing more to do
    if (this.nextIgnore !== null) {
      return;
    }
    // check hint to see if ignore should be turned on
    const hint = this.hintFor(n);
    if (hint === "next") {
      this.nextIgnore = n;
      return;
    }
    // else check custom node attribute set by a prior visitor
    if (this.getAttr(path.node, "skip-all") !== null) {
      this.nextIgnore = n;
    }

    // else check for ignored class methods
    if (
      path.isFunctionExpression() &&
      this.ignoreClassMethods.some(
        (name) => path.node.id && name === path.node.id.name
      )
    ) {
      this.nextIgnore = n;
      return;
    }
    if (
      path.isClassMethod() &&
      this.ignoreClassMethods.some((name) => name === path.node.key.name)
    ) {
      this.nextIgnore = n;
      return;
    }
  }

  // all the generic stuff on exit of a node,
  // including reseting ignores and custom node attrs
  onExit(path) {
    // restore ignore status, if needed
    if (path.node === this.nextIgnore) {
      this.nextIgnore = null;
    }
    // nuke all attributes for the node
    delete path.node.__cov__;
  }

  // set a node attribute for the supplied node
  setAttr(node, name, value) {
    node.__cov__ = node.__cov__ || {};
    node.__cov__[name] = value;
  }

  // retrieve a node attribute for the supplied node or null
  getAttr(node, name) {
    const c = node.__cov__;
    if (!c) {
      return null;
    }
    return c[name];
  }

  //
  increase(type, id, index) {
    const T = this.types;
    const wrap =
      index !== null
        ? // If `index` present, turn `x` into `x[index]`.
          (x) => T.memberExpression(x, T.numericLiteral(index), true)
        : (x) => x;
    return T.updateExpression(
      "++",
      wrap(
        T.memberExpression(
          T.memberExpression(
            T.callExpression(T.identifier(this.varName), []),
            T.identifier(type)
          ),
          T.numericLiteral(id),
          true
        )
      )
    );
  }

  // Reads the logic expression conditions and conditionally increments truthy counter.
  increaseTrue(type, id, index, node) {
    const T = this.types;
    const tempName = `${this.varName}_temp`;

    return T.sequenceExpression([
      T.assignmentExpression(
        "=",
        T.memberExpression(
          T.callExpression(T.identifier(this.varName), []),
          T.identifier(tempName)
        ),
        node // Only evaluates once.
      ),
      T.parenthesizedExpression(
        T.conditionalExpression(
          T.memberExpression(
            T.callExpression(T.identifier(this.varName), []),
            T.identifier(tempName)
          ),
          this.increase(type, id, index),
          T.nullLiteral()
        )
      ),
      T.memberExpression(
        T.callExpression(T.identifier(this.varName), []),
        T.identifier(tempName)
      ),
    ]);
  }

  insertCounter(path, increment) {
    const T = this.types;
    if (path.isBlockStatement()) {
      path.node.body.unshift(T.expressionStatement(increment));
    } else if (path.isStatement()) {
      path.insertBefore(T.expressionStatement(increment));
    } else if (
      this.counterNeedsHoisting(path) &&
      T.isVariableDeclarator(path.parentPath)
    ) {
      // make an attempt to hoist the statement counter, so that
      // function names are maintained.
      const parent = path.parentPath.parentPath;
      if (parent && T.isExportNamedDeclaration(parent.parentPath)) {
        parent.parentPath.insertBefore(T.expressionStatement(increment));
      } else if (
        parent &&
        (T.isProgram(parent.parentPath) ||
          T.isBlockStatement(parent.parentPath))
      ) {
        parent.insertBefore(T.expressionStatement(increment));
      } else {
        path.replaceWith(T.sequenceExpression([increment, path.node]));
      }
    } /* istanbul ignore else: not expected */ else if (path.isExpression()) {
      path.replaceWith(T.sequenceExpression([increment, path.node]));
    } else {
      console.error(
        "Unable to insert counter for node identifierDescription:",
        path.node.type
      );
    }
  }

  insertStatementCounter(path) {
    /* istanbul ignore if: paranoid check */
    if (!(path.node && path.node.loc)) {
      if (
        path.parentPath &&
        path.parentPath.parentPath &&
        path.parentPath.parentPath.isVariableDeclaration()
      ) {
        // stupid hack to make sure the traces match with the cfg
        // this one is for when init is empty in the variable declarator
        const index = this.cov.newStatement(
          path.parentPath.parentPath.node.loc
        );
        const increment = this.increase("s", index, null);
        this.insertCounter(path.parentPath.parentPath, increment);
      }
      return;
    }
    if (
      path.parentPath &&
      path.parentPath.parentPath &&
      path.parentPath.parentPath.isVariableDeclaration()
    ) {
      // stupid hack to make sure the traces match with the cfg
      const index = this.cov.newStatement(path.parentPath.parentPath.node.loc);
      const increment = this.increase("s", index, null);
      this.insertCounter(path.parentPath.parentPath, increment);
    }

    const index = this.cov.newStatement(path.node.loc);
    const increment = this.increase("s", index, null);
    this.insertCounter(path, increment);
  }

  insertFunctionCounter(path) {
    const T = this.types;
    /* istanbul ignore if: paranoid check */
    if (!(path.node && path.node.loc)) {
      return;
    }
    const n = path.node;

    let dloc = null;
    // get location for declaration
    // switch (n.type) {
    //   case "FunctionDeclaration":
    //   case "FunctionExpression":
    //     /* istanbul ignore else: paranoid check */
    //     if (n.id) {
    //       dloc = n.id.loc;
    //     }
    //     break;
    // }
    if (!dloc) {
      dloc = {
        start: n.loc.start,
        end: n.loc.end, // idk why it was this way since this seems to work too { line: n.loc.start.line, column: n.loc.start.column + 1 },
      };
    }

    const name = n.id ? n.id.name : n.name;
    const index = this.cov.newFunction(name, dloc, n.body.loc);
    const increment = this.increase("f", index, null);
    const body = path.get("body");
    /* istanbul ignore else: not expected */
    if (body.isBlockStatement()) {
      body.node.body.unshift(T.expressionStatement(increment));
    } else {
      console.error(
        "Unable to process function body node identifierDescription:",
        path.node.type
      );
    }
  }

  getBranchIncrement(ifPath, branchName, loc) {
    const index = this.cov.addBranchPath(ifPath, branchName, loc);
    return this.increase("b", branchName, index);
  }

  getBranchMetaTracker(
    branchName: string,
    testAsCode: string,
    variables: string[]
  ) {
    const T = this.types;

    const metaTracker = T.callExpression(T.identifier(this.metaVarName), [
      T.stringLiteral(`${branchName}`),
      T.objectExpression([
        T.objectProperty(
          T.stringLiteral("condition_ast"),
          T.stringLiteral("TODO we should remove the condition asts entirely")
        ),
        T.objectProperty(
          T.stringLiteral("condition"),
          T.stringLiteral(testAsCode)
        ),
        T.ObjectProperty(
          T.stringLiteral("variables"),
          T.ObjectExpression([
            ...variables
              .filter((v, i, a) => a.indexOf(v) === i) // remove duplicates
              .map(([source, identifier]) => {
                return T.objectProperty(
                  T.stringLiteral(source),
                  T.identifier(identifier)
                );
              }),
          ])
        ),
      ]),
    ]);

    return metaTracker;
  }

  getBranchLogicIncrement(path, branchName, loc) {
    const index = this.cov.addBranchPath(branchName, loc);
    return [
      this.increase("b", branchName, index),
      this.increaseTrue("bT", branchName, index, path.node),
    ];
  }

  insertBranchCounter(ifPath, path, branchName, placeholder = false) {
    const increment = this.getBranchIncrement(
      ifPath,
      branchName,
      placeholder ? undefined : path.node.loc
    );

    this.insertCounter(path, increment);
  }

  findLeaves(node, accumulator, parent, property) {
    if (!node) {
      return;
    }
    if (node.type === "LogicalExpression") {
      const hint = this.hintFor(node);
      if (hint !== "next") {
        this.findLeaves(node.left, accumulator, node, "left");
        this.findLeaves(node.right, accumulator, node, "right");
      }
    } else {
      accumulator.push({
        node,
        parent,
        property,
      });
    }
  }
}
