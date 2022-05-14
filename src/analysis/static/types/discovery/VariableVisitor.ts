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
import { Element, ElementType, getElementId } from "./Element";
import { getRelationType, Relation, RelationType } from "./Relation";
import { Visitor } from "../../Visitor";

// TODO functionexpression
// TODO return
export class VariableVisitor extends Visitor {

  private _relations: Relation[]
  private _wrapperElementIsRelation: Map<string, Relation>

  private _elementStore: Map<string, Element>

  get wrapperElementIsRelation(): Map<string, Relation> {
    return this._wrapperElementIsRelation;
  }

  get elements(): Element[] {
    const _elements: Set<Element> = new Set<Element>()

    // todo maybe not return relation elements
    for (const relation of this.relations) {
      for (const element of relation.involved) {
        _elements.add(element)
      }
    }

    return [..._elements];
  }

  get relations(): Relation[] {
    return this._relations;
  }

  constructor(filePath: string) {
    super(filePath)
    this._relations = []
    this._wrapperElementIsRelation = new Map<string, Relation>()

    this._elementStore = new Map<string, Element>()
  }


  // context
  public ClassDeclaration: (path) => void = (path) => {
  }

  public ClassMethod: (path) => void = (path) => {
    if (path.node.kind === 'constructor') {
      // TODO
      return
    }

    const involved: Element[] = [this._getElement(path,  path.node.key)]

    for (const param of path.node.params) {
      involved.push(this._getElement(path, param))
    }

    this.relations.push({
      relation: RelationType.Parameters,
      involved: involved
    })
  }

  public FunctionDeclaration: (path) => void = (path) => {
    const involved: Element[] = [this._getElement(path, path.node.id)]

    for (const param of path.node.params) {
      involved.push(this._getElement(path, param))
    }

    this.relations.push({
      relation: RelationType.Parameters,
      involved: involved
    })
  }

  public ArrowFunctionExpression: (path) => void = (path) => {
    const involved: Element[] = [this._getElement(path, path.node)]

    for (const param of path.node.params) {
      involved.push(this._getElement(path, param))
    }

    this.relations.push({
      relation: RelationType.Parameters,
      involved: involved
    })
  }

  public FunctionExpression: (path) => void = (path) => {
    const involved: Element[] = [this._getElement(path, path.node)]

    for (const param of path.node.params) {
      involved.push(this._getElement(path, param))
    }

    this.relations.push({
      relation: RelationType.Parameters,
      involved: involved
    })
  }

  public CallExpression: (path) => void = (path) => {
    const relation: Relation = {
      relation: RelationType.Call,
      involved: [
        this._getElement(path, path.node.callee),
        ...path.node.arguments.map((a) => {
          return this._getElement(path, a)
        })
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public VariableDeclarator: (path) => void = (path) => {
    if (!path.node.init) {
      // if the variable is not instantiated we skip it
      return
    }
    const relation: Relation = {
      relation: getRelationType("assignment", "="),
      involved: [
        this._getElement(path, path.node.id),
        this._getElement(path, path.node.init)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

    // operations
  // public ReturnStatement: (path) => void = (path) => {
  //   // get the name of the function that we are returning
  //   const functionScope = [...this._currentScopeStack].reverse().find((s) => s.identifierDescription === ScopeType.Method || s.identifierDescription === ScopeType.FUNCTION)
  //   // get the corresponding variable of the function
  //   const variable = this._getVariableInScope(functionScope.name)
  //
  //   variable.usage.push({
  //     identifierDescription: UsageType.Return,
  //     operation: "",
  //     usedVariable: `${path.node.argument.start}-${path.node.argument.end}`
  //   })
  // }

  // unary
  public UnaryExpression: (path) => void = (path) => {
    const relation: Relation = {
      relation: getRelationType("unary", path.node.operator, path.node.prefix),
      involved: [
        this._getElement(path, path.node.argument)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public UpdateExpression: (path) => void = (path) => {
    const relation: Relation = {
      relation: getRelationType("unary", path.node.operator),
      involved: [
        this._getElement(path, path.node.argument)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public RestElement: (path) => void = (path) => {
    const relation: Relation = {
      relation: RelationType.Spread,
      involved: [
        this._getElement(path, path.node.argument)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public ArrayExpression: (path) => void = (path) => {
    const relation: Relation = {
      relation: RelationType.Array,
      involved: path.node.elements.map((e) => {
        if (!e) {
          return {
            type: ElementType.NullConstant,
            value: null
          }
        }
        return this._getElement(path, e)
      })
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public ObjectExpression: (path) => void = (path) => {
    const relation: Relation = {
      relation: RelationType.Object,
      involved: path.node.properties.map((e) => {
        return this._getElement(path, e)
      })
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public AssignmentExpression: (path) => void = (path) => {
    const relation: Relation = {
      relation: getRelationType("assignment", path.node.operator),
      involved: [
        this._getElement(path, path.node.left),
        this._getElement(path, path.node.right)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  // binary
  public BinaryExpression: (path) => void = (path) => {
    const relation: Relation = {
      relation: getRelationType("binary", path.node.operator),
      involved: [
        this._getElement(path, path.node.left),
        this._getElement(path, path.node.right)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public LogicalExpression: (path) => void = (path) => {
    const relation: Relation = {
      relation: getRelationType("binary", path.node.operator),
      involved: [
        this._getElement(path, path.node.left),
        this._getElement(path, path.node.right)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public MemberExpression: (path) => void = (path) => {
    // if (path.node.object.type === "ThisExpression") {
    //   // set the scope to the first "thisable" scope
    //   scope = this._scopes
    //     .reverse()
    //     .find((s) =>
    //       s.type === ScopeType.Object
    //       || s.type === ScopeType.Class
    //       || s.type === ScopeType.Function
    //     )
    // }

    const relation: Relation = {
      relation: RelationType.PropertyAccessor,
      involved: [
        this._getElement(path, path.node.object),
        this._getElement(path, path.node.property)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  // ternary
  public ConditionalExpression: (path) => void = (path) => {
    const relation: Relation = {
      relation: RelationType.Conditional,
      involved: [
        this._getElement(path, path.node.test),
        this._getElement(path, path.node.consequent),
        this._getElement(path, path.node.alternate)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  _getElement(path, node) {
    const element = super._getElement(path, node)
    const elementId = getElementId(element)

    if (!this._elementStore.has(elementId)) {
      this._elementStore.set(elementId, element)
    }

    return this._elementStore.get(elementId)
  }
}


