import { defaults } from "@istanbuljs/schema";
import { VisitState } from "./VisitState";
import { createHash } from "crypto";
import { template } from "@babel/core";

const { name } = require("../../package.json");

// increment this version if there are schema changes
// that are not backwards compatible:
const VERSION = "4";

const SHA = "sha1";
const MAGIC_KEY = "_coverageSchema";
const MAGIC_VALUE = createHash(SHA)
  .update(name + "@" + VERSION)
  .digest("hex");

// pattern for istanbul to ignore the whole file
const COMMENT_FILE_RE = /^\s*istanbul\s+ignore\s+(file)(?=\W|$)/;

export class Visitor {
  private types: any;
  private sourceFilePath: string;
  private opts: any;
  private visitState: VisitState;

  constructor(types, sourceFilePath = "unknown.js", opts: VisitorOptions = {}) {
    this.types = types;
    this.sourceFilePath = sourceFilePath;
    this.opts = {
      ...defaults.instrumentVisitor,
      ...opts,
    };
    this.visitState = new VisitState(
      types,
      sourceFilePath,
      opts.inputSourceMap,
      opts.ignoreClassMethods,
      opts.reportLogic
    );
  }

  enter(path) {
    if (shouldIgnoreFile(path.find((p) => p.isProgram()))) {
      return;
    }
    if (alreadyInstrumented(path, this.visitState)) {
      return;
    }
    path.traverse(codeVisitor, this.visitState);
  }

  exit(path) {
    if (alreadyInstrumented(path, this.visitState)) {
      return;
    }
    this.visitState.cov.freeze();
    const coverageData = this.visitState.cov.toJSON();
    if (shouldIgnoreFile(path.find((p) => p.isProgram()))) {
      return {
        fileCoverage: coverageData,
        sourceMappingURL: this.visitState.sourceMappingURL,
      };
    }
    coverageData[MAGIC_KEY] = MAGIC_VALUE;
    const hash = createHash(SHA)
      .update(JSON.stringify(coverageData))
      .digest("hex");
    coverageData.hash = hash;
    const coverageNode = this.types.valueToNode(coverageData);
    delete coverageData[MAGIC_KEY];
    delete coverageData.hash;
    let gvTemplate;
    if (this.opts.coverageGlobalScopeFunc) {
      if (path.scope.getBinding("Function")) {
        gvTemplate = globalTemplateAlteredFunction({
          GLOBAL_COVERAGE_SCOPE: this.types.stringLiteral(
            "return " + this.opts.coverageGlobalScope
          ),
        });
      } else {
        gvTemplate = globalTemplateFunction({
          GLOBAL_COVERAGE_SCOPE: this.types.stringLiteral(
            "return " + this.opts.coverageGlobalScope
          ),
        });
      }
    } else {
      gvTemplate = globalTemplateVariable({
        GLOBAL_COVERAGE_SCOPE: this.opts.coverageGlobalScope,
      });
    }
    const cv = coverageTemplate({
      GLOBAL_COVERAGE_VAR: this.types.stringLiteral(this.opts.coverageVariable),
      GLOBAL_COVERAGE_TEMPLATE: gvTemplate,
      COVERAGE_FUNCTION: this.types.identifier(this.visitState.varName),
      PATH: this.types.stringLiteral(this.sourceFilePath),
      INITIAL: coverageNode,
      HASH: this.types.stringLiteral(hash),
    });

    const meta = metaTemplate({
      GLOBAL_META_VAR: "\"__meta__\"",
      META_FUNCTION: this.types.identifier(this.visitState.metaVarName),
      PATH: this.types.stringLiteral(this.sourceFilePath),
      HASH: this.types.stringLiteral(hash),
    });

    // explicitly call this.varName to ensure coverage is always initialized
    path.node.body.unshift(
      this.types.expressionStatement(
        this.types.callExpression(
          this.types.identifier(this.visitState.varName),
          []
        )
      )
    );
    path.node.body.unshift(cv);
    path.node.body.unshift(meta)
    return {
      fileCoverage: coverageData,
      sourceMappingURL: this.visitState.sourceMappingURL,
    };
  }
}

