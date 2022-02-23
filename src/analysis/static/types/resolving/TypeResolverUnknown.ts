import { TypeResolver } from "./TypeResolver";
import { Element } from "../discovery/Element";
import { Scope, ScopeType } from "../discovery/Scope";
import { Relation } from "../discovery/Relation";
import { TypeProbabilityMap } from "./TypeProbabilityMap";

export class TypeResolverUnknown extends TypeResolver{

  getTyping(scopeName: string, scopeType: ScopeType, variableName: string): TypeProbabilityMap {
    return new TypeProbabilityMap()
  }

  resolveTypes(scopes: Scope[], elements: Element[], relations: Relation[], wrapperElementIsRelation: Map<string, Relation>) {
  }
}
