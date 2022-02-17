export class ImportVisitor {
  private _imports: Set<string>;

  constructor() {
    this._imports = new Set<string>();
  }

  public ImportDeclaration: (path) => void = (path) => {
    this._imports.add(path.node.source.value)
  };

  public CallExpression: (path) => void = (path) => {
    if (path.node.callee.name === 'require') {

      if (path.node.arguments[0].type === 'StringLiteral') {
        this._imports.add(path.node.arguments[0].value)
      } else {
        throw new Error("This tool does not support dynamic require statements.")
      }
    }
  };

  get imports(): Set<string> {
    return this._imports;
  }
}
