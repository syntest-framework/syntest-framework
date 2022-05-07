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
import { Element, ElementType } from "./Element";
import { getRelationType, Relation, RelationType } from "./Relation";
import { Scope } from "./Scope";

// TODO functionexpression
// TODO return
export class VariableVisitor {

  private _filePath: string;
  // Stack because functions in functions in functions ... etc.

  private _relations: Relation[]
  private _wrapperElementIsRelation: Map<string, Relation>

  private _elementStore: Map<string, Element>

  get wrapperElementIsRelation(): Map<string, Relation> {
    return this._wrapperElementIsRelation;
  }

  get elements(): Element[] {
    const _elements: Set<Element> = new Set<Element>()

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
    this._filePath = filePath

    this._relations = []
    this._wrapperElementIsRelation = new Map<string, Relation>()

    this._elementStore = new Map<string, Element>()
  }

  // context
  public ClassDeclaration: (path) => void = (path) => {
  }

  public ClassMethod: (path) => void = (path) => {
  }

  public FunctionDeclaration: (path) => void = (path) => {
    const involved: Element[] = [this._getElement(this._filePath, path, path.node)]

    for (const param of path.node.params) {
      involved.push(this._getElement(this._filePath, path, param))
    }

    this.relations.push({
      relation: RelationType.Parameters,
      involved: involved
    })
  }

  public ArrowFunctionExpression: (path) => void = (path) => {
    const involved: Element[] = [this._getElement(this._filePath, path, path.node)]

    for (const param of path.node.params) {
      involved.push(this._getElement(this._filePath, path, param))
    }

    this.relations.push({
      relation: RelationType.Parameters,
      involved: involved
    })
  }

