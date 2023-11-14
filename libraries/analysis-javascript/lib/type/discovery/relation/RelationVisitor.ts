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
import { ImplementationError } from "@syntest/diagnostics";

import { getRelationType, Relation, RelationType } from "../relation/Relation";

export class RelationVisitor extends AbstractSyntaxTreeVisitor {
  private _relationMap: Map<string, Relation>;

  get relationMap(): Map<string, Relation> {
    return this._relationMap;
  }

  constructor(filePath: string, syntaxForgiving: boolean) {
    super(filePath, syntaxForgiving);
    this._relationMap = new Map();
  }

  private _createRelation(
    path: NodePath<t.Node>,
    type: RelationType,
    involved: NodePath<t.Node>[],
    computed = false
  ) {
    const id = this._getNodeId(path);
    const relation: Relation = {
      id: id,
      type: type,
      involved: involved.map((p) => {
        if (
          p === undefined ||
          p === null ||
          p.node === null ||
          p.node === undefined
        ) {
          throw new ImplementationError(
            `Involved node is undefined or null for ${id}`
          );
          // return `${id}::anonymous`; // TODO we should look into this
        }
        return this._getNodeId(p);
      }),
      computed,
    };

    this._relationMap.set(relation.id, relation);
  }
  // special
  public ReturnStatement: (path: NodePath<t.ReturnStatement>) => void = (
    path
  ) => {
    const type = RelationType.Return;

    // get the function id
    const functionPath = path.findParent((p) => p.isFunction());

    if (functionPath === null) {
      // should not be possible
      throw new ImplementationError(
        "Return statement is not inside a function"
      );
    }

    if (path.has("argument")) {
      this._createRelation(path, type, [functionPath, path.get("argument")]);
    } else {
      this._createRelation(path, type, [functionPath]);
    }
  };

  public CallExpression: (path: NodePath<t.CallExpression>) => void = (
    path
  ) => {
    const type = RelationType.Call;
    this._createRelation(path, type, [
      path.get("callee"),
      ...path.get("arguments"),
    ]);
  };

  public PrivateName: (path: NodePath<t.PrivateName>) => void = (path) => {
    const type = RelationType.PrivateName;
    this._createRelation(path, type, [path.get("id")]);
  };

  public ObjectProperty: (path: NodePath<t.ObjectProperty>) => void = (
    path
  ) => {
    const type = RelationType.ObjectProperty;
    this._createRelation(
      path,
      type,
      [path.get("key"), path.get("value")],
      path.node.computed
    );
  };

  public ObjectMethod: (path: NodePath<t.ObjectMethod>) => void = (path) => {
    const type = RelationType.ObjectMethod;
    this._createRelation(
      path,
      type,
      [path.get("key"), ...path.get("params")],
      path.node.computed
    );
  };

  public ClassProperty: (path: NodePath<t.ClassProperty>) => void = (path) => {
    const classParent = path.findParent((p) => p.isClass());
    const involved = [classParent, path];

    if (path.has("value")) {
      involved.push(path.get("value"));
    }

    if (path.node.static) {
      this._createRelation(
        path,
        RelationType.StaticClassProperty,
        involved,
        path.node.computed
      );
    } else {
      this._createRelation(
        path,
        RelationType.ClassProperty,
        involved,
        path.node.computed
      );
    }
  };

  public ClassMethod: (path: NodePath<t.ClassMethod>) => void = (path) => {
    const classParent = path.findParent((p) => p.isClass());

    switch (path.node.kind) {
      case "constructor": {
        this._createRelation(
          path,
          RelationType.ClassConstructor,
          [classParent, path, ...path.get("params")],
          path.node.computed
        );
        break;
      }
      case "get": {
        this._createRelation(
          path,
          RelationType.ClassGetter,
          [classParent, path],
          path.node.computed
        );
        break;
      }
      case "set": {
        this._createRelation(
          path,
          RelationType.ClassSetter,
          [classParent, path, ...path.get("params")],
          path.node.computed
        );
        break;
      }
      default: {
        if (path.node.static && path.node.async) {
          this._createRelation(
            path,
            RelationType.StaticAsyncClassMethod,
            [classParent, path, ...path.get("params")],
            path.node.computed
          );
        } else if (path.node.static) {
          this._createRelation(
            path,
            RelationType.StaticClassMethod,
            [classParent, path, ...path.get("params")],
            path.node.computed
          );
        } else if (path.node.async) {
          this._createRelation(
            path,
            RelationType.AsyncClassMethod,
            [classParent, path, ...path.get("params")],
            path.node.computed
          );
        } else {
          this._createRelation(
            path,
            RelationType.ClassMethod,
            [classParent, path, ...path.get("params")],
            path.node.computed
          );
        }
      }
    }
  };

