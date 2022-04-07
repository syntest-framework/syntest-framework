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
import { TypeResolver } from "../TypeResolver";
import { elementTypeToTypingType, Typing, TypingType } from "../Typing";
import { Relation, RelationType } from "../../discovery/Relation";
import { Scope, ScopeType } from "../../discovery/Scope";
import { Element, isInstanceOfElement } from "../../discovery/Element";
import { ComplexObject } from "../../discovery/object/ComplexObject";
import { TypeProbabilityMap } from "../TypeProbabilityMap";

export class TypeResolverInference extends TypeResolver {

  private wrapperElementIsRelation: Map<string, Relation>

  resolvePrimitiveElements(elements: Element[]): boolean {
    let somethingSolved = false
    for (const element of elements) {
      if (this.elementTyping.has(element)) {
        continue
      }

      const typingsType = elementTypeToTypingType(element.type)

      if (typingsType) {
        this.setElementType(element, { type: typingsType }, 1)
        somethingSolved = true
      }
    }
    return somethingSolved
  }

  resolveComplexElements(scopes: Scope[], elements: Element[], relations: Relation[], wrapperElementIsRelation: Map<string, Relation>, objects: ComplexObject[]): boolean {
    let somethingSolved = false

    // filter relations by property accessors
    const propertyAccessors = relations.filter((r) => r.relation === RelationType.PropertyAccessor)

    for (const element of elements) {
      if (this.elementTyping.has(element)) {
        continue
      }

      if (element.type !== 'identifier') {
        continue
      }

      // TODO should also have same scope
      const relevantAccessors = propertyAccessors.filter((r) => r.involved[0].value === element.value)
      const properties = relevantAccessors.map((r) => r.involved[1])

      if (!properties.length) {
        continue
      }

      // TODO find out wether function property or regular property

      // find best matching object
      let total = 0
      for (const object of objects) {
        let score = 0
        for (const prop of properties) {
          if (object.properties.has(prop.value) || object.functions.has(prop.value)) {
            score += 1
          }
        }

        // atleast score of one
        if (score > 0) {
          if (object.name === 'function') {
            this.setElementType(element, { type: TypingType.FUNCTION }, score)
          } else if (object.name === 'string') {
            this.setElementType(element, { type: TypingType.STRING }, score)
          } else if (object.name === 'array') {
            this.setElementType(element, { type: TypingType.ARRAY }, score)
          }else {
            this.setElementType(element, {
              type: TypingType.OBJECT,
              name: object.name,
              import: object.import,
            }, score)
          }

          total += score
        }
      }

      somethingSolved = true
    }

    return somethingSolved
  }

  resolveTypes(scopes: Scope[], elements: Element[], relations: Relation[], wrapperElementIsRelation: Map<string, Relation>, objects: ComplexObject[]) {
    this.wrapperElementIsRelation = wrapperElementIsRelation


    // TODO remove this
    let rounds = 0
    let somethingSolved = true
    while (somethingSolved && rounds < 1000) {
      somethingSolved = false
      rounds += 1 // TODO remove this

      // TODO maybe this is only needed once
      somethingSolved = this.resolvePrimitiveElements(elements) || somethingSolved
      somethingSolved = this.resolveComplexElements(scopes, elements, relations, wrapperElementIsRelation, objects) || somethingSolved


      for (const relation of relations) {
        if (this.relationFullyResolved.has(relation)) {
          continue
        }
        const resolveInvolved = (e: Element) => {
          if (this.elementTyping.has(e)) {
            return this.elementTyping.get(e)
          } else if (e.type === 'relation' && this.relationTyping.has(wrapperElementIsRelation.get(e.value))) {
            return this.relationTyping.get(wrapperElementIsRelation.get(e.value))
          }
          return e
        }

        const involved: (Element | TypeProbabilityMap)[] = relation.involved
          .map(resolveInvolved)

        const allResolved = this.resolveRelationElements(relation.relation, involved)

        // TODO TODO FALSE can also resolve the result of a relation without its elements
        if (allResolved) {
          const resolveInvolved = (e: Element) => {
            if (this.elementTyping.has(e)) {
              return this.elementTyping.get(e)
            } else if (e.type === 'relation' && this.relationTyping.has(wrapperElementIsRelation.get(e.value))) {
              return this.relationTyping.get(wrapperElementIsRelation.get(e.value))
            }
            throw new Error("Should all be resolved!!!")
          }

          const involved: TypeProbabilityMap[] = relation.involved
            .map(resolveInvolved)

          const relationResolved = this.resolveRelation(relation, involved)

          if (relationResolved) {
            somethingSolved = true
            this.relationFullyResolved.add(relation)
          }
        }
      }
    }
  }