// generic function that takes a set of visitor methods and
// returns a visitor object with `enter` and `exit` properties,
// such that:
//
// * standard entry processing is done
// * the supplied visitors are called only when ignore is not in effect
//   This relieves them from worrying about ignore states and generated nodes.
// * standard exit processing is done
//
function entries(...enter) {
  // the enter function
  const wrappedEntry = function (path, node) {
    this.onEnter(path);
    if (this.shouldIgnore(path)) {
      return;
    }
    enter.forEach((e) => {
      e.call(this, path, node);
    });
  };
  const exit = function (path, node) {
    this.onExit(path, node);
  };
  return {
    enter: wrappedEntry,
    exit,
  };
}

function coverStatement(path) {
  this.insertStatementCounter(path);
}

/* istanbul ignore next: no node.js support */
function coverAssignmentPattern(path) {
  const n = path.node;
  const b = this.cov.newBranch("default-arg", n.loc);
  this.insertBranchCounter(path.get("right"), b);
}

function coverFunction(path) {
  this.insertFunctionCounter(path);
}

function coverVariableDeclarator(path) {
  this.insertStatementCounter(path.get("init"));
}

function coverClassPropDeclarator(path) {
  this.insertStatementCounter(path.get("value"));
}

function makeBlock(path) {
  const T = this.types;
  if (!path.node) {
    path.replaceWith(T.blockStatement([]));
  }
  if (!path.isBlockStatement()) {
    path.replaceWith(T.blockStatement([path.node]));
    path.node.loc = path.node.body[0].loc;
    path.node.body[0].leadingComments = path.node.leadingComments;
    path.node.leadingComments = undefined;
  }
}

function blockProp(prop) {
  return function (path) {
    makeBlock.call(this, path.get(prop));
  };
}

function makeParenthesizedExpressionForNonIdentifier(path) {
  const T = this.types;
  if (path.node && !path.isIdentifier()) {
    path.replaceWith(T.parenthesizedExpression(path.node));
  }
}

function parenthesizedExpressionProp(prop) {
  return function (path) {
    makeParenthesizedExpressionForNonIdentifier.call(this, path.get(prop));
  };
}

function convertArrowExpression(path) {
  const n = path.node;
  const T = this.types;
  if (!T.isBlockStatement(n.body)) {
    const bloc = n.body.loc;
    if (n.expression === true) {
      n.expression = false;
    }
    n.body = T.blockStatement([T.returnStatement(n.body)]);
    // restore body location
    n.body.loc = bloc;
    // set up the location for the return statement so it gets
    // instrumented
    n.body.body[0].loc = bloc;
  }
}

function coverIfBranches(path) {
  const n = path.node;
  const hint = this.hintFor(n);
  const ignoreIf = hint === "if";
  const ignoreElse = hint === "else";
  const branch = this.cov.newBranch("if", n.loc);

  if (ignoreIf) {
    this.setAttr(n.consequent, "skip-all", true);
  } else {
    this.insertBranchCounter(path.get("consequent"), branch, n.loc);
  }
  if (ignoreElse) {
    this.setAttr(n.alternate, "skip-all", true);
  } else {
    this.insertBranchCounter(path.get("alternate"), branch);
  }

  const T = this.types;
  const test = path.get('test')
  const variables = []
  test.traverse({
    Identifier: {
      enter: (p) => {
        if (p.parent.type === "MemberExpression") {
          return
        }
        variables.push(p.node.name)
      }
    },
    MemberExpression: {
      enter: (p) => {
        // calls and such are possible but are problamatic because they could have side effects changing the behaviour
        if (p.node.object.type === 'Identifier' && p.node.property.type === 'Identifier') {
          variables.push(p.getSource())
        }
      }
    }
    // calls and such are possible but are problamatic because they could have side effects changing the behaviour
  }, test)
  const metaTracker = this.getBranchMetaTracker(branch, test.node, test.getSource(), variables)
  path.insertBefore(T.expressionStatement(metaTracker));
}

