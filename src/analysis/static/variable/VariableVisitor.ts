import { Element, ElementType, getElement, getElementId } from "./Element";
import { getRelationType, Relation, RelationType } from "./Relation";
import { Scope, ScopeType } from "./Scope";

// TODO functionexpression
// TODO return
export class VariableVisitor {

  private filePath: string;
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

  constructor(filePath: string) {
    this.filePath = filePath
    this._scopes = []
    this._relations = []
    this._currentScopeStack = []
    this._wrapperElementIsRelation = new Map<string, Relation>()

    this._createGlobalScope()
  }

  private _createGlobalScope() {
    const globalScope: Scope = {
      name: "global",
      filePath: this.filePath,
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
      filePath: this.filePath,
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
      relation: getRelationType("unary", path.node.operator, path.node.prefix),
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

  public AssignmentExpression: (path) => void = (path) => {
    const scope = this._getCurrentScope()

    const relation: Relation = {
      relation: getRelationType("assignment", path.node.operator),
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
      relation: RelationType.PropertyAccessor,
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
      relation: RelationType.Conditional,
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