  getTyping(scopeName: string, scopeType: ScopeType, variableName: string): TypeProbabilityMap {
    const element = [...this.elementTyping.keys()].find((e) => e.scope.name === scopeName && e.scope.type === scopeType && e.value === variableName)

    if (!element) {
      return new TypeProbabilityMap()
    }
    return this.elementTyping.get(element);
  }

  resolveRelationElements(relation: RelationType, involved: (Element | TypeProbabilityMap)[]): boolean {
    switch (relation) {
      case RelationType.PropertyAccessor: // could be multiple things
        // although the first has to an object/array/function
        return false
      case RelationType.New: //
        return false
      case RelationType.Spread: // hmmmm this is hard....
        return false

      case RelationType.PlusPlusPrefix: // must be numerical
      case RelationType.MinusMinusPrefix: // must be numerical
      case RelationType.PlusPlusPostFix: // must be numerical
      case RelationType.MinusMinusPostFix: // must be numerical
        if (isInstanceOfElement(involved[0])) {
          this.setElementType(involved[0], { type: TypingType.NUMERIC }, 1)
        }
        return true

      // Unary
      case RelationType.Delete: // could be multiple things
        return false
      case RelationType.Void: // could be multiple things
        return false
      case RelationType.TypeOf: // could be multiple things
        return false
      case RelationType.PlusUnary: // could be multiple things
        return false
      case RelationType.MinusUnary: // could be multiple things
        return false
      case RelationType.BitwiseNotUnary: // could be multiple things
        return false
      case RelationType.LogicalNotUnary: // could be multiple things
        return false


      // binary
      case RelationType.Addition:
        return false // could be multiple things
      case RelationType.Subtraction: // must be numerical
      case RelationType.Division: // must be numerical
      case RelationType.Multiplication: // must be numerical
      case RelationType.Remainder: // must be numerical
      case RelationType.Exponentiation: // must be numerical
        if (isInstanceOfElement(involved[0])) {
          this.setElementType(involved[0], { type: TypingType.NUMERIC }, 1)
        }
        if (isInstanceOfElement(involved[1])) {
          this.setElementType(involved[1], { type: TypingType.NUMERIC }, 1)
        }
        return true

      case RelationType.In: // could be multiple things
      case RelationType.InstanceOf: // could be multiple things
      case RelationType.Less: // must be numeric
      case RelationType.Greater: // must be numeric
      case RelationType.LessOrEqual: // must be numeric
      case RelationType.GreaterOrEqual: // must be numeric
        if (isInstanceOfElement(involved[0])) {
          this.setElementType(involved[0], { type: TypingType.NUMERIC }, 1)
        }
        if (isInstanceOfElement(involved[1])) {
          this.setElementType(involved[1], { type: TypingType.NUMERIC }, 1)
        }
        return true

      case RelationType.Equality: // could be multiple things
      case RelationType.InEquality: // could be multiple things
      case RelationType.StrictEquality: // could be multiple things
      case RelationType.StrictInequality: // could be multiple things
        return false

      case RelationType.BitwiseLeftShift: // must be numeric
      case RelationType.BitwiseRightShift: // must be numeric
      case RelationType.BitwiseUnsignedRightShift: // must be numeric

      case RelationType.BitwiseAnd: // must be numeric
      case RelationType.BitwiseOr: // must be numeric
      case RelationType.BitwiseXor: // must be numeric
        if (isInstanceOfElement(involved[0])) {
          this.setElementType(involved[0], { type: TypingType.NUMERIC }, 1)
        }
        if (isInstanceOfElement(involved[1])) {
          this.setElementType(involved[1], { type: TypingType.NUMERIC }, 1)
        }
        return true

      case RelationType.LogicalAnd: // could be multiple things
      case RelationType.LogicalOr: // could be multiple things
      case RelationType.NullishCoalescing: // Could be multiple things
        return false

      // ternary
      case RelationType.Conditional: // could be multiple things
        return false

      case RelationType.Assignment: // must be the same
        // TODO not sure if this works, this will propogate changed to either element to the other
        if (isInstanceOfElement(involved[0]) && !isInstanceOfElement(involved[1])) {
          // this.setElementType(involved[0], { type: involved[1].type }, 1)
          this.elementTyping.set(involved[0], involved[1])
          return true
        } else if (!isInstanceOfElement(involved[0]) && isInstanceOfElement(involved[1])) {
          // this.setElementType(involved[1], { type: involved[0].type }, 1)
          this.elementTyping.set(involved[1], involved[0])
          return true
        }
        return false
      case RelationType.MultiplicationAssignment: // must be numeric
      case RelationType.ExponentiationAssignment: // must be numeric
      case RelationType.DivisionAssignment: // must be numeric
      case RelationType.RemainderAssigment: // must be numeric
      case RelationType.SubtractionAssignment: // must be numeric
      case RelationType.LeftShiftAssignment: // must be numeric
      case RelationType.RightShiftAssignment: // must be numeric
      case RelationType.UnSignedRightShiftAssignment: // must be numeric
      case RelationType.BitwiseAndAssignment: // must be numeric
      case RelationType.BitwiseXorAssignment: // must be numeric
      case RelationType.BitwiseOrAssignment: // must be numeric
        if (isInstanceOfElement(involved[0])) {
          this.setElementType(involved[0], { type: TypingType.NUMERIC }, 1)
        }
        if (isInstanceOfElement(involved[1])) {
          this.setElementType(involved[1], { type: TypingType.NUMERIC }, 1)
        }
        return true
      case RelationType.AdditionAssignment: // must be numeric or string
        return false

      case RelationType.LogicalAndAssignment: // could be multiple things
      case RelationType.LogicalOrAssignment: // could be multiple things
      case RelationType.LogicalNullishAssignment: // could be multiple things
        return false

      case RelationType.Return: // could be multiple things

      // multi
      case RelationType.Parameters: // could be multiple things
      case RelationType.Call: // could be multiple things
        // but we do know that the first involved element is a function
        if (isInstanceOfElement(involved[0])) {
          this.setElementType(involved[0], { type: TypingType.FUNCTION }, 1)
        }
        return false

      case RelationType.Object: // could be multiple things
      case RelationType.Array: // could be multiple things
        return false
    }

    throw new Error("not implemented")
  }

