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
  intermediary,
  branch,
  placeholder,
  root,
  normal,
}