function coverLoopBranch(path) {
  const n = path.node;
  const branch = this.cov.newBranch("loop", n.loc);

  this.insertBranchCounter(path.get("body"), branch, n.loc);

  const T = this.types;

  const increment = this.getBranchIncrement(branch, path.node.loc);
  path.insertAfter(T.expressionStatement(increment));

  // TODO we should actually print what the just defined variable is set to
  const justDefinedVariables = []

  path.get('init').traverse({
    VariableDeclarator: {
      enter: (p) => {
        justDefinedVariables.push(p.node.id.name)
      }
    }
  })

  const test = path.get('test')
  const variables = []
  test.traverse({
    Identifier: {
      enter: (p) => {
        if (p.parent.type === "MemberExpression") {
          return
        }
        if (justDefinedVariables.includes(p.node.name)) {
          return
        }
        variables.push(p.node.name)
      }
    },
    MemberExpression: {
      enter: (p) => {
        // calls and such are possible but are problamatic because they could have side effects changing the behaviour
        if (p.node.object.type === 'Identifier' && p.node.property.type === 'Identifier') {
          variables.push(p.getSource())
        }
      }
    }
  }, test)
  const metaTracker = this.getBranchMetaTracker(branch, test.node, test.getSource(), variables)
  path.insertBefore(T.expressionStatement(metaTracker));
}

function createSwitchBranch(path) {
  const b = this.cov.newBranch("switch", path.node.loc);
  this.setAttr(path.node, "branchName", b);
}

function coverSwitchCase(path) {
  const T = this.types;
  const b = this.getAttr(path.parentPath.node, "branchName");
  /* istanbul ignore if: paranoid check */
  if (b === null) {
    throw new Error("Unable to get switch branch name");
  }
  const increment = this.getBranchIncrement(b, path.node.loc);
  path.node.consequent.unshift(T.expressionStatement(increment));
}

function coverTernary(path) {
  const n = path.node;
  const branch = this.cov.newBranch("cond-expr", path.node.loc);
  const cHint = this.hintFor(n.consequent);
  const aHint = this.hintFor(n.alternate);

  if (cHint !== "next") {
    this.insertBranchCounter(path.get("consequent"), branch);
  }
  if (aHint !== "next") {
    this.insertBranchCounter(path.get("alternate"), branch);
  }

  const T = this.types;
  const test = path.get('test')
  const variables = []
  test.traverse({
    Identifier: {
      enter: (p) => {
        if (p.parent.type === "MemberExpression") {
          return
        }
        variables.push(p.node.name)
      }
    },
    MemberExpression: {
      enter: (p) => {
        // calls and such are possible but are problamatic because they could have side effects changing the behaviour
        if (p.node.object.type === 'Identifier' && p.node.property.type === 'Identifier') {
          variables.push(p.getSource())
        }
      }
    }
  }, test)
  const metaTracker = this.getBranchMetaTracker(branch, test.node, test.getSource(), variables)
  // path.parentPath.insertBefore(metaTracker)
  // path.replaceWith(T.sequenceExpression([metaTracker, path.node]))
  test.replaceWith(T.sequenceExpression([metaTracker, test.node]));
}

// TODO not sure how to handle the metatracker for this
// TODO also unhandy since a chain of statements will be seen as a multi-sides branch
function coverLogicalExpression(path) {
  // const T = this.types;
  // if (path.parentPath.node.type === "LogicalExpression") {
  //   return; // already processed
  // }
  //
  // const leaves = [];
  // this.findLeaves(path.node, leaves);
  // const b = this.cov.newBranch("binary-expr", path.node.loc, this.reportLogic);
  // for (let i = 0; i < leaves.length; i += 1) {
  //   const leaf = leaves[i];
  //   const hint = this.hintFor(leaf.node);
  //   if (hint === "next") {
  //     continue;
  //   }
  //
  //   if (this.reportLogic) {
  //     const increment = this.getBranchLogicIncrement(leaf, b, leaf.node.loc);
  //     if (!increment[0]) {
  //       continue;
  //     }
  //     leaf.parent[leaf.property] = T.sequenceExpression([
  //       increment[0],
  //       increment[1],
  //     ]);
  //     continue;
  //   }
  //
  //   const increment = this.getBranchIncrement(b, leaf.node.loc);
  //   if (!increment) {
  //     continue;
  //   }
  //   leaf.parent[leaf.property] = T.sequenceExpression([increment, leaf.node]);
  // }
}

