export interface Node {
  id: string;

  root: boolean;
  // if it is a root node
  contractName?: string;
  functionName?: string;
  isConstructor?: boolean;

  branch: boolean;
  probe: boolean;
  // if it is a branch or probe node
  condition?: Operation;

  lines: number[];
  statements: string[];

  placeholder?: boolean;
  description?: string;
}

export interface Operation {
  type: string;
  operator: string;
}
