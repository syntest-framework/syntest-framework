export class VariableVisitor {

  // Stack because functions in functions in functions ... etc.
  private _currentScopeStack: Scope[]

  private _scopes: Scope[]
  private _relations: Relation[]

  get scopes(): Scope[] {
    return this._scopes;
  }

  get elements(): Element[] {
    const _elements: Element[] = []
    const _idSet: Set<string> = new Set()

    for (const relation of this.relations) {
      for (const element of relation.involved) {
        const elementId = getElementId(element)
        if (_idSet.has(elementId)) {
          continue
        }
        _idSet.add(elementId)
        _elements.push(element)
      }
    }

    return [..._elements];
  }

  get relations(): Relation[] {
    return this._relations;
  }

  constructor() {
    this._scopes = []
    this._relations = []
    this._currentScopeStack = []

    this._createGlobalScope()
  }

  private _createGlobalScope() {
    const globalScope: Scope = {
      name: "global",
      type: ScopeType.Global
    }

    this._currentScopeStack.push(globalScope)
    this.scopes.push(globalScope)
  }

  private _getCurrentScope(): Scope {
    return this._currentScopeStack[this._currentScopeStack.length - 1]
  }

  private _enterScope(name: string, type: ScopeType) {
    const scope: Scope = {
      name: name,
      type: type,
    }
    this._currentScopeStack.push(scope)
    this._scopes.push(scope)
  }

  private _exitScope(name: string) {
    const popped = this._currentScopeStack.pop()

    if (name !== popped.name) {
      throw new Error("Popped scope is not equal to the exiting scope!")
    }
  }

  // context
  public ClassDeclaration = {
    enter: (path) => {
      this._enterScope(path.node.id.name, ScopeType.Class)
    },
    exit: (path) => {
      this._exitScope(path.node.id.name)
    }
  }

  public ClassMethod = {
    enter: (path) => {
      this._enterScope(path.node.key.name, ScopeType.Method)
    },
    exit: (path) => {
      this._exitScope(path.node.key.name)
    }
  }

  public FunctionDeclaration = {
    enter: (path) => {
      const functionScope = this._getCurrentScope()
      const functionName = path.node.id.name
      this._enterScope(functionName, ScopeType.Function)

      const scope = this._getCurrentScope()

      for (const param of path.node.params) {
        if (param.type !== "Identifier") {
          throw new Error("unsupported")
        }
        this.relations.push({
          relation: RelationType.Parameter,
          involved: [
            {
              scope: functionScope,
              type: ElementType.Identifier,
              value: functionName
            },
            {
              scope: scope,
              type: ElementType.Identifier,
              value: param.name
            }
          ]
        })
      }
    },
    exit: (path) => {
      this._exitScope(path.node.id.name)
    }
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
  //       type: UsageType.Assignment,
  //       operation: '=',
  //       usedVariable: `${path.node.init.start}-${path.node.init.end}`
  //     }
  //   )
  // }

    // operations
  // public ReturnStatement: (path) => void = (path) => {
  //   // get the name of the function that we are returning
  //   const functionScope = [...this._currentScopeStack].reverse().find((s) => s.type === ScopeType.Method || s.type === ScopeType.Function)
  //   // get the corresponding variable of the function
  //   const variable = this._getVariableInScope(functionScope.name)
  //
  //   variable.usage.push({
  //     type: UsageType.Return,
  //     operation: "",
  //     usedVariable: `${path.node.argument.start}-${path.node.argument.end}`
  //   })
  // }

  public BinaryExpression: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    this.relations.push({
      relation: getRelationType("binary", path.node.operator),
      involved: [
        getElement(scope, path.node.left),
        getElement(scope, path.node.right)
      ]
    })
  }

  public UnaryExpression: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    this.relations.push({
      relation: getRelationType("unary", path.node.operator),
      involved: [
        getElement(scope, path.node.argument)
      ]
    })
  }
}

function getRelationType(type: string, operator: string): RelationType {
  if (type === "unary") {
    switch (operator) {
      case "!":
        return RelationType.NotUnary
      case "-":
        return RelationType.MinusUnary
      case "typeof":
        return RelationType.TypeOf
    }
  } else if (type === "binary") {
    switch (operator) {
      case "+":
        return RelationType.PlusBinary
      case "-":
        return RelationType.MinusBinary

      case "===":
        return RelationType.Equal
      case "!==":
        return RelationType.NotEqual
      case "==":
        return RelationType.typeCoercionEqual
      case "!=":
        return RelationType.typeCoercionNotEqual
    }
  }

  throw new Error(`Unsupported relation type operator: ${type} -> ${operator}`)
}

function getElement(scope: Scope, node): Element {
  if (node.type === "StringLiteral"
  || node.type === "NumericLiteral"
  || node.type === "BooleanLiteral") {
    return {
      scope: scope,
      type: ElementType.Constant,
      value: node.value
    }
  } else if (node.type === "Identifier") {
    return {
      scope: scope,
      type: ElementType.Identifier,
      value: node.name
    }
  }

  throw new Error(`Cannot get element ${scope.name} -> ${node.type}`)
}

export function getElementId(element: Element): string {
  console.log(element)
  return `scope=(name=${element.scope.name},type=${element.scope.type}),type=${element.type},value=${element.value}`
}

export interface Relation {
  relation: RelationType
  involved: Element[]
}

export enum RelationType {
  // unary
  NotUnary="!L",
  MinusUnary="-L",
  TypeOf="typeof L",

  // binary
  PlusBinary="L+R",
  MinusBinary="L-R",
  C="",

  // function
  Parameter="L(R)",
  Return="L()->R",

  // comparison
  Equal="===",
  NotEqual="!==",
  typeCoercionEqual="==",
  typeCoercionNotEqual="!=",
}

export interface Element {
  scope: Scope
  type: ElementType
  value: string
}

export enum ElementType {
  Constant='constant',
  Identifier='identifier',
}

export interface Scope {
  name: string,
  type: ScopeType
}

export enum ScopeType {
  Global="global",
  Class="class",
  Method="method",
  Function="function",
  Object="object"
}
