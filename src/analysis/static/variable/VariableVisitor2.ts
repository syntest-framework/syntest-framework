export class VariableVisitor {

  // Stack because functions in functions in functions ... etc.
  private _currentScopeStack: Scope[]

  private _scopes: Scope[]
  private _variables: AbstractVariable[]

  get scopes(): Scope[] {
    return this._scopes;
  }

  get variables(): AbstractVariable[] {
    return this._variables;
  }

  constructor() {
    this._scopes = []
    this._variables = []
    this._currentScopeStack = []

    this._createGlobalScope()
  }

  private _createGlobalScope() {
    const globalScope: Scope = {
      name: "global",
      type: ScopeType.Global
    }

    this._variables.push(new Variable('require', globalScope))
    const module = new Variable('module', globalScope)
    this._variables.push(module)
    this._variables.push(new MemberVariable('exports', globalScope, module))

    this._currentScopeStack.push(globalScope)
    this.scopes.push(globalScope)
  }

  private _getCurrentScope(): Scope {
    return this._currentScopeStack[this._currentScopeStack.length - 1]
  }

  private _getVariableInScope(variableName: string): Variable {
    // search in reverse order to find the closest variable (because of shadowing)
    for (let i = this._currentScopeStack.length - 1; i >= 0; i--) {
      const scope = this._currentScopeStack[i]
      const variable = this._variables.find((v) => v.scope === scope && v.id === variableName)

      if (variable && variable instanceof Variable) {
        return variable
      }
    }

    console.log(this._currentScopeStack)
    console.log(this._variables)
    console.log(variableName)

    throw new Error("Cannot find required variable in current scope: " + variableName)
  }

  private _enterScope(name: string, type: ScopeType) {
    const currentScope = this._getCurrentScope()

    const variableId = name

    if (this._variables.find((v) => v.scope === currentScope && v.id === variableId)) {
      throw new Error("I wasnt expecting that things can be redeclared")
    }

    // declare the function as usable variable in the current scope
    this._variables.push(new Variable(variableId, currentScope))

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
      this._enterScope(path.node.id.name, ScopeType.Function)

      // register the parameters
      for (const param of path.node.params) {
        const currentScope = this._getCurrentScope()

        if (param.type !== 'Identifier') {
          throw new Error("Did not know this was possible")
        }

        const variableId = param.name

        // declare the function as usable variable in the current scope
        this._variables.push(new Variable(variableId, currentScope))
      }

    },
    exit: (path) => {
      this._exitScope(path.node.id.name)
    }
  }

  // declarations
  // public ClassProperty: (path) => void = (path) => {
  //
  // }

  public VariableDeclarator: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const variableId = path.node.id.name

    if (this._variables.find((v) => v.scope === scope && v.id === variableId)) {
      throw new Error("I wasnt expecting that things can be redeclared")
    }

    const variable = new Variable(variableId, scope)
    this._variables.push(variable)

    variable.usage.push(
      {
        type: UsageType.Assignment,
        operation: '=',
        usedVariable: `${path.node.init.start}-${path.node.init.end}`
      }
    )
  }

  // imports
  // TODO should be done differently
  // public ObjectProperty: (path) => void = (path) => {
  //   const scope = this._getCurrentScope()
  //
  //   const variableId = path.node.key.name
  //
  //   if (this._variables.find((v) => v.scope === scope && v.id === variableId)) {
  //     console.log(variableId)
  //     console.log(scope)
  //     throw new Error("I wasnt expecting that things can be redeclared")
  //   }
  //
  //   const variable = new Variable(variableId, scope)
  //   this._variables.push(variable)
  //
  //   variable.usage.push( // TODO
  //     // {
  //     //   type: UsageType.Assignment,
  //     //   operation: '=',
  //     //   usedVariable: `${path.node.init.start}-${path.node.init.end}`
  //     // }
  //   )
  // }

    // operations
  public ReturnStatement: (path) => void = (path) => {
    // get the name of the function that we are returning
    const functionScope = [...this._currentScopeStack].reverse().find((s) => s.type === ScopeType.Method || s.type === ScopeType.Function)
    // get the corresponding variable of the function
    const variable = this._getVariableInScope(functionScope.name)

    variable.usage.push({
      type: UsageType.Return,
      operation: "",
      usedVariable: `${path.node.argument.start}-${path.node.argument.end}`
    })
  }

  public Identifier: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const actualVariable = this._getVariableInScope(path.node.name)

    const variable = new WrappedVariable(`${path.node.start}-${path.node.end}`, scope, actualVariable)
    this._variables.push(variable)
  }

  public NumericLiteral: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const constant = new Constant('number', path.node.value)

    const variable = new WrappedVariable(`${path.node.start}-${path.node.end}`, scope, constant)
    this._variables.push(variable)
  }

  public BooleanLiteral: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const constant = new Constant('bool', path.node.value)

    const variable = new WrappedVariable(`${path.node.start}-${path.node.end}`, scope, constant)
    this._variables.push(variable)
  }

  public StringLiteral: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const constant = new Constant('string', path.node.value)

    const variable = new WrappedVariable(`${path.node.start}-${path.node.end}`, scope, constant)
    this._variables.push(variable)
  }

  public BinaryExpression: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const operation = new BinaryOperation(path.node.operator, `${path.node.left.start}-${path.node.left.end}`, `${path.node.right.start}-${path.node.right.end}`)

    const variable = new WrappedVariable(`${path.node.start}-${path.node.end}`, scope, operation)
    this._variables.push(variable)

    // left usage
    if (path.node.left.type === '') {
      // this._getVariableInScope()
    }
    // right usage
  }

  public UnaryExpression: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const operation = new UnaryOperation(path.node.operator, `${path.node.argument.start}-${path.node.argument.end}`)

    const variable = new WrappedVariable(`${path.node.start}-${path.node.end}`, scope, operation)
    this._variables.push(variable)
  }
}

export interface Scope {
  name: string,
  type: ScopeType
}

export enum ScopeType {
  Global,
  Class,
  Method,
  Function,
  Object
}

export interface Usage {
  type: UsageType
  operation: string
  usedVariable: string
}
export enum UsageType {
  BinaryOperation,
  UnaryOperation,
  Assignment,
  FunctionCall,
  Property,
  Parameter,
  Return,
}

class Constant {
  public readonly type: string
  public readonly value: any

  constructor(type: string, value: any) {
    this.type = type
    this.value = value
  }
}

class Operation {
  public readonly operator: string

  constructor(operator: string) {
    this.operator = operator
  }
}

class UnaryOperation extends Operation{
  public readonly argument: string

  constructor(operator: string, argument: string) {
    super(operator)
    this.argument = argument
  }
}

class BinaryOperation extends Operation {
  public readonly left: string
  public readonly right: string

  constructor(operator: string, left: string, right: string) {
    super(operator)
    this.left = left
    this.right = right
  }
}

abstract class AbstractVariable {
  public readonly id: string
  public readonly scope: Scope

  constructor(id: string, scope: Scope) {
    this.id = id
    this.scope = scope
  }
}

class WrappedVariable extends AbstractVariable {
  public readonly actual: Variable | Constant | Operation

  constructor(id: string, scope: Scope, actual: Variable | Constant | Operation) {
    super(id, scope);
    this.actual = actual
  }
}

class Variable extends AbstractVariable {
  public readonly usage: Usage[]

  constructor(id: string, scope: Scope) {
    super(id, scope);
    this.usage = []
  }
}

class MemberVariable extends Variable {
  public readonly parent: Variable

  constructor(id: string, scope: Scope, parent: Variable) {
    super(id, scope);
    this.parent = parent
  }
}
