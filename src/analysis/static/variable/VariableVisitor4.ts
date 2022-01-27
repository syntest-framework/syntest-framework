export class VariableVisitor {

  // Stack because functions in functions in functions ... etc.
  private _currentScopeStack: Scope[]

  private _scopes: Scope[]
  private _relations: Relation[]
  private _wrapperElementIsRelation: Map<string, Relation>

  get scopes(): Scope[] {
    return this._scopes;
  }

  get wrapperElementIsRelation(): Map<string, Relation> {
    return this._wrapperElementIsRelation;
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
    this._wrapperElementIsRelation = new Map<string, Relation>()

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
      console.log(this._currentScopeStack)
      throw new Error(`Popped scope is not equal to the exiting scope! ${name} != ${popped.name}`)
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

      const involved: Element[] = [{
        scope: functionScope,
        type: ElementType.Identifier,
        value: functionName
      }]

      for (const param of path.node.params) {
        if (param.type === "Identifier") {
          involved.push({
            scope: scope,
            type: ElementType.Identifier,
            value: param.name
          })
        } else if (param.type === "RestElement"
          || param.type === "AssignmentPattern") {
          involved.push({
            scope: scope,
            type: ElementType.Relation,
            value: `%${path.node.start}-${path.node.end}`
          })
        } else {
          throw new Error("unsupported")
        }
      }

      this.relations.push({
        relation: RelationType.Parameters,
        involved: involved
      })
    },
    exit: (path) => {
      this._exitScope(path.node.id.name)
    }
  }

  public ArrowFunctionExpression = {
    enter: (path) => {
      const functionScope = this._getCurrentScope()
      const functionName = `%${path.node.start}-${path.node.end}`

      this._enterScope(functionName, ScopeType.Function)

      const scope = this._getCurrentScope()

      const involved: Element[] = [{
        scope: functionScope,
        type: ElementType.Identifier,
        value: functionName
      }]

      for (const param of path.node.params) {
        if (param.type === "Identifier") {
          involved.push({
            scope: scope,
            type: ElementType.Identifier,
            value: param.name
          })
        } else if (param.type === "RestElement") {
          involved.push({
            scope: scope,
            type: ElementType.Relation,
            value: `%${path.node.start}-${path.node.end}`
          })
        } else {
          throw new Error("unsupported")
        }
      }

      this.relations.push({
        relation: RelationType.Parameters,
        involved: involved
      })
    },
    exit: (path) => {
      const functionName = `%${path.node.start}-${path.node.end}`
      this._exitScope(functionName)
    }
  }

  public CallExpression: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const relation: Relation = {
      relation: RelationType.Call,
      involved: [
        getElement(scope, path.node.callee),
        ...path.node.arguments.map((a) => {
          return getElement(scope, a)
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

  // unary
  public UnaryExpression: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const relation: Relation = {
      relation: getRelationType("unary", path.node.operator),
      involved: [
        getElement(scope, path.node.argument)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public UpdateExpression: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const relation: Relation = {
      relation: getRelationType("unary", path.node.operator),
      involved: [
        getElement(scope, path.node.argument)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public RestElement: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const relation: Relation = {
      relation: RelationType.Spread,
      involved: [
        getElement(scope, path.node.argument)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public ArrayExpression: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const relation: Relation = {
      relation: RelationType.Array,
      involved: path.node.elements.map((e) => {
        return getElement(scope, e)
      })
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public ObjectExpression: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const relation: Relation = {
      relation: RelationType.Object,
      involved: path.node.properties.map((e) => {
        return getElement(scope, e)
      })
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public AssignmentPattern: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const relation: Relation = {
      relation: RelationType.Assignment,
      involved: [
        getElement(scope, path.node.left),
        getElement(scope, path.node.right)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  // binary
  public BinaryExpression: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const relation: Relation = {
      relation: getRelationType("binary", path.node.operator),
      involved: [
        getElement(scope, path.node.left),
        getElement(scope, path.node.right)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public LogicalExpression: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const relation: Relation = {
      relation: getRelationType("binary", path.node.operator),
      involved: [
        getElement(scope, path.node.left),
        getElement(scope, path.node.right)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  public MemberExpression: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const relation: Relation = {
      relation: RelationType.Member,
      involved: [
        getElement(scope, path.node.object),
        getElement(scope, path.node.property)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }

  // ternary
  public ConditionalExpression: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const relation: Relation = {
      relation: RelationType.Ternary,
      involved: [
        getElement(scope, path.node.test),
        getElement(scope, path.node.consequent),
        getElement(scope, path.node.alternate)
      ]
    }

    this._wrapperElementIsRelation.set(`%${path.node.start}-${path.node.end}`, relation)
    this.relations.push(relation)
  }
}

function getRelationType(type: string, operator: string): RelationType {
  if (type === "unary") {
    switch (operator) {
      case "!":
        return RelationType.NotUnary
      case "-":
        return RelationType.MinusUnary
      case "+":
        return RelationType.PlusUnary
      case "typeof":
        return RelationType.TypeOf
      case "++":
        return RelationType.PlusPlus
      case "--":
        return RelationType.MinusMinus
    }
  } else if (type === "binary") {
    switch (operator) {
      case "+":
        return RelationType.PlusBinary
      case "-":
        return RelationType.MinusBinary
      case "/":
        return RelationType.Divide
      case "*":
        return RelationType.Multiply
      case "%":
        return RelationType.Mod

      case "===":
        return RelationType.Equal
      case "!==":
        return RelationType.NotEqual
      case "==":
        return RelationType.typeCoercionEqual
      case "!=":
        return RelationType.typeCoercionNotEqual

      case "<":
        return RelationType.StrictSmaller
      case ">":
        return RelationType.StrictGreater
      case "<=":
        return RelationType.Smaller
      case ">=":
        return RelationType.Greater

      case "||":
        return RelationType.LazyOr
      case "|":
        return RelationType.LazyAnd
      case "&&":
        return RelationType.Or
      case "&":
        return RelationType.And
    }
  }

  throw new Error(`Unsupported relation type operator: ${type} -> ${operator}`)
}

function getElement(scope: Scope, node): Element {
  if (node.type === "StringLiteral") {
    return {
      scope: scope,
      type: ElementType.StringConstant,
      value: node.value
    }
  } else if (node.type === "NumericLiteral") {
    return {
      scope: scope,
      type: ElementType.NumericalConstant,
      value: node.pattern
    }
  } else if (node.type === "BooleanLiteral") {
    return {
      scope: scope,
      type: ElementType.BooleanConstant,
      value: node.pattern
    }
  } else if (node.type === "RegExpLiteral") {
    return {
      scope: scope,
      type: ElementType.RegexConstant,
      value: node.pattern
    }
  } else if (node.type === "NullLiteral") {
    return {
      scope: scope,
      type: ElementType.NullConstant,
      value: node.pattern
    }
  } else if (node.type === "Identifier") {
    return {
      scope: scope,
      type: ElementType.Identifier,
      value: node.name
    }
  } else if (node.type === "ThisExpression") {
    // TODO should be done differntly maybe
    return {
      scope: scope,
      type: ElementType.Identifier,
      value: 'this'
    }
  } else if (node.type === 'UnaryExpression'
    || node.type === 'UpdateExpression'
    || node.type === 'CallExpression'

    || node.type === 'BinaryExpression'
    || node.type === 'LogicalExpression'

    || node.type === 'ConditionalExpression'

    || node.type === 'MemberExpression'

    || node.type === 'ArrowFunctionExpression'

    || node.type === 'ArrayExpression'
    || node.type === 'ObjectExpression'

    || node.type === 'AssignmentExpression') {
    return {
      scope: scope,
      type: ElementType.Relation,
      value: `%${node.start}-${node.end}`
    }
  }
  throw new Error(`Cannot get element: "${scope.name}" -> ${node.type}`)
}

export function getElementId(element: Element): string {
  return `scope=(name=${element.scope.name},type=${element.scope.type}),type=${element.type},value=${element.value}`
}

export interface Relation {
  relation: RelationType
  involved: Element[]
}

export enum RelationType {
  // UNARY
  //
  NotUnary="!L",
  PlusUnary="+L",
  MinusUnary="-L",
  TypeOf="typeof L",
  //
  PlusPlus="L++",
  MinusMinus="L--",
  // spread
  Spread="...",

  // BINARY
  //
  PlusBinary="L+R",
  MinusBinary="L-R",
  Divide="L/R",
  Multiply="L*R",
  Mod="L%R",

  // comparison
  Equal="L===R",
  NotEqual="L!==R",
  typeCoercionEqual="L==R",
  typeCoercionNotEqual="L!=R",
  StrictSmaller="L<R",
  StrictGreater="L>R",
  Smaller="L<=R",
  Greater="L>=R",
  // logical
  LazyOr="L||R",
  LazyAnd="L&&R",
  Or="L|R",
  And="L&R",
  // function
  Return="L->R",
  // member
  Member="L.R",
  // assignment
  Assignment="L=R",

  // TERNARY
  Ternary="Q?L:R",

  // MULTI
  // function
  Parameters="L_R",
  Call="L(R)",
  // object
  Object="{L:R}",
  // array
  Array="[L]",

}

export interface Element {
  scope: Scope
  type: ElementType
  value: string
}

export enum ElementType {
  StringConstant='stringConstant',
  NumericalConstant='numericalConstant',
  BooleanConstant='booleanConstant',
  NullConstant='nullConstant',
  RegexConstant='regexConstant',
  Identifier='identifier',
  Relation='relation'
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