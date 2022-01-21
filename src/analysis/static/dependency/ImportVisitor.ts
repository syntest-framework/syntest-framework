export class ImportVisitor {
  private _imports: Set<string>;

  constructor() {
    this._imports = new Set<string>();
  }

  public ImportDeclaration: (path) => void = (path) => {
    this._imports.add(path.node.source.value)
  };

  get imports(): Set<string> {
    return this._imports;
  }
}
