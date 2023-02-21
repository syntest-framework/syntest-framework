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

import {
  BranchNode,
  CFG,
  Node,
  NodeType,
  Operation,
  PlaceholderNode,
  RootNode,
} from "@syntest/cfg-core";

export class ControlFlowGraphVisitor {
  private _cfg: CFG;

  // private _nodeStack: Node[][]
  //
  // private _level = -1

  private _lastVisitedNode: Node;

  private _trackingLeaves: Node[];
  private _firstExit: boolean;
  private _connectToNext: boolean;

  private _nodeStack: Node[];

  constructor() {
    this._cfg = new CFG();

    this._trackingLeaves = [];
    this._firstExit = true;
    this._connectToNext = false;
    this._nodeStack = [];
  }

  private _ignore = new Set([
    "Program",
    "BooleanLiteral",
    // 'BlockStatement',
    // 'VariableDeclaration',
    "VariableDeclarator",
    "Identifier",
    "NumericLiteral",

    "BinaryExpression",
    "UpdateExpression",
    "NumericLiteral",

    // 'BlockStatement'
  ]);

  enter = (path) => {
    if (this._ignore.has(path.node.type)) {
      // console.log('ignore', path.node.type)
      return;
    }
    console.log("enter", path.node.type);

    const node: Node = this._getNode(path);

    let isConnected = false;

    if (this._connectToNext) {
      // connect tracking leaves to new child
      this._connectParents(this._trackingLeaves, [node]);
      // empty tracking leaves
      this._trackingLeaves.length = 0;
      isConnected = true;
    }

    const parentPath = path.parentPath;

    if (!isConnected && parentPath) {
      if (
        [
          "IfStatement",
          "WhileStatement",
          "ForStatement",
          "SwitchStatement",
        ].includes(parentPath.node.type)
      ) {
        // connect to parent branch node
        const parent: Node = this._nodeStack[this._nodeStack.length - 1];

        this._connectParents([parent], [node]);
        isConnected = true;
      } else if (
        parentPath.node.type === "BlockStatement" &&
        parentPath.get("body.0") === path
      ) {
        // if it is the first in the block statement we should connect it to the blockstatement node
        const parent: Node = this._nodeStack[this._nodeStack.length - 1];

        this._connectParents([parent], [node]);
        isConnected = true;
      }
    }

    if (!isConnected && this._lastVisitedNode) {
      // connect to last visited node
      this._connectParents([this._lastVisitedNode], [node]);
      isConnected = true;
    }

    // reset first exit
    this._firstExit = true;
    this._nodeStack.push(node);
  };

  exit = (path) => {
    if (this._ignore.has(path.node.type)) {
      return;
    }
    console.log("exit", path.node.type);

    const node = this._nodeStack.pop();
    // deepest point
    if (this._firstExit) {
      // TODO check if return/break/continue

      const parentPath = path.parentPath;
      // should only be added if there is no next node in the block statement
      if (
        parentPath.node.type === "BlockStatement" &&
        !(
          parentPath.get("body." + (parentPath.get("body").length - 1)) === path
        )
      ) {
        // pass
      } else {
        this._trackingLeaves.push(node);
      }
    }

    if (path.node.type === "IfStatement") {
      this._connectToNext = true;

      if (!path.has("alternate")) {
        // false node missing
        const falseNode: Node = this._createPlaceholderNode(
          [path.node.loc.end.line],
          []
        );

        this._trackingLeaves.push(falseNode);

        this._connectParents([node], [falseNode]);
      }
    } else if (
      path.node.type === "WhileStatement" ||
      path.node.type === "ForStatement"
    ) {
      this._connectToNext = true;

      // false node missing
      const falseNode: Node = this._createPlaceholderNode(
        [path.node.loc.end.line],
        []
      );

      // TODO intercept continue nodes

      // connect trackingleaves to while node
      this._connectParents(this._trackingLeaves, [node]);

      this._trackingLeaves = [falseNode];

      this._connectParents([node], [falseNode]);
    }

    this._lastVisitedNode = node;
    this._firstExit = false;
  };

  // enter = (path) => {
  //   if (this._ignore.has(path.node.type)) {
  //     // console.log('ignore', path.node.type)
  //     return
  //   }
  //
  //   const node: Node = this._getNode(path)
  //
  //   const parentPath = path.parentPath
  //
  //   if (!parentPath) {
  //     // nothing
  //   } else if (parentPath.node.type === 'IfStatement') {
  //     // connect to parent branch node
  //     const parent: Node = this._parentStack[this._parentStack.length - 1]
  //
  //     this._connectParents([parent], [node])
  //
  //   } else if (this._lastVisitedNode) {
  //     // connect to last visited node
  //     this._connectParents([this._lastVisitedNode], [node])
  //   }
  //
  //   console.log('enter', path.node.type)
  //   this._parentStack.push(node)
  //   this._lastVisitedNode = node
  // }
  // exit = (path) => {
  //   if (this._ignore.has(path.node.type)) {
  //     return
  //   }
  //
  //   console.log('exit', path.node.type)
  //   const node = this._parentStack.pop()
  //
  //   if (path.node.type === 'IfStatement') {
  //     if (!path.has('alternate')) {
  //       // false node missing
  //       const falseNode: Node = this._createPlaceholderNode(
  //         [path.node.loc.end.line],
  //         []
  //       );
  //
  //       this._connectParents(
  //         [node],
  //         [falseNode]
  //       )
  //     }
  //   }
  //
  //
  // }

