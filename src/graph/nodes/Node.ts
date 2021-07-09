export interface Node {
  type: string;

  id: string;

  lines: number[];
  statements: string[];

  description?: string;

  probe: boolean;
}







