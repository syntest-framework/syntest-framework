import { TypeResolver } from "./TypeResolver";
import { Typing, TypingType } from "./Typing";
import { Scope, ScopeType } from "../variable/Scope";
import { Element } from "../variable/Element";
import { Relation } from "../variable/Relation";

export class TypeResolverUnknown extends TypeResolver{

  getTyping(scopeName: string, scopeType: ScopeType, variableName: string): Typing {
    return {
      type: TypingType.Unknown
    }
  }

  resolveTypes(scopes: Scope[], elements: Element[], relations: Relation[], wrapperElementIsRelation: Map<string, Relation>) {
  }
}
