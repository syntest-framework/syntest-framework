/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Javascript.
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

import { Relation, RelationType } from "../discovery/relation/Relation";
import { elementTypeToTypingType, TypeEnum } from "./TypeEnum";
import { TypeModelFactory } from "./TypeModelFactory";

import { Element, ElementType } from "../discovery/element/Element";
import { TypeModel } from "./TypeModel";

export class InferenceTypeModelFactory extends TypeModelFactory {
  private _typeModel: TypeModel;

  private _elementMap: Map<string, Element>;
  private _relationsMap: Map<string, Relation>;

  private _idToBindingIdMap: Map<string, string>;

  // private _processedIds: Set<string>;

  constructor() {
    super();
    this._elementMap = new Map();
    this._relationsMap = new Map();

    this._idToBindingIdMap = new Map();

    // this._processedIds = new Set();
  }

  resolveTypes(
    elementMap: Map<string, Element>,
    relationMap: Map<string, Relation>
  ) {
    this._typeModel = new TypeModel();
    this._elementMap = elementMap;
    this._relationsMap = relationMap;

    this.createLiteralTypeMaps(elementMap);
    this.createIdentifierTypeMaps(elementMap);
    this.createRelationTypeMaps(relationMap);
    this.inferRelationTypes(relationMap);

    // TODO check for array/function/string type

    return this._typeModel;
  }

  createNewTypeProbability(id: string, bindingId: string) {
    this._typeModel.addId(bindingId);

    if (id === bindingId) {
      // don't set if the id and binding are equal
      return;
    }

    if (
      this._idToBindingIdMap.has(id) &&
      this._idToBindingIdMap.get(id) !== bindingId
    ) {
      throw new Error(
        `Setting a new binding id to a previously set id is not allowed. Id: ${id}, old binding: ${this._idToBindingIdMap.get(
          id
        )}, new binding: ${bindingId}`
      );
    }

    this._idToBindingIdMap.set(id, bindingId);
    // always requires a mapping to itself
    // because for example a global variable is never declared
    // so we create a global::variable binding id
    // but this binding id is never created in the element map
    // so we manually add it here
    // if ()
    // this._idToBindingIdMap.set(bindingId, bindingId);
  }

  createLiteralTypeMaps(elementMap: Map<string, Element>) {
    for (const element of elementMap.values()) {
      if (element.type === ElementType.Identifier) {
        continue;
      }

      this.createNewTypeProbability(element.id, element.id);
      this._typeModel.addTypeScore(
        element.id,
        elementTypeToTypingType(element.type)
      );
    }
  }

  createIdentifierTypeMaps(elementMap: Map<string, Element>) {
    for (const element of elementMap.values()) {
      if (element.type !== ElementType.Identifier) {
        continue;
      }

      this.createNewTypeProbability(element.id, element.bindingId);
    }
  }

  createRelationTypeMaps(relationMap: Map<string, Relation>) {
    for (const relation of relationMap.values()) {
      this.createNewTypeProbability(relation.id, relation.id);

      for (let index = 0; index < relation.involved.length; index++) {
        const involvedId = relation.involved[index];
        if (this._elementMap.has(involvedId)) {
          const element = this._elementMap.get(involvedId);

          if (element.type === ElementType.Identifier) {
            this.createNewTypeProbability(element.id, element.bindingId);
          } else {
            this.createNewTypeProbability(element.id, element.id);
          }
        } else {
          // relation
          this.createNewTypeProbability(involvedId, involvedId);
        }
      }
    }
  }

