import { TypeResolver } from "./TypeResolver";
import { elementTypeToTypingType, Typing, TypingType } from "./Typing";
import { Element, isInstanceOfElement } from "../variable/Element";
import { Scope, ScopeType } from "../variable/Scope";
import { Relation, RelationType } from "../variable/Relation";

export class TypeResolverInference extends TypeResolver{

  resolveTypes(scopes: Scope[], elements: Element[], relations: Relation[], wrapperElementIsRelation: Map<string, Relation>) {
    let somethingSolved = true
    while (somethingSolved) {
      somethingSolved = false

      // TODO maybe this is only needed once
      for (const element of elements) {
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
      }

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

        const involved: (Element | Typing)[] = relation.involved
          .map(resolveInvolved)

        const allResolved = this.resolveRelationElements(relation.relation, involved)

        // TODO FALSE can also resolve the result of a relation without its elements
        if (allResolved) {
          const resolveInvolved = (e: Element) => {
            if (this.elementTyping.has(e)) {
              return this.elementTyping.get(e)
            } else if (e.type === 'relation' && this.relationTyping.has(wrapperElementIsRelation.get(e.value))) {
              return this.relationTyping.get(wrapperElementIsRelation.get(e.value))
            }
            throw new Error("Should all be resolved!!!")
          }

          const involved: Typing[] = relation.involved
            .map(resolveInvolved)

          const relationResolved = this.resolveRelation(relation, involved)

          if (relationResolved) {
            this.relationFullyResolved.add(relation)
          }

          somethingSolved = true
        }
      }
    }

    // console.log(this.elementTyping)
    // console.log(this.relationTyping)
    // process.exit()
  }

  getTyping(scopeName: string, scopeType: ScopeType, variableName: string): Typing {
    const element = [...this.elementTyping.keys()].find((e) => e.scope.name === scopeName && e.scope.type === scopeType && e.value === variableName)

    if (!element) {
      console.log('not found')
      console.log(scopeName, scopeType)
      console.log(variableName)
      console.log(element)
      return {
        type: TypingType.Unknown
      }
    }
    return this.elementTyping.get(element);
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

  resolveRelation(relation: Relation, involved: Typing[]): boolean {
    // TODO

    switch (relation.relation) {
      // Unary
      case RelationType.NotUnary: // must be boolean
        this.relationTyping.set(relation, { type: TypingType.Boolean })
        return true
      case RelationType.PlusUnary: // must be numerical
        this.relationTyping.set(relation, { type: TypingType.Numeric })
        return true
      case RelationType.MinusUnary: // must be numerical
        this.relationTyping.set(relation, { type: TypingType.Numeric })
        return true
      case RelationType.TypeOf: // must be string
        this.relationTyping.set(relation, { type: TypingType.String })
        return true

      case RelationType.PlusPlus: // must be numerical
      case RelationType.MinusMinus: // must be numerical
        this.relationTyping.set(relation, { type: TypingType.Numeric })
        return true
      case RelationType.Spread: // must be array i think
        this.relationTyping.set(relation, { type: TypingType.Array })
        return true

      // binary
      case RelationType.PlusBinary:
        if (involved[0].type === TypingType.String || involved[1].type === TypingType.String) {
          this.relationTyping.set(relation, { type: TypingType.String })
        } else if (involved[0].type === TypingType.Numeric || involved[1].type === TypingType.Numeric) {
          this.relationTyping.set(relation, { type: TypingType.Numeric })
        } else {
          return false // TODO maybe its always NaN?
        }
        return true
      case RelationType.MinusBinary: // must be numerical
      case RelationType.Divide: // must be numerical
      case RelationType.Multiply: // must be numerical
      case RelationType.Mod: // must be numerical
        this.relationTyping.set(relation, { type: TypingType.Numeric })
        return true

      case RelationType.Equal: // must be boolean
      case RelationType.NotEqual: // must be boolean
      case RelationType.typeCoercionEqual: // must be boolean
      case RelationType.typeCoercionNotEqual: // must be boolean
      case RelationType.StrictSmaller: // must be boolean
      case RelationType.StrictGreater: // must be boolean
      case RelationType.Smaller: // must be boolean
      case RelationType.Greater: // must be boolean
        this.relationTyping.set(relation, { type: TypingType.Boolean })
        return true
      case RelationType.Or: // must be numeric
      case RelationType.And: // must be numeric
        this.relationTyping.set(relation, { type: TypingType.Numeric })
        return true
      case RelationType.LazyOr: // can be the type of the first or second one depending on if the first is not false/null/undefined
      case RelationType.LazyAnd: //can be the boolean or the type of the second one depending on if the first and second are not false/null/undefined
        // this.relationTyping.set(relation, { type: involved[1].type })
        return false
      case RelationType.Return: // must be equal to the type of the returned element
      case RelationType.Member: // must be equal to the type of the member element
        this.relationTyping.set(relation, { type: involved[1].type })
        return true

      case RelationType.Assignment: // no relation type
        this.relationTyping.set(relation, { type: TypingType.Null })
        return true

      // TODO
      // ternary
      case RelationType.Ternary: // could be multiple things
        return false

      // multi
      case RelationType.Parameters: // could be multiple things
      case RelationType.Call: // must be the return type of the called function
        return false

      case RelationType.Object: // could be multiple things
      case RelationType.Array: // could be multiple things
        return false
    }

    throw new Error("not implemented")
  }

}
