import { Typing } from "./Typing";
import { Element } from "../discovery/Element";
import { Scope, ScopeType } from "../discovery/Scope";
import { Relation } from "../discovery/Relation";
import { ComplexObject } from "../discovery/object/ComplexObject";
import { TypeProbabilityMap } from "./TypeProbabilityMap";

// TODO would be better if the typeresolver works for all files
export abstract class TypeResolver {
  private _relationTyping: Map<Relation, TypeProbabilityMap> // TODO should be probability distribution per typing
  private _elementTyping: Map<Element, TypeProbabilityMap>

  private _relationFullyResolved: Set<Relation> // TODO should be probability distribution per typing

  constructor() {
    this._relationTyping = new Map()
    this._elementTyping = new Map()
    this._relationFullyResolved = new Set()
  }

  abstract resolveTypes(scopes: Scope[], elements: Element[], relations: Relation[], wrapperElementIsRelation: Map<string, Relation>, objects: ComplexObject[])
  abstract getTyping(scopeName: string, scopeType: ScopeType, variableName: string): TypeProbabilityMap

  setRelationType(relation: Relation, type: Typing, value: number) {
    if (this.relationTyping.has(relation)) {
      const probabilities = this.relationTyping.get(relation)
      probabilities.addType(type, value)
    } else {
      const probabilities = new TypeProbabilityMap()
      this.relationTyping.set(relation, probabilities)
      probabilities.addType(type, value)
    }
  }

  setElementType(element: Element, type: Typing, value: number) {
    if (this.elementTyping.has(element)) {
      const probabilities = this.elementTyping.get(element)
      probabilities.addType(type, value)
    } else {
      const probabilities = new TypeProbabilityMap()
      this.elementTyping.set(element, probabilities)
      probabilities.addType(type, value)
    }
  }

  get relationTyping(): Map<Relation, TypeProbabilityMap> {
    return this._relationTyping;
  }

  get elementTyping(): Map<Element, TypeProbabilityMap> {
    return this._elementTyping;
  }

  get relationFullyResolved(): Set<Relation> {
    return this._relationFullyResolved;
  }
}