  _getNode(path): Node {
    if (
      ["IfStatement", "WhileStatement", "ForStatement"].includes(path.node.type)
    ) {
      return this._createBranchNode([path.node.loc.start.line], [], {
        type: path.node.test.type,
        operator: path.get("test").getSource(),
      });
    } else if (path.node.type === "SwitchStatement") {
      return this._createBranchNode([path.node.loc.start.line], [], {
        type: "Switch",
        operator: "==",
      });
    }

    // TODO

    return this._createNode([path.node.loc.start.line], []);
  }

  // enter = (path) => {
  //   if (!(path.node.type in this)) {
  //     console.log('skip', path.node.type, this._level)
  //
  //     return
  //   }
  //   if (this._ignore.has(path.node.type)) {
  //     console.log('ignore', path.node.type, this._level)
  //
  //     return
  //   }
  //
  //   this._level += 1
  //   console.log('enter', path.node.type, this._level)
  //
  //   // check if exists?
  //   if (this._nodeStack[this._level]) {
  //     return
  //   }
  //   this._nodeStack.push([])
  // }
  //
  // exit = (path) => {
  //   if (!(path.node.type in this)) {
  //     return
  //   }
  //   if (this._ignore.has(path.node.type)) {
  //     return
  //   }
  //   console.log('exit', path.node.type, this._level)
  //
  //   const parents = this._nodeStack[this._level]
  //   const children = this._nodeStack[this._level + 1]
  //   this._connectParents(parents, children)
  //
  //   this._level -= 1
  // }
  //
  // FunctionDeclaration = {
  //   enter: (path) => {
  //     const node: RootNode = this._createRootNode(
  //       [path.node.loc.start.line],
  //       [],
  //       path.node.id.name
  //     );
  //     this._nodeStack[this._level].push(node)
  //
  //   },
  //   exit: (path) => {
  //
  //   }
  // }
  //
  // BlockStatement = {
  //   enter: (path) => {
  //     const blockNode: Node = this._createPlaceholderNode(
  //       [path.node.loc.start.line],
  //       []
  //     );
  //     this._nodeStack[this._level].push(blockNode)
  //
  //   },
  //   exit: (path) => {
  //
  //   }
  // }
  //
  // IfStatement = {
  //   enter: (path) => {
  //     const node: BranchNode = this._createBranchNode(
  //       [path.node.loc.start.line],
  //       [],
  //       {
  //         type: path.node.test.type,
  //         operator: path.node.test.operator,
  //       }
  //     );
  //
  //     this._nodeStack[this._level].push(node)
  //   },
  //   exit: (path) => {
  //     const parents = this._nodeStack[this._level + 1]
  //     const children = this._nodeStack[this._level + 2]
  //
  //     if (children.length === 1) {
  //       // false node missing
  //       const falseNode: Node = this._createPlaceholderNode(
  //         [path.node.loc.end.line],
  //         []
  //       );
  //
  //       this._connectParents(
  //         parents,
  //         [falseNode]
  //       )
  //     }
  //
  //     // remove stacks above
  //     console.log(this._nodeStack)
  //     this._nodeStack.splice(this._level + 2)
  //     console.log(this._nodeStack)
  //
  //   }
  // }
  //
  // ReturnStatement = {
  //   enter: (path) => {
  //     const node: Node = this._createNode(
  //       [path.node.loc.start.line],
  //       []
  //     );
  //
  //     this._nodeStack[this._level].push(node)
  //   },
  //   exit: (path) => {
  //   }
  // }
  //
  // VariableDeclaration = {
  //   enter: (path) => {
  //     const node: Node = this._createNode(
  //       [path.node.loc.start.line],
  //       []
  //     );
  //
  //     this._nodeStack[this._level].push(node)
  //   },
  //   exit: (path) => {
  //
  //   }
  // }

  _createRootNode(
    lines: number[],
    statements: string[],
    description?: string
  ): RootNode {
    const node: RootNode = {
      id: `f-${lines[0]}`,
      lines: lines,
      statements: statements,
      type: NodeType.Root,
      description: description,
    };

    this._cfg.nodes.push(node);

    return node;
  }

  /**
   * This method creates a new node in the cfg
   * @param lines
   * @param statements
   * @param branch whether this nodes is a branching node (i.e. multiple outgoing edges)
   * @param probe
   * @param condition if it is a branch node this is the condition to branch on
   * @param placeholder
   * @private
   */
  _createNode(lines: number[], statements: string[]): Node {
    const node: Node = {
      type: NodeType.Intermediary,
      id: `s-${lines[0]}`,
      lines: lines,
      statements: statements,
    };

    this._cfg.nodes.push(node);

    return node;
  }

  _createPlaceholderNode(
    lines: number[],
    statements: string[]
  ): PlaceholderNode {
    const node: PlaceholderNode = {
      type: NodeType.Placeholder,
      id: `s-${lines[0]}`,
      lines: lines,
      statements: statements,
    };

    this._cfg.nodes.push(node);

    return node;
  }

  _createBranchNode(
    lines: number[],
    statements: string[],
    condition: Operation
  ): BranchNode {
    const node: BranchNode = {
      condition: condition,
      id: `b-${lines[0]}`,
      lines: lines,
      statements: statements,
      type: NodeType.Branch,
      probe: false,
    };

    this._cfg.nodes.push(node);

    return node;
  }

  _connectParents(parents: Node[], children: Node[]) {
    if (children === undefined) {
      return;
    }
    for (const parent of parents) {
      for (const child of children) {
        this._cfg.edges.push({
          from: parent.id,
          to: child.id,
        });
      }
    }
  }

  get cfg(): CFG {
    return this._cfg;
  }
}
