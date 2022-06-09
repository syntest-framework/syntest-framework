import { Scope } from "./types/discovery/Scope";
import { Element, ElementType } from "./types/discovery/Element";

export abstract class Visitor {
  private _filePath: string;
  private _scopeIdOffset: number = undefined

  // TODO functionExpression has no id
  private _thisScopes: string[] = ['ClassDeclaration', 'FunctionDeclaration']
  private _thisScopeStack: number[]
  private _thisScopeStackNames: string[]

  constructor(filePath: string) {
    this._filePath = filePath
    this._thisScopeStack = []
    this._thisScopeStackNames = []
  }

  private _getCurrentThisScopeId() {
    if (!this._thisScopeStack.length) {
      throw new Error("Invalid scope stack!")
    }

    return this._thisScopeStack[this._thisScopeStack.length - 1]
  }

  private _getCurrentThisScopeName() {
    if (!this._thisScopeStackNames.length) {
      throw new Error("Invalid scope stack!")
    }

    return this._thisScopeStackNames[this._thisScopeStackNames.length - 1]
  }

  Program: (path) => void = (path) => {
    // this is required because babel does not reset its uid counter
    if (this._scopeIdOffset === undefined) {
      this._scopeIdOffset = path.scope.uid
      this._thisScopeStack.push(path.scope.uid)
      this._thisScopeStackNames.push('global')
    }
  }

  Scope = {
    enter: (path) => {
      if (!this._thisScopes.includes(path.node.type)) {
        return
      }

      const id: string = path.node.id?.name || 'anon'
      this._thisScopeStack.push(path.scope.uid)
      this._thisScopeStackNames.push(id)
    },
    exit: (path) => {
      if (!this._thisScopes.includes(path.node.type)) {
        return
      }

      this._thisScopeStack.pop()
      this._thisScopeStackNames.pop()
    }
  }

  _getScope(path): Scope {
    if (path.node.type === 'ThisExpression') {
      return {
        uid: `${this._getCurrentThisScopeId() - this.scopeIdOffset}`,
        filePath: this.filePath,
      }
    }

    if (path.node.type === 'MemberExpression') {
      const propertyName = path.node.property.name

      const objectScope: Scope = this._getScope(path.get('object'))

      objectScope.uid += '-' + propertyName

      return objectScope
    } else if (path.node.type === 'CallExpression') {
      return this._getScope(path.get('callee'))
    }

    if (path.parent.type === 'MemberExpression' && path.parentPath.get('property') === path) {
      const propertyName = path.node.name

      const objectScope: Scope = this._getScope(path.parentPath.get('object'))

      objectScope.uid += '-' + propertyName

      return objectScope
    }

    if (path.node.type === 'Identifier') {
      if (path.scope.hasGlobal(path.node.name)) {
        return {
          uid: 'global',
          filePath: this.filePath
        }
      }

      if (path.scope.hasBinding(path.node.name) && path.scope.getBinding(path.node.name)) {
        const variableScope = path.scope.getBinding(path.node.name).scope

        return {
          uid: `${variableScope.uid - this.scopeIdOffset}`,
          filePath: this.filePath,
        }
      }

      // if (path.scope.hasOwnBinding(node.name)) {
      //   const variableScope = path.scope.getOwnBinding(node.name).scope
      //
      //   return {
      //     uid: variableScope.uid,
      //     filePath: filePath,
      //   }
      // }

      // TODO these might be wrong
      if (path.parent.type === 'ClassMethod'
        || path.parent.type === 'ObjectMethod'
        || path.parent.type === 'AssignmentExpression'
        || path.parent.type === 'FunctionExpression'
        || path.parent.type === 'ObjectProperty'
        || path.parent.type === 'MetaProperty') {
        const uid = path.scope.getBlockParent()?.uid

        return {
          filePath: this.filePath,
          uid: `${uid - this.scopeIdOffset}`
        }
      }

      throw new Error(`Cannot find scope of Identifier ${path.node.name}\n${this.filePath}\n${path.getSource()}`)
    }

    // TODO super should be handled like this actually (kind off)
    if (path.node.type === 'Super'
      || path.node.type.includes('Expression')
      || path.node.type.includes('Literal')) {
      const uid = path.scope.getBlockParent()?.uid

      return {
        filePath: this.filePath,
        uid: `${uid - this.scopeIdOffset}`
      }
    }




    throw new Error(`Cannot find scope of element of type ${path.node.type}\n${this.filePath}\n${path.getSource()}`)

    // const uid = path.scope.getBlockParent()?.uid
    //
    // return {
    //   filePath: this.filePath,
    //   uid: `${uid - this.scopeIdOffset}`
    // }
    // const uid = path.scope.getBlockParent()?.uid
    //
    // return {
    //   filePath: this.filePath,
    //   uid: `${uid - this.scopeIdOffset}`
    // }
  }

