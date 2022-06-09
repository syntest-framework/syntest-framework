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
import { Element, ElementType } from "../discovery/Element";
import { Relation, RelationType } from "../discovery/Relation";
import { ComplexObject } from "../discovery/object/ComplexObject";
import { TypeProbability } from "./TypeProbability";
import { Scope } from "../discovery/Scope";

/**
 * Abstract TypeResolver class
 *
 * @author Dimitri Stallenberg
 */
export abstract class TypeResolver {
  private _relationTyping: Map<Relation, TypeProbability>
  private _elementTyping: Map<Element, TypeProbability>

  private _relationFullyResolved: Set<Relation>

  private _wrapperElementIsRelation: Map<string, Relation>

  private processed: Map<Relation, Set<Element>>

  /**
   * Constructor
   */
  constructor() {
    this._relationTyping = new Map()
    this._elementTyping = new Map()
    this._relationFullyResolved = new Set()

    this.processed = new Map<Relation, Set<Element>>()
  }

  get availableTypes() {
    return [...this.elementTyping.values()]//, ...this.relationTyping.values()])
  }

  /**
   * Resolves the types of all given elements and relations
   * @param scopes the available scopes
   * @param elements the elements to resolve the types of
   * @param relations the relations to resolve the types of
   * @param wrapperElementIsRelation a map that specifies which elements are which relations
   * @param objects the user defined objects that are available to the file under evaluation
   */
  abstract resolveTypes(elements: Element[], relations: Relation[], wrapperElementIsRelation: Map<string, Relation>, objects: ComplexObject[])

  /**
   * Returns the identifierDescription of the variable in the given scope
   * @param scope the scope the variable is in
   * @param variableName the name of the variable
   */
  abstract getTyping(scope: Scope, variableName: string): TypeProbability

  /**
   * Sets the identifierDescription of the specified relation
   * @param relation the relation to set the identifierDescription of
   * @param type the identifierDescription of the relation
   * @param value the score of identifierDescription (higher score means higher probability)
   */
  setRelationType(relation: Relation, type: string | TypeProbability, value: number) {
    if (relation.relation === RelationType.PropertyAccessor) {
      this.setElementType(relation, relation.involved[1], type, 1)
      this.setProcessed(relation, relation.involved[1])
    }

    if (this.relationTyping.has(relation)) {
      const probabilities = this.relationTyping.get(relation)
      probabilities.addType(type, value)
    } else {
      const probabilities = new TypeProbability()
      this.relationTyping.set(relation, probabilities)
      probabilities.addType(type, value)
    }
  }

  setElementTypeToElement(relation: Relation, element: Element, typeElement: Element, value: number) {
    if (!this.elementTyping.has(typeElement)) {
      this.elementTyping.set(typeElement, new TypeProbability())
    }

    if (typeElement.type === ElementType.Relation) {
      const relation = this._wrapperElementIsRelation.get(typeElement.value)

      if (!relation) {
        throw new Error(`Cannot find relation: ${typeElement.value}`)
      }

      this.setElementType(relation, element, this.relationTyping.get(relation), value)

    } else {
      this.setElementType(relation, element, this.elementTyping.get(typeElement), value)
    }
  }

  setElementType(relation: Relation, element: Element, type: string | TypeProbability, value: number, object: ComplexObject = null, propertyTypings: Map<string, TypeProbability> = null) {
    if (!this.processed.has(relation)) {
      this.processed.set(relation, new Set<Element>())
    }

    if (this.processed.get(relation).has(element)) {
      return
    }

    this._setElementType(element, type, value, object, propertyTypings)
  }

  setProcessed(relation: Relation, element: Element) {
    if (!this.processed.has(relation)) {
      this.processed.set(relation, new Set<Element>())
    }

    this.processed.get(relation).add(element)
  }

    /**
   * Sets the identifierDescription of the specified element
   * @param element the element to set the identifierDescription of
   * @param type the type of the element
   * @param value the score of type (higher score means higher probability)
   */
  _setElementType(element: Element, type: string | TypeProbability, value: number, object: ComplexObject = null, propertyTypings: Map<string, TypeProbability> = null) {
    if (element.type === ElementType.Relation) {
      const relation = this._wrapperElementIsRelation.get(element.value)

      if (!relation) {
        throw new Error(`Cannot find relation: ${element.value}`)
      }

      this.setRelationType(relation, type, 1)
    }

    if (!this.elementTyping.has(element)) {
      this.elementTyping.set(element, new TypeProbability())
    }

    const typeMap = this.elementTyping.get(element)
    typeMap.addType(type, value, object, propertyTypings)
  }

  getRelationType(relation: Relation) {
    if (!this.relationTyping.has(relation)) {
      this.relationTyping.set(relation, new TypeProbability())
    }

    return this.relationTyping.get(relation)
  }

  getElementType(element: Element) {
    if (element.type === 'relation') {
      const relation: Relation = this.wrapperElementIsRelation.get(element.value)
      return this.getRelationType(relation)
    }

    if (!this.elementTyping.has(element)) {
      this.elementTyping.set(element, new TypeProbability())
    }

    return this.elementTyping.get(element)
  }

  get elements() {
    return [...this.elementTyping.keys()]
  }

  private get relationTyping(): Map<Relation, TypeProbability> {
    return this._relationTyping;
  }

  get elementTyping(): Map<Element, TypeProbability> {
    return this._elementTyping;
  }

  get relationFullyResolved(): Set<Relation> {
    return this._relationFullyResolved;
  }


  get wrapperElementIsRelation(): Map<string, Relation> {
    return this._wrapperElementIsRelation;
  }

  set wrapperElementIsRelation(value: Map<string, Relation>) {
    this._wrapperElementIsRelation = value;
  }
}
