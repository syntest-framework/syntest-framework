/*
 * Copyright 2020-2022 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest JavaScript.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Typing } from "./Typing";
import { Element } from "../discovery/Element";
import { Scope, ScopeType } from "../discovery/Scope";
import { Relation } from "../discovery/Relation";
import { ComplexObject } from "../discovery/object/ComplexObject";
import { TypeProbabilityMap } from "./TypeProbabilityMap";

/**
 * Abstract TypeResolver class
 *
 * @author Dimitri Stallenberg
 */
export abstract class TypeResolver {
  private _relationTyping: Map<Relation, TypeProbabilityMap>
  private _elementTyping: Map<Element, TypeProbabilityMap>

  private _relationFullyResolved: Set<Relation>

  /**
   * Constructor
   */
  constructor() {
    this._relationTyping = new Map()
    this._elementTyping = new Map()
    this._relationFullyResolved = new Set()
  }

  /**
   * Resolves the types of all given elements and relations
   * @param scopes the available scopes
   * @param elements the elements to resolve the types of
   * @param relations the relations to resolve the types of
   * @param wrapperElementIsRelation a map that specifies which elements are which relations
   * @param objects the user defined objects that are available to the file under evaluation
   */
  abstract resolveTypes(scopes: Scope[], elements: Element[], relations: Relation[], wrapperElementIsRelation: Map<string, Relation>, objects: ComplexObject[])

  /**
   * Returns the type of the variable in the given scope
   * @param scopeName the name of the scope the variable is in
   * @param scopeType the type of the scope the varaiable is in (function, class, global, etc.)
   * @param variableName the name of the variable
   */
  abstract getTyping(scopeName: string, scopeType: ScopeType, variableName: string): TypeProbabilityMap

  /**
   * Sets the type of the specified relation
   * @param relation the relation to set the type of
   * @param type the type of the relation
   * @param value the score of type (higher score means higher probability)
   */
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

  /**
   * Sets the type of the specified element
   * @param element the element to set the type of
   * @param type the type of the element
   * @param value the score of type (higher score means higher probability)
   */
  setElementType(element: Element, type: Typing, value: number) {
    if (this.elementTyping.has(element)) {
      const typeMap = this.elementTyping.get(element)
      typeMap.addType(type, value)
    } else {
      const typeMap = new TypeProbabilityMap()
      this.elementTyping.set(element, typeMap)
      typeMap.addType(type, value)
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
