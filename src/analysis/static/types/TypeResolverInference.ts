import { TypeResolver } from "./TypeResolver";
import { elementTypeToTypingType, Typing, TypingType } from "./Typing";
import { isInstanceOfElement } from "../variable/Element";
import { Scope } from "../variable/Scope";
import { Relation, RelationType } from "../variable/Relation";
import { Element } from "../variable/Element";

export class TypeResolverInference extends TypeResolver{

  private scopes: Scope[]
  private elements: Element[]
  private relations: Relation[]
  private wrapperElementIsRelation: Map<string, Relation>

  private relationTyping: Map<Relation, Typing> // TODO should be probability distribution per typing
  private elementTyping: Map<Element, Typing> // TODO should be probability distribution per typing

  private relationFullyResolved: Set<Relation> // TODO should be probability distribution per typing

  constructor(scopes: Scope[], elements: Element[], relations: Relation[], wrapperElementIsRelation: Map<string, Relation>) {
    super()
    this.scopes = scopes
    this.elements = elements
    this.relations = relations
    this.wrapperElementIsRelation = wrapperElementIsRelation

    this.relationTyping = new Map()
    this.elementTyping = new Map()
    this.relationFullyResolved = new Set()

    this.resolveTypes()
  }

  private resolveTypes() {
    let somethingSolved = true
    while (somethingSolved) {

      // TODO maybe this is only needed once
      for (const element of this.elements) {
        if (this.elementTyping.has(element)) {
          continue
        }

        const typingsType = elementTypeToTypingType(element.type)

        if (typingsType) {
          this.elementTyping.set(element, {
            type: typingsType
          })
          somethingSolved = true
        }

        // TODO if it is a relation element
      }

      for (const relation of this.relations) {
        if (this.relationFullyResolved.has(relation)) {
          continue
        }
        const resolveInvolved = (e: Element) => {
          if (this.elementTyping.has(e)) {
            return this.elementTyping.get(e)
          } else if (e.type === 'relation' && this.relationTyping.has(this.wrapperElementIsRelation.get(e.value))) {
            return this.relationTyping.get(this.wrapperElementIsRelation.get(e.value))
          }
          return e
        }

        const involved: (Element | Typing)[] = relation.involved
          .map(resolveInvolved)

        const allResolved = this.resolveRelationElements(relation.relation, involved)

        // TODO FALSE can also resolve the result of a relation without its elements
        if (allResolved) {
          const resolveInvolved = (e: Element) => {
            if (this.elementTyping.has(e)) {
              return this.elementTyping.get(e)
            } else if (e.type === 'relation' && this.relationTyping.has(this.wrapperElementIsRelation.get(e.value))) {
              return this.relationTyping.get(this.wrapperElementIsRelation.get(e.value))
            }
            throw new Error("Should all be resolved!!!")
          }

          const involved: Typing[] = relation.involved
            .map(resolveInvolved)

          const relationResolved = this.resolveRelation(relation.relation, involved)

          if (relationResolved) {
            this.relationFullyResolved.add(relation)
          }
        }
      }
    }

    process.exit()
  }

  getTyping(scope: Scope, variableName: string): Typing {

    // TODO resolve
    return undefined;
  }

  resolveRelationElements(relation: RelationType, involved: (Element | Typing)[]): boolean {
    switch (relation) {
      // Unary
      case RelationType.NotUnary: // could be multiple things
        return false
      case RelationType.PlusUnary: // could be multiple things
        return false
      case RelationType.MinusUnary: // could be multiple things
        return false
      case RelationType.TypeOf: // could be multiple things
        return false

      case RelationType.PlusPlus: // must be numerical
      case RelationType.MinusMinus: // must be numerical
        if (isInstanceOfElement(involved[0])) {
          this.elementTyping.set(involved[0], { type: TypingType.Numeric })
        }
        return true
      case RelationType.Spread: // hmmmm this is hard....
        return false

      // binary
      case RelationType.PlusBinary:
        return false // could be multiple things
      case RelationType.MinusBinary: // must be numerical
      case RelationType.Divide: // must be numerical
      case RelationType.Multiply: // must be numerical
      case RelationType.Mod: // must be numerical
        if (isInstanceOfElement(involved[0])) {
          this.elementTyping.set(involved[0], { type: TypingType.Numeric })
        }
        if (isInstanceOfElement(involved[1])) {
          this.elementTyping.set(involved[1], { type: TypingType.Numeric })
        }
        return true

      case RelationType.Equal: // could be multiple things
      case RelationType.NotEqual: // could be multiple things
      case RelationType.typeCoercionEqual: // could be multiple things
      case RelationType.typeCoercionNotEqual: // could be multiple things
        return false
      case RelationType.StrictSmaller: // must be numeric
      case RelationType.StrictGreater: // must be numeric
      case RelationType.Smaller: // must be numeric
      case RelationType.Greater: // must be numeric
      case RelationType.Or: // must be numeric
      case RelationType.And: // must be numeric
        if (isInstanceOfElement(involved[0])) {
          this.elementTyping.set(involved[0], { type: TypingType.Numeric })
        }
        if (isInstanceOfElement(involved[1])) {
          this.elementTyping.set(involved[1], { type: TypingType.Numeric })
        }
        return true
      case RelationType.LazyOr: // could be multiple things
      case RelationType.LazyAnd: // could be multiple things
      case RelationType.Return: // could be multiple things
      case RelationType.Member: // could be multiple things
        // although the first has to an object/array/function
        return false

      case RelationType.Assignment: // must be the same
        if (isInstanceOfElement(involved[0]) && !isInstanceOfElement(involved[1])) {
          this.elementTyping.set(<Element>involved[0], <Typing>{ type: involved[1].type })
          return true
        } else if (!isInstanceOfElement(involved[0]) && isInstanceOfElement(involved[1])) {
          this.elementTyping.set(<Element>involved[1], <Typing>{ type: involved[0].type })
          return true
        } else {
          return false
        }

      // ternary
      case RelationType.Ternary: // could be multiple things
        return false

      // multi
      case RelationType.Parameters: // could be multiple things
      case RelationType.Call: // could be multiple things
        // but we do know that the first involved element is a function
        if (isInstanceOfElement(involved[0])) {
          this.elementTyping.set(involved[0], { type: TypingType.Function })
        }
        return false

      case RelationType.Object: // could be multiple things
      case RelationType.Array: // could be multiple things
        return false
    }

    throw new Error("not implemented")
  }

