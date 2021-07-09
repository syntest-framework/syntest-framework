import {Node} from "./Node";

export interface BranchNode extends Node {
    type: 'branch';

    condition: Operation;
}

export interface Operation {
    type: string;
    operator: string;
}