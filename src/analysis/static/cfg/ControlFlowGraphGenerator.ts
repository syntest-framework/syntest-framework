import {
  BranchNode,
  CFG,
  CFGFactory, Edge,
  Node,
  NodeType, Operation,
  Parameter, PlaceholderNode,
  Properties,
  PublicVisibility,
  RootNode,
} from "@syntest/framework";
import { traverse } from "@babel/core";
import { ControlFlowGraphVisitor } from "./ControlFlowGraphVisitor";

interface ReturnValue {
  childNodes: Node[];
  breakNodes: Node[];
}

export class ControlFlowGraphGenerator implements CFGFactory {
  // convertast(ast: any): CFG {
  //   const visitor = new ControlFlowGraphVisitor();
  //
  //   traverse(ast, visitor);
  //
  //   return visitor.cfg;
  // }

  private cfg: CFG;
  private _contracts: string[] = [];

  convertAST(ast: any, compress = false, placeholder = false): CFG {
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
    functionName: string,
    isConstructor: boolean,
    parameters: Parameter[],
    returnParameter: Parameter,
  ): RootNode {
    const node: RootNode = {
      contractName: "",
      functionName: functionName,
      id: `f-${lines[0]}`,
      isConstructor: isConstructor,
      lines: lines,
      statements: statements,
      type: NodeType.Root,

      parameters: parameters,
      returnParameters: [returnParameter],

      visibility: PublicVisibility,
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
      id: `s-${lines[0]}`,
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
      id: `s-${lines[0]}`,
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
      id: `b-${lines[0]}`,
      lines: lines,
      statements: statements,
      type: NodeType.Branch,
      probe: false,
    };

    this.cfg.nodes.push(node);

    return node;
  }

  private parseParameter(parameter): Parameter {
    return {
      name: parameter.name || 'unknown',
      type: 'any'// good question...
    };
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
      "ClassProperty"
    ];

    if (skipable.includes(child.type)) {
      return {
        childNodes: parents,
        breakNodes: [],
      };
    }

    switch (child.type) {
      case "File":
        return this.visitChild(child.program, parents)
      case "Program":
        return this.visitProgram(child)
      case "FunctionDeclaration":
        return this.visitFunctionDeclaration(child)

      case "ExpressionStatement":
        return this.visitExpressionStatement(child, parents);
      case "CallExpression":
        return this.visitCallExpression(child, parents)
      case "AssignmentExpression":
        return this.visitAssignmentExpression(child, parents)

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
      case "VariableDeclaration":
        return this.visitVariableDeclaration(child, parents)

      case "IfStatement":
        return this.visitIfStatement(child, parents);
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
      // case "Conditional":
      //   return this.Conditional(cfg, child, parents);
      //
      // case "ForStatement":
      //   return this.ForStatement(cfg, child, parents);
      // case "WhileStatement":
      //   return this.WhileStatement(cfg, child, parents);
      // case "DoWhileStatement":
      //   return this.DoWhileStatement(cfg, child, parents);
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
        console.log(child);
        console.log(`ast type: ${child.type} is not supported currently!`)
        throw new Error(`ast type: ${child.type} is not supported currently!`);
    }
  }

  private visitProgram(ast: any): ReturnValue {
    for (const child of ast.body) {
      // TODO add more probably
      if (!['FunctionDeclaration', 'ClassDeclaration'].includes(child.type)) {
        continue
      }
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
      ast.id.name,
      ast.isConstructor, // TODO
      ast.params.map(this.parseParameter),
      ast.returnParameter ? this.parseParameter(ast.returnParameter) : { name: 'unknown', type: 'any' }
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

  private visitExpressionStatement(
    ast: any,
    parents: Node[]
  ): ReturnValue {

    const node: Node = this.createNode([ast.loc.start.line], []);
    this.connectParents(parents, [node]);

    const { childNodes, breakNodes } = this.visitChild(ast.expression, [node]);

    return {
      childNodes: [node],
      breakNodes: breakNodes,
    };
    //
    // return {
    //   childNodes: [],
    //   breakNodes: [],
    // };
    // if (ast.expression.type === "CallExpression") {
    //   const { childNodes, breakNodes } = this.visitChild(
    //     ast.expression,
    //     parents
    //   );
    //
    //   return {
    //     childNodes: childNodes,
    //     breakNodes: breakNodes,
    //   };
    // } else {
    //   const node: Node = this.createNode([ast.loc.start.line], []);
    //   this.connectParents(parents, [node]);
    //
    //   const { childNodes, breakNodes } = this.visitChild(ast.expression, [
    //     node,
    //   ]);
    //
    //   return {
    //     childNodes: childNodes,
    //     breakNodes: breakNodes,
    //   };
    // }
  }

  private visitAssignmentExpression(ast: any, parents: Node[]): ReturnValue {
    // console.log(ast)
    // const { childNodes, breakNodes } = this.visitChild(
    //   ast.expression,
    //   parents
    // );
    //
    // return {
    //   childNodes: childNodes,
    //   breakNodes: breakNodes,
    // };

    return {
      childNodes: [],
      breakNodes: [],
    };
  }

  private visitCallExpression(ast: any, parents: Node[]): ReturnValue {
    const { childNodes, breakNodes } = this.visitChild(
      ast.expression,
      parents
    );

    return {
      childNodes: childNodes,
      breakNodes: breakNodes,
    };
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
    const node: Node = this.createNode([ast.loc.start.line], []);
    this.connectParents(parents, [node]);

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
      ast.key.name,
      ast.isConstructor, // TODO
      ast.params.map(this.parseParameter),
      ast.returnParameter ? this.parseParameter(ast.returnParameter) : { name: 'unknown', type: 'any' }
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
    const node: Node = this.createNode([ast.loc.start.line], []);
    this.connectParents(parents, [node]);

    return {
      childNodes: [node],
      breakNodes: [],
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
      const { childNodes, breakNodes } = this.visitChild(ast.alternate, [
        node,
      ]);
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
}
