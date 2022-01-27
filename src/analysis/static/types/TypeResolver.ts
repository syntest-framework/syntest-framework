import { Scope } from "../variable/VariableVisitor4";
import { Typing } from "./Typing";

export abstract class TypeResolver {
  abstract getTyping(scope: Scope, variableName: string): Typing
}