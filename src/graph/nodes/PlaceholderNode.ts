import { Node, NodeType } from "./Node";

/**
 * Interface for a Placeholder Node.
 *
 * @author Dimitri Stallenberg
 */
export interface PlaceholderNode extends Node {
  type: NodeType.Placeholder;
}
