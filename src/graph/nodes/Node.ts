/**
 * Interface for a Node.
 *
 * @author Dimitri Stallenberg
 */
export interface Node {
  type: NodeType;

  id: string;

  lines: number[];
  statements: string[];

  description?: string;
}

export enum NodeType {
  Intermediary,
  Branch,
  Placeholder,
  Root,
  Normal,
}
