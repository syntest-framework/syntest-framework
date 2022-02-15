export enum ExportType {
  function,
  class,
  const,
}

export interface Export {
  name: string,
  type: ExportType,
  default: boolean,
  module: boolean,
  filePath: string
}

export class ExportVisitor {
  // TODO other export types such as module.export or exports.

  private _targetPath: string
  private _exports: Export[];
  private _identifiers: Map<string, ExportType>

  constructor(targetPath: string) {
    this._targetPath = targetPath
    this._exports = [];
    this._identifiers = new Map<string, ExportType>()
  }

  // exports
  public ExportNamedDeclaration: (path) => void = (path) => {
    if (path.node.declaration) {
      this._exports.push({
        name: path.node.declaration.id.name,
        type: this._getType(path.node.declaration.type, path.node.declaration.name),
        default: false,
        module: false,
        filePath: this._targetPath
      })
    } else if (path.node.specifiers) {

      if (path.node.source) {
        // TODO skip because we already tested it in another file
        return
      }

      for (const specifier of path.node.specifiers) {
        this._exports.push({
          name: specifier.local.name,
          type: this._getType(specifier.local.type, specifier.local.name),
          default: specifier.local.name === 'default',
          module: false,
          filePath: this._targetPath
        })
      }
    }

    throw new Error('Unknown named export')
  };

  public ExportDefaultDeclaration: (path) => void = (path) => {
    this._exports.push({
      name: path.node.declaration.name,
      type: this._getType(path.node.declaration.type, path.node.declaration.name),
      default: true,
      module: false,
      filePath: this._targetPath
    })
  };

  public ExpressionStatement: (path) => void = (path) => {
    if (path.node.expression.type === 'AssignmentExpression'
      && path.node.expression.left.type === 'MemberExpression'
    ) {
      if (path.node.expression.left.object.name === 'module'
        && path.node.expression.left.property.name === 'exports'
      ) {
        if (path.node.expression.right.type === 'Identifier') {
          this._exports.push({
            name: path.node.expression.right.name,
            type: this._getType(path.node.expression.right.type, path.node.expression.right.name),
            default: true,
            module: true,
            filePath: this._targetPath
          })
        } else if (path.node.expression.right.type === 'Literal'
          || path.node.expression.right.type === 'ArrayExpression') {
          this._exports.push({
            name: `${path.node.expression.right.type}`,
            type: ExportType.const,
            default: true,
            module: true,
            filePath: this._targetPath
          })
        } else if (path.node.expression.right.type === 'ObjectExpression') {
          for (const property of path.node.expression.right.properties) {
            this._exports.push({
              name: property.key.name,
              type: this._getType(property.key.type, property.key.name),
              default: false,
              module: true,
              filePath: this._targetPath
            })
          }
        }
      } else if (path.node.expression.left.object.name === 'exports') {
        if (path.node.expression.right.type === 'Identifier') {
          this._exports.push({
            name: path.node.expression.left.property.type === 'Identifier' ? path.node.expression.left.property.name : path.node.expression.left.property.value,
            type: this._getType(path.node.expression.right.type, path.node.expression.right.name),
            default: false,
            module: false,
            filePath: this._targetPath
          })
        } else if (path.node.expression.right.type === 'Literal'
          || path.node.expression.right.type === 'ArrayExpression'
          || path.node.expression.right.type === 'ObjectExpression') {
          this._exports.push({
            name: path.node.expression.left.property.type === 'Identifier' ? path.node.expression.left.property.name : path.node.expression.left.property.value,
            type: ExportType.const,
            default: false,
            module: false,
            filePath: this._targetPath
          })
        }
      }
    }
  };

  // identifiable stuff
  public FunctionDeclaration: (path) => void = (path) => {
    const identifier = path.node.id.name;
    this._identifiers.set(identifier, ExportType.function)
  }

  public ClassDeclaration: (path) => void = (path) => {
    const identifier = path.node.id.name;
    this._identifiers.set(identifier, ExportType.class)
  }

  public VariableDeclaration: (path) => void = (path) => {
    for (const declaration of path.node.declarations) {
      const identifier = declaration.id.name;

      if (declaration.init && declaration.init.type === "ArrowFunctionExpression") {
        this._identifiers.set(identifier, ExportType.function) // not always the case
      } else {
        this._identifiers.set(identifier, ExportType.const) // not always the case
      }
    }
  }

  // util function
  _getType(type: string, name?: string): ExportType {
    if (type === 'FunctionDeclaration') {
      return ExportType.function
    } else if (type === 'VariableDeclaration') {
      return ExportType.const
    }  else if (type === 'NewExpression') {
      return ExportType.const
    } else if (type === 'ClassDeclaration') {
      return ExportType.class
    } else if (type === 'Identifier') {
      if (!this._identifiers.has(name)) {
        throw new Error("Cannot find identifier that is exported: " + name + " - " + type)
      }

      return this._identifiers.get(name)
    }

    throw new Error("Unknown export type: " + type)
  }

  // getters
  get exports(): Export[] {
    return this._exports;
  }
}


