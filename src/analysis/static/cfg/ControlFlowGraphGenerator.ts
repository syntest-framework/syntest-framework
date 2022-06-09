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
import {
  BranchNode,
  CFG,
  CFGFactory, Edge,
  Node,
  NodeType, Operation,
  PlaceholderNode, prng,
  RootNode,
} from "@syntest/framework";

interface ReturnValue {
  childNodes: Node[];
  breakNodes: Node[];
}

export class ControlFlowGraphGenerator implements CFGFactory {

  private cfg: CFG;
  private _contracts: string[] = [];

  convertAST(ast: any, compress = false, placeholder = false): CFG {
    // TODO the imported stuff should also be resolved...
    this._contracts = [];

    this.cfg = new CFG();

    this.visitChild(ast, []);

    // if (!placeholder) {
    //   this.removePlaceholder();
    // }

    // if (compress) {
    //   this.compress();
    // }

    return this.cfg;
  }


  removePlaceholder(): void {
    const removableEdges = [];
    const removableNodes = [];
    this.cfg.nodes
      // Find all placeholder nodes
      .filter((n) => n.type === NodeType.Placeholder)
      .forEach((placeholderNode) => {
        this.cfg.edges
          // Find all placeholder nodes that are not end nodes
          .filter((edge) => edge.from === placeholderNode.id)
          .forEach((outgoingEdge) => {
            const targetNode = outgoingEdge.to;
            this.cfg.edges
              // Find all incoming edges from the current placeholder node
              .filter((edge) => edge.to === placeholderNode.id)
              // Connect the incoming and outgoing nodes together
              .forEach((incomingEdge) => {
                incomingEdge.to = targetNode;
              });

            // Only delete the edge from the placeholder node
            // There could be other nodes pointing to the target node
            removableEdges.push(outgoingEdge);
            if (!removableNodes.includes(placeholderNode))
              removableNodes.push(placeholderNode);
          });
      });

    // Delete unneeded placeholder elements
    removableEdges.forEach((edge) => {
      this.cfg.edges.splice(this.cfg.edges.indexOf(edge), 1);
    });
    removableNodes.forEach((node) => {
      this.cfg.nodes.splice(this.cfg.nodes.indexOf(node), 1);
    });
  }

  compress(): void {
    const roots = this.cfg.nodes.filter((n) => n.type === NodeType.Root);

    // create  node map for easy lookup
    const nodeMap = new Map<string, Node>();
    for (const node of this.cfg.nodes) {
      nodeMap[node.id] = node;
    }

    // create outgoing edge map for easy lookup
    const outEdgeMap = new Map<string, string[]>();
    for (const edge of this.cfg.edges) {
      if (!outEdgeMap[edge.from]) {
        outEdgeMap[edge.from] = [];
      }
      outEdgeMap[edge.from].push(edge.to);
    }

    const discoveredMap = new Map<string, boolean>();

    const removedNodes = [];
    // const removedEdges = []

    let possibleCompression = [];
    for (const root of roots) {
      const stack: Node[] = [root];
      while (stack.length != 0) {
        const currentNode = stack.pop();
        const outGoingEdges = outEdgeMap[currentNode.id] || [];

        if (outGoingEdges.length === 1) {
          // exactly one next node so compression might be possible
          possibleCompression.push(currentNode);
        } else if (outGoingEdges.length !== 1) {
          // zero or more than one outgoing edges so the compression ends here
          const description = [];

          const incomingEdges: Edge[][] = [];

          for (let i = 0; i < possibleCompression.length - 1; i++) {
            const node = possibleCompression[i];
            if (node.root) {
              // do not remove root nodes
              continue;
            }

            removedNodes.push(node);
            description.push(node.line);

            incomingEdges.push(this.cfg.edges.filter((e) => e.to === node.id));
          }

          if (possibleCompression.length > 0) {
            let nodeId = currentNode.id;
            if (outGoingEdges.length === 0) {
              // no next nodes so we can also remove the last one
              const lastNode =
                possibleCompression[possibleCompression.length - 1];
              // unless it is a root node
              if (!lastNode.root) {
                removedNodes.push(lastNode);
                description.push(lastNode.line);

                incomingEdges.push(
                  this.cfg.edges.filter((e) => e.to === lastNode.id)
                );
              }

              // change the current node to be the compressed version of all previous nodes
              currentNode.description = description.join(", ");
            } else {
              // change the current node to be the compressed version of all previous nodes
              possibleCompression[possibleCompression.length - 1].description =
                description.join(", ");
              nodeId = possibleCompression[possibleCompression.length - 1].id;
            }

            // change the edges pointing to any of the removed nodes
            for (const edges of incomingEdges) {
              for (const edge of edges) {
                edge.to = nodeId;
              }
            }
          }

          // reset compression
          possibleCompression = [];
        }

        if (!discoveredMap[currentNode.id]) {
          discoveredMap[currentNode.id] = true;
          for (const to of outGoingEdges) {
            stack.push(nodeMap[to]);
          }
        }
      }

      // reset compressions before going to the next root
      possibleCompression = [];
    }

    this.cfg.nodes = this.cfg.nodes.filter((n) => !removedNodes.includes(n));
    // remove edges of which the to/from has been removed
    this.cfg.edges = this.cfg.edges.filter(
      (e) => !removedNodes.find((n) => n.id === e.to || n.id === e.from)
    );

    // TODO also remove unreachable code
  }