  resolveRelation(relation: Relation, involved: TypeProbabilityMap[]): boolean {
    // TODO

    switch (relation.relation) {
      // Unary
      case RelationType.PropertyAccessor: // must be equal to the type of the member element
        this.relationTyping.set(relation, involved[1])
        return true
      case RelationType.New: //
        // TODO
        return false
      case RelationType.Spread: // must be array i think
        this.setRelationType(relation, { type: TypingType.ARRAY }, 1)
        return true

      case RelationType.PlusPlusPostFix: // must be numerical
      case RelationType.MinusMinusPostFix: // must be numerical
      case RelationType.PlusPlusPrefix: // must be numerical
      case RelationType.MinusMinusPrefix: // must be numerical
        this.setRelationType(relation, { type: TypingType.NUMERIC }, 1)
        return true

      case RelationType.Delete: // must be string
        // TODO
        return false
      case RelationType.Void: // must be void
        // TODO
        return false
      case RelationType.TypeOf: // must be string
        this.setRelationType(relation, { type: TypingType.STRING }, 1)
        return true
      case RelationType.PlusUnary: // must be numerical
      case RelationType.MinusUnary: // must be numerical
        this.setRelationType(relation, { type: TypingType.NUMERIC }, 1)
        return true
      case RelationType.BitwiseNotUnary: // must be boolean
      case RelationType.LogicalNotUnary: // must be boolean
        this.setRelationType(relation, { type: TypingType.BOOLEAN }, 1)
        return true


      // binary
      case RelationType.Addition:
        // if (involved[0].g === TypingType.STRING || involved[1].type === TypingType.STRING) {
        //   this.relationTyping.set(relation, { type: TypingType.STRING })
        // } else if (involved[0].type === TypingType.NUMERIC || involved[1].type === TypingType.NUMERIC) {
        //   this.relationTyping.set(relation, { type: TypingType.NUMERIC })
        // } else {
        //   return false // TODO maybe its always NaN?
        // }
        // TODO no clue
        return false
      case RelationType.Subtraction: // must be numerical
      case RelationType.Division: // must be numerical
      case RelationType.Multiplication: // must be numerical
      case RelationType.Remainder: // must be numerical
      case RelationType.Exponentiation: // must be numerical
        this.setRelationType(relation, { type: TypingType.NUMERIC }, 1)
        return true

      case RelationType.In: //
        // TODO
        return false
      case RelationType.InstanceOf: // must be boolean
      case RelationType.Less: // must be boolean
      case RelationType.Greater: // must be boolean
      case RelationType.LessOrEqual: // must be boolean
      case RelationType.GreaterOrEqual: // must be boolean
        this.setRelationType(relation, { type: TypingType.BOOLEAN }, 1)
        return true

      case RelationType.Equality: // must be boolean
      case RelationType.InEquality: // must be boolean
      case RelationType.StrictEquality: // must be boolean
      case RelationType.StrictInequality: // must be boolean
        this.setRelationType(relation, { type: TypingType.BOOLEAN }, 1)
        return true

      case RelationType.BitwiseLeftShift: // must be numeric
      case RelationType.BitwiseRightShift: // must be numeric
      case RelationType.BitwiseUnsignedRightShift: // must be numeric
        this.setRelationType(relation, { type: TypingType.NUMERIC }, 1)
        return true

      case RelationType.BitwiseAnd: // must be numeric
      case RelationType.BitwiseOr: // must be numeric
      case RelationType.BitwiseXor: // must be numeric
        this.setRelationType(relation, { type: TypingType.NUMERIC }, 1)
        return true

      case RelationType.LogicalOr: // can be the type of the first or second one depending on if the first is not false/null/undefined
      case RelationType.LogicalAnd: //can be the boolean or the type of the second one depending on if the first and second are not false/null/undefined
      case RelationType.NullishCoalescing: //??
        // this.relationTyping.set(relation, { type: involved[1].type })
        return false

      // ternary
      case RelationType.Conditional: // could be multiple things
        // TODO
        return false

      case RelationType.Assignment: // no relation type
      case RelationType.MultiplicationAssignment: // no relation type
      case RelationType.ExponentiationAssignment: // no relation type
      case RelationType.DivisionAssignment: // no relation type
      case RelationType.RemainderAssigment: // no relation type
      case RelationType.AdditionAssignment: // no relation type
      case RelationType.SubtractionAssignment: // no relation type
      case RelationType.LeftShiftAssignment: // no relation type
      case RelationType.RightShiftAssignment: // no relation type
      case RelationType.UnSignedRightShiftAssignment: // no relation type
      case RelationType.BitwiseAndAssignment: // no relation type
      case RelationType.BitwiseXorAssignment: // no relation type
      case RelationType.BitwiseOrAssignment: // no relation type
      case RelationType.LogicalAndAssignment: // no relation type
      case RelationType.LogicalOrAssignment: // no relation type
      case RelationType.LogicalNullishAssignment: // no relation type

        // TODO
        // this.relationTyping.set(relation, { type: TypingType.NULL })
        return false

      // TODO

      case RelationType.Return: // must be equal to the type of the returned element
      case RelationType.Parameters: // could be multiple things
      case RelationType.Call: // must be the return type of the called function
      case RelationType.Object: // could be multiple things
      case RelationType.Array: // could be multiple things
        return false
    }

    throw new Error("not implemented")
  }

}