const codeVisitor = {
  ArrowFunctionExpression: entries(convertArrowExpression, coverFunction),
  AssignmentPattern: entries(coverAssignmentPattern),
  BlockStatement: entries(), // ignore processing only
  ExportDefaultDeclaration: entries(), // ignore processing only
  ExportNamedDeclaration: entries(), // ignore processing only
  ClassMethod: entries(coverFunction),
  ClassDeclaration: entries(parenthesizedExpressionProp("superClass")),
  ClassProperty: entries(coverClassPropDeclarator),
  ClassPrivateProperty: entries(coverClassPropDeclarator),
  ObjectMethod: entries(coverFunction),
  ExpressionStatement: entries(coverStatement),
  BreakStatement: entries(coverStatement),
  ContinueStatement: entries(coverStatement),
  DebuggerStatement: entries(coverStatement),
  ReturnStatement: entries(coverStatement),
  ThrowStatement: entries(coverStatement),
  TryStatement: entries(coverStatement),
  VariableDeclaration: entries(), // ignore processing only
  VariableDeclarator: entries(coverVariableDeclarator),
  IfStatement: entries(
    blockProp("consequent"),
    blockProp("alternate"),
    coverStatement,
    coverIfBranches
  ),
  ForStatement: entries(blockProp("body"),
    coverStatement,
    coverLoopBranch
  ),
  ForInStatement: entries(blockProp("body"),
    coverStatement,
    // coverLoopBranch
  ),
  ForOfStatement: entries(blockProp("body"),
    coverStatement,
    // coverLoopBranch
  ),
  WhileStatement: entries(blockProp("body"),
    coverStatement,
    coverLoopBranch
  ),
  DoWhileStatement: entries(blockProp("body"),
    coverStatement,
    coverLoopBranch
  ),
  SwitchStatement: entries(createSwitchBranch, coverStatement),
  SwitchCase: entries(coverSwitchCase),
  WithStatement: entries(blockProp("body"), coverStatement),
  FunctionDeclaration: entries(coverFunction),
  FunctionExpression: entries(coverFunction),
  LabeledStatement: entries(coverStatement),
  ConditionalExpression: entries(coverTernary),
  LogicalExpression: entries(coverLogicalExpression),
};
const globalTemplateAlteredFunction = template(`
        const Function = (function(){}).constructor;
        const global = (new Function(GLOBAL_COVERAGE_SCOPE))();
`);
const globalTemplateFunction = template(`
        const global = (new Function(GLOBAL_COVERAGE_SCOPE))();
`);
const globalTemplateVariable = template(`
        const global = GLOBAL_COVERAGE_SCOPE;
`);
// the template to insert at the top of the program.
const coverageTemplate = template(
  `
    function COVERAGE_FUNCTION () {
        const path = PATH;
        const hash = HASH;
        GLOBAL_COVERAGE_TEMPLATE
        const gcv = GLOBAL_COVERAGE_VAR;
        const coverageData = INITIAL;
        const coverage = global[gcv] || (global[gcv] = {});
        if (!coverage[path] || coverage[path].hash !== hash) {
            coverage[path] = coverageData;
        }
        const actualCoverage = coverage[path];
        {
            // @ts-ignore
            COVERAGE_FUNCTION = function () {
                return actualCoverage;
            }
        }
        return actualCoverage;
    }
`,
  { preserveComments: true }
);

const metaTemplate = template(
  `
    function META_FUNCTION (branch, metaInformation) {
        const path = PATH;
        const hash = HASH;
        const gmv = GLOBAL_META_VAR;
        const meta = global[gmv] || (global[gmv] = {});
                
        if (!meta[path] || meta[path].hash !== hash) {
            meta[path] = {
              hash: hash,
              meta: {}
            };
        }
        
        if (!meta[path].meta[branch]) {
          meta[path].meta[branch] = {}
        }
        
        meta[path].meta[branch] = metaInformation
    }
`,
  { preserveComments: true }
);
// the rewire plugin (and potentially other babel middleware)
// may cause files to be instrumented twice, see:
// https://github.com/istanbuljs/babel-plugin-istanbul/issues/94
// we should only instrument code for coverage the first time
// it's run through istanbul-lib-instrument.
function alreadyInstrumented(path, visitState) {
  return path.scope.hasBinding(visitState.varName);
}
function shouldIgnoreFile(programNode) {
  return (
    programNode.parent &&
    programNode.parent.comments.some((c) => COMMENT_FILE_RE.test(c.value))
  );
}

export interface VisitorOptions {
  inputSourceMap?: any;
  ignoreClassMethods?: any;
  reportLogic?: any;
  coverageGlobalScopeFunc?: any;
  coverageGlobalScope?: any;
  coverageVariable?: any;
}
