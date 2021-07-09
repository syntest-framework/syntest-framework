import {Node} from "./Node";
import {Parameter} from "../parsing/Parameter";
import {Visibility} from "../parsing/Visibility";

export interface RootNode extends Node {
    type: 'root';

    // if it is a root node
    contractName: string;
    functionName: string;
    isConstructor: boolean;

    parameters: Parameter[]
    returnParameters: Parameter[]
    visibility: Visibility
}