  inferRelationTypes(relationMap: Map<string, Relation>) {
    const solveOrder = [
      RelationType.ClassDefinition,
      RelationType.ObjectPattern,
      RelationType.ArrayPattern,
      RelationType.ObjectInitializer,
      RelationType.ArrayInitializer,

      RelationType.FunctionDefinition,
      RelationType.FunctionStarDefinition,
      RelationType.AsyncFunctionDefinition,
      RelationType.AsyncFunctionStarDefinition,

      RelationType.ClassProperty,
      RelationType.StaticClassProperty,
      RelationType.ClassMethod,
      RelationType.AsyncClassMethod,
      RelationType.StaticClassMethod,
      RelationType.StaticAsyncClassMethod,
      RelationType.ClassConstructor,
      RelationType.ClassGetter,
      RelationType.ClassSetter,

      RelationType.ObjectMethod,
      RelationType.ObjectProperty,

      RelationType.Return,

      RelationType.PropertyAccessor,
      RelationType.OptionalPropertyAccessor,
    ];
    const sortedRelations = [...relationMap.values()].sort((a, b) => {
      const aIndex = solveOrder.indexOf(a.type);
      const bIndex = solveOrder.indexOf(b.type);

      if (aIndex === -1) {
        return 1;
      } else if (bIndex === -1) {
        return -1;
      } else {
        return aIndex - bIndex;
      }
    });

    for (const relation of sortedRelations) {
      this.resolveRelation(relation);
    }
  }

  getElement(id: string): Element {
    return this._elementMap.get(id);
  }

  getRelation(id: string): Relation {
    return this._relationsMap.get(id);
  }

