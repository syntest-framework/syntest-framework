export interface Node {
  description?: string;

  id: string;
  line: number;

  branch: boolean;
  // if it is a branch node
  condition?: Operation;

  root: boolean;
  // if it is a root node
  contractName?: string;
  functionName?: string;
  isConstructor?: boolean;
}

export interface Operation {
  type: string;
  operator: string;
}
