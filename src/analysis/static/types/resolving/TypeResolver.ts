import { Typing } from "./Typing";
import { Element } from "../discovery/Element";
import { Scope, ScopeType } from "../discovery/Scope";
import { Relation } from "../discovery/Relation";
import { ComplexObject } from "../discovery/object/ComplexObject";

// TODO would be better if the typeresolver works for all files
export abstract class TypeResolver {
  private _relationTyping: Map<Relation, Typing> // TODO should be probability distribution per typing
  private _elementTyping: Map<Element, Map<Typing, number>> // TODO should be probability distribution per typing

  private _relationFullyResolved: Set<Relation> // TODO should be probability distribution per typing

  constructor() {
    this._relationTyping = new Map()
    this._elementTyping = new Map()
    this._relationFullyResolved = new Set()
  }

  abstract resolveTypes(scopes: Scope[], elements: Element[], relations: Relation[], wrapperElementIsRelation: Map<string, Relation>, objects: ComplexObject[])
  abstract getTyping(scopeName: string, scopeType: ScopeType, variableName: string): Typing

  get relationTyping(): Map<Relation, Typing> {
    return this._relationTyping;
  }

  get elementTyping(): Map<Element, Map<Typing, number>> {
    return this._elementTyping;
  }

  get relationFullyResolved(): Set<Relation> {
    return this._relationFullyResolved;
  }
}