  public ArrayPattern: (path: NodePath<t.ArrayPattern>) => void = (path) => {
    const type = RelationType.ArrayPattern;

    if (path.has("elements")) {
      this._createRelation(
        path,
        type,
        path.get("elements").filter((p) => p.node !== null)
      );
    } else {
      this._createRelation(path, type, []);
    }
  };

  public ObjectPattern: (path: NodePath<t.ObjectPattern>) => void = (path) => {
    const type = RelationType.ObjectPattern;

    if (path.has("properties")) {
      this._createRelation(path, type, path.get("properties"));
    } else {
      this._createRelation(path, type, []);
    }
  };

  public RestElement: (path: NodePath<t.RestElement>) => void = (path) => {
    const type = RelationType.RestElement;
    this._createRelation(path, type, [path.get("argument")]);
  };

  // primary expression
  public ThisExpression: (path: NodePath<t.ThisExpression>) => void = (
    path
  ) => {
    const type = RelationType.This;

    const parent = this._getThisParent(path);

    if (parent) {
      this._createRelation(path, type, [parent]);
    }
  };

  public ArrayExpression: (path: NodePath<t.ArrayExpression>) => void = (
    path
  ) => {
    const type = RelationType.ArrayInitializer;

    if (path.has("elements")) {
      this._createRelation(
        path,
        type,
        path.get("elements").filter((p) => p.node !== null)
      );
    } else {
      this._createRelation(path, type, []);
    }
  };

  public ObjectExpression: (path: NodePath<t.ObjectExpression>) => void = (
    path
  ) => {
    const type = RelationType.ObjectInitializer;

    if (path.has("properties")) {
      this._createRelation(path, type, path.get("properties"));
    } else {
      this._createRelation(path, type, []);
    }
  };

  public FunctionExpression: (path: NodePath<t.FunctionExpression>) => void = (
    path
  ) => {
    const id = path.has("id") ? path.get("id") : path;
    const involved = [id, ...path.get("params")];

    if (path.node.generator && path.node.async) {
      this._createRelation(
        path,
        RelationType.AsyncFunctionStarDefinition,
        involved
      );
    } else if (path.node.generator) {
      this._createRelation(path, RelationType.FunctionStarDefinition, involved);
    } else if (path.node.async) {
      this._createRelation(
        path,
        RelationType.AsyncFunctionDefinition,
        involved
      );
    } else {
      this._createRelation(path, RelationType.FunctionDefinition, involved);
    }
  };

  public FunctionDeclaration: (path: NodePath<t.FunctionDeclaration>) => void =
    (path) => {
      const id = path.has("id") ? path.get("id") : path;
      if (path.node.generator && path.node.async) {
        this._createRelation(path, RelationType.AsyncFunctionStarDefinition, [
          id,
          ...path.get("params"),
        ]);
      } else if (path.node.generator) {
        this._createRelation(path, RelationType.FunctionStarDefinition, [
          id,
          ...path.get("params"),
        ]);
      } else if (path.node.async) {
        this._createRelation(path, RelationType.AsyncFunctionDefinition, [
          id,
          ...path.get("params"),
        ]);
      } else {
        this._createRelation(path, RelationType.FunctionDefinition, [
          id,
          ...path.get("params"),
        ]);
      }
    };

  public ArrowFunctionExpression: (
    path: NodePath<t.ArrowFunctionExpression>
  ) => void = (path) => {
    const type = RelationType.FunctionDefinition;
    // no id for arrow functions

    if (path.parentPath.isVariableDeclarator()) {
      this._createRelation(path, type, [
        path.parentPath,
        ...path.get("params"),
      ]);
    } else {
      this._createRelation(path, type, [path, ...path.get("params")]);
    }
  };

  public ClassExpression: (path: NodePath<t.ClassExpression>) => void = (
    path
  ) => {
    const type = RelationType.ClassDefinition;
    this._createRelation(path, type, [path.get("id")]);
  };

  public ClassDeclaration: (path: NodePath<t.ClassDeclaration>) => void = (
    path
  ) => {
    const type = RelationType.ClassDefinition;
    this._createRelation(path, type, [path.get("id")]);
  };

  public TemplateLiteral: (path: NodePath<t.TemplateLiteral>) => void = (
    path
  ) => {
    const type = RelationType.TemplateLiteral;
    this._createRelation(path, type, [
      ...path.get("quasis"),
      ...path.get("expressions"),
    ]);
  };

  public SequenceExpression: (path: NodePath<t.SequenceExpression>) => void = (
    path
  ) => {
    const type = RelationType.Sequence;
    this._createRelation(path, type, path.get("expressions"));
  };

  // left-hand-side expression
  public MemberExpression: (path: NodePath<t.MemberExpression>) => void = (
    path
  ) => {
    const type = RelationType.PropertyAccessor;
    this._createRelation(
      path,
      type,
      [path.get("object"), path.get("property")],
      path.node.computed
    );
  };

