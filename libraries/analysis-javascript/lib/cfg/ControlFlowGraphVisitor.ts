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
import { ImplementationError } from "@syntest/diagnostics";
import { getLogger, Logger } from "@syntest/logging";

export class ControlFlowGraphVisitor extends AbstractSyntaxTreeVisitor {
  protected static override LOGGER: Logger;

  private _nodesList: Node[];
  private _nodes: Map<string, Node>;
  private _edges: Edge[];

  private _labeledBreakNodes: Map<string, Set<string>>;
  private _labeledContinueNodes: Map<string, Set<string>>;

  private _regularBreakNodesStack: Set<string>[];
  private _regularContinueNodesStack: Set<string>[];
  private _returnNodes: Set<string>;
  private _throwNodes: Set<string>;

  private _functions: ControlFlowFunction[];

  private _currentParents: string[];
  private _edgeType: EdgeType;

  get cfg(): ControlFlowProgram {
    if (!this._nodes.has("ENTRY")) {
      throw new ImplementationError("No entry node found");
    }
    if (!this._nodes.has("SUCCESS_EXIT")) {
      throw new ImplementationError("No success exit node found");
    }
    if (!this._nodes.has("ERROR_EXIT")) {
      throw new ImplementationError("No error exit node found");
    }

    if (this._nodesList.length !== this._nodes.size) {
      throw new ImplementationError("Number of nodes dont match");
    }

    const entryNode = this._nodes.get("ENTRY");
    const successExitNode = this._nodes.get("SUCCESS_EXIT");
    const errorExitNode = this._nodes.get("ERROR_EXIT");

    if (this._currentParents[0] === "ENTRY") {
      // nothing added so we add
    }

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

    if (this._regularBreakNodesStack.length > 0) {
      ControlFlowGraphVisitor.LOGGER.warn(
        `Found ${this._regularBreakNodesStack.length} break node stacks that are not connected to a loop`
      );
    }

    if (this._regularContinueNodesStack.length > 0) {
      ControlFlowGraphVisitor.LOGGER.warn(
        `Found ${this._regularContinueNodesStack.length} continue node stacks that are not connected to a loop`
      );
    }

    if (this._labeledBreakNodes.size > 0) {
      ControlFlowGraphVisitor.LOGGER.warn(
        `Found ${this._labeledBreakNodes.size} break node labels that are not connected to a label exit`
      );
    }

    if (this._labeledContinueNodes.size > 0) {
      ControlFlowGraphVisitor.LOGGER.warn(
        `Found ${this._labeledContinueNodes.size} continue node labels that are not connected to a label exit`
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
      functions: this._functions.map((function_, index) => {
        if (
          this._functions.filter((f) => f.name === function_.name).length > 1
        ) {
          function_.name = `${function_.name} (${index})`;
        }
        return function_;
      }),
    };
  }

  constructor(filePath: string, syntaxForgiving: boolean) {
    super(filePath, syntaxForgiving);
    ControlFlowGraphVisitor.LOGGER = getLogger("ControlFlowGraphVisitor");

    this._nodesList = [];
    this._nodes = new Map<string, Node>();
    this._edges = [];

    this._labeledBreakNodes = new Map();
    this._labeledContinueNodes = new Map();
    this._regularBreakNodesStack = [];
    this._regularContinueNodesStack = [];
    this._returnNodes = new Set<string>();
    this._throwNodes = new Set<string>();

    this._functions = [];

    this._currentParents = [];

    this._edgeType = EdgeType.NORMAL;

    const entry = new Node("ENTRY", NodeType.ENTRY, "ENTRY", [], {});
    const successExit = new Node("SUCCESS_EXIT", NodeType.EXIT, "EXIT", [], {});
    const errorExit = new Node("ERROR_EXIT", NodeType.EXIT, "EXIT", [], {});

    this._nodes.set(entry.id, entry);
    this._nodes.set(successExit.id, successExit);
    this._nodes.set(errorExit.id, errorExit);
    this._nodesList.push(entry, successExit, errorExit);

    this._currentParents = [entry.id];
  }

  private _getBreakNodes(): Set<string> {
    if (this._regularBreakNodesStack.length === 0) {
      throw new ImplementationError("No break nodes found");
    }
    return this._regularBreakNodesStack[
      this._regularBreakNodesStack.length - 1
    ];
  }

  private _getContinueNodes(): Set<string> {
    if (this._regularContinueNodesStack.length === 0) {
      throw new ImplementationError("No continue nodes found");
    }
    return this._regularContinueNodesStack[
      this._regularContinueNodesStack.length - 1
    ];
  }

  private _getLocation(path: NodePath): Location {
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

  private _createNode(path: NodePath): Node {
    const id = `${this._getNodeId(path)}`;
    const node = new Node(
      id,
      NodeType.NORMAL,
      path.node.type,
      [
        {
          id: id,
          location: this._getLocation(path),
          statementAsText: path.toString(),
        },
      ],
      {},
      path.node.type
    );

    if (this._nodes.has(id)) {
      throw new ImplementationError("Node already registered", {
        context: { nodeId: id },
      });
    }
    this._nodes.set(id, node);
    this._nodesList.push(node);

    return node;
  }

  public _getPlaceholderNodeId(path: NodePath<t.Node>): string {
    if (path.node.loc === undefined) {
      throw new ImplementationError(
        `Node ${path.type} in file '${this._filePath}' does not have a location`
      );
    }

    const startLine = (<{ line: number }>(<unknown>path.node.loc.start)).line;
    const startColumn = (<{ column: number }>(<unknown>path.node.loc.start))
      .column;
    const startIndex = (<{ index: number }>(<unknown>path.node.loc.start))
      .index;
    const endLine = (<{ line: number }>(<unknown>path.node.loc.end)).line;
    const endColumn = (<{ column: number }>(<unknown>path.node.loc.end)).column;
    const endIndex = (<{ index: number }>(<unknown>path.node.loc.end)).index;

    return `${this._filePath}:${startLine}:${startColumn}:::${endLine}:${endColumn}:::${startIndex}:${endIndex}`;
  }

  /**
   * Create a placeholder node for a node that is not in the AST, but is used in the CFG.
   * Uses the end location of the parent node as the start and end location of the placeholder node.
   * @param path
   * @returns
   */
  private _createPlaceholderNode(path: NodePath, double = false): Node {
    let id = `placeholder:::${this._getPlaceholderNodeId(path)}`;
    if (double) {
      id = "placeholder:::" + id;
    }
    const location = this._getLocation(path);
    const node = new Node(
      id,
      NodeType.NORMAL,
      path.node.type,
      [
        {
          id: id,
          location: {
            start: {
              line: location.start.line,
              column: location.start.column,
              index: location.start.index,
            },
            end: {
              line: location.end.line,
              column: location.end.column,
              index: location.end.index,
            },
          },
          statementAsText: path.toString(),
        },
      ],
      {},
      path.node.type
    );

    if (this._nodes.has(id)) {
      throw new ImplementationError("Node already registered", {
        context: { nodeId: id },
      });
    }
    this._nodes.set(id, node);
    this._nodesList.push(node);

    return node;
  }

  private _createEdge(
    source: Node,
    target: Node,
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
  private _connectToParents(node: Node) {
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

    if (!this._nodes.has(this._getNodeId(path))) {
      const node = this._createNode(path);

      this._connectToParents(node);
      this._currentParents = [node.id];
    }

    const subVisitor = new ControlFlowGraphVisitor(
      this.filePath,
      this.syntaxForgiving
    );
    path.traverse(subVisitor);

    if (!subVisitor._nodes.has("ENTRY")) {
      throw new ImplementationError("No entry node found");
    }

    const name = path.has("id")
      ? (<NodePath<t.Identifier>>path.get("id")).node.name
      : path.has("key")
      ? (<NodePath<t.Identifier>>path.get("key")).node.name
      : "anonymous";

    const cfp = subVisitor.cfg;

    this._functions.push(
      {
        id: this._getNodeId(path),
        name: name,
        graph: cfp.graph,
      },
      // sub functions within this function
      ...cfp.functions
    );

    path.skip();
  };

  // actual control flow graph related nodes
  public Statement: (path: NodePath<t.Statement>) => void = (path) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering statement: ${path.type}\tline: ${path.node.loc.start.line}\tcolumn: ${path.node.loc.start.column}`
    );

    if (this._nodes.has(this._getNodeId(path))) {
      throw new ImplementationError("Id already used", {
        context: { nodeId: this._getNodeId(path) },
      });
    } else {
      const node = this._createNode(path);

      this._connectToParents(node);
      this._currentParents = [node.id];
    }
  };

  public Expression: (path: NodePath<t.Expression>) => void = (path) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering Expression at ${this._getNodeId(path)}`
    );

    if (this._nodes.has(this._getNodeId(path))) {
      // just ignore
    } else if (!path.isLiteral() && !path.isIdentifier()) {
      const node = this._createNode(path);

      this._connectToParents(node);
      this._currentParents = [node.id];
    }
  };

  public Conditional: (path: NodePath<t.Conditional>) => void = (path) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering IfStatement at ${this._getNodeId(path)}`
    );

    const branchNode = this._createNode(path);
    this._connectToParents(branchNode);
    this._currentParents = [branchNode.id];

    const testNode = this._createNode(path.get("test"));
    this._connectToParents(testNode);
    this._currentParents = [testNode.id];

    // consequent
    this._edgeType = EdgeType.CONDITIONAL_TRUE;
    let sizeBefore = this._nodesList.length;
    path.get("consequent").visit();

    // there either is no consequent or it is empty
    if (sizeBefore === this._nodesList.length) {
      const consequent = this._createNode(path.get("consequent"));
      this._connectToParents(consequent);
      this._currentParents = [consequent.id];
    }
    const consequentNodes = this._currentParents;

    // alternate
    this._currentParents = [testNode.id];
    this._edgeType = EdgeType.CONDITIONAL_FALSE;

    sizeBefore = this._nodesList.length;
    if (path.has("alternate")) {
      path.get("alternate").visit();
    }

    // there either is no alternate or it is empty
    if (sizeBefore === this._nodesList.length) {
      if (path.has("alternate")) {
        const alternate = this._createNode(path.get("alternate"));
        this._connectToParents(alternate);
        this._currentParents = [alternate.id];
      } else {
        const alternate = this._createPlaceholderNode(path);
        this._connectToParents(alternate);
        this._currentParents = [alternate.id];
      }
    }

    const alternateNodes = this._currentParents;

    this._currentParents = [...alternateNodes, ...consequentNodes];

    path.skip();
  };

  // labels
  public LabeledStatement: (path: NodePath<t.LabeledStatement>) => void = (
    path
  ) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering LabeledStatement at ${this._getNodeId(path)}`
    );

