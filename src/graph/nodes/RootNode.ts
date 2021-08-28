import { Node, NodeType } from "./Node";
import { Parameter } from "../parsing/Parameter";
import { Visibility } from "../parsing/Visibility";

/**
 * Interface for a RootNode
 *
 * @author Dimitri Stallenberg
 */
export interface RootNode extends Node {
  type: NodeType.Root;

  // if it is a root node
  contractName: string;
  functionName: string;
  isConstructor: boolean;

  parameters: Parameter[];
  returnParameters: Parameter[];
  visibility: Visibility;
}