  private createRootNode(
    lines: number[],
    statements: string[],
    description?: string
  ): RootNode {
    const node: RootNode = {
      id: `f-${lines[0]}-${prng.uniqueId()}`,
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
  private createNode(lines: number[], statements: string[]): Node {
    const node: Node = {
      type: NodeType.Intermediary,
      id: `s-${lines[0]}-${prng.uniqueId()}`,
      lines: lines,
      statements: statements,
    };

    this.cfg.nodes.push(node);

    return node;
  }


  private createPlaceholderNode(
    lines: number[],
    statements: string[]
  ): PlaceholderNode {
    const node: PlaceholderNode = {
      type: NodeType.Placeholder,
      id: `s-${lines[0]}-${prng.uniqueId()}`,
      lines: lines,
      statements: statements,
    };

    this.cfg.nodes.push(node);

    return node;
  }

  private createBranchNode(
    lines: number[],
    statements: string[],
    condition: Operation
  ): BranchNode {
    const node: BranchNode = {
      condition: condition,
      id: `b-${lines[0]}-${prng.uniqueId()}`,
      lines: lines,
      statements: statements,
      type: NodeType.Branch,
      probe: false,
    };

    this.cfg.nodes.push(node);

    return node;
  }

  /**
   * This method creates edges to connect the given parents to the given children
   * @param cfg the cfg to add the edges to
   * @param parents the parent nodes
   * @param children the child nodes
   * @private
   */
  private connectParents(parents: Node[], children: Node[]) {
    for (const parent of parents) {
      for (const child of children) {
        this.cfg.edges.push({
          from: parent.id,
          to: child.id,
        });
      }
    }
  }

  /**
   * This method visit a child node in the ast using the visitor design pattern.
   *
   * @param child the child ast node
   * @param parents the parents of the child
   * @param contractName
   * @private
   */
  private visitChild(
    child: any,
    parents: Node[],
    contractName?: string
  ): ReturnValue {
    const skipable: string[] = [
      "ImportDeclaration",
      "ClassProperty",
      "EmptyStatement",
    ];

    if (skipable.includes(child.type)) {
      return {
        childNodes: parents,
        breakNodes: [],
      };
    }

    switch (child.type) {
      // passthrough
      case "File":
        return this.visitChild(child.program, parents)
      case "ExportDefaultDeclaration":
        return this.visitChild(child.declaration, parents)
      case "ExportSpecifier":
        return this.visitChild(child.local, parents);
      case "UnaryExpression":
        return this.visitChild(child.argument, parents);
      case "ExpressionStatement":
        return this.visitChild(child.expression, parents);

      //
      case "Program":
        return this.visitProgram(child)
      case "FunctionDeclaration":
        return this.visitFunctionDeclaration(child)
      case "CallExpression":
        return this.visitCallExpression(child, parents);
      case "ExportNamedDeclaration":
        return this.visitExportNamedDeclaration(child, parents);

      case "Identifier":

      case "NumericLiteral":
      case "BooleanLiteral":
      case "StringLiteral":
      case "NullLiteral":
      case "TemplateLiteral":
      case "RegExpLiteral":

      case "SpreadElement":

      case "BinaryExpression":
      case "LogicalExpression":
      case "MemberExpression":
      case "AssignmentExpression":
      case "ArrowFunctionExpression":
      case "FunctionExpression":
      case "ArrayExpression":
      case "ThisExpression":
      case "ObjectExpression":
      case "NewExpression":
      case "AwaitExpression":
      case "UpdateExpression":

      case "VariableDeclarator":
        return this.visitGeneralExpression(child, parents);

      case "VariableDeclaration":
        return this.visitVariableDeclaration(child, parents)

      case "ReturnStatement":
        return this.visitReturnStatement(child, parents)
      case "ThrowStatement":
        return this.visitThrowStatement(child, parents)

      case "BlockStatement":
        return this.visitBlockStatement(child, parents)

      case "ClassDeclaration":
        return this.visitClassDeclaration(child)
      case "ClassMethod":
        return this.visitClassMethod(child)

      case "IfStatement":
        return this.visitIfStatement(child, parents);
      case "ConditionalExpression":
        return this.visitConditional(child, parents);

      case "TryStatement":
        return this.visitTryStatement(child, parents)

      case "CatchClause":
        return this.visitCatchClause(child, parents);

      case "WhileStatement":
        return this.visitWhileStatement(child, parents);
      case "DoWhileStatement":
        return this.visitDoWhileStatement(child, parents);
      case "ForOfStatement":
        return this.visitForOfStatement(child, parents)
      case "ForInStatement":
        return this.visitForOfStatement(child, parents)
      case "ForStatement":
        return this.visitForStatement(child, parents);

      case "BreakStatement":
        return this.visitBreakStatement(child, parents)
      case "ContinueStatement":
        return this.visitContinueStatement(child, parents)


      case "SwitchStatement":
        return this.visitSwitchStatement(child, parents)
      case "SwitchCase":
        return this.visitSwitchCase(child, parents)


      // case "SourceUnit":
      //   return this.SourceUnit(cfg, child);
      // case "ContractDefinition":
      //   return this.ContractDefinition(cfg, child);
      // case "ModifierDefinition":
      //   return this.ModifierDefinition(cfg, child);
      // case "FunctionDefinition":
      //   return this.FunctionDefinition(cfg, child, contractName);
      // case "ModifierInvocation":
      //   return this.ModifierInvocation(cfg, child, parents);
      // case "Block":
      //   return this.Block(cfg, child, parents);
      //
      // case "IfStatement":
      //   return this.IfStatement(cfg, child, parents);


      // case "WhileStatement":
      //   return this.WhileStatement(cfg, child, parents);

      //
      // case "VariableDeclarationStatement":
      //   return this.VariableDeclarationStatement(cfg, child, parents);
      // case "ExpressionStatement":
      //   return this.ExpressionStatement(cfg, child, parents);
      // case "FunctionCall":
      //   return this.FunctionCall(cfg, child, parents);
      // case "ReturnStatement":
      //   return this.ReturnStatement(cfg, child, parents);
      // case "BreakStatement":
      //   return this.BreakStatement(cfg, child, parents);

      default:
        throw new Error(`ast type: ${child.type} is not supported currently!`);
    }
  }

  private visitProgram(ast: any): ReturnValue {
    for (const child of ast.body) {
      // TODO add more probably
      // if (!['FunctionDeclaration', 'ClassDeclaration', 'ExpressionStatement'].includes(child.type)) {

      // if (['ImportDeclaration', 'ClassDeclaration', 'ExpressionStatement'].includes(child.type)) {
      //   continue
      // }
      this.visitChild(child, []);
    }

    return {
      childNodes: [],
      breakNodes: [],
    };
  }

  private visitFunctionDeclaration(ast: any): ReturnValue {
    if (!ast.loc) {
      return {
        childNodes: [],
        breakNodes: [],
      };
    }
    const node: RootNode = this.createRootNode(
      [ast.loc.start.line],
      [],
      ast.id.name
    );


    let parents: Node[] = [node];

    const totalBreakNodes = [];
    // if (ast.modifiers && Properties.modifier_extraction) {
    //   ast.modifiers.forEach((modifier) => {
    //     const { childNodes, breakNodes } = this.visitChild(
    //       cfg,
    //       modifier,
    //       parents
    //     );
    //     if (childNodes.length > 0) {
    //       parents = childNodes;
    //     }
    //     totalBreakNodes.push(...breakNodes);
    //   });
    // }

    // Check if body is block
    if (ast.body) {
      // TODO: Add child nodes to results
      this.visitChild(ast.body, parents);
    }

    return {
      childNodes: [],
      breakNodes: [],
    };
  }

  private visitCallExpression(
    ast: any,
    parents: Node[]
  ): ReturnValue {
    const node: Node = this.createNode([ast.loc.start.line], []);
    this.connectParents(parents, [node]);
    let nodes = [node]
    for (const arg of ast.arguments) {
      const result = this.visitChild(arg, nodes);

      nodes = result.childNodes
    }

    return {
      childNodes: [node],
      breakNodes: []
    }
  }

  private visitExportNamedDeclaration(
    ast: any,
    parents: Node[]
  ): ReturnValue {
    if (ast.specifiers && ast.specifiers.length) {
      let nodes = parents
      for (const specifier of ast.specifiers) {
        const result = this.visitChild(specifier, nodes);

        nodes = result.childNodes
      }

      return {
        childNodes: nodes,
        breakNodes: []
      }
    } else {
      return this.visitChild(ast.declaration, parents)
    }
  }

  private visitGeneralExpression(
    ast: any,
    parents: Node[]
  ): ReturnValue {
    if (['LogicalExpression', 'BinaryExpression'].includes(ast.type)) {
      const left = this.visitChild(ast.left, parents);
      const right = this.visitChild(ast.right, left.childNodes);

      return {
        childNodes: [...right.childNodes],
        breakNodes: [...left.breakNodes, ...right.breakNodes],
      };
    } else if (ast.type === 'AssignmentExpression') {
      return this.visitChild(ast.right, parents);
    } else if (ast.type === 'VariableDeclarator') {
      if (ast.init) {
        return this.visitChild(ast.init, parents);
      }

      const node: Node = this.createNode([ast.loc.start.line], []);
      this.connectParents(parents, [node]);


      return {
        childNodes: [node],
        breakNodes: [],
      };
    } else if (ast.type === 'FunctionExpression'
    || ast.type === 'ArrowFunctionExpression') {
      const node: RootNode = this.createRootNode(
        [ast.loc.start.line],
        [],
      );
      this.connectParents(parents, [node]);

      if (ast.body) {
        return this.visitChild(ast.body, [node]);
      }

      return {
        childNodes: [],
        breakNodes: [],
      };
    } else {
      const node: Node = this.createNode([ast.loc.start.line], []);
      this.connectParents(parents, [node]);

      return {
        childNodes: [node],
        breakNodes: [],
      };
    }

  }

  private visitBlockStatement(ast: any, parents: Node[]): ReturnValue {
    let nodes = parents;
    const totalBreakNodes = [];
    for (const child of ast.body) {
      const { childNodes, breakNodes } = this.visitChild(child, nodes);
      nodes = childNodes;
      totalBreakNodes.push(...breakNodes);
    }

    return {
      childNodes: nodes,
      breakNodes: totalBreakNodes,
    };
  }

  /**
   * This is a terminating node
   * @param ast
   * @param parents
   * @constructor
   * @private
   */
  private visitReturnStatement(ast: any, parents: Node[]): ReturnValue {
    const count = this.cfg.edges.length

    if (ast.argument) {
      this.visitChild(ast.argument, parents)
    }

    if (!this.cfg.edges[count]) {
      // if no nodes are created we add one
      const node: Node = this.createNode([ast.loc.start.line], []);
      this.connectParents(parents, [node]);
    }

    return {
      childNodes: [],
      breakNodes: [],
    };
  }

  // TODO try catch support
  private visitThrowStatement(ast: any, parents: Node[]): ReturnValue {
    const node: Node = this.createNode([ast.loc.start.line], []);
    this.connectParents(parents, [node]);

    return {
      childNodes: [],
      breakNodes: [],
    };
  }

  private visitClassDeclaration(ast: any): ReturnValue {
    const classBody = ast.body
    for (const child of classBody.body) {
      this.visitChild(child, []);
    }

    return {
      childNodes: [],
      breakNodes: [],
    };
  }

  private visitClassMethod(ast: any): ReturnValue {
    const node: RootNode = this.createRootNode(
      [ast.loc.start.line],
      [],
      ast.key.name
    );

    let parents: Node[] = [node];

    // Check if body is block
    if (ast.body) {
      this.visitChild(ast.body, parents);
    }

    return {
      childNodes: [],
      breakNodes: [],
    };
  }

  private visitVariableDeclaration(
    ast: any,
    parents: Node[]
  ): ReturnValue {
    // const node: Node = this.createNode([ast.loc.start.line], []);
    // this.connectParents(parents, [node]);

    let nodes = parents
    const totalBreakNodes = [];
    for (const child of ast.declarations) {
      const { childNodes, breakNodes } = this.visitChild(child, nodes);
      nodes = childNodes;
      totalBreakNodes.push(...breakNodes);
    }

    return {
      childNodes: [...nodes],
      breakNodes: totalBreakNodes,
    };
  }

  private visitIfStatement(ast: any, parents: Node[]): ReturnValue {
    const node: BranchNode = this.createBranchNode(
      [ast.loc.start.line],
      [],
      {
        type: ast.test.type,
        operator: ast.test.operator,
      }
    );

    this.connectParents(parents, [node]);

    // Store all break points
    const totalBreakNodes = [];

    // Visit true flow
    let count = this.cfg.edges.length;
    const { childNodes, breakNodes } = this.visitChild(ast.consequent, [
      node,
    ]);
    const trueNodes = childNodes;

    totalBreakNodes.push(...breakNodes);

    // Check if a child node was created
    if (!this.cfg.edges[count]) {
      // Add empty placeholder node
      const emptyChildNode = this.createPlaceholderNode(
        [ast.consequent.loc.start.line],
        []
      );
      this.connectParents([node], [emptyChildNode])
      trueNodes.push(emptyChildNode);

      this.cfg.edges[count].branchType = true;

      // this.cfg.edges.push({
      //   from: node.id,
      //   to: emptyChildNode.id,
      //   branchType: true,
      // });
    }
    // Add edge identifierDescription to first added edge
    this.cfg.edges[count].branchType = true;

    // Visit false flow
    if (ast.alternate) {
      count = this.cfg.edges.length;
      const { childNodes, breakNodes } = this.visitChild(ast.alternate, [
        node,
      ]);
      const falseNodes = childNodes;
      totalBreakNodes.push(...breakNodes);

      // Check if a child node was created
      if (this.cfg.edges[count]) {
        // Add edge identifierDescription to first added edge
        this.cfg.edges[count].branchType = false;
      } else {
        // Add empty placeholder node
        const emptyChildNode = this.createPlaceholderNode(
          [ast.alternate.loc.start.line],
          []
        );
        falseNodes.push(emptyChildNode);

        this.cfg.edges.push({
          from: node.id,
          to: emptyChildNode.id,
          branchType: false,
        });
      }

      return {
        childNodes: [...trueNodes, ...falseNodes],
        breakNodes: totalBreakNodes,
      };
    } else {
      // Add empty placeholder node
      const falseNode: Node = this.createPlaceholderNode(
        [ast.loc.end.line],
        []
      );

      this.cfg.edges.push({
        from: node.id,
        to: falseNode.id,
        branchType: false,
      });

      return {
        childNodes: [...trueNodes, falseNode],
        breakNodes: totalBreakNodes,
      };
    }
  }


  private visitConditional(ast: any, parents: Node[]): ReturnValue {
    const node: BranchNode = this.createBranchNode(
      [ast.loc.start.line],
      [],
      {
        type: ast.test.type,
        operator: ast.test.operator,
      });
    this.connectParents(parents, [node]);

    // Store all break points
    const totalBreakNodes = [];

    // Visit true flow
    let count = this.cfg.edges.length;
    const { childNodes, breakNodes } = this.visitChild(ast.consequent,
      [node]
    );
    const trueNodes = childNodes;
    totalBreakNodes.push(...breakNodes);

    // Check if a child node was created
    if (this.cfg.edges[count]) {
      // Add edge type to first added edge
      this.cfg.edges[count].branchType = true;
    } else {
      // Add empty placeholder node
      const emptyChildNode = this.createPlaceholderNode(
        [ast.consequent.loc.start.line],
        []
      );
      trueNodes.push(emptyChildNode);

      this.cfg.edges.push({
        from: node.id,
        to: emptyChildNode.id,
        branchType: true,
      });
    }

    // Visit false flow
    if (ast.alternate) {
      count = this.cfg.edges.length;
      const { childNodes, breakNodes } = this.visitChild(
        ast.alternate,
        [node]
      );
      const falseNodes = childNodes;
      totalBreakNodes.push(...breakNodes);

      // Check if a child node was created
      if (this.cfg.edges[count]) {
        // Add edge type to first added edge
        this.cfg.edges[count].branchType = false;
      } else {
        // Add empty placeholder node
        const emptyChildNode = this.createPlaceholderNode(
          [ast.alternate.loc.start.line],
          []
        );
        falseNodes.push(emptyChildNode);

        this.cfg.edges.push({
          from: node.id,
          to: emptyChildNode.id,
          branchType: false,
        });
      }

      return {
        childNodes: [...trueNodes, ...falseNodes],
        breakNodes: totalBreakNodes,
      };
    } else {
      // Add empty placeholder node
      const falseNode = this.createPlaceholderNode([ast.loc.end.line], []);

      this.cfg.edges.push({
        from: node.id,
        to: falseNode.id,
        branchType: false,
      });

      return {
        childNodes: [...trueNodes, falseNode],
        breakNodes: totalBreakNodes,
      };
    }
  }

  private visitTryStatement(ast: any, parents:Node[]): ReturnValue {
    // TODO finalizer try -> catch -> finally
    const node: BranchNode = this.createBranchNode(
      [ast.loc.start.line],
      [],
      {
        type: ast.type,
        operator: 'exception',
      }
    );

    this.connectParents(parents, [node]);

    // Store all break points
    const totalBreakNodes = [];

    // Visit try flow
    let count = this.cfg.edges.length;
    let tryNodes = this.visitChild(ast.block, [
      node,
    ]);
    const tryChildNodes = tryNodes.childNodes;
    totalBreakNodes.push(...tryNodes.breakNodes);

    // Check if a child node was created
    if (this.cfg.edges[count]) {
      // Add edge identifierDescription to first added edge
      this.cfg.edges[count].branchType = true;
    } else {
      // Add empty placeholder node
      const emptyChildNode = this.createPlaceholderNode(
        [ast.consequent.loc.start.line],
        []
      );
      tryChildNodes.push(emptyChildNode);

      this.cfg.edges.push({
        from: node.id,
        to: emptyChildNode.id,
        branchType: true,
      });
    }

    // Visit catch flow
    count = this.cfg.edges.length;
    const catchNodes = this.visitChild(ast.handler, [
      node,
    ]);
    const catchChildNodes = catchNodes.childNodes;
    totalBreakNodes.push(...catchNodes.breakNodes);

    // Check if a child node was created
    if (this.cfg.edges[count]) {
      // Add edge identifierDescription to first added edge
      this.cfg.edges[count].branchType = false;
    } else {
      // Add empty placeholder node
      const emptyChildNode = this.createPlaceholderNode(
        [ast.alternate.loc.start.line],
        []
      );
      catchChildNodes.push(emptyChildNode);

      this.cfg.edges.push({
        from: node.id,
        to: emptyChildNode.id,
        branchType: false,
      });
    }

    return {
      childNodes: [...tryChildNodes, ...catchChildNodes],
      breakNodes: totalBreakNodes,
    };
  }

  private visitCatchClause(ast: any, parents:Node[]): ReturnValue {
    const node: Node = this.createNode([ast.loc.start.line], []);
    this.connectParents(parents, [node]);

    return {
      childNodes: [node],
      breakNodes: [],
    };
  }

  private visitWhileStatement(ast: any, parents: Node[]): ReturnValue {
    const node: Node = this.createBranchNode([ast.loc.start.line], [], {
      type: ast.test.type,
      operator: ast.test.operator,
    });
    this.connectParents(parents, [node]);

    const count = this.cfg.edges.length;
    const { childNodes, breakNodes } = this.visitChild(ast.body, [node]);
    const trueNodes = childNodes;

    // Check if a child node was created
    if (this.cfg.edges[count]) {
      // Add edge identifierDescription to first added edge
      this.cfg.edges[count].branchType = true;
    } else {
      // Add empty placeholder node
      const emptyChildNode = this.createPlaceholderNode(
        [ast.loc.start.line],
        []
      );
      trueNodes.push(emptyChildNode);

      this.cfg.edges.push({
        from: node.id,
        to: emptyChildNode.id,
        branchType: true,
      });
    }

    // Add empty placeholder node for the false flow
    const falseNode = this.createPlaceholderNode( [ast.loc.end.line], []);
    this.cfg.edges.push({
      from: node.id,
      to: falseNode.id,
      branchType: false,
    });

    // Connect break points
    for (const breakNode of breakNodes) {
      this.cfg.edges.push({
        from: breakNode.id,
        to: falseNode.id,
      });
    }

    // Connect loop
    this.connectParents(trueNodes, [node]);

    return {
      childNodes: [falseNode],
      breakNodes: [],
    };
  }

  private visitForOfStatement(ast: any, parents: Node[]): ReturnValue {
    const node: Node = this.createBranchNode([ast.loc.start.line], [], {
      type: 'CallExpression',
      operator: 'isEmpty',
    });
    this.connectParents(parents, [node]);

    const count = this.cfg.edges.length;
    const { childNodes, breakNodes } = this.visitChild(ast.body, [node]);
    const loopNodes = childNodes;

    // Check if a child node was created
    if (this.cfg.edges[count]) {
      // Add edge identifierDescription to first added edge
      this.cfg.edges[count].branchType = true;
    } else {
      // Add empty placeholder node
      const emptyChildNode = this.createPlaceholderNode(
        [ast.loc.start.line],
        []
      );
      loopNodes.push(emptyChildNode);

      this.cfg.edges.push({
        from: node.id,
        to: emptyChildNode.id,
        branchType: true,
      });
    }

    // Add empty placeholder node for the false flow
    const falseNode = this.createPlaceholderNode([ast.loc.end.line], []);
    this.cfg.edges.push({
      from: node.id,
      to: falseNode.id,
      branchType: false,
    });

    // Connect break points
    for (const breakNode of breakNodes) {
      this.cfg.edges.push({
        from: breakNode.id,
        to: falseNode.id,
      });
    }

    // Connect loop
    this.connectParents(loopNodes, [node]);

    return {
      childNodes: [falseNode],
      breakNodes: [],
    };
  }

  /**
   * This is a break statement
   * @param ast
   * @param parents
   * @constructor
   * @private
   */
  private visitBreakStatement(ast: any, parents: Node[]): ReturnValue {
    const node: Node = this.createNode([ast.loc.start.line], []);
    this.connectParents(parents, [node]);

    return {
      childNodes: [],
      breakNodes: [node],
    };
  }

  // TODO currently incorrect is passthrough now
  private visitContinueStatement(ast: any, parents: Node[]): ReturnValue {
    const node: Node = this.createNode([ast.loc.start.line], []);
    this.connectParents(parents, [node]);

    return {
      childNodes: [],
      breakNodes: [],
    };
  }

  private visitDoWhileStatement(ast: any, parents: Node[]): ReturnValue {
    // entry node
    const entryNode: Node = this.createBranchNode(
      [ast.loc.start.line],
      [],
      {
        type: ast.test.type,
        operator: ast.test.operator,
      }
    );
    this.connectParents(parents, [entryNode]);

    // TODO: We can check if a node is generated. This eliminates the need for entryNode
    // 'do' block
    const { childNodes, breakNodes } = this.visitChild(ast.body, [
      entryNode,
    ]);
    const trueNodes = childNodes;

    // while check
    const whileNode: Node = this.createBranchNode(
      [ast.loc.start.line],
      [],
      {
        type: ast.test.type,
        operator: ast.test.operator,
      }
    );
    this.connectParents(trueNodes, [whileNode]);

    // Connect back to the entry node and mark as true branch
    this.cfg.edges.push({
      from: whileNode.id,
      to: entryNode.id,
      branchType: true,
    });

    // Add empty placeholder node for the false flow
    const falseNode: Node = this.createPlaceholderNode(
      [ast.loc.end.line],
      []
    );
    this.cfg.edges.push({
      from: whileNode.id,
      to: falseNode.id,
      branchType: false,
    });

    // Connect break points
    for (const breakNode of breakNodes) {
      this.cfg.edges.push({
        from: breakNode.id,
        to: falseNode.id,
      });
    }

    return {
      childNodes: [falseNode],
      breakNodes: [],
    };
  }

  private visitSwitchStatement(ast: any, parents: Node[]): ReturnValue {
    // TODO currently incorrect
    const node: Node = this.createBranchNode([ast.loc.start.line], [], {
      type: 'Switch',
      operator: '==',
    });
    this.connectParents(parents, [node]);

    // Add empty placeholder node for the false flow
    const falseNode = this.createPlaceholderNode([ast.loc.end.line], []);

    let nodes = [node]
    for (const switchCase of ast.cases) {
      const { childNodes, breakNodes } = this.visitChild(switchCase, nodes);
      nodes = childNodes

      // Connect break points
      for (const breakNode of breakNodes) {
        this.cfg.edges.push({
          from: breakNode.id,
          to: falseNode.id,
        });
      }
    }

    for (const breakNode of nodes) {
      this.cfg.edges.push({
        from: breakNode.id,
        to: falseNode.id,
      });
    }

    return {
      childNodes: nodes,
      breakNodes: [],
    };
  }

  private visitSwitchCase(ast: any, parents: Node[]): ReturnValue {
    const node: Node = this.createBranchNode([ast.loc.start.line], [], {
      type: 'switchCase',
      operator: '==',
    });
    this.connectParents(parents, [node]);

    const count = this.cfg.edges.length;

    let nodes = [node]
    const totalBreakNodes = []
    for (const child of ast.consequent) {
      const { childNodes, breakNodes } = this.visitChild(child, nodes);
      nodes = childNodes
      totalBreakNodes.push(...breakNodes)
    }

    const trueNodes = nodes;
    const childNodes = []

    // Check if a child node was created
    if (this.cfg.edges[count]) {
      // Add edge identifierDescription to first added edge
      this.cfg.edges[count].branchType = true;
    } else {
      // Add empty placeholder node
      const emptyChildNode = this.createPlaceholderNode(
        [ast.loc.start.line],
        []
      );
      trueNodes.push(emptyChildNode);

      this.cfg.edges.push({
        from: node.id,
        to: emptyChildNode.id,
        branchType: true,
      });

      childNodes.push(emptyChildNode)
    }

    // Add empty placeholder node for the false flow
    const falseNode = this.createPlaceholderNode([ast.loc.start.line], []);
    this.cfg.edges.push({
      from: node.id,
      to: falseNode.id,
      branchType: false,
    });

    return {
      childNodes: [...childNodes, falseNode],
      breakNodes: totalBreakNodes,
    };
  }

  private visitForStatement(ast: any, parents: Node[]): ReturnValue {
    const node: Node = this.createBranchNode([ast.loc.start.line], [], {
      type: ast.test.type,
      operator: ast.test.operator || ast.test.name || ast.test.value,
    });
    this.connectParents(parents, [node]);
    // TODO For each probably not supported

    // TODO init expression
    // TODO condition expression
    // TODO loopExpression

    const count = this.cfg.edges.length;
    const { childNodes, breakNodes } = this.visitChild(ast.body, [node]);
    const trueNodes = childNodes;

    // Check if a child node was created
    if (this.cfg.edges[count]) {
      // Add edge identifierDescription to first added edge
      this.cfg.edges[count].branchType = true;
    } else {
      // Add empty placeholder node
      const emptyChildNode = this.createPlaceholderNode(
        [ast.loc.start.line],
        []
      );
      trueNodes.push(emptyChildNode);

      this.cfg.edges.push({
        from: node.id,
        to: emptyChildNode.id,
        branchType: true,
      });
    }

    // Add empty placeholder node for the false flow
    const falseNode = this.createPlaceholderNode([ast.loc.end.line], []);
    this.cfg.edges.push({
      from: node.id,
      to: falseNode.id,
      branchType: false,
    });

    // Connect break points
    for (const breakNode of breakNodes) {
      this.cfg.edges.push({
        from: breakNode.id,
        to: falseNode.id,
      });
    }

    // Connect loop
    this.connectParents(trueNodes, [node]);

    return {
      childNodes: [falseNode],
      breakNodes: [],
    };
  }
}
