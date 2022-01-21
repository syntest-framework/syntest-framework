import {
  PublicVisibility,
  PrivateVisibility,
  TargetMetaData,
} from "@syntest/framework";
import { JavaScriptTargetMetaData } from "../JavaScriptTargetPool";

export class VariableVisitor {

  // function name (scope) -> variable name -> Variable object
  private variables: Map<string, Map<string, Variable>>
  // Stack because functions in functions in functions ... etc.
  private currentScopeStack: Scope[]

  constructor() {
    this.variables = new Map()
    this.currentScopeStack = []
  }

  private _enterScope(name: string, type: ScopeType) {
    this.currentScopeStack.push({
      name: name,
      type: type
    })

    const scope = this.currentScopeStack.map((s) => s.name).join(' -> ')
    if (!this.variables.has(scope)) {
      this.variables.set(scope, new Map<string, Variable>())
    }
  }

  private _exitScope(name) {
    const popped = this.currentScopeStack.pop()

    if (name !== popped) {
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

  public MethodDefinition = {
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
    },
    exit: (path) => {
      this._exitScope(path.node.id.name)
    }
  }

  // identifiers
  public Identifier: (path) => void = (path) => {
    const name = path.node.name
    const parent = path.parentNode

    let scope: Scope

    if (parent.type === 'MemberExpression') {
      if (parent.object.type === 'ThisExpression') {
        // get closest scope which allows "this.{something}"
        scope = [...this.currentScopeStack].reverse().find((s) => s.type === ScopeType.Class || s.type === ScopeType.Function)

        if (!scope) {
          throw new Error("Cannot find scope!")
        }
      } else {
        if (parent.object.type !== 'Identifier') {

        }

        scope = {
          name: ,
          type:
        }
      }
    }

    // let variable: Variable
    // if (this.variables.get(scope).has(name)) {
    //   variable = this.variables.get(scope).get(name)
    // } else {
    //   variable = {
    //     name: name,
    //     scope: scope,
    //     usage: []
    //   }
    //   this.variables.get(scope).set(name, variable)
    // }


    switch (parent.type) {
      case "FunctionExpression":
      case "FunctionDeclaration":
    }

  }

  // operations

  // returns (for function types)
}

export interface Variable {
  name: string, //
  scope: string, // function name | global
  usage: Usage[]
}

export interface Scope {
  name: string,
  type: ScopeType
}

export enum ScopeType {
  Class,
  Method,
  Function
}

export interface Usage {
  type: UsageType
  operation: string

}

export enum UsageType {
  BinaryOperation,
  UnaryOperation,
  Assignment,
  FunctionCall,
  Property,
}
