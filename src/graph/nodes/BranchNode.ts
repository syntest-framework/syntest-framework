import { Node, NodeType } from "./Node";

/**
 * Interface for a BranchNode.
 *
 * @author Dimitri Stallenberg
 */
export interface BranchNode extends Node {
  type: NodeType.Branch;

  condition: Operation;

  probe: boolean;
}

/**
 * Interface for an Operation.
 *
 * @author Dimitri Stallenberg
 */
export interface Operation {
  type: string;
  operator: string;
}
