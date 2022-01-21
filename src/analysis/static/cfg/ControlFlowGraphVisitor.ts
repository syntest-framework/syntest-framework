import {
  Node,
  BranchNode,
  CFG, NodeType, RootNode, Parameter, PublicVisibility,
} from "@syntest/framework";

export class ControlFlowGraphVisitor {
  private _cfg: CFG;
  private _parentStack: Node[][]
  private _branchCount: number

  get cfg(): CFG {
    return this._cfg;
  }

  constructor() {
    this._cfg = new CFG()
    this._parentStack = []
    this._branchCount = 0
  }

  private connectParents(children: Node[]) {
    if (!this._parentStack.length) {
      throw new Error("Something went wrong no parents found!")
    }
    const parents = this._parentStack[this._parentStack.length - 1]

    for (const parent of parents) {
      for (const child of children) {
        this._cfg.edges.push({
          from: parent.id,
          to: child.id
        })
      }
    }
  }

  // public resolveTypes(type: any): string {
  //   let paramType: string;
  //   switch (type.type) {
  //     case "ElementaryTypeName": {
  //       paramType = type.name;
  //       break;
  //     }
  //     case "UserDefinedTypeName": {
  //       paramType = type.namePath;
  //       break;
  //     }
  //     case "Mapping": {
  //       paramType = `Map<${type.keyType.name},${this.resolveTypes(
  //         type.valueType
  //       )}>`;
  //       break;
  //     }
  //     case "ArrayTypeName": {
  //       paramType = `${this.resolveTypes(type.baseTypeName)}[]`;
  //       break;
  //     }
  //     case "FunctionTypeName": {
  //       const parameterTypes = type.parameterTypes
  //         .map((param) => {
  //           return this.resolveTypes(param);
  //         })
  //         .join(",");
  //
  //       const returnTypes = type.returnTypes
  //         .map((param) => {
  //           return this.resolveTypes(param);
  //         })
  //         .join(",");
  //
  //       paramType = `function(${parameterTypes}):${returnTypes}`;
  //       break;
  //     }
  //   }
  //   return paramType;
  // }
  //
  private parseParameter(parameter): Parameter {
    return {
      name: parameter.name,
      type: 'unknown'// good question...
    };
  }

  public ClassMethod = {
    enter: (path) => {
      const node: RootNode = {
        contractName: "xxx",
        functionName: path.node.key.name,
        id: `${this._branchCount++}`,
        isConstructor: path.node.kind === 'constructor',
        lines: [path.node.loc.start.line],
        statements: [],
        type: NodeType.Root,

        parameters: path.node.params.map(this.parseParameter),
        returnParameters: [],

        visibility: PublicVisibility
      }

      this.cfg.nodes.push(node)

      this._parentStack.push([node])
    },
    exit: (path) => {
      this._parentStack.pop()
    }
  }


  public IfStatement = {
    enter: (path) => {
      if (!path.node.loc) {
        return
      }

      const node: BranchNode = {
        condition: {
          type: path.node.test.type,
          operator: path.node.test.operator
        },
        id: `${this._branchCount++}`,
        lines: [path.node.loc.start.line],
        statements: [],
        type: NodeType.Branch,
        probe: false,
      }

      this.cfg.nodes.push(node)

      this.connectParents([node])

      this._parentStack.push([node])
    },
    exit: (path) => {
      if (!path.node.loc) {
        return
      }


      // this._parentStack.pop()
      //
      // const node: Node = {
      //   id: `${this._branchCount++}`,
      //   lines: [path.node.loc.end.line],
      //   statements: [],
      //   type: NodeType.Intermediary,
      // }
      //
      // this.cfg.nodes.push(node)
      //
      // this.connectParents([node])
      //
      // this._parentStack.push([node])
    }
  }

  public BlockStatement = {
    enter: (path) => {
      if (!path.node.loc) {
        return
      }

      const node: Node = {
        id: `${this._branchCount++}`,
        lines: [path.node.loc.start.line],
        statements: [],
        type: NodeType.Placeholder,
      }

      this.cfg.nodes.push(node)

      this.connectParents([node])

      this._parentStack.push([node])
    },
    exit: (path) => {
      if (!path.node.loc) {
        return
      }
    }
  }

  public ExpressionStatement = (path) => {
    if (!path.node.loc) {
      return
    }

    const node: Node = {
      id: `${this._branchCount++}`,
      lines: [path.node.loc.start.line],
      statements: [],
      type: NodeType.Intermediary,
    }

    this.cfg.nodes.push(node)

    this.connectParents([node])

    this._parentStack.push([node])
  }

  public ReturnStatement = (path) => {
    if (!path.node.loc) {
      return
    }

    const node: Node = {
      id: `${this._branchCount++}`,
      lines: [path.node.loc.start.line],
      statements: [],
      type: NodeType.Intermediary,
    }

    this.cfg.nodes.push(node)

    this.connectParents([node])

    this._parentStack.pop()
  }
}