  resolveRelation(relation: Relation): void {
    const relationId = relation.id;
    const relationType: RelationType = relation.type;
    const originalInvolved: string[] = relation.involved;
    const involved: string[] = originalInvolved.map((id) => {
      while (this._idToBindingIdMap.has(id)) {
        id = this._idToBindingIdMap.get(id);
      }
      return id;
    });

    switch (relationType) {
      case RelationType.Return: {
        const functionId = involved[0];
        const argumentId = involved[1];

        if (argumentId !== undefined) {
          this._typeModel.addRelationScore(relationId, argumentId);
          this._typeModel.addReturn(functionId, argumentId);
        }

        break;
      }
      case RelationType.Call: {
        // TODO currently not possible because of the way the relations are created
        // const [functionId, ...arguments_] = involved;

        const [functionId] = involved;

        this._typeModel.addTypeScore(functionId, TypeEnum.FUNCTION);

        const type = this._typeModel.getObjectDescription(functionId);

        // relation result is equal to return type of functionId
        for (const returnValueId of type.return) {
          this._typeModel.addRelationScore(relationId, returnValueId);
        }

        // TODO
        // // couple function arguments with function parameters
        // if (arguments_.length > type.parameters.size) {
        //   throw new Error(`Function ${functionId} has ${type.parameters.size} parameters, but was called with ${arguments_.length} arguments`)
        // }

        // for (const [index, argumentId] of arguments_.entries()) {
        //   const parameterId = type.parameters.get(index)
        //   this._typeModel.addRelationScore(parameterId, argumentId)
        // }

        break;
      }
      case RelationType.PrivateName: {
        // TODO
        break;
      }
      case RelationType.ObjectProperty: {
        const [propertyId, valueId] = involved;

        const propertyElement = this._elementMap.get(propertyId);

        if (propertyElement) {
          const propertyName =
            "name" in propertyElement
              ? propertyElement.name
              : propertyElement.value;

          this._typeModel.addProperty(relationId, propertyName, propertyId);
        } else {
          // TODO what if the property is not an element (spread element for example)
        }

        // connect property to value
        if (valueId !== undefined) {
          this._typeModel.addRelationScore(propertyId, valueId);
        }

        break;
      }
      case RelationType.ObjectMethod: {
        const [functionId, ...parameters] = involved;

        // TODO what if the property is not an element
        const propertyElement = this._elementMap.get(functionId);
        const propertyName =
          "name" in propertyElement
            ? propertyElement.name
            : propertyElement.value;

        this._typeModel.addProperty(relationId, propertyName, functionId);

        // create function type
        for (const [index, id] of parameters.entries()) {
          this._typeModel.addParameter(functionId, index, id);
        }

        break;
      }

      case RelationType.ClassProperty:
      case RelationType.StaticClassProperty: {
        if (involved.length < 2) {
          throw new Error(
            `Class property relation should have at least 2 elements, but has ${involved.length}`
          );
        }

        const classId = involved[0];
        const propertyId = involved[1];
        const valueId = involved[2];

        // TODO what if the property is not an element
        const propertyElement = this.getElement(propertyId);
        const propertyName =
          "name" in propertyElement
            ? propertyElement.name
            : propertyElement.value;

        // make object for the class
        this._typeModel.addProperty(classId, propertyName, propertyId);

        // connect property to value
        if (valueId !== undefined) {
          this._typeModel.addRelationScore(propertyId, valueId);
        }

        break;
      }
      case RelationType.ClassMethod:
      case RelationType.AsyncClassMethod:
      case RelationType.StaticClassMethod:
      case RelationType.StaticAsyncClassMethod:
      case RelationType.ClassConstructor:
      case RelationType.ClassGetter:
      case RelationType.ClassSetter: {
        if (involved.length < 2) {
          throw new Error(
            `Class method relation should have at least 2 elements, but has ${involved.length}`
          );
        }

        const [, functionId, ...parameters] = involved;
        // const [classId, functionId, ...parameters] = involved;

        // TODO the following does not work because the element refers to the identifier of the method
        // BUT we do not record the ids as such we actually record the id of the entire function
        // // TODO what if the function id is not an element
        // const propertyElement = this.getElement(functionId);
        // const propertyName =
        //   "name" in propertyElement
        //     ? propertyElement.name
        //     : propertyElement.value;

        // this._typeModel.addProperty(classId, propertyName, functionId);

        // TODO maybe not for setter / getter
        // make function for the method
        for (const [index, id] of parameters.entries()) {
          this._typeModel.addParameter(functionId, index, id);
        }

        break;
      }

      case RelationType.ArrayPattern: {
        const elements = involved;

        this._typeModel.addTypeScore(relationId, TypeEnum.ARRAY);
        // create array type
        for (const [index, id] of elements.entries()) {
          this._typeModel.addElement(relationId, index, id);
        }

        break;
      }
      case RelationType.ObjectPattern: {
        // create object type
        // the properties are added through the ObjectMethod/ObjectProperty relations
        this._typeModel.addTypeScore(relationId, TypeEnum.OBJECT);
        break;
      }
      case RelationType.RestElement: {
        const restElement = involved[0];

        this._typeModel.addTypeScore(relationId, TypeEnum.ARRAY);

        // connect rest element to array
        this._typeModel.addRelationScore(restElement, relationId);
        break;
      }

      case RelationType.While:
      case RelationType.If: {
        const conditionId = involved[0];

        // add boolean type to condition
        this._typeModel.addTypeScore(conditionId, TypeEnum.BOOLEAN);

        break;
      }
      case RelationType.For: {
        const conditionId = involved[0];

        if (conditionId) {
          // weird
          break;
        }
        // add boolean type to condition
        this._typeModel.addTypeScore(conditionId, TypeEnum.BOOLEAN);

        break;
      }
      case RelationType.ForIn: {
        const declarator = involved[0];
        const arrayOrObject = involved[1];

        this._typeModel.addTypeScore(arrayOrObject, TypeEnum.ARRAY);
        this._typeModel.addTypeScore(arrayOrObject, TypeEnum.OBJECT);

        const typeOfArray = this._typeModel.getObjectDescription(arrayOrObject);

        for (const id of typeOfArray.elements.values()) {
          // connect declarator to array element
          this._typeModel.addRelationScore(declarator, id);
        }

        const typeOfObject =
          this._typeModel.getObjectDescription(arrayOrObject);

        for (const id of typeOfObject.properties.values()) {
          // connect declarator to object property
          this._typeModel.addRelationScore(declarator, id);
        }

        break;
      }
      case RelationType.ForOf: {
        const declarator = involved[0];
        const array = involved[1];

        this._typeModel.addTypeScore(array, TypeEnum.ARRAY);

        const typeOfArray = this._typeModel.getObjectDescription(array);

        for (const id of typeOfArray.elements.values()) {
          // connect declarator to array element
          this._typeModel.addRelationScore(declarator, id);
        }

        break;
      }
      case RelationType.Switch: {
        const [discriminant, ...cases] = involved;

        for (const case_ of cases) {
          this._typeModel.addRelationScore(discriminant, case_);
        }

        break;
      }

      // Primary Expressions
      case RelationType.This: {
        const thisParent = involved[0];

        // add this type to parent
        this._typeModel.addRelationScore(thisParent, relationId);

        // create object type
        this._typeModel.addTypeScore(relationId, TypeEnum.OBJECT);

        break;
      }

      case RelationType.ArrayInitializer: {
        const elements = involved;

        // create array type
        for (const [index, id] of elements.entries()) {
          this._typeModel.addElement(relationId, index, id);
        }

        break;
      }
      case RelationType.ObjectInitializer: {
        // create object type
        // the properties are added through the ObjectMethod/ObjectProperty relations
        this._typeModel.addTypeScore(relationId, TypeEnum.OBJECT);
        break;
      }

      case RelationType.ClassDefinition: {
        if (involved.length === 0) {
          throw new Error(`Class definition has no involved elements`);
        }
        const classId = involved[0];

        // the properties are added through the ObjectMethod/ObjectProperty relations
        this._typeModel.addTypeScore(classId, TypeEnum.OBJECT);

        // connect class to relation
        this._typeModel.addRelationScore(classId, relationId);

        break;
      }

      case RelationType.FunctionDefinition:
      case RelationType.FunctionStarDefinition:
      case RelationType.AsyncFunctionDefinition:
      case RelationType.AsyncFunctionStarDefinition: {
        if (involved.length === 0) {
          throw new Error(`Function definition has no involved elements`);
        }
        const functionId = relationId;
        const [_identifierId, ...parameters] = involved;

        for (const [index, id] of parameters.entries()) {
          this._typeModel.addParameter(functionId, index, id);
        }

        // connect function to relation
        this._typeModel.addRelationScore(functionId, relationId);

        break;
      }

      case RelationType.TemplateLiteral: {
        // TODO something with the quasis and expressions
        this._typeModel.addTypeScore(relationId, TypeEnum.STRING);
        break;
      }

      case RelationType.Sequence: {
        // TODO nothing i think
        break;
      }

      // Left-hand-side Expressions
      case RelationType.PropertyAccessor:
      case RelationType.OptionalPropertyAccessor: {
        const [objectId, propertyId] = involved;
        const [, originalProperty] = originalInvolved;

        const propertyElement = this.getElement(originalProperty);

        // TODO
        // we add these scores by default because it is likely a string/object/array
        // however we should check if its one of the default properties of any of the primitives
        // if that is the case we should not give it string object or array
        this._typeModel.addTypeScore(objectId, TypeEnum.ARRAY);
        this._typeModel.addTypeScore(objectId, TypeEnum.STRING);
        this._typeModel.addTypeScore(objectId, TypeEnum.OBJECT);

        if (propertyElement === undefined) {
          // e.g. object[b ? 1 : 0]
          // TODO what if the property is not an element
        } else if (propertyElement.type === ElementType.NumericalLiteral) {
          // e.g. object[0]
          // add array type to object
          this._typeModel.addTypeScore(objectId, TypeEnum.ARRAY);
          this._typeModel.addTypeScore(objectId, TypeEnum.STRING);
        } else if (propertyElement.type === ElementType.StringLiteral) {
          // e.g. object["abc"]
          // add array type to object
          this._typeModel.addTypeScore(objectId, TypeEnum.OBJECT);
        } else {
          const propertyName =
            "name" in propertyElement
              ? propertyElement.name
              : propertyElement.value;

          this._typeModel.addProperty(objectId, propertyName, propertyId);
        }

        // we don't have to connect the relationid to the propertyId since they are equal already
        this._typeModel.addRelationScore(relationId, propertyId);
        break;
      }

      case RelationType.New: {
        const class_ = involved[0];
        // TODO maybe this is not neccessary since the class is already connected to the relation
        // this._typeModel.addObjectTypeScore(relationId, {
        //   type: TypeEnum.OBJECT,
        //   properties: new Map()
        // });
        this._typeModel.addRelationScore(relationId, class_);
        break;
      }

      case RelationType.PlusPlusPrefix: // must be numerical
      case RelationType.MinusMinusPrefix: // must be numerical
      case RelationType.PlusPlusPostFix: // must be numerical
      case RelationType.MinusMinusPostFix: {
        // must be numerical
        const argumentId = involved[0];

        this._typeModel.addTypeScore(argumentId, TypeEnum.NUMERIC);
        this._typeModel.addRelationScore(relationId, argumentId);
        break;
      }

      // Unary
      case RelationType.Delete: {
        // TODO can we say something about the argument?
        this._typeModel.addTypeScore(relationId, TypeEnum.UNDEFINED);
        break;
      }
      case RelationType.Void: {
        // TODO can we say something about the argument?
        this._typeModel.addTypeScore(relationId, TypeEnum.UNDEFINED);
        break;
      }
      case RelationType.TypeOf: {
        // TODO can we say something about the argument?
        this._typeModel.addTypeScore(relationId, TypeEnum.STRING);
        break;
      }
      case RelationType.PlusUnary:
      case RelationType.MinusUnary:
      case RelationType.BitwiseNotUnary: {
        // could be multiple things but the argument is probably numerical
        const argumentId = involved[0];
        this._typeModel.addTypeScore(argumentId, TypeEnum.NUMERIC);
        this._typeModel.addTypeScore(relationId, TypeEnum.NUMERIC);
        break;
      }
      case RelationType.LogicalNotUnary: {
        // TODO can we say something about the argument?
        this._typeModel.addTypeScore(relationId, TypeEnum.BOOLEAN);
        break;
      }
      case RelationType.Await: {
        // often function?
        const argumentId = involved[0];

        this._typeModel.addTypeScore(argumentId, TypeEnum.FUNCTION);

        const type_ = this._typeModel.getObjectDescription(argumentId);

        for (const returnType of type_.return) {
          this._typeModel.addRelationScore(relationId, returnType);
        }

        break;
      }

      // binary
      case RelationType.Addition: {
        if (involved.length !== 2) {
          throw new Error(`Addition relation has wrong involved elements`);
        }

        const [leftId, rightId] = involved;

        // can be multiple things but string and number are the most likely
        this._typeModel.addTypeScore(leftId, TypeEnum.NUMERIC);
        this._typeModel.addTypeScore(rightId, TypeEnum.NUMERIC);

        this._typeModel.addTypeScore(leftId, TypeEnum.STRING);
        this._typeModel.addTypeScore(rightId, TypeEnum.STRING);

        this._typeModel.addRelationScore(relationId, leftId);
        this._typeModel.addRelationScore(relationId, rightId);
        // even though we add the relations we still add the number type directly since it is most likely
        this._typeModel.addTypeScore(relationId, TypeEnum.NUMERIC);

        break;
      }
      case RelationType.Subtraction: // must be numerical
      case RelationType.Division: // must be numerical
      case RelationType.Multiplication: // must be numerical
      case RelationType.Remainder: // must be numerical
      case RelationType.Exponentiation: {
        if (involved.length !== 2) {
          throw new Error(`Relation has wrong involved elements`);
        }

        const [leftId, rightId] = involved;

        // can be multiple things but number is the most likely
        this._typeModel.addTypeScore(leftId, TypeEnum.NUMERIC);
        this._typeModel.addTypeScore(rightId, TypeEnum.NUMERIC);

        this._typeModel.addRelationScore(relationId, leftId);
        this._typeModel.addRelationScore(relationId, rightId);
        // even though we add the relations we still add the number type directly since it is most likely
        // in this case we are pretty sure the result is numeric so we give 2 score
        this._typeModel.addTypeScore(relationId, TypeEnum.NUMERIC, 2);

        break;
      }

      case RelationType.In: {
        const [, rightId] = involved;

        // right is likely an array or object

        this._typeModel.addTypeScore(rightId, TypeEnum.ARRAY);
        this._typeModel.addTypeScore(rightId, TypeEnum.OBJECT);

        // TODO
        // if it is an array we know the leftId is an element of the array
        // if it is an object we know the leftId is a property of the object

        this._typeModel.addTypeScore(relationId, TypeEnum.BOOLEAN);

        break;
      }
      case RelationType.InstanceOf: {
        const [leftId, rightId] = involved;

        this._typeModel.addTypeScore(leftId, TypeEnum.OBJECT);
        this._typeModel.addTypeScore(rightId, TypeEnum.OBJECT);

        this._typeModel.addTypeScore(relationId, TypeEnum.BOOLEAN);

        break;
      }
      case RelationType.Less: // must be numeric
      case RelationType.Greater: // must be numeric
      case RelationType.LessOrEqual: // must be numeric
      case RelationType.GreaterOrEqual: {
        const [leftId, rightId] = involved;

        // most likely numerical
        this._typeModel.addTypeScore(leftId, TypeEnum.NUMERIC);
        this._typeModel.addTypeScore(rightId, TypeEnum.NUMERIC);
        this._typeModel.addTypeScore(relationId, TypeEnum.BOOLEAN);

        break;
      }

      case RelationType.Equality: // could be multiple things
      case RelationType.InEquality: // could be multiple things
      case RelationType.StrictEquality: // could be multiple things
      case RelationType.StrictInequality: {
        const [leftId, rightId] = involved;

        // both sides are likely the same type
        this._typeModel.addRelationScore(leftId, rightId);

        this._typeModel.addTypeScore(relationId, TypeEnum.BOOLEAN);

        break;
      }

      case RelationType.BitwiseLeftShift: // must be numeric
      case RelationType.BitwiseRightShift: // must be numeric
      case RelationType.BitwiseUnsignedRightShift: // must be numeric

      case RelationType.BitwiseAnd: // must be numeric
      case RelationType.BitwiseOr: // must be numeric
      case RelationType.BitwiseXor: {
        const [leftId, rightId] = involved;

        // most likely numerical
        this._typeModel.addTypeScore(leftId, TypeEnum.NUMERIC);
        this._typeModel.addTypeScore(rightId, TypeEnum.NUMERIC);
        this._typeModel.addTypeScore(relationId, TypeEnum.NUMERIC);

        break;
      }

      case RelationType.LogicalAnd: {
        const [leftId, rightId] = involved;

        // most likely both boolean
        this._typeModel.addTypeScore(leftId, TypeEnum.BOOLEAN);
        this._typeModel.addTypeScore(rightId, TypeEnum.BOOLEAN);

        //can be the boolean or the type of the second one depending on if the first and second are not false/null/undefined
        this._typeModel.addRelationScore(relationId, leftId);
        this._typeModel.addRelationScore(relationId, rightId);
        this._typeModel.addTypeScore(relationId, TypeEnum.BOOLEAN);
        // TODO can we say that the leftId and rightId are the same type?

        break;
      }

      case RelationType.LogicalOr: {
        const [leftId, rightId] = involved;

        // most likely both boolean
        this._typeModel.addTypeScore(leftId, TypeEnum.BOOLEAN);
        this._typeModel.addTypeScore(rightId, TypeEnum.BOOLEAN);

        // can be the type of the first or second one depending on if the first is not false/null/undefined
        this._typeModel.addRelationScore(relationId, leftId);
        this._typeModel.addRelationScore(relationId, rightId);
        this._typeModel.addTypeScore(relationId, TypeEnum.BOOLEAN);

        // TODO can we say that the leftId and rightId are the same type?

        break;
      }
      case RelationType.NullishCoalescing: {
        const [leftId, rightId] = involved;

        // left side could be nullish
        this._typeModel.addTypeScore(leftId, TypeEnum.NULL);
        this._typeModel.addTypeScore(leftId, TypeEnum.UNDEFINED);

        // returns the rightId if leftId is nullish
        this._typeModel.addRelationScore(relationId, leftId);
        this._typeModel.addRelationScore(relationId, rightId);
        // TODO can we say that the leftId and rightId are the same type?

        break;
      }

      // ternary
      case RelationType.Conditional: {
        const [conditionId, leftId, rightId] = involved;
        this._typeModel.addTypeScore(conditionId, TypeEnum.BOOLEAN);

        // returns the leftId if conditionId is true
        // returns the rightId if conditionId is false
        this._typeModel.addRelationScore(relationId, leftId);
        this._typeModel.addRelationScore(relationId, rightId);

        // TODO can we say that the leftId and rightId are the same type?

        break;
      }

      case RelationType.Assignment: {
        // should always have two involved
        if (involved.length !== 2) {
          throw new Error(
            `Assignment relation should have two involved, but has ${involved.length}. ${relation.id}`
          );
        }
        const [leftId, rightId] = involved;

        this._typeModel.addRelationScore(leftId, rightId);
        // TODO This is not the way to do this
        // for now it is neccessary because variable declarations such as in lodash/at.js
        // do not have the correct ids causing the relation to have the wrong
        this._typeModel.addRelationScore(relationId, rightId);
        this._typeModel.addRelationScore(leftId, relationId);

        // undefined should be the actual result
        // this._typeModel.addPrimitiveTypeScore(relationId, {
        //   type: TypeEnum.UNDEFINED,
        // });

        break;
      }
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
      case RelationType.BitwiseOrAssignment: {
        if (involved.length !== 2) {
          throw new Error(
            `Assignment relation should have two involved, but has ${involved.length}`
          );
        }
        const [leftId, rightId] = involved;

        this._typeModel.addRelationScore(leftId, rightId);
        // likely numeric
        this._typeModel.addTypeScore(leftId, TypeEnum.NUMERIC);
        this._typeModel.addTypeScore(rightId, TypeEnum.NUMERIC);

        this._typeModel.addTypeScore(relationId, TypeEnum.UNDEFINED);

        break;
      }
      case RelationType.AdditionAssignment: {
        if (involved.length !== 2) {
          throw new Error(
            `Assignment relation should have two involved, but has ${involved.length}`
          );
        }
        const [leftId, rightId] = involved;

        this._typeModel.addRelationScore(leftId, rightId);
        // likely numeric or string
        this._typeModel.addTypeScore(leftId, TypeEnum.NUMERIC);
        this._typeModel.addTypeScore(leftId, TypeEnum.STRING);
        this._typeModel.addTypeScore(rightId, TypeEnum.NUMERIC);
        this._typeModel.addTypeScore(rightId, TypeEnum.STRING);

        this._typeModel.addTypeScore(relationId, TypeEnum.UNDEFINED);

        break;
      }

      case RelationType.LogicalAndAssignment: // could be multiple things
      case RelationType.LogicalOrAssignment: // could be multiple things
      case RelationType.LogicalNullishAssignment: {
        if (involved.length !== 2) {
          throw new Error(
            `Assignment relation should have two involved, but has ${involved.length}`
          );
        }
        const [leftId, rightId] = involved;

        this._typeModel.addRelationScore(leftId, rightId);
        // likely boolean
        this._typeModel.addTypeScore(leftId, TypeEnum.BOOLEAN);
        this._typeModel.addTypeScore(rightId, TypeEnum.BOOLEAN);
        this._typeModel.addTypeScore(relationId, TypeEnum.UNDEFINED);

        break;
      }

      case RelationType.Yield:
      case RelationType.YieldStar: {
        // TODO
        break;
      }

      case RelationType.Spread: {
        const [spreadId] = involved;

        // is array or object
        this._typeModel.addTypeScore(spreadId, TypeEnum.ARRAY);
        this._typeModel.addTypeScore(spreadId, TypeEnum.OBJECT);

        // TODO results in a sequence of the type of the spread

        break;
      }

      case RelationType.Comma: {
        // TODO
        break;
      }
    }
  }
}
