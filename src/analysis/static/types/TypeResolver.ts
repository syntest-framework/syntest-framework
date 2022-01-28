import { Typing } from "./Typing";
import { Scope } from "../variable/Scope";

export abstract class TypeResolver {
  abstract getTyping(scope: Scope, variableName: string): Typing
}