  resolveRelation(relation: RelationType, involved: (Element | Typing)[]): boolean {
    // TODO






    switch (relation) {
      // Unary
      case RelationType.NotUnary: // could be multiple things
        return false
      case RelationType.PlusUnary: // could be multiple things
        return false
      case RelationType.MinusUnary: // could be multiple things
        return false
      case RelationType.TypeOf: // could be multiple things
        return false

      case RelationType.PlusPlus: // must be numerical
      case RelationType.MinusMinus: // must be numerical
        if (isInstanceOfElement(involved[0])) {
          this.elementTyping.set(involved[0], { type: TypingType.Numeric })
        }
        return true
      case RelationType.Spread: // hmmmm this is hard....
        return false

      // binary
      case RelationType.PlusBinary:
        return false // could be multiple things
      case RelationType.MinusBinary: // must be numerical
      case RelationType.Divide: // must be numerical
      case RelationType.Multiply: // must be numerical
      case RelationType.Mod: // must be numerical
        if (isInstanceOfElement(involved[0])) {
          this.elementTyping.set(involved[0], { type: TypingType.Numeric })
        }
        if (isInstanceOfElement(involved[1])) {
          this.elementTyping.set(involved[1], { type: TypingType.Numeric })
        }
        return true

      case RelationType.Equal: // could be multiple things
      case RelationType.NotEqual: // could be multiple things
      case RelationType.typeCoercionEqual: // could be multiple things
      case RelationType.typeCoercionNotEqual: // could be multiple things
        return false
      case RelationType.StrictSmaller: // must be numeric
      case RelationType.StrictGreater: // must be numeric
      case RelationType.Smaller: // must be numeric
      case RelationType.Greater: // must be numeric
      case RelationType.Or: // must be numeric
      case RelationType.And: // must be numeric
        if (isInstanceOfElement(involved[0])) {
          this.elementTyping.set(involved[0], { type: TypingType.Numeric })
        }
        if (isInstanceOfElement(involved[1])) {
          this.elementTyping.set(involved[1], { type: TypingType.Numeric })
        }
        return true
      case RelationType.LazyOr: // could be multiple things
      case RelationType.LazyAnd: // could be multiple things
      case RelationType.Return: // could be multiple things
      case RelationType.Member: // could be multiple things
        // although the first has to an object/array/function
        return false

      case RelationType.Assignment: // must be the same
        if (isInstanceOfElement(involved[0]) && !isInstanceOfElement(involved[1])) {
          this.elementTyping.set(<Element>involved[0], <Typing>{ type: involved[1].type })
          return true
        } else if (!isInstanceOfElement(involved[0]) && isInstanceOfElement(involved[1])) {
          this.elementTyping.set(<Element>involved[1], <Typing>{ type: involved[0].type })
          return true
        } else {
          return false
        }

      // ternary
      case RelationType.Ternary: // could be multiple things
        return false

      // multi
      case RelationType.Parameters: // could be multiple things
      case RelationType.Call: // could be multiple things
        // but we do know that the first involved element is a function
        if (isInstanceOfElement(involved[0])) {
          this.elementTyping.set(involved[0], { type: TypingType.Function })
        }
        return false

      case RelationType.Object: // could be multiple things
      case RelationType.Array: // could be multiple things
        return false
    }

    throw new Error("not implemented")
  }

}
