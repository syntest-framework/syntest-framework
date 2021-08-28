import {Node, NodeType} from "./nodes/Node";
import { Edge } from "./Edge";
import {FunctionDescription} from "./parsing/FunctionDescription";
import {RootNode} from "./nodes/RootNode";
import {Visibility} from "./parsing/Visibility";

export class CFG {
  private _nodes: Node[];
  private _edges: Edge[];

  constructor() {
    this._nodes = []
    this._edges = []
  }


  get nodes(): Node[] {
    return this._nodes;
  }

  get edges(): Edge[] {
    return this._edges;
  }


  set nodes(value: Node[]) {
    this._nodes = value;
  }

  set edges(value: Edge[]) {
    this._edges = value;
  }

  getFunctionDescriptions(
      contractOfInterest: string
  ): FunctionDescription[] {
    let nodes = this.getRootNodes();
    nodes = this.filterRootNodes(nodes, contractOfInterest);
    return this.convertRootNodeToFunctionDescription(nodes);
  }

  getRootNodes(): RootNode[] {
    return this._nodes
        .filter((node) => node.type === NodeType.Root)
        .map((node) => <RootNode>node);
  }

  filterRootNodes(
      nodes: RootNode[],
      contractOfInterest: string
  ): RootNode[] {
    return nodes.filter((node) => node.contractName === contractOfInterest);
  }

  visibilityToString(visibility: Visibility): string {
    return `${visibility}`;
  }

  convertRootNodeToFunctionDescription(
      nodes: RootNode[]
  ): FunctionDescription[] {
    // TODO bits and decimals?
    return nodes.map((node) => {
      return {
        name: node.functionName,
        isConstructor: node.isConstructor,
        type: node.isConstructor ? "constructor" : "function",
        visibility: node.visibility,
        parameters: node.parameters,
        returnParameters: node.returnParameters,
      };
    });
  }

}
