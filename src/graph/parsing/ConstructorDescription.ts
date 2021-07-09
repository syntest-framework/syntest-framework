import {ActionDescription} from "./ActionDescription";
import {Parameter} from "./Parameter";

export interface ConstructorDescription extends ActionDescription {
    name: string;
    type: string;
    parameters: Parameter[];
}