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
import { NodePath } from "@babel/core";
import * as t from "@babel/types";
import { AbstractSyntaxTreeVisitor } from "@syntest/ast-visitor-javascript";
import {
  ControlFlowFunction,
  ControlFlowGraph,
  ControlFlowProgram,
  Edge,
  EdgeType,
  Location,
  Node,
  NodeType,
} from "@syntest/cfg";
import { getLogger } from "@syntest/logging";

export class ControlFlowGraphVisitor extends AbstractSyntaxTreeVisitor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected static override LOGGER: any;

  private _nodesList: Node<t.Node>[];
  private _nodes: Map<string, Node<t.Node>>;
  private _edges: Edge[];

  private _breakNodesStack: Set<string>[];
  private _continueNodesStack: Set<string>[];
  private _returnNodes: Set<string>;
  private _throwNodes: Set<string>;

  private _functions: ControlFlowFunction<t.Node>[];

  private _currentParents: string[];
  private _edgeType: EdgeType;

  get cfg(): ControlFlowProgram<t.Node> {
    if (!this._nodes.has("ENTRY")) {
      throw new Error("No entry node found");
    }
    if (!this._nodes.has("SUCCESS_EXIT")) {
      throw new Error("No success exit node found");
    }
    if (!this._nodes.has("ERROR_EXIT")) {
      throw new Error("No error exit node found");
    }

    if (this._nodesList.length !== this._nodes.size) {
      throw new Error("Number of nodes dont match");
    }

    const entryNode = this._nodes.get("ENTRY");
    const successExitNode = this._nodes.get("SUCCESS_EXIT");
    const errorExitNode = this._nodes.get("ERROR_EXIT");

    // connect last nodes to success exit
    this._connectToParents(successExitNode);

    // connect all return nodes to success exit
    for (const returnNode of this._returnNodes) {
      this._edges.push(
        this._createEdge(
          this._nodes.get(returnNode),
          successExitNode,
          EdgeType.NORMAL
        )
      );
    }

    // connect all throw nodes to error exit
    for (const throwNode of this._throwNodes) {
      this._edges.push(
        this._createEdge(
          this._nodes.get(throwNode),
          errorExitNode,
          EdgeType.EXCEPTION
        )
      );
    }

    if (this._breakNodesStack.length > 0) {
      ControlFlowGraphVisitor.LOGGER.warn(
        `Found ${this._breakNodesStack.length} break node stacks that are not connected to a loop`
      );
    }

    if (this._continueNodesStack.length > 0) {
      ControlFlowGraphVisitor.LOGGER.warn(
        `Found ${this._continueNodesStack.length} continue node stacks that are not connected to a loop`
      );
    }

    return {
      graph: new ControlFlowGraph(
        entryNode,
        successExitNode,
        errorExitNode,
        this._nodes,
        this._edges
      ),
      functions: this._functions,
    };
  }

  constructor(filePath: string) {
    super(filePath);
    ControlFlowGraphVisitor.LOGGER = getLogger("ControlFlowGraphVisitor");

    this._nodesList = [];
    this._nodes = new Map<string, Node<t.Node>>();
    this._edges = [];

    this._breakNodesStack = [];
    this._continueNodesStack = [];
    this._returnNodes = new Set<string>();
    this._throwNodes = new Set<string>();

    this._functions = [];

    this._currentParents = [];

    this._edgeType = EdgeType.NORMAL;

    const entry = new Node<t.Node>("ENTRY", NodeType.ENTRY, "ENTRY", [], {});
    const successExit = new Node<t.Node>(
      "SUCCESS_EXIT",
      NodeType.EXIT,
      "EXIT",
      [],
      {}
    );
    const errorExit = new Node<t.Node>(
      "ERROR_EXIT",
      NodeType.EXIT,
      "EXIT",
      [],
      {}
    );

    this._nodes.set(entry.id, entry);
    this._nodes.set(successExit.id, successExit);
    this._nodes.set(errorExit.id, errorExit);
    this._nodesList.push(entry, successExit, errorExit);

    this._currentParents = [entry.id];
  }

  private _getBreakNodes(): Set<string> {
    if (this._breakNodesStack.length === 0) {
      throw new Error("No break nodes found");
    }
    return this._breakNodesStack[this._breakNodesStack.length - 1];
  }

  private _getContinueNodes(): Set<string> {
    if (this._continueNodesStack.length === 0) {
      throw new Error("No continue nodes found");
    }
    return this._continueNodesStack[this._continueNodesStack.length - 1];
  }

  private _getLocation(path: NodePath<t.Node>): Location {
    return {
      start: {
        line: path.node.loc.start.line,
        column: path.node.loc.start.column,
        index: (<{ index: number }>(<unknown>path.node.loc.start)).index,
      },
      end: {
        line: path.node.loc.end.line,
        column: path.node.loc.end.column,
        index: (<{ index: number }>(<unknown>path.node.loc.end)).index,
      },
    };
  }

  private _createNode(path: NodePath<t.Node>): Node<t.Node> {
    const id = `${this._getNodeId(path)}`;
    const node = new Node<t.Node>(
      id,
      NodeType.NORMAL,
      path.node.type,
      [
        {
          id: id,
          location: this._getLocation(path),
          statement: path.node,
          statementAsText: path.toString(),
        },
      ],
      {},
      path.node.type
    );
    this._nodes.set(id, node);
    this._nodesList.push(node);

    return node;
  }

  /**
   * Create a placeholder node for a node that is not in the AST, but is used in the CFG.
   * Uses the end location of the parent node as the start and end location of the placeholder node.
   * @param path
   * @returns
   */
  private _createPlaceholderNode(path: NodePath<t.Node>): Node<t.Node> {
    const id = `placeholder-${this._getNodeId(path)}`;
    const location = this._getLocation(path);
    const node = new Node<t.Node>(
      id,
      NodeType.NORMAL,
      path.node.type,
      [
        {
          id: id,
          location: {
            start: {
              line: location.end.line,
              column: location.end.column,
              index: location.end.index,
            },
            end: {
              line: location.end.line,
              column: location.end.column,
              index: location.end.index,
            },
          },
          statement: path.node,
          statementAsText: path.toString(),
        },
      ],
      {},
      path.node.type
    );
    this._nodes.set(id, node);
    this._nodesList.push(node);

    return node;
  }

  private _isSpecial(path: NodePath<t.Node>): boolean {
    return (
      path.isFunction() ||
      path.isClass() ||
      path.isConditional() ||
      path.isLoop() ||
      path.isBlock() ||
      // terminating statements
      path.isBreakStatement() ||
      path.isContinueStatement() ||
      path.isReturnStatement() ||
      path.isThrowStatement() ||
      // exports
      path.isExportAllDeclaration() ||
      path.isExportDeclaration() ||
      path.isExportDefaultDeclaration() ||
      path.isExportDefaultSpecifier() ||
      path.isExportNamedDeclaration() ||
      path.isExportNamespaceSpecifier() ||
      path.isExportSpecifier()
    );
  }

  private _generalNode: (
    path: NodePath<
      t.Statement | t.Declaration | t.Expression | t.VariableDeclarator
    >
  ) => void = (path) => {
    if (this._isSpecial(path)) {
      return;
    }

    const node = this._createNode(path);

    this._connectToParents(node);
    this._currentParents = [node.id];

    path.skip();
  };

  private _createEdge(
    source: Node<t.Node>,
    target: Node<t.Node>,
    edgeType: EdgeType,
    label = ""
  ): Edge {
    return new Edge(
      `${source.id}->${target.id}`,
      edgeType,
      label,
      source.id,
      target.id,
      "description"
    );
  }

  /**
   * Connects the current parents to the given node
   * It uses the current edge type and resets it back to normal afterwards
   *
   * @param node
   */
  private _connectToParents(node: Node<t.Node>) {
    // it is actually possible that there are no parents
    for (const parent of this._currentParents) {
      this._edges.push(
        this._createEdge(this._nodes.get(parent), node, this._edgeType)
      );
      this._edgeType = EdgeType.NORMAL;
    }
  }

  public Block: (path: NodePath<t.Block>) => void = (path) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering block at ${this._getNodeId(path)}`
    );

    // we need to repeat this from the baseclass because we cannot use super.Program
    if (path.isProgram() && this._scopeIdOffset === undefined) {
      this._scopeIdOffset = this._getUidFromScope(path.scope);
      this._thisScopeStack.push(this._getUidFromScope(path.scope));
      this._thisScopeStackNames.push("global");
    }

    const node = this._createNode(path);

    this._connectToParents(node);
    this._currentParents = [node.id];

    for (const statement of path.get("body")) {
      statement.visit();
    }

    path.skip();
  };

  // functions
  public Function: (path: NodePath<t.Function>) => void = (path) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering function at ${this._getNodeId(path)}`
    );
    const subVisitor = new ControlFlowGraphVisitor(this.filePath);
    path.traverse(subVisitor);

    if (!subVisitor._nodes.has("ENTRY")) {
      // this function has no block
      // e.g. () => log("hello world")
      // we need to create a node for it
      if (subVisitor._nodes.size > 0) {
        throw new Error(
          `Function ${this._getNodeId(path)} has no entry node but has ${
            subVisitor._nodes.size
          } nodes`
        );
      }

      const entry = new Node<t.Node>("ENTRY", NodeType.ENTRY, "ENTRY", [], {});
      const successExit = new Node<t.Node>(
        "SUCCESS_EXIT",
        NodeType.EXIT,
        "EXIT",
        [],
        {}
      );
      const errorExit = new Node<t.Node>(
        "ERROR_EXIT",
        NodeType.EXIT,
        "EXIT",
        [],
        {}
      );

      subVisitor._nodes.set(entry.id, entry);
      subVisitor._nodes.set(successExit.id, successExit);
      subVisitor._nodes.set(errorExit.id, errorExit);

      this._currentParents = [entry.id];
      subVisitor._connectToParents(successExit);
    }

    this._functions.push(
      {
        id: this._getNodeId(path),
        name: "id" in path.node ? path.node.id?.name : "anonymous",
        graph: subVisitor.cfg.graph,
      },
      // sub functions within this function
      ...subVisitor.cfg.functions
    );

    path.skip();
  };

  // actual control flow graph related nodes
  public Statement: (path: NodePath<t.Statement>) => void = (path) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering statement: ${path.type}\tline: ${path.node.loc.start.line}\tcolumn: ${path.node.loc.start.column}`
    );
    const node = this._createNode(path);

    this._connectToParents(node);
    this._currentParents = [node.id];

    let expression;
    if (
      path.isExpressionStatement() &&
      ((expression = path.get("expression")),
      expression.isAssignmentExpression())
    ) {
      if (this._isSpecial(expression.get("right"))) {
        expression.get("right").visit();
      }
    } else if (this._isSpecial(path)) {
      path.traverse(this);
    }

    path.skip();
  };

  public Declaration: (path: NodePath<t.Declaration>) => void = (path) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering Declaration at ${this._getNodeId(path)}`
    );

    const node = this._createNode(path);

    this._connectToParents(node);
    this._currentParents = [node.id];

    if (path.has("declarations")) {
      const declarations = path.get("declarations");

      if (!Array.isArray(declarations)) {
        throw new TypeError("Declarations is not an array");
      }

      for (const declaration of declarations) {
        if (declaration.has("init")) {
          const init = declaration.get("init");

          if (Array.isArray(init)) {
            throw new TypeError("Init is an array");
          }

          if (this._isSpecial(init)) {
            init.visit();
          }
        }
      }
    } else if (this._isSpecial(path)) {
      path.traverse(this);
    }
    path.skip();
  };

  public Expression: (path: NodePath<t.Expression>) => void = (path) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering Expression at ${this._getNodeId(path)}`
    );

    this._generalNode(path);
  };

  public IfStatement: (path: NodePath<t.IfStatement>) => void = (path) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering IfStatement at ${this._getNodeId(path)}`
    );

    const branchNode = this._createNode(path); // or path.get("test") ??
    // TODO test

    this._connectToParents(branchNode);

    // consequent
    this._currentParents = [branchNode.id];
    this._edgeType = EdgeType.CONDITIONAL_TRUE;
    path.get("consequent").visit();
    const consequentNodes = this._currentParents;

    // alternate
    this._currentParents = [branchNode.id];
    this._edgeType = EdgeType.CONDITIONAL_FALSE;
    if (path.has("alternate")) {
      path.get("alternate").visit();
    } else {
      const alternate = this._createPlaceholderNode(path);
      this._connectToParents(alternate);
      this._currentParents = [alternate.id];
    }

    const alternateNodes = this._currentParents;

    this._currentParents = [...alternateNodes, ...consequentNodes];

    path.skip();
  };

  public DoWhileStatement: (path: NodePath<t.DoWhileStatement>) => void = (
    path
  ) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering DoWhileStatement at ${this._getNodeId(path)}`
    );

    this._breakNodesStack.push(new Set());
    this._continueNodesStack.push(new Set());

    const size = this._nodesList.length;
    // body
    path.get("body").visit();

    let firstBodyNode = this._nodesList[size];
    if (firstBodyNode === undefined) {
      // should never happen since we always add the block node
      // empty body
      // create placeholder node
      const placeholderNode = this._createPlaceholderNode(path);
      this._connectToParents(placeholderNode);
      this._currentParents = [placeholderNode.id];
      firstBodyNode = placeholderNode;
    }

    // loop
    const loopNode = this._createNode(path); // or path.get("test") ??
    // TODO test

    this._connectToParents(loopNode);

    // consequent
    // the back edge
    this._edges.push(
      this._createEdge(
        loopNode,
        firstBodyNode,
        EdgeType.CONDITIONAL_TRUE,
        EdgeType.BACK_EDGE
      )
    );

    // alternate
    this._currentParents = [loopNode.id];
    this._edgeType = EdgeType.CONDITIONAL_FALSE;

    // connect all break nodes to loop exit
    this._currentParents.push(...this._breakNodesStack.pop());

    // connect all continue nodes to test
    for (const continueNode of this._continueNodesStack.pop()) {
      this._edges.push(
        this._createEdge(
          this._nodes.get(continueNode),
          loopNode,
          EdgeType.BACK_EDGE,
          EdgeType.BACK_EDGE
        )
      );
    }

    path.skip();
  };

  public WhileStatement: (path: NodePath<t.WhileStatement>) => void = (
    path
  ) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering WhileStatement at ${this._getNodeId(path)}`
    );

    this._breakNodesStack.push(new Set());
    this._continueNodesStack.push(new Set());

    // loop
    const loopNode = this._createNode(path); // or path.get("test") ??
    // TODO test

    this._connectToParents(loopNode);

    // body
    this._currentParents = [loopNode.id];
    this._edgeType = EdgeType.CONDITIONAL_TRUE;
    const beforeSize = this._nodes.size;
    path.get("body").visit();

    // check if something was created
    if (beforeSize === this._nodes.size) {
      // empty body
      // create placeholder node
      const placeholderNode = this._createPlaceholderNode(path);
      this._connectToParents(placeholderNode);
      this._currentParents = [placeholderNode.id];
    }

    // the back edge
    this._edgeType = EdgeType.BACK_EDGE;
    this._connectToParents(loopNode); // TODO should be label back edge too

    // exit
    this._edgeType = EdgeType.CONDITIONAL_FALSE;
    this._currentParents = [loopNode.id];

    // connect all break nodes to loop exit
    this._currentParents.push(...this._breakNodesStack.pop());

    // connect all continue nodes to test entry
    for (const continueNode of this._continueNodesStack.pop()) {
      this._edges.push(
        this._createEdge(
          this._nodes.get(continueNode),
          loopNode,
          EdgeType.BACK_EDGE,
          EdgeType.BACK_EDGE
        )
      );
    }

    path.skip();
  };

  public ForStatement: (path: NodePath<t.ForStatement>) => void = (path) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering ForStatement at ${this._getNodeId(path)}`
    );

    this._breakNodesStack.push(new Set());
    this._continueNodesStack.push(new Set());

    // init
    if (path.has("init")) {
      path.get("init").visit();
    }

    // test
    if (!path.has("test")) {
      // unsupported
      throw new Error(
        `ForStatement test not implemented at ${this._getNodeId(path)}`
      );
    }

    // TODO test
    const testNode = this._createNode(path); // or path.get("test") ??
    this._connectToParents(testNode);
    this._currentParents = [testNode.id];

    // true
    // body
    this._edgeType = EdgeType.CONDITIONAL_TRUE;
    const beforeSize = this._nodes.size;
    path.get("body").visit();

    // check if something was created
    if (beforeSize === this._nodes.size) {
      // empty body
      // create placeholder node
      const placeholderNode = this._createPlaceholderNode(path);
      this._connectToParents(placeholderNode);
      this._currentParents = [placeholderNode.id];
    }

    // update
    if (!path.has("update")) {
      // unsupported
      throw new Error(
        `ForStatement update not implemented at ${this._getNodeId(path)}`
      );
    }

    path.get("update").visit();

    // connect to test
    this._edgeType = EdgeType.BACK_EDGE;
    this._connectToParents(testNode);

    // false
    this._edgeType = EdgeType.CONDITIONAL_FALSE;
    this._currentParents = [testNode.id];

    // connect all break nodes to loop exit
    this._currentParents.push(...this._breakNodesStack.pop());

    // connect all continue nodes to test
    for (const continueNode of this._continueNodesStack.pop()) {
      this._edges.push(
        this._createEdge(
          this._nodes.get(continueNode),
          testNode,
          EdgeType.BACK_EDGE,
          EdgeType.BACK_EDGE
        )
      );
    }

    path.skip();
  };

  public ForInStatement: (path: NodePath<t.ForInStatement>) => void = (
    path
  ) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering ForInStatement at ${this._getNodeId(path)}`
    );

    this._breakNodesStack.push(new Set());
    this._continueNodesStack.push(new Set());

    if (!path.has("left")) {
      // unsupported
      throw new Error(
        `ForInStatement left not implemented at ${this._getNodeId(path)}`
      );
    }
    if (!path.has("right")) {
      // unsupported
      throw new Error(
        `ForInStatement right not implemented at ${this._getNodeId(path)}`
      );
    }

    // left
    path.get("left").visit();

    // TODO test
    const testNode = this._createNode(path); // or path.get("test") ??
    this._connectToParents(testNode);
    this._currentParents = [testNode.id];

    // true
    // body
    this._edgeType = EdgeType.CONDITIONAL_TRUE;
    const beforeSize = this._nodes.size;
    path.get("body").visit();

    // check if something was created
    if (beforeSize === this._nodes.size) {
      // empty body
      // create placeholder node
      const placeholderNode = this._createPlaceholderNode(path);
      this._connectToParents(placeholderNode);
      this._currentParents = [placeholderNode.id];
    }

    // connect to test
    this._edgeType = EdgeType.BACK_EDGE;
    this._connectToParents(testNode);

    // false
    this._edgeType = EdgeType.CONDITIONAL_FALSE;
    this._currentParents = [testNode.id];

    // connect all break nodes to loop exit
    this._currentParents.push(...this._breakNodesStack.pop());

    // connect all continue nodes to test
    for (const continueNode of this._continueNodesStack.pop()) {
      this._edges.push(
        this._createEdge(
          this._nodes.get(continueNode),
          testNode,
          EdgeType.BACK_EDGE,
          EdgeType.BACK_EDGE
        )
      );
    }

    path.skip();
  };

  public ForOfStatement: (path: NodePath<t.ForOfStatement>) => void = (
    path
  ) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering ForOfStatement at ${this._getNodeId(path)}`
    );

    this._breakNodesStack.push(new Set());
    this._continueNodesStack.push(new Set());

    if (!path.has("left")) {
      // unsupported
      throw new Error(
        `ForOfStatement left not implemented at ${this._getNodeId(path)}`
      );
    }
    if (!path.has("right")) {
      // unsupported
      throw new Error(
        `ForOfStatement right not implemented at ${this._getNodeId(path)}`
      );
    }

    // left
    path.get("left").visit();

    // TODO test
    const testNode = this._createNode(path); // or path.get("test") ??
    this._connectToParents(testNode);
    this._currentParents = [testNode.id];

    // true
    // body
    this._edgeType = EdgeType.CONDITIONAL_TRUE;
    const beforeSize = this._nodes.size;
    path.get("body").visit();

    // check if something was created
    if (beforeSize === this._nodes.size) {
      // empty body
      // create placeholder node
      const placeholderNode = this._createPlaceholderNode(path);
      this._connectToParents(placeholderNode);
      this._currentParents = [placeholderNode.id];
    }

    // connect to test
    this._edgeType = EdgeType.BACK_EDGE;
    this._connectToParents(testNode);

    // false
    this._edgeType = EdgeType.CONDITIONAL_FALSE;
    this._currentParents = [testNode.id];

    // connect all break nodes to loop exit
    this._currentParents.push(...this._breakNodesStack.pop());

    // connect all continue nodes to loop entry
    for (const continueNode of this._continueNodesStack.pop()) {
      this._edges.push(
        this._createEdge(
          this._nodes.get(continueNode),
          testNode,
          EdgeType.BACK_EDGE,
          EdgeType.BACK_EDGE
        )
      );
    }

    path.skip();
  };

  public SwitchStatement: (path: NodePath<t.SwitchStatement>) => void = (
    path
  ) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering SwitchStatement at ${this._getNodeId(path)}`
    );

    this._breakNodesStack.push(new Set());

    // TODO test
    const testNode = this._createNode(path); // or path.get("test") ??
    this._connectToParents(testNode);
    this._currentParents = [testNode.id];

    for (const caseNode of path.get("cases")) {
      // TODO test
      const caseTestNode = this._createNode(caseNode); // or path.get("test") ??
      this._connectToParents(caseTestNode);
      this._currentParents = [caseTestNode.id];

      if (caseNode.has("test")) {
        // case
        this._edgeType = EdgeType.CONDITIONAL_TRUE;
      }

      // consequent
      if (caseNode.get("consequent").length === 0) {
        // empty body
        // create placeholder node
        const placeholderNode = this._createPlaceholderNode(caseNode);
        this._connectToParents(placeholderNode);
        this._currentParents = [placeholderNode.id];
      } else {
        for (const consequentNode of caseNode.get("consequent")) {
          consequentNode.visit();
        }
      }

      if (caseNode.has("test")) {
        // case
        this._edgeType = EdgeType.CONDITIONAL_FALSE;
        this._currentParents = [caseTestNode.id, ...this._currentParents];
      } else {
        // default
        this._currentParents = [...this._currentParents];
      }
    }

    // connect all break nodes to switch exit
    this._currentParents.push(...this._breakNodesStack.pop());

    path.skip();
  };

  // terminating statements
  // these statements are the end of a path
  // so they don't have any children
  // which is why we empty the parents list instead of adding the node to it

  public BreakStatement: (path: NodePath<t.BreakStatement>) => void = (
    path
  ) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering BreakStatement at ${this._getNodeId(path)}`
    );

    const node = this._createNode(path);
    this._connectToParents(node);

    this._getBreakNodes().add(node.id);
    this._currentParents = [];
    path.skip();
  };

  public ContinueStatement: (path: NodePath<t.ContinueStatement>) => void = (
    path
  ) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering ContinueStatement at ${this._getNodeId(path)}`
    );

    const node = this._createNode(path);
    this._connectToParents(node);

    this._getContinueNodes().add(node.id);
    this._currentParents = [];
    path.skip();
  };

  public ReturnStatement: (path: NodePath<t.ReturnStatement>) => void = (
    path
  ) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering ReturnStatement at ${this._getNodeId(path)}`
    );

    const node = this._createNode(path);
    this._connectToParents(node);
    this._currentParents = [node.id];

    if (path.has("argument")) {
      path.get("argument").visit();
    }

    for (const nodeId of this._currentParents) {
      this._returnNodes.add(nodeId);
    }

    this._currentParents = [];
    path.skip();
  };

  public ThrowStatement: (path: NodePath<t.ThrowStatement>) => void = (
    path
  ) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering ThrowStatement at ${this._getNodeId(path)}`
    );

    const node = this._createNode(path);
    this._connectToParents(node);

    this._throwNodes.add(node.id);
    this._currentParents = [];
    path.skip();
  };
}
