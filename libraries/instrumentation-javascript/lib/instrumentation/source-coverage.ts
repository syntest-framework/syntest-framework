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
import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { ImplementationError } from "@syntest/diagnostics";
const { classes } = require("istanbul-lib-coverage");

/**
 * SourceCoverage provides mutation methods to manipulate the structure of
 * a file coverage object. Used by the instrumenter to create a full coverage
 * object for a file incrementally.
 *
 * @private
 * @param pathOrObj {String|Object} - see the argument for {@link FileCoverage}
 * @extends FileCoverage
 * @constructor
 */
export class SourceCoverage extends classes.FileCoverage {
  private meta: any;
  private data: any;
  private _filePath: string;
  constructor(pathOrObj) {
    super(pathOrObj);
    this._filePath = pathOrObj;
    this.meta = {
      last: {
        s: 0,
        f: 0,
        b: 0,
      },
    };
  }

  public _getNodeId(loc): string {
    if (loc === undefined) {
      throw new ImplementationError(
        `Node * in file '${this._filePath}' does not have a location`
      );
    }

    const startLine = (<{ line: number }>(<unknown>loc.start)).line;
    const startColumn = (<{ column: number }>(<unknown>loc.start)).column;
    const startIndex = (<{ index: number }>(<unknown>loc.start)).index;
    const endLine = (<{ line: number }>(<unknown>loc.end)).line;
    const endColumn = (<{ column: number }>(<unknown>loc.end)).column;
    const endIndex = (<{ index: number }>(<unknown>loc.end)).index;

    return `${this._filePath}:${startLine}:${startColumn}:::${endLine}:${endColumn}:::${startIndex}:${endIndex}`;
  }

  public _getPlaceholderNodeId(loc): string {
    if (loc === undefined) {
      throw new ImplementationError(
        `Node * in file '${this._filePath}' does not have a location`
      );
    }

    const startLine = (<{ line: number }>(<unknown>loc.start)).line;
    const startColumn = (<{ column: number }>(<unknown>loc.start)).column;
    const startIndex = (<{ index: number }>(<unknown>loc.start)).index;
    const endLine = (<{ line: number }>(<unknown>loc.end)).line;
    const endColumn = (<{ column: number }>(<unknown>loc.end)).column;
    const endIndex = (<{ index: number }>(<unknown>loc.end)).index;

    return `${this._filePath}:${startLine}:${startColumn}:::${endLine}:${endColumn}:::${startIndex}:${endIndex}`;
  }

  _cloneLocation(loc) {
    return {
      id: loc && this._getNodeId(loc),
      start: {
        line: loc && loc.start.line,
        column: loc && loc.start.column,
        index: loc && loc.start.index,
      },
      end: {
        line: loc && loc.end.line,
        column: loc && loc.end.column,
        index: loc && loc.end.index,
      },
    };
  }

  newStatement(loc, placeholder = false, double = false) {
    const s = this.meta.last.s;

    if (placeholder) {
      const clone = this._cloneLocation({
        start: loc.end,
        end: loc.end,
      });
      let id = this._getPlaceholderNodeId(loc);
      if (double) {
        id = "placeholder:::" + id;
      }
      clone.id = `placeholder:::${id}`;
      this.data.statementMap[s] = clone;
      this.data.s[s] = 0;
      this.meta.last.s += 1;
    } else {
      this.data.statementMap[s] = this._cloneLocation(loc);
      this.data.s[s] = 0;
      this.meta.last.s += 1;
    }

    return s;
  }

  newFunction(name, decl, loc) {
    const f = this.meta.last.f;
    name = name || "(anonymous_" + f + ")";
    this.data.fnMap[f] = {
      name,
      decl: this._cloneLocation(decl),
      loc: this._cloneLocation(loc),
      // DEPRECATED: some legacy reports require this info.
      line: loc && loc.start.line,
    };
    this.data.f[f] = 0;
    this.meta.last.f += 1;
    return f;
  }

  newBranch(type, loc, isReportLogic = false) {
    const b = this.meta.last.b;
    this.data.b[b] = [];
    this.data.branchMap[b] = {
      loc: this._cloneLocation(loc),
      type,
      locations: [],
      // DEPRECATED: some legacy reports require this info.
      line: loc && loc.start.line,
    };
    this.meta.last.b += 1;
    this.maybeNewBranchTrue(type, b, isReportLogic);
    return b;
  }

  maybeNewBranchTrue(type, name, isReportLogic) {
    if (!isReportLogic) {
      return;
    }
    if (type !== "binary-expr") {
      return;
    }
    this.data.bT = this.data.bT || {};
    this.data.bT[name] = [];
  }

  addBranchPath(ifPath: NodePath<t.Node>, name, location) {
    const bMeta = this.data.branchMap[name];
    const counts = this.data.b[name];

    /* istanbul ignore if: paranoid check */
    if (!bMeta) {
      throw new ImplementationError(
        "Invalid branch " + name + `${this._getNodeId(ifPath.node.loc)}`
      );
    }
    if (location !== undefined) {
      bMeta.locations.push(this._cloneLocation(location));
    } else {
      const clone = this._cloneLocation({
        start: ifPath.node.loc.end,
        end: ifPath.node.loc.end,
      });
      const id = this._getPlaceholderNodeId(ifPath.node.loc);
      clone.id = `placeholder:::${id}`;
      bMeta.locations.push(clone);
    }
    counts.push(0);
    this.maybeAddBranchTrue(name);
    return counts.length - 1;
  }

  maybeAddBranchTrue(name) {
    if (!this.data.bT) {
      return;
    }
    const countsTrue = this.data.bT[name];
    if (!countsTrue) {
      return;
    }
    countsTrue.push(0);
  }

  /**
   * Assigns an input source map to the coverage that can be used
   * to remap the coverage output to the original source
   * @param sourceMap {object} the source map
   */
  inputSourceMap(sourceMap) {
    this.data.inputSourceMap = sourceMap;
  }

  freeze() {
    // prune empty branches
    const map = this.data.branchMap;
    const branches = this.data.b;
    const branchesT = this.data.bT || {};
    Object.keys(map).forEach((b) => {
      if (map[b].locations.length === 0) {
        delete map[b];
        delete branches[b];
        delete branchesT[b];
      }
    });
  }
}