  public FunctionExpression: (path) => void = (path) => {
    const involved: Element[] = [this._getElement(this._filePath, path, path.node)]

    for (const param of path.node.params) {
      involved.push(this._getElement(this._filePath, path, param))
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
        this._getElement(this._filePath, path, path.node.callee),
        ...path.node.arguments.map((a) => {
          return this._getElement(this._filePath, path, a)
        })
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  // public VariableDeclarator: (path) => void = (path) => {
  //   const scope = this._getCurrentScope()
  //
  //   const variableId = path.node.id.name
  //
  //   if (this._variables.find((v) => v.scope === scope && v.id === variableId)) {
  //     throw new Error("I wasnt expecting that things can be redeclared")
  //   }
  //
  //   const variable = new Variable(variableId, scope)
  //   this._variables.push(variable)
  //
  //   variable.usage.push(
  //     {
  //       identifierDescription: UsageType.Assignment,
  //       operation: '=',
  //       usedVariable: `${path.node.init.start}-${path.node.init.end}`
  //     }
  //   )
  // }

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
        this._getElement(this._filePath, path, path.node.argument)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public UpdateExpression: (path) => void = (path) => {
    const relation: Relation = {
      relation: getRelationType("unary", path.node.operator),
      involved: [
        this._getElement(this._filePath, path, path.node.argument)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public RestElement: (path) => void = (path) => {
    const relation: Relation = {
      relation: RelationType.Spread,
      involved: [
        this._getElement(this._filePath, path, path.node.argument)
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
        return this._getElement(this._filePath, path, e)
      })
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public ObjectExpression: (path) => void = (path) => {
    const relation: Relation = {
      relation: RelationType.Object,
      involved: path.node.properties.map((e) => {
        return this._getElement(this._filePath, path, e)
      })
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public AssignmentExpression: (path) => void = (path) => {
    const relation: Relation = {
      relation: getRelationType("assignment", path.node.operator),
      involved: [
        this._getElement(this._filePath, path, path.node.left),
        this._getElement(this._filePath, path, path.node.right)
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
        this._getElement(this._filePath, path, path.node.left),
        this._getElement(this._filePath, path, path.node.right)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public LogicalExpression: (path) => void = (path) => {
    const relation: Relation = {
      relation: getRelationType("binary", path.node.operator),
      involved: [
        this._getElement(this._filePath, path, path.node.left),
        this._getElement(this._filePath, path, path.node.right)
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
        this._getElement(this._filePath, path, path.node.object),
        this._getElement(this._filePath, path, path.node.property)
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
        this._getElement(this._filePath, path, path.node.test),
        this._getElement(this._filePath, path, path.node.consequent),
        this._getElement(this._filePath, path, path.node.alternate)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  private _getElement(filePath: string, path, node) {
    const element = getElement(filePath, path, node)
    const elementId = getElementId(element)

    if (!this._elementStore.has(elementId)) {
      this._elementStore.set(elementId, element)
    }

    return this._elementStore.get(elementId)
  }
}

function getElement(filePath: string, path, node): Element {
  const scope: Scope = {
    filePath: filePath,
    uid: path.scope.uid
  }

  if (node.type === "NullLiteral") {
    return {
      scope: scope,
      type: ElementType.NullConstant,
      value: null
    }
  } else if (node.type === "StringLiteral"
    || node.type === "TemplateLiteral") {
    return {
      scope: scope,
      type: ElementType.StringConstant,
      value: node.value
    }
  } else if (node.type === "NumericLiteral") {
    return {
      scope: scope,
      type: ElementType.NumericalConstant,
      value: node.value
    }
  } else if (node.type === "BooleanLiteral") {
    return {
      scope: scope,
      type: ElementType.BooleanConstant,
      value: node.value
    }
  } else if (node.type === "RegExpLiteral") {
    return {
      scope: scope,
      type: ElementType.RegexConstant,
      value: node.pattern
    }
  } else if (node.type === "Identifier") {
    return {
      scope: getScope(filePath, path, node.name),
      type: ElementType.Identifier,
      value: node.name
    }
  } else if (node.type === "ThisExpression") {
    // TODO should be done differently maybe
    return {
      scope: getScope(filePath, path, 'this'),
      type: ElementType.Identifier,
      value: 'this'
    }
  } else if (node.type === "Super") {
    // TODO should be done differently maybe
    return {
      scope: scope,
      type: ElementType.Identifier,
      value: 'super'
    }
  } else if (node.type === 'UnaryExpression'
    || node.type === 'UpdateExpression'
    || node.type === 'CallExpression'

    || node.type === 'BinaryExpression'
    || node.type === 'LogicalExpression'

    || node.type === 'ConditionalExpression'

    || node.type === 'MemberExpression'

    || node.type === 'ArrowFunctionExpression'
    || node.type === 'FunctionExpression'
    || node.type === 'FunctionDeclaration'

    // TODO

    || node.type === 'SpreadElement'
    || node.type === 'NewExpression'
    || node.type === 'SequenceExpression'
    || node.type === 'ObjectPattern'
    || node.type === 'RestElement'

    || node.type === 'ArrayExpression'
    || node.type === 'ObjectExpression'

    || node.type === 'ObjectProperty' // TODO not sure about this one
    || node.type === 'ObjectMethod'// TODO not sure about this one

    || node.type === 'AssignmentExpression'
    || node.type === 'AssignmentPattern') {

    // TODO should be default
    return {
      scope: scope,
      type: ElementType.Relation,
      value: `%${node.start}-${node.end}`
    }
  }
  throw new Error(`Cannot get element: "${node.name}" -> ${node.type}`)
}

function getScope(filePath: string, path, name): Scope {
  if (path.scope.hasGlobal(name)) {
    return {
      uid: 'global',
      filePath: filePath
    }
  }

  if (path.scope.hasBinding(name) && path.scope.getBinding(name)) {
    const variableScope = path.scope.getBinding(name).scope

    return {
      uid: variableScope.uid,
      filePath: filePath,
    }
  }

  // if (path.scope.hasOwnBinding(name)) {
  //   const variableScope = path.scope.getOwnBinding(name).scope
  //
  //   return {
  //     uid: variableScope.uid,
  //     filePath: filePath,
  //   }
  // }

  if (path.type === 'MemberExpression') { // TODO we should check if we are the property currently (doesnt work when object === property, car.car)
    if (path.node.property.name === name) {
      const objectIdentifier = getOriginalObjectIdentifier(path.node.object)

      const objectScope: Scope = getScope(filePath, path, objectIdentifier)

      objectScope.uid += '-' + objectIdentifier

      return objectScope
    }
  }

  if (name === 'this' || name === 'anon') {
    return {
      uid: path.scope.uid,
      filePath: filePath,
    }
  }


  throw new Error(`Cannot find scope of element ${name} of type ${path.type} in ${filePath}`)
}

function getOriginalObjectIdentifier(object): string {
  if (object.type === 'Identifier') {
    return object.name
  }

  if (object.type === 'ThisExpression') {
    return 'this'
  }

  if (object.type === 'CallExpression'
    || object.type === 'NewExpression') {
    return getOriginalObjectIdentifier(object.callee)
  } else if (object.type === 'MemberExpression') {
    return getOriginalObjectIdentifier(object.object)
  } else {
    // console.log(object)
    // throw new Error(`${object.type}`)

    return 'anon'
  }
}

function getElementId(element: Element): string {
  if (!element.scope) {
    return `scope=null,type=${element.type},value=${element.value}`
  }
  return `scope=(name=${element.scope.uid},filePath=${element.scope.filePath}),type=${element.type},value=${element.value}`
}