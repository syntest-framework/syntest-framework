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
import { elementTypeToTypingType, TypeEnum } from "../TypeEnum";
import { Relation, RelationType } from "../../discovery/Relation";
import { Element, isInstanceOfElement } from "../../discovery/Element";
import { ComplexObject } from "../../discovery/object/ComplexObject";
import { TypeProbability } from "../TypeProbability";
import { Scope } from "../../discovery/Scope";

export class TypeResolverInference extends TypeResolver {

  private wrapperElementIsRelation: Map<string, Relation>

  /**
   * This function resolves constant elements such as numerical constants or other primitives
   * @param elements the elements to resolve
   */
  resolvePrimitiveElements(elements: Element[]): boolean {
    let somethingSolved = false
    for (const element of elements) {
      if (this.elementTyping.has(element)) {
        continue
      }

      const typingsType = elementTypeToTypingType(element.type)

      if (typingsType) {
        this.setElementType(element, typingsType, 1)
        somethingSolved = true
      }
    }
    return somethingSolved
  }

  resolveRelations(elements: Element[], relations: Relation[], wrapperElementIsRelation: Map<string, Relation>): boolean {
    let somethingSolved = false
    for (const relation of relations) {
      if (this.relationFullyResolved.has(relation)) {
        continue
      }
      // try to resolve elements that are involved in the relation
      const resolveInvolved = (e: Element) => {
        if (this.elementTyping.has(e)) {
          return this.elementTyping.get(e)
        } else if (e.type === 'relation' && this.relationTyping.has(wrapperElementIsRelation.get(e.value))) {
          // if the element is a relation try to find the typing based on the wrapper element of the relation
          return this.relationTyping.get(wrapperElementIsRelation.get(e.value))
        }
        // if we cannot resolve the element return it
        return e
      }

      const involved: (Element | TypeProbability)[] = relation.involved
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
          console.log(e)
          console.log(wrapperElementIsRelation.get(e.value))
          console.log(relation)
          throw new Error("Should all be resolved!!!")
        }

        const involved: TypeProbability[] = relation.involved
          .map(resolveInvolved)

        const relationResolved = this.resolveRelation(relation, involved)

        if (relationResolved) {
          somethingSolved = true
          this.relationFullyResolved.add(relation)
        }
      }
    }
    return somethingSolved
  }

  resolveComplexElements(elements: Element[], relations: Relation[], wrapperElementIsRelation: Map<string, Relation>, objects: ComplexObject[]): boolean {
    let somethingSolved = false

    // filter relations by property accessors
    const propertyAccessors = relations.filter((r) => r.relation === RelationType.PropertyAccessor)

    for (const element of elements) {
      if (element.type !== 'identifier' || element.value === 'this') { // TODO this
        continue
      }

      const properties = propertyAccessors
        .filter((r) => {
          return r.involved[0].value === element.value
        })
        .filter((r) => {
          return r.involved[0].scope.uid === element.scope.uid
          && r.involved[0].scope.filePath === element.scope.filePath
        })
        .map((r) => {
          return r.involved[1]
        })
        // remove duplicates
        .reduce((unique: Element[], item) => {
          const found = unique.find((uniqueItem: Element) => {
            return uniqueItem.value === item.value
            && uniqueItem.scope.uid === item.scope.uid
            // && uniqueItem.scope.type === item.scope.type
          })
          if (found) {
            return unique
          } else {
            return [...unique, item]
          }
        }, [])



      if (!properties.length) {
        continue
      }

      // TODO find out wether function property or regular property

      // TODO can be improved by comparing property types


      const anonObject: ComplexObject = {
        import: "",
        name: "anon",
        properties: new Set<string>(),
        functions: new Set<string>(),
        propertyType: new Map<string, TypeProbability>()
      }

      properties.forEach((p) => {
        anonObject.properties.add(p.value)
        if (this.elementTyping.has(p)) {
          anonObject.propertyType.set(p.value, this.elementTyping.get(p))
        }
      })

      const objects_ = [anonObject, ...objects, ]

      // find matching objects
      for (const object of objects_) {
        let score = 0
        for (const prop of properties) {
          if (object.properties.has(prop.value) || object.functions.has(prop.value)) {
            score += 1
          }
        }



        // atleast score of one
        if (score > 0) {
          let type: TypeEnum

          if (object.name === 'function') {
            type = TypeEnum.FUNCTION
          } else if (object.name === 'string') {
            type = TypeEnum.STRING
          } else if (object.name === 'array') {
            type = TypeEnum.ARRAY
          } else {
            type = TypeEnum.OBJECT
          }

          const propertyTypings: Map<string, TypeProbability> = new Map()

          let found = 0

          object.functions.forEach((func) => {
            const typeMap = new TypeProbability([[TypeEnum.FUNCTION, 1, null]])

            found += 1

            propertyTypings.set(func, typeMap)
          })

          object.properties.forEach((prop) => {
            if (object.propertyType && object.propertyType.has(prop)) {
              const typeMap = new TypeProbability([[object.propertyType.get(prop), 1, null]])
              found += 1
              propertyTypings.set(prop, typeMap)
              return
            }
            const element = properties.find((p) => p.value === prop)

            if (element && this.elementTyping.has(element)) {
              found += 1
              propertyTypings.set(element.value, this.elementTyping.get(element))
              return
            }

            // get type info from the object definition
            const relevantRelations = relations
              .filter((r) => r.relation === RelationType.PropertyAccessor)
              .filter((r) => r.involved[1].scope.filePath === object.import)
              // .filter((r) => r.involved[1].scope.uid === object.uid) // todo
              .filter((r) => r.involved[0].value === 'this')
              .filter((r) => r.involved[1].value === prop)
              .filter((r) => r.involved[1].type === 'identifier')

            elements = relevantRelations.map((r) => r.involved[1])

            // if (elements.length > 2) {
            //   const el1 = elements[0]
            //
            //   for (const el2 of elements) {
            //     if (el1 !== el2) {
            //       console.log(object)
            //       console.log(elements)
            //       process.exit()
            //     }
            //   }
            // }

            if (elements.length && this.elementTyping.has(elements[0])) {
              found += 1
              propertyTypings.set(elements[0].value, this.elementTyping.get(elements[0]))
              return
            }
          })

          // properties.forEach((p) => {
          //   if (this.elementTyping.has(p)) {
          //     found += 1
          //     propertyTypings.set(p.value, this.elementTyping.get(p))
          //   } else {
          //     const typeMap = new TypeProbabilityMap()
          //     // standard types
          //     if (object.functions.has(p.value)) {
          //       found += 1
          //       typeMap.addType({
          //         type: TypeEnum.FUNCTION
          //       })
          //     } else if (object.propertyType && object.propertyType.has(p.value)) {
          //       found += 1
          //       typeMap.addType(object.propertyType.get(p.value))
          //     }
          //
          //     propertyTypings.set(p.value, typeMap)
          //   }
          // })

          this.setElementType(element, type, score, object, propertyTypings)

          somethingSolved = true // TODO should be here right?
        }
      }


    }

    return somethingSolved
  }

  resolveTypes(elements: Element[], relations: Relation[], wrapperElementIsRelation: Map<string, Relation>, objects: ComplexObject[]) {
    this.wrapperElementIsRelation = wrapperElementIsRelation


    // TODO remove this
    let rounds = 0
    let somethingSolved = true
    while (somethingSolved && rounds < 100) {
      somethingSolved = false
      rounds += 1 // TODO remove this

      somethingSolved = this.resolvePrimitiveElements(elements) || somethingSolved
      somethingSolved = this.resolveRelations(elements, relations, wrapperElementIsRelation) || somethingSolved
      somethingSolved = this.resolveComplexElements(elements, relations, wrapperElementIsRelation, objects) || somethingSolved
    }
  }

  getTyping(scope: Scope, variableName: string): TypeProbability {
    const elements = [...this.elementTyping.keys()]
      .filter((e) => !!e.scope)

    const correctFile = elements.filter((e) => e.scope.filePath === scope.filePath)

    const correctVariable = correctFile.filter((e) => e.value === variableName)

    const correctScope = correctVariable.filter((e) => `${e.scope.uid}` === `${scope.uid}`)

    const element = correctScope[0]

    if (!element) {
      // console.log(scopeName)
      // console.log(scopeType)
      // console.log(variableName)
      // console.log(correctScopeName)
      // console.log(correctScopeType)
      // console.log(correctVariable)
      //
      // console.log(elements.filter((e) => e.value === variableName))
      // throw new Error("Invalid!")

      return new TypeProbability()
    }

    return this.elementTyping.get(element)
  }

  resolveRelationElements(relation: RelationType, involved: (Element | TypeProbability)[]): boolean {
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
          this.setElementType(involved[0], TypeEnum.NUMERIC, 1)
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
          this.setElementType(involved[0], TypeEnum.NUMERIC, 1)
        }
        if (isInstanceOfElement(involved[1])) {
          this.setElementType(involved[1], TypeEnum.NUMERIC, 1)
        }
        return true

      case RelationType.In: // could be multiple things
      case RelationType.InstanceOf: // could be multiple things
      case RelationType.Less: // must be numeric
      case RelationType.Greater: // must be numeric
      case RelationType.LessOrEqual: // must be numeric
      case RelationType.GreaterOrEqual: // must be numeric
        if (isInstanceOfElement(involved[0])) {
          this.setElementType(involved[0], TypeEnum.NUMERIC, 1)
        }
        if (isInstanceOfElement(involved[1])) {
          this.setElementType(involved[1], TypeEnum.NUMERIC, 1)
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
          this.setElementType(involved[0], TypeEnum.NUMERIC, 1)
        }
        if (isInstanceOfElement(involved[1])) {
          this.setElementType(involved[1], TypeEnum.NUMERIC, 1)
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
          // this.setElementType(involved[0], { identifierDescription: involved[1].identifierDescription }, 1)
          this.elementTyping.set(involved[0], involved[1])
          return true
        } else if (!isInstanceOfElement(involved[0]) && isInstanceOfElement(involved[1])) {
          // this.setElementType(involved[1], { identifierDescription: involved[0].identifierDescription }, 1)
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
          this.setElementType(involved[0], TypeEnum.NUMERIC, 1)
        }
        if (isInstanceOfElement(involved[1])) {
          this.setElementType(involved[1], TypeEnum.NUMERIC, 1)
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
          this.setElementType(involved[0], TypeEnum.FUNCTION, 1)
        }
        return false

      case RelationType.Object: // could be multiple things
      case RelationType.Array: // could be multiple things
        return false
    }

    throw new Error("not implemented")
  }

  resolveRelation(relation: Relation, involved: TypeProbability[]): boolean {
    // TODO

    switch (relation.relation) {
      // Unary
      case RelationType.PropertyAccessor: // must be equal to the identifierDescription of the member element
        this.relationTyping.set(relation, involved[1])
        return true
      case RelationType.New: //
        // TODO
        return false
      case RelationType.Spread: // must be array i think
        this.setRelationType(relation, TypeEnum.ARRAY, 1)
        return true

      case RelationType.PlusPlusPostFix: // must be numerical
      case RelationType.MinusMinusPostFix: // must be numerical
      case RelationType.PlusPlusPrefix: // must be numerical
      case RelationType.MinusMinusPrefix: // must be numerical
        this.setRelationType(relation, TypeEnum.NUMERIC, 1)
        return true

      case RelationType.Delete: // must be string
        // TODO
        return false
      case RelationType.Void: // must be void
        // TODO
        return false
      case RelationType.TypeOf: // must be string
        this.setRelationType(relation, TypeEnum.STRING, 1)
        return true
      case RelationType.PlusUnary: // must be numerical
      case RelationType.MinusUnary: // must be numerical
        this.setRelationType(relation, TypeEnum.NUMERIC, 1)
        return true
      case RelationType.BitwiseNotUnary: // must be boolean
      case RelationType.LogicalNotUnary: // must be boolean
        this.setRelationType(relation, TypeEnum.BOOLEAN, 1)
        return true


      // binary
      case RelationType.Addition:
        // if (involved[0].g === TypeEnum.STRING || involved[1].identifierDescription === TypeEnum.STRING) {
        //   this.relationTyping.set(relation, { identifierDescription: TypeEnum.STRING })
        // } else if (involved[0].identifierDescription === TypeEnum.NUMERIC || involved[1].identifierDescription === TypeEnum.NUMERIC) {
        //   this.relationTyping.set(relation, { identifierDescription: TypeEnum.NUMERIC })
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
        this.setRelationType(relation, TypeEnum.NUMERIC, 1)
        return true

      case RelationType.In: //
        // TODO
        return false
      case RelationType.InstanceOf: // must be boolean
      case RelationType.Less: // must be boolean
      case RelationType.Greater: // must be boolean
      case RelationType.LessOrEqual: // must be boolean
      case RelationType.GreaterOrEqual: // must be boolean
        this.setRelationType(relation, TypeEnum.BOOLEAN, 1)
        return true

      case RelationType.Equality: // must be boolean
      case RelationType.InEquality: // must be boolean
      case RelationType.StrictEquality: // must be boolean
      case RelationType.StrictInequality: // must be boolean
        this.setRelationType(relation, TypeEnum.BOOLEAN, 1)
        return true

      case RelationType.BitwiseLeftShift: // must be numeric
      case RelationType.BitwiseRightShift: // must be numeric
      case RelationType.BitwiseUnsignedRightShift: // must be numeric
        this.setRelationType(relation, TypeEnum.NUMERIC, 1)
        return true

      case RelationType.BitwiseAnd: // must be numeric
      case RelationType.BitwiseOr: // must be numeric
      case RelationType.BitwiseXor: // must be numeric
        this.setRelationType(relation, TypeEnum.NUMERIC, 1)
        return true

      case RelationType.LogicalOr: // can be the identifierDescription of the first or second one depending on if the first is not false/null/undefined
        // TODO maybe should also do if just one is not element
        // TODO
        if (!isInstanceOfElement(involved[0]) && !isInstanceOfElement(involved[1])) {
          this.setRelationType(relation, involved[0], 1)
          this.setRelationType(relation, involved[1], 1)
          return true
        }

        return false
      case RelationType.LogicalAnd: //can be the boolean or the identifierDescription of the second one depending on if the first and second are not false/null/undefined
      case RelationType.NullishCoalescing: //??
        // this.relationTyping.set(relation, { identifierDescription: involved[1].identifierDescription })

        // TODO
        // if (!isInstanceOfElement(involved[0])) {
        //   this.setRelationType(relation, involved[0], 0.5)
        //   this.setRelationType(relation, involved[0], 0.5)
        //
        //   this.setElementType(involved[0], { type: TypeEnum.FUNCTION }, 1)
        // }
        return false

      // ternary
      case RelationType.Conditional: // could be multiple things
        // TODO
        return false

      case RelationType.Assignment: // no relation identifierDescription
      case RelationType.MultiplicationAssignment: // no relation identifierDescription
      case RelationType.ExponentiationAssignment: // no relation identifierDescription
      case RelationType.DivisionAssignment: // no relation identifierDescription
      case RelationType.RemainderAssigment: // no relation identifierDescription
      case RelationType.AdditionAssignment: // no relation identifierDescription
      case RelationType.SubtractionAssignment: // no relation identifierDescription
      case RelationType.LeftShiftAssignment: // no relation identifierDescription
      case RelationType.RightShiftAssignment: // no relation identifierDescription
      case RelationType.UnSignedRightShiftAssignment: // no relation identifierDescription
      case RelationType.BitwiseAndAssignment: // no relation identifierDescription
      case RelationType.BitwiseXorAssignment: // no relation identifierDescription
      case RelationType.BitwiseOrAssignment: // no relation identifierDescription
      case RelationType.LogicalAndAssignment: // no relation identifierDescription
      case RelationType.LogicalOrAssignment: // no relation identifierDescription
      case RelationType.LogicalNullishAssignment: // no relation identifierDescription

        // TODO
        // this.relationTyping.set(relation, { identifierDescription: TypeEnum.NULL })
        return false

      // TODO

      case RelationType.Return: // must be equal to the identifierDescription of the returned element
      case RelationType.Parameters: // could be multiple things
      case RelationType.Call: // must be the return identifierDescription of the called function
      case RelationType.Object: // could be multiple things
      case RelationType.Array: // could be multiple things
        return false
    }

    throw new Error("not implemented")
  }

}
