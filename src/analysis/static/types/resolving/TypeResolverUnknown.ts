import { TypeResolver } from "./TypeResolver";
import { Typing, TypingType } from "./Typing";
import { Element } from "../discovery/Element";
import { Scope, ScopeType } from "../discovery/Scope";
import { Relation } from "../discovery/Relation";

export class TypeResolverUnknown extends TypeResolver{

  getTyping(scopeName: string, scopeType: ScopeType, variableName: string): Typing {
    return {
      type: TypingType.Unknown
    }
  }

  resolveTypes(scopes: Scope[], elements: Element[], relations: Relation[], wrapperElementIsRelation: Map<string, Relation>) {
  }
}