    const label = path.get("label").node.name;

    this._labeledBreakNodes.set(label, new Set());
    this._labeledContinueNodes.set(label, new Set());

    const labelNode = this._createNode(path);
    this._connectToParents(labelNode);

    // body
    this._currentParents = [labelNode.id];
    const beforeSize = this._nodes.size;
    path.get("body").visit();

    // check if something was created
    if (beforeSize === this._nodes.size) {
      // empty body
      // create placeholder node
      const placeholderNode = this._createPlaceholderNode(path.get("body"));
      this._connectToParents(placeholderNode);
      this._currentParents = [placeholderNode.id];
    }

    // exit
    const labelExit = this._createPlaceholderNode(path, true);

    // connect all break nodes to exit
    this._currentParents.push(...this._labeledBreakNodes.get(label));
    this._connectToParents(labelExit);
    this._currentParents = [labelExit.id];
    // connect all continue nodes to label entry
    for (const continueNode of this._labeledContinueNodes.get(label)) {
      this._edges.push(
        this._createEdge(
          this._nodes.get(continueNode),
          labelNode,
          EdgeType.BACK_EDGE
        )
      );
    }

    // remove labeled break/continues
    this._labeledBreakNodes.delete(label);
    this._labeledContinueNodes.delete(label);

    path.skip();
  };

  // loops
  public DoWhileStatement: (path: NodePath<t.DoWhileStatement>) => void = (
    path
  ) => {
    ControlFlowGraphVisitor.LOGGER.debug(
      `Entering DoWhileStatement at ${this._getNodeId(path)}`
    );

    const doWhileNode = this._createNode(path);
    this._connectToParents(doWhileNode);
    this._currentParents = [doWhileNode.id];

    this._regularBreakNodesStack.push(new Set());
    this._regularContinueNodesStack.push(new Set());

    const size = this._nodesList.length;
    // body
    path.get("body").visit();

    let firstBodyNode = this._nodesList[size];
    if (firstBodyNode === undefined) {
      // empty body
      // create placeholder node
      const placeholderNode = this._createPlaceholderNode(path.get("body"));
      this._connectToParents(placeholderNode);
      this._currentParents = [placeholderNode.id];
      firstBodyNode = placeholderNode;
    }

    // loop
    const loopNode = this._createNode(path.get("test"));
    this._connectToParents(loopNode);

    // consequent
    this._currentParents = [loopNode.id];
    this._edgeType = EdgeType.CONDITIONAL_TRUE;
    const consequent = this._createPlaceholderNode(path.get("test")); // bit of a hack to use the test
    this._connectToParents(consequent);

    // the back edge
    this._edges.push(
      this._createEdge(consequent, firstBodyNode, EdgeType.BACK_EDGE)
    );

    // false
    this._currentParents = [loopNode.id];
    this._edgeType = EdgeType.CONDITIONAL_FALSE;
    const alternate = this._createPlaceholderNode(path);
    this._connectToParents(alternate);

    // exit
    this._currentParents = [alternate.id];
    const loopExit = this._createPlaceholderNode(path, true);

    // connect all break nodes to loop exit
    this._currentParents.push(...this._regularBreakNodesStack.pop());
    this._connectToParents(loopExit);
    this._currentParents = [loopExit.id];

    // connect all continue nodes to test
    for (const continueNode of this._regularContinueNodesStack.pop()) {
      this._edges.push(
        this._createEdge(
          this._nodes.get(continueNode),
          loopNode,
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

    const whileNode = this._createNode(path);
    this._connectToParents(whileNode);
    this._currentParents = [whileNode.id];

    this._regularBreakNodesStack.push(new Set());
    this._regularContinueNodesStack.push(new Set());

    // loop
    const loopNode = this._createNode(path.get("test"));

    this._connectToParents(loopNode);

    // true body
    this._currentParents = [loopNode.id];
    this._edgeType = EdgeType.CONDITIONAL_TRUE;
    const beforeSize = this._nodes.size;
    path.get("body").visit();

    // check if something was created
    if (beforeSize === this._nodes.size) {
      // empty body
      // create placeholder node
      const placeholderNode = this._createPlaceholderNode(path.get("body"));
      this._connectToParents(placeholderNode);
      this._currentParents = [placeholderNode.id];
    }

    // the back edge
    this._edgeType = EdgeType.BACK_EDGE;
    this._connectToParents(loopNode); // TODO should be label back edge too

    // false
    this._currentParents = [loopNode.id];
    this._edgeType = EdgeType.CONDITIONAL_FALSE;
    const alternate = this._createPlaceholderNode(path);
    this._connectToParents(alternate); // TODO should be label back edge too

    // exit
    this._currentParents = [alternate.id];
    const loopExit = this._createPlaceholderNode(path, true);

    // connect all break nodes to loop exit
    this._currentParents.push(...this._regularBreakNodesStack.pop());
    this._connectToParents(loopExit);
    this._currentParents = [loopExit.id];

    // connect all continue nodes to test entry
    for (const continueNode of this._regularContinueNodesStack.pop()) {
      this._edges.push(
        this._createEdge(
          this._nodes.get(continueNode),
          loopNode,
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

    const forNode = this._createNode(path);
    this._connectToParents(forNode);
    this._currentParents = [forNode.id];

    this._regularBreakNodesStack.push(new Set());
    this._regularContinueNodesStack.push(new Set());

    // init
    if (path.has("init")) {
      const init = path.get("init");
      // stupid hack because the variable declaration of an init is not registered correctly?
      if (init.isVariableDeclaration()) {
        const node = this._createNode(init.get("declarations")[0].get("init"));

        this._connectToParents(node);
        this._currentParents = [node.id];
      } else {
        init.visit();
      }
    }

    // test
    let testNode;
    if (path.has("test")) {
      testNode = this._createNode(path.get("test"));
      this._connectToParents(testNode);
      this._currentParents = [testNode.id];
      // true
      this._edgeType = EdgeType.CONDITIONAL_TRUE;
    }

    // body
    let beforeSize = this._nodes.size;
    path.get("body").visit();

    // check if something was created
    if (beforeSize === this._nodes.size) {
      // empty body
      // create placeholder node
      const placeholderNode = this._createPlaceholderNode(path.get("body"));
      this._connectToParents(placeholderNode);
      this._currentParents = [placeholderNode.id];
    }

    // update
    if (path.has("update")) {
      beforeSize = this._nodesList.length;
      path.get("update").visit();

      if (beforeSize === this._nodesList.length) {
        throw new ImplementationError(
          `No node was added for the update part of the for loop`
        );
      }
    }

    // connect to test
    if (path.has("test")) {
      this._edgeType = EdgeType.BACK_EDGE;
      this._connectToParents(testNode);
      // false
      this._currentParents = [testNode.id];
      this._edgeType = EdgeType.CONDITIONAL_FALSE;

      const alternate = this._createPlaceholderNode(path);
      this._connectToParents(alternate);
      this._currentParents = [alternate.id];
    } else {
      this._currentParents = [];
    }

    // exit
    const loopExit = this._createPlaceholderNode(path, true);

    // connect all break nodes to loop exit
    this._currentParents.push(...this._regularBreakNodesStack.pop());
    this._connectToParents(loopExit);
    this._currentParents = [loopExit.id];

    // connect all continue nodes to test
    for (const continueNode of this._regularContinueNodesStack.pop()) {
      this._edges.push(
        this._createEdge(
          this._nodes.get(continueNode),
          testNode,
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

    const forInNode = this._createNode(path);
    this._connectToParents(forInNode);
    this._currentParents = [forInNode.id];

    this._regularBreakNodesStack.push(new Set());
    this._regularContinueNodesStack.push(new Set());

    if (!path.has("left")) {
      // unsupported
      throw new ImplementationError("ForInStatement left not implemented", {
        context: { nodeId: this._getNodeId(path) },
      });
    }
    if (!path.has("right")) {
      // unsupported
      throw new ImplementationError("ForInStatement right not implemented", {
        context: { nodeId: this._getNodeId(path) },
      });
    }

    // left
    path.get("left").visit();

    // test does not exist so we create placeholder?
    const testNode = this._createPlaceholderNode(path.get("left")); // stupid hack but we cannot have the placeholder twice
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
      const placeholderNode = this._createPlaceholderNode(path.get("body"));
      this._connectToParents(placeholderNode);
      this._currentParents = [placeholderNode.id];
    }

    // connect to test
    this._edgeType = EdgeType.BACK_EDGE;
    this._connectToParents(testNode);

    // false
    this._currentParents = [testNode.id];
    this._edgeType = EdgeType.CONDITIONAL_FALSE;
    const alternate = this._createPlaceholderNode(path);
    this._connectToParents(alternate);

    // exit
    this._currentParents = [alternate.id];
    const loopExit = this._createPlaceholderNode(path, true);

    // connect all break nodes to loop exit
    this._currentParents.push(...this._regularBreakNodesStack.pop());
    this._connectToParents(loopExit);
    this._currentParents = [loopExit.id];

    // connect all continue nodes to test
    for (const continueNode of this._regularContinueNodesStack.pop()) {
      this._edges.push(
        this._createEdge(
          this._nodes.get(continueNode),
          testNode,
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

    const forOfNode = this._createNode(path);
    this._connectToParents(forOfNode);
    this._currentParents = [forOfNode.id];

    this._regularBreakNodesStack.push(new Set());
    this._regularContinueNodesStack.push(new Set());

    if (!path.has("left")) {
      // unsupported
      throw new ImplementationError("ForInStatement left not implemented", {
        context: { nodeId: this._getNodeId(path) },
      });
    }
    if (!path.has("right")) {
      // unsupported
      throw new ImplementationError("ForInStatement right not implemented", {
        context: { nodeId: this._getNodeId(path) },
      });
    }

    // left
    path.get("left").visit();

    // test does not exist so we create placeholder?
    const testNode = this._createPlaceholderNode(path.get("left")); // stupid hack but we cannot have the placeholder twice
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
      const placeholderNode = this._createPlaceholderNode(path.get("body"));
      this._connectToParents(placeholderNode);
      this._currentParents = [placeholderNode.id];
    }

    // connect to test
    this._edgeType = EdgeType.BACK_EDGE;
    this._connectToParents(testNode);

    // false
    this._currentParents = [testNode.id];
    this._edgeType = EdgeType.CONDITIONAL_FALSE;
    const alternate = this._createPlaceholderNode(path);
    this._connectToParents(alternate);

    // exit
    this._currentParents = [alternate.id];
    const loopExit = this._createPlaceholderNode(path, true);

    // connect all break nodes to loop exit
    this._currentParents.push(...this._regularBreakNodesStack.pop());
    this._connectToParents(loopExit);
    this._currentParents = [loopExit.id];

    // connect all continue nodes to loop entry
    for (const continueNode of this._regularContinueNodesStack.pop()) {
      this._edges.push(
        this._createEdge(
          this._nodes.get(continueNode),
          testNode,
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

    this._regularBreakNodesStack.push(new Set());

    const switchNode = this._createNode(path);
    this._connectToParents(switchNode);
    this._currentParents = [switchNode.id];

    const testNode = this._createNode(path.get("discriminant"));
    this._connectToParents(testNode);
    this._currentParents = [testNode.id];
    let fallThrough: string[] = [];

    for (const caseNode of path.get("cases")) {
      if (caseNode.has("test")) {
        // test
        const caseTestNode = this._createNode(caseNode.get("test"));
        this._connectToParents(caseTestNode);
        this._currentParents = [caseTestNode.id];

        // consequent
        this._edgeType = EdgeType.CONDITIONAL_TRUE;
        const consequentNode = this._createNode(caseNode);
        this._connectToParents(consequentNode);
        this._currentParents = [consequentNode.id, ...fallThrough];

        if (caseNode.get("consequent").length > 0) {
          for (const consequentNode of caseNode.get("consequent")) {
            consequentNode.visit();
          }
        }

        const trueParents = this._currentParents; // if there is a break these should be empty
        fallThrough = [...trueParents]; // fall through

        // alternate
        // placeholder
        this._edgeType = EdgeType.CONDITIONAL_FALSE;
        this._currentParents = [caseTestNode.id];
        const alternateNode = this._createPlaceholderNode(caseNode);
        this._connectToParents(alternateNode);
        this._currentParents = [alternateNode.id]; // normal
      } else {
        // default
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
      }
    }
    // exit
    const switchExit = this._createPlaceholderNode(path, true);

    this._currentParents.push(
      // connect fall through nodes to switch exit
      ...fallThrough,
      // connect all break nodes to switch exit
      ...this._regularBreakNodesStack.pop()
    );
    this._connectToParents(switchExit);
    this._currentParents = [switchExit.id];

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
    if (path.has("label")) {
      // labeled break node
      const label = path.get("label").node.name;
      if (!this._labeledBreakNodes.has(label)) {
        throw new ImplementationError("Label does not exist for break node", {
          context: { label: label, id: this._getNodeId(path) },
        });
      }
      this._labeledBreakNodes.get(label).add(node.id);
    } else {
      // regular break node
      this._getBreakNodes().add(node.id);
    }
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

    if (path.has("label")) {
      // labeled continue node
      const label = path.get("label").node.name;
      if (!this._labeledContinueNodes.has(label)) {
        throw new ImplementationError("Label does not exist for break node", {
          context: { label: label, id: this._getNodeId(path) },
        });
      }
      this._labeledContinueNodes.get(label).add(node.id);
    } else {
      // regular continue node
      this._getContinueNodes().add(node.id);
    }
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