  public OptionalMemberExpression: (
    path: NodePath<t.OptionalMemberExpression>
  ) => void = (path) => {
    const type = RelationType.OptionalPropertyAccessor;
    this._createRelation(
      path,
      type,
      [path.get("object"), path.get("property")],
      path.node.computed
    );
  };

  public MetaProperty: (path: NodePath<t.MetaProperty>) => void = (path) => {
    const type = RelationType.PropertyAccessor;
    this._createRelation(path, type, [path.get("meta"), path.get("property")]);
  };

  public NewExpression: (path: NodePath<t.NewExpression>) => void = (path) => {
    const type = RelationType.New;
    this._createRelation(path, type, [
      path.get("callee"),
      ...path.get("arguments"),
    ]);
  };

  // UNARY
  // increment and decrement
  public UpdateExpression: (path: NodePath<t.UpdateExpression>) => void = (
    path
  ) => {
    const type = getRelationType("unary", path.node.operator, path.node.prefix);
    this._createRelation(path, type, [path.get("argument")]);
  };

  // unary
  public UnaryExpression: (path: NodePath<t.UnaryExpression>) => void = (
    path
  ) => {
    const type = getRelationType("unary", path.node.operator, path.node.prefix);
    this._createRelation(path, type, [path.get("argument")]);
  };

  public AwaitExpression: (path: NodePath<t.AwaitExpression>) => void = (
    path
  ) => {
    const type = RelationType.Await;
    this._createRelation(path, type, [path.get("argument")]);
  };

  // binary
  public BinaryExpression: (path: NodePath<t.BinaryExpression>) => void = (
    path
  ) => {
    const type = getRelationType("binary", path.node.operator);
    this._createRelation(path, type, [path.get("left"), path.get("right")]);
  };

  public LogicalExpression: (path: NodePath<t.LogicalExpression>) => void = (
    path
  ) => {
    const type = getRelationType("binary", path.node.operator);
    this._createRelation(path, type, [path.get("left"), path.get("right")]);
  };

  // ternary
  public ConditionalExpression: (
    path: NodePath<t.ConditionalExpression>
  ) => void = (path) => {
    const type = RelationType.Conditional;
    this._createRelation(path, type, [
      path.get("test"),
      path.get("consequent"),
      path.get("alternate"),
    ]);
  };

  // assignment
  public AssignmentExpression: (
    path: NodePath<t.AssignmentExpression>
  ) => void = (path) => {
    const type = getRelationType("assignment", path.node.operator);
    this._createRelation(path, type, [path.get("left"), path.get("right")]);
  };

  public AssignmentPattern: (path: NodePath<t.AssignmentPattern>) => void = (
    path
  ) => {
    const type = RelationType.Assignment;
    this._createRelation(path, type, [path.get("left"), path.get("right")]);
  };

  public VariableDeclarator: (path: NodePath<t.VariableDeclarator>) => void = (
    path
  ) => {
    if (path.has("init")) {
      const type = RelationType.Assignment;
      this._createRelation(path, type, [path.get("id"), path.get("init")]);
    }
    // if there is no init, it is a declaration
    // declarations are handled by the ElementVisitor
  };

  // TODO yield
  // spread
  public SpreadElement: (path: NodePath<t.SpreadElement>) => void = (path) => {
    const type = RelationType.Spread;
    this._createRelation(path, type, [path.get("argument")]);
  };

  // TODO comma

  public WhileStatement: (path: NodePath<t.WhileStatement>) => void = (
    path
  ) => {
    const type = RelationType.While;
    this._createRelation(path, type, [path.get("test")]);
  };

  public IfStatement: (path: NodePath<t.IfStatement>) => void = (path) => {
    const type = RelationType.If;
    this._createRelation(path, type, [path.get("test")]);
  };

  public ForStatement: (path: NodePath<t.ForStatement>) => void = (path) => {
    const type = RelationType.For;
    if (path.has("test")) {
      this._createRelation(path, type, [path.get("test")]);
    } else {
      this._createRelation(path, type, []);
    }
  };

  public ForInStatement: (path: NodePath<t.ForInStatement>) => void = (
    path
  ) => {
    const type = RelationType.ForIn;
    this._createRelation(path, type, [path.get("left"), path.get("right")]);
  };

  public ForOfStatement: (path: NodePath<t.ForOfStatement>) => void = (
    path
  ) => {
    const type = RelationType.ForIn;
    this._createRelation(path, type, [path.get("left"), path.get("right")]);
  };

  public SwitchStatement: (path: NodePath<t.SwitchStatement>) => void = (
    path
  ) => {
    const type = RelationType.Switch;
    this._createRelation(path, type, [
      path.get("discriminant"),
      ...path
        .get("cases")
        .filter((p) => p.has("test"))
        .map((p) => p.get("test")),
    ]);
  };
}
