import {ActionDescription} from "./ActionDescription";
import {Parameter} from "./Parameter";
import {Visibility} from "./Visibility";

export interface FunctionDescription extends ActionDescription {
    name: string;
    type: string;
    visibility: Visibility;
    parameters: Parameter[];
    returnType: string;
}