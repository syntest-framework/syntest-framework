export interface Node {
  id: string;
  line: number;
  branch: boolean;
  condition?: Operation
  description?: string;
}

export interface Operation {
  type: string;
  operator: string;
}
