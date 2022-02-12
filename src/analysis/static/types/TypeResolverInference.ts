import { TypeResolver } from "./TypeResolver";
import { elementTypeToTypingType, Typing, TypingType } from "./Typing";
import { Element, ElementType, isInstanceOfElement } from "../variable/Element";
import { Scope, ScopeType } from "../variable/Scope";
import { Relation, RelationType } from "../variable/Relation";

export class TypeResolverInference extends TypeResolver{

  private wrapperElementIsRelation: Map<string, Relation>

  resolveTypes(scopes: Scope[], elements: Element[], relations: Relation[], wrapperElementIsRelation: Map<string, Relation>) {
    this.wrapperElementIsRelation = wrapperElementIsRelation
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
      // throw new Error("xx")
      return {
        type: TypingType.Unknown
      }
    }
    return this.elementTyping.get(element);
  }

  resolveRelationElements(relation: RelationType, involved: (Element | Typing)[]): boolean {
    switch (relation) {
      case RelationType.PropertyAccessor: // could be multiple things
        // although the first has to an object/array/function
        // TODO TODO this is a hack to fix .apply to be mapped to functions
        if (isInstanceOfElement(involved[0]) && isInstanceOfElement(involved[1]) && involved[1].value === 'apply') {
          this.elementTyping.set(involved[0], {type: TypingType.Function})
          this.elementTyping.set(involved[1], {type: TypingType.Function})

          return true
        }
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
          this.elementTyping.set(involved[0], { type: TypingType.Numeric })
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
          this.elementTyping.set(involved[0], { type: TypingType.Numeric })
        }
        if (isInstanceOfElement(involved[1])) {
          this.elementTyping.set(involved[1], { type: TypingType.Numeric })
        }
        return true

      case RelationType.In: // could be multiple things
      case RelationType.InstanceOf: // could be multiple things
      case RelationType.Less: // must be numeric
      case RelationType.Greater: // must be numeric
      case RelationType.LessOrEqual: // must be numeric
      case RelationType.GreaterOrEqual: // must be numeric
        if (isInstanceOfElement(involved[0])) {
          this.elementTyping.set(involved[0], { type: TypingType.Numeric })
        }
        if (isInstanceOfElement(involved[1])) {
          this.elementTyping.set(involved[1], { type: TypingType.Numeric })
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
          this.elementTyping.set(involved[0], { type: TypingType.Numeric })
        }
        if (isInstanceOfElement(involved[1])) {
          this.elementTyping.set(involved[1], { type: TypingType.Numeric })
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
        if (isInstanceOfElement(involved[0]) && !isInstanceOfElement(involved[1])) {
          this.elementTyping.set(<Element>involved[0], <Typing>{ type: involved[1].type })
          return true
        } else if (!isInstanceOfElement(involved[0]) && isInstanceOfElement(involved[1])) {
          this.elementTyping.set(<Element>involved[1], <Typing>{ type: involved[0].type })
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
          this.elementTyping.set(involved[0], { type: TypingType.Numeric })
        }
        if (isInstanceOfElement(involved[1])) {
          this.elementTyping.set(involved[1], { type: TypingType.Numeric })
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
      case RelationType.PropertyAccessor: // must be equal to the type of the member element
        this.relationTyping.set(relation, { type: involved[1].type })
        return true
      case RelationType.New: //
        // TODO
        return false
      case RelationType.Spread: // must be array i think
        this.relationTyping.set(relation, { type: TypingType.Array })
        return true

      case RelationType.PlusPlusPostFix: // must be numerical
      case RelationType.MinusMinusPostFix: // must be numerical
      case RelationType.PlusPlusPrefix: // must be numerical
      case RelationType.MinusMinusPrefix: // must be numerical
        this.relationTyping.set(relation, { type: TypingType.Numeric })
        return true

      case RelationType.Delete: // must be string
        // TODO
        return false
      case RelationType.Void: // must be void
        // TODO
        return false
      case RelationType.TypeOf: // must be string
        this.relationTyping.set(relation, { type: TypingType.String })
        return true
      case RelationType.PlusUnary: // must be numerical
        this.relationTyping.set(relation, { type: TypingType.Numeric })
        return true
      case RelationType.MinusUnary: // must be numerical
        this.relationTyping.set(relation, { type: TypingType.Numeric })
        return true
      case RelationType.BitwiseNotUnary: // must be boolean
        this.relationTyping.set(relation, { type: TypingType.Boolean })
        return true
      case RelationType.LogicalNotUnary: // must be boolean
        this.relationTyping.set(relation, { type: TypingType.Boolean })
        return true


      // binary
      case RelationType.Addition:
        if (involved[0].type === TypingType.String || involved[1].type === TypingType.String) {
          this.relationTyping.set(relation, { type: TypingType.String })
        } else if (involved[0].type === TypingType.Numeric || involved[1].type === TypingType.Numeric) {
          this.relationTyping.set(relation, { type: TypingType.Numeric })
        } else {
          return false // TODO maybe its always NaN?
        }
        return true
      case RelationType.Subtraction: // must be numerical
      case RelationType.Division: // must be numerical
      case RelationType.Multiplication: // must be numerical
      case RelationType.Remainder: // must be numerical
      case RelationType.Exponentiation: // must be numerical
        this.relationTyping.set(relation, { type: TypingType.Numeric })
        return true

      case RelationType.In: //
        // TODO
        return false
      case RelationType.InstanceOf: // must be boolean
      case RelationType.Less: // must be boolean
      case RelationType.Greater: // must be boolean
      case RelationType.LessOrEqual: // must be boolean
      case RelationType.GreaterOrEqual: // must be boolean
        this.relationTyping.set(relation, { type: TypingType.Boolean })
        return true

      case RelationType.Equality: // must be boolean
      case RelationType.InEquality: // must be boolean
      case RelationType.StrictEquality: // must be boolean
      case RelationType.StrictInequality: // must be boolean
        this.relationTyping.set(relation, { type: TypingType.Boolean })
        return true

      case RelationType.BitwiseLeftShift: // must be numeric
      case RelationType.BitwiseRightShift: // must be numeric
      case RelationType.BitwiseUnsignedRightShift: // must be numeric
        this.relationTyping.set(relation, { type: TypingType.Numeric })
        return true

      case RelationType.BitwiseAnd: // must be numeric
      case RelationType.BitwiseOr: // must be numeric
      case RelationType.BitwiseXor: // must be numeric
        this.relationTyping.set(relation, { type: TypingType.Numeric })
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
        // this.relationTyping.set(relation, { type: TypingType.Null })
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
