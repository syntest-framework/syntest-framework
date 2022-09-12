/*
 * Copyright 2020-2022 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest JavaScript.
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


import { Visitor } from "../Visitor";
import {
  BranchNode,
  CFG,
  Node,
  NodeType,
  Operation,
  PlaceholderNode,
  RootNode,
} from "../../../../../syntest-framework";

export class CFGVisitor extends Visitor {

  private cfg: CFG;

  private currentParents: Node[]

  private breakNodes: Node[];

  private branchStack: BranchNode[]

  constructor(filePath: string) {
    super(filePath)
    this.cfg = new CFG();
  }

  FunctionDeclaration = {
    enter: (path) => {

    },
    exit: (path) => {

    }
  }

  IfStatement = {
    enter: (path) => {
      const node: BranchNode = this._createBranchNode(
        [path.node.loc.start.line],
        [],
        {
          type: path.node.test.type,
          operator: path.node.test.operator,
        }
      );

      this._connectParents(this.currentParents, [node])
      this.currentParents = [node]
      path.get('consequent').traverse()
    },
    exit: (path) => {
      // checks?

    }
  }

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
      description: description
    };

    this.cfg.nodes.push(node);

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

    this.cfg.nodes.push(node);

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

    this.cfg.nodes.push(node);

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

    this.cfg.nodes.push(node);

    return node;
  }

  _connectParents(parents: Node[], children: Node[]) {
    for (const parent of parents) {
      for (const child of children) {
        this.cfg.edges.push({
          from: parent.id,
          to: child.id,
        });
      }
    }
  }

}