  _getElement(path): Element {
    const uid = path.scope.getBlockParent()?.uid

    const scope: Scope = {
      filePath: this.filePath,
      uid: `${uid - this.scopeIdOffset}`
    }

    if (path.node.type === "PrivateName") {
      // TODO should be done differently maybe
      return {
        scope: scope,
        type: ElementType.Identifier,
        value: '#' + path.node.name
      }
    }

    switch (path.node.type) {
      case "NullLiteral":
        return {
          scope: scope,
          type: ElementType.NullConstant,
          value: null
        }
      case "StringLiteral":
      case "TemplateLiteral":
        return {
          scope: scope,
          type: ElementType.StringConstant,
          value: path.node.value
        }
      case "NumericLiteral":
        return {
          scope: scope,
          type: ElementType.NumericalConstant,
          value: path.node.value
        }
      case "BooleanLiteral":
        return {
          scope: scope,
          type: ElementType.BooleanConstant,
          value: path.node.value
        }
      case "RegExpLiteral":
        return {
          scope: scope,
          type: ElementType.RegexConstant,
          value: path.node.pattern
        }
      case "Super":
        return {
          scope: scope,
          type: ElementType.Identifier,
          value: 'super'
        }
    }

    if (path.node.type === "Identifier") {
      if (path.node.name === 'undefined') {
        return {
          scope: scope,
          type: ElementType.UndefinedConstant,
          value: path.node.name
        }
      }
      return {
        scope: this._getScope(path),
        type: ElementType.Identifier,
        value: path.node.name
      }
    } else if (path.node.type === "ThisExpression") {
      // TODO should be done differently maybe
      return {
        scope: this._getScope(path),
        type: ElementType.Identifier,
        value: 'this'
      }
    } else if (path.node.type === 'MemberExpression') {
      return {
        scope: this._getScope(path),
        type: ElementType.Relation,
        value: `%-${this.filePath}-${path.node.start}-${path.node.end}`
      }
    }

    // all relation stuff
    if (path.node.type === 'UnaryExpression'
      || path.node.type === 'UpdateExpression'
      || path.node.type === 'CallExpression'

      || path.node.type === 'BinaryExpression'
      || path.node.type === 'LogicalExpression'

      || path.node.type === 'ConditionalExpression'

      || path.node.type === 'ArrowFunctionExpression'
      || path.node.type === 'FunctionExpression'
      || path.node.type === 'ClassExpression'

      || path.node.type === 'SpreadElement'
      || path.node.type === 'NewExpression'
      || path.node.type === 'SequenceExpression'
      || path.node.type === 'ObjectPattern'
      || path.node.type === 'RestElement'

      || path.node.type === 'ArrayExpression'
      || path.node.type === 'ObjectExpression'
      || path.node.type === 'AwaitExpression'

      || path.node.type === 'ObjectProperty'
      || path.node.type === 'ObjectMethod'

      || path.node.type === 'AssignmentExpression'
      || path.node.type === 'AssignmentPattern'
      || path.node.type === 'ArrayPattern'
      || path.node.type === 'PrivateName'
      || path.node.type === 'MetaProperty') {

      // TODO should be default
      return {
        scope: scope,
        type: ElementType.Relation,
        value: `%-${this.filePath}-${path.node.start}-${path.node.end}`
      }
    }
    throw new Error(`Cannot get element: "${path.node.name}" -> ${path.node.type}\n${this.filePath}`)
  }


  get filePath(): string {
    return this._filePath;
  }

  get scopeIdOffset(): number {
    return this._scopeIdOffset;
  }

  set scopeIdOffset(value: number) {
    this._scopeIdOffset = value;
  }
}
