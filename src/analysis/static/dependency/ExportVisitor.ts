export class ExportVisitor {
  // TODO export types maybe (const/function/class)
  // TODO default vs named
  // TODO other export types such as module.export or exports.

  private _exports: Set<string>;

  constructor() {
    this._exports = new Set<string>();
  }

  public ExportNamedDeclaration: (path) => void = (path) => {
    this._exports.add(path.node.declaration.id.name)
  };

  public ExportDefaultDeclaration: (path) => void = (path) => {
    // TODO
  };


  get exports(): Set<string> {
    return this._exports;
  }
}
