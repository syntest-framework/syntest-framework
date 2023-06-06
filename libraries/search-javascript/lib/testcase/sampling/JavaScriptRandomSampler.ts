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

import {
  ClassTarget,
  FunctionTarget,
  getRelationName,
  isExported,
  MethodTarget,
  ObjectFunctionTarget,
  ObjectTarget,
  RootContext,
  TypeEnum,
} from "@syntest/analysis-javascript";
import { prng } from "@syntest/search";

import { JavaScriptSubject } from "../../search/JavaScriptSubject";
import { JavaScriptTestCase } from "../JavaScriptTestCase";
import { Getter } from "../statements/action/Getter";
import { MethodCall } from "../statements/action/MethodCall";
import { Setter } from "../statements/action/Setter";
import { ArrayStatement } from "../statements/complex/ArrayStatement";
import { ArrowFunctionStatement } from "../statements/complex/ArrowFunctionStatement";
import { ObjectStatement } from "../statements/complex/ObjectStatement";
import { BoolStatement } from "../statements/primitive/BoolStatement";
import { NullStatement } from "../statements/primitive/NullStatement";
import { NumericStatement } from "../statements/primitive/NumericStatement";
import { StringStatement } from "../statements/primitive/StringStatement";
import { UndefinedStatement } from "../statements/primitive/UndefinedStatement";
import { ConstructorCall } from "../statements/root/ConstructorCall";
import { FunctionCall } from "../statements/root/FunctionCall";
import { RootObject } from "../statements/root/RootObject";
import { RootStatement } from "../statements/root/RootStatement";
import { Statement } from "../statements/Statement";

import { JavaScriptTestCaseSampler } from "./JavaScriptTestCaseSampler";
import { TargetType } from "@syntest/analysis";
import { ObjectFunctionCall } from "../statements/action/ObjectFunctionCall";
import { ObjectType } from "@syntest/analysis-javascript";

export class JavaScriptRandomSampler extends JavaScriptTestCaseSampler {
  private _rootContext: RootContext;

  constructor(
    subject: JavaScriptSubject,
    typeInferenceMode: string,
    randomTypeProbability: number,
    incorporateExecutionInformation: boolean,
    maxActionStatements: number,
    stringAlphabet: string,
    stringMaxLength: number,
    resampleGeneProbability: number,
    deltaMutationProbability: number,
    exploreIllegalValues: boolean
  ) {
    super(
      subject,
      typeInferenceMode,
      randomTypeProbability,
      incorporateExecutionInformation,
      maxActionStatements,
      stringAlphabet,
      stringMaxLength,
      resampleGeneProbability,
      deltaMutationProbability,
      exploreIllegalValues
    );
  }

  /**
   * Set the root context
   *
   * this cannot be part of the constructor because the root context is not available at that point
   * because of the plugin structure.
   */
  set rootContext(rootContext: RootContext) {
    this._rootContext = rootContext;
  }

  get rootContext(): RootContext {
    return this._rootContext;
  }

  sample(): JavaScriptTestCase {
    let root: RootStatement;

    const actionableTargets = (<JavaScriptSubject>(
      this._subject
    )).getActionableTargets();

    const rootTargets = actionableTargets
      .filter(
        (target) =>
          target.type === TargetType.FUNCTION ||
          target.type === TargetType.CLASS ||
          target.type === TargetType.OBJECT
      )
      .filter((target) => isExported(target));

    if (rootTargets.length === 0) {
      throw new Error(
        `No root targets found in file ${this.subject.name} ${this.subject.path}`
      );
    }

    const rootTarget = prng.pickOne(rootTargets);

    switch (rootTarget.type) {
      case TargetType.FUNCTION: {
        root = this.sampleFunctionCall(0);

        break;
      }
      case TargetType.CLASS: {
        root = this.sampleClass(0);

        break;
      }
      case TargetType.OBJECT: {
        root = this.sampleRootObject(0);

        break;
      }
      // No default
    }

    return new JavaScriptTestCase(root);
  }

  // sampleRoot(depth: number) {

  // }

  sampleFunctionCall(depth: number): FunctionCall {
    // get a random function
    const function_ = <FunctionTarget>(
      prng.pickOne(
        (<JavaScriptSubject>this._subject)
          .getActionableTargetsByType(TargetType.FUNCTION)
          .filter((target) => isExported(target))
      )
    );

    return this.sampleSpecificFunctionCall(depth, function_.id, function_.name);
  }

  sampleSpecificFunctionCall(
    depth: number,
    id: string,
    name: string
  ): FunctionCall {
    const type_ = this.rootContext.getTypeModel().getObjectDescription(id);

    const arguments_: Statement[] = this._sampleArguments(depth, type_);

    return new FunctionCall(
      id,
      name,
      TypeEnum.FUNCTION,
      prng.uniqueId(),
      arguments_
    );
  }

  sampleClass(depth: number): ConstructorCall {
    // get a random class
    const class_ = <ClassTarget>(
      prng.pickOne(
        (<JavaScriptSubject>this._subject)
          .getActionableTargetsByType(TargetType.CLASS)
          .filter((target) => isExported(target))
      )
    );

    return this.sampleSpecificClass(depth, class_.id, class_.name);
  }

  sampleSpecificClass(
    depth: number,
    id: string,
    name: string
  ): ConstructorCall {
    // get the constructor of the class
    const constructor_ = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter(
        (method) =>
          (<MethodTarget>method).className === name &&
          (<MethodTarget>method).methodType === "constructor"
      );

    if (constructor_.length > 1) {
      throw new Error("Multiple constructors found for class");
    }
    let arguments_: Statement[] = [];
    if (constructor_.length === 0) {
      // default constructor no args
    } else {
      const action = constructor_[0];

      const type_ = this.rootContext
        .getTypeModel()
        .getObjectDescription(action.id);

      arguments_ = this._sampleArguments(depth, type_);
    }

    const calls: Statement[] = [];
    const methods = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter(
        (method) =>
          (<MethodTarget>method).className === name &&
          (<MethodTarget>method).methodType === "method"
      );
    const getters = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter(
        (method) =>
          (<MethodTarget>method).className === name &&
          (<MethodTarget>method).methodType === "get"
      );
    const setters = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter(
        (method) =>
          (<MethodTarget>method).className === name &&
          (<MethodTarget>method).methodType === "set"
      );

    const nCalls =
      methods.length + getters.length + setters.length &&
      prng.nextInt(1, this.maxActionStatements);
    for (let index = 0; index < nCalls; index++) {
      const randomMethod = <MethodTarget>(
        prng.pickOne([...methods, ...getters, ...setters])
      );
      switch (randomMethod.methodType) {
        case "method": {
          calls.push(
            this.sampleSpecificMethodCall(
              depth + 1,
              randomMethod.id,
              randomMethod.name,
              name
            )
          );

          break;
        }
        case "get": {
          calls.push(
            this.sampleSpecificGetter(
              depth + 1,
              randomMethod.id,
              randomMethod.name,
              name
            )
          );

          break;
        }
        case "set": {
          calls.push(
            this.sampleSpecificSetter(
              depth + 1,
              randomMethod.id,
              randomMethod.name,
              name
            )
          );

          break;
        }
        // No default
      }
    }

    return new ConstructorCall(
      id,
      name,
      TypeEnum.OBJECT,
      prng.uniqueId(),
      arguments_,
      calls
    );
  }

  sampleClassCall(
    depth: number,
    className: string
  ): MethodCall | Getter | Setter {
    const methods = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter(
        (method) =>
          (<MethodTarget>method).className === className &&
          (<MethodTarget>method).methodType === "method"
      );
    const getters = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter(
        (method) =>
          (<MethodTarget>method).className === className &&
          (<MethodTarget>method).methodType === "get"
      );
    const setters = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter(
        (method) =>
          (<MethodTarget>method).className === className &&
          (<MethodTarget>method).methodType === "set"
      );

    const randomMethod = <MethodTarget>(
      prng.pickOne([...methods, ...getters, ...setters])
    );
    switch (randomMethod.methodType) {
      case "method": {
        return this.sampleSpecificMethodCall(
          depth + 1,
          randomMethod.id,
          randomMethod.name,
          className
        );
      }
      case "get": {
        return this.sampleSpecificGetter(
          depth + 1,
          randomMethod.id,
          randomMethod.name,
          className
        );
      }
      case "set": {
        return this.sampleSpecificSetter(
          depth + 1,
          randomMethod.id,
          randomMethod.name,
          className
        );
      }
      // No default
    }

    throw new Error("No method found");
  }

  sampleMethodCall(depth: number, className: string): MethodCall {
    const methods = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter(
        (method) =>
          (<MethodTarget>method).className === className &&
          (<MethodTarget>method).methodType === "method"
      );

    const method = <MethodTarget>prng.pickOne(methods);

    return this.sampleSpecificMethodCall(
      depth,
      method.id,
      method.name,
      className
    );
  }

  sampleSpecificMethodCall(
    depth: number,
    id: string,
    name: string,
    className: string
  ): MethodCall {
    const type_ = this.rootContext.getTypeModel().getObjectDescription(id);

    const arguments_: Statement[] = this._sampleArguments(depth, type_);

    return new MethodCall(
      id,
      name,
      TypeEnum.FUNCTION,
      prng.uniqueId(),
      className,
      arguments_
    );
  }

  sampleGetter(depth: number, className: string): Getter {
    const methods = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter(
        (method) =>
          (<MethodTarget>method).className === className &&
          (<MethodTarget>method).methodType === "get"
      );

    const method = <MethodTarget>prng.pickOne(methods);

    return this.sampleSpecificGetter(depth, method.id, method.name, className);
  }

  sampleSpecificGetter(
    depth: number,
    id: string,
    name: string,
    className: string
  ): Getter {
    return new Getter(id, name, TypeEnum.FUNCTION, prng.uniqueId(), className);
  }

  sampleSetter(depth: number, className: string): Setter {
    const methods = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter(
        (method) =>
          (<MethodTarget>method).className === className &&
          (<MethodTarget>method).methodType === "set"
      );

    const method = <MethodTarget>prng.pickOne(methods);

    return this.sampleSpecificSetter(depth, method.id, method.name, className);
  }

  sampleSpecificSetter(
    depth: number,
    id: string,
    name: string,
    className: string
  ): Setter {
    const type_ = this.rootContext.getTypeModel().getObjectDescription(id);

    const arguments_: Statement[] = this._sampleArguments(depth, type_);

    if (arguments_.length !== 1) {
      throw new Error("Setter must have exactly one argument");
    }

    return new Setter(
      id,
      name,
      TypeEnum.FUNCTION,
      prng.uniqueId(),
      className,
      arguments_[0]
    );
  }

  sampleRootObject(depth: number): RootObject {
    // get a random object
    const object_ = <ObjectTarget>(
      prng.pickOne(
        (<JavaScriptSubject>this._subject)
          .getActionableTargetsByType(TargetType.OBJECT)
          .filter((target) => isExported(target))
      )
    );

    return this.sampleSpecificRootObject(depth, object_.id, object_.name);
  }

  sampleSpecificRootObject(
    depth: number,
    id: string,
    name: string
  ): RootObject {
    const calls: Statement[] = [];
    const functions = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.OBJECT_FUNCTION)
      .filter(
        (function_) => (<ObjectFunctionTarget>function_).objectName === name
      );

    const nCalls =
      functions.length > 0 && prng.nextInt(1, this.maxActionStatements);
    for (let index = 0; index < nCalls; index++) {
      const randomFunction = <ObjectFunctionTarget>prng.pickOne(functions);
      calls.push(
        this.sampleSpecificObjectFunctionCall(
          depth + 1,
          randomFunction.id,
          randomFunction.name,
          name
        )
      );
    }

    return new RootObject(id, name, TypeEnum.OBJECT, prng.uniqueId(), calls);
  }

  sampleObjectFunctionCall(
    depth: number,
    objectName: string
  ): ObjectFunctionCall {
    const functions = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.OBJECT_FUNCTION)
      .filter(
        (function_) =>
          (<ObjectFunctionTarget>function_).objectName === objectName
      );

    const randomFunction = <ObjectFunctionTarget>prng.pickOne(functions);
    return this.sampleSpecificObjectFunctionCall(
      depth + 1,
      randomFunction.id,
      randomFunction.name,
      objectName
    );
  }

  sampleSpecificObjectFunctionCall(
    depth: number,
    id: string,
    name: string,
    objectName: string
  ): ObjectFunctionCall {
    const type_ = this.rootContext.getTypeModel().getObjectDescription(id);

    const arguments_: Statement[] = this._sampleArguments(depth, type_);

    return new ObjectFunctionCall(
      id,
      name,
      TypeEnum.FUNCTION,
      prng.uniqueId(),
      objectName,
      arguments_
    );
  }

  // arguments
  sampleArrayArgument(
    depth: number,
    arrayId: string,
    index: number
  ): Statement {
    const arrayType = this.rootContext
      .getTypeModel()
      .getObjectDescription(arrayId);

    const element = arrayType.elements.get(index);
    if (element) {
      return this.sampleArgument(depth, element, String(index));
    }

    const childIds = [...arrayType.elements.values()];

    if (childIds.length === 0) {
      // TODO should be done in the typemodel somehow
      // maybe create types for the subproperties by doing /main/array/id::1::1[element-index]
      // maybe create types for the subproperties by doing /main/array/id::1::1.property
      return this.sampleString(
        "anon",
        "anon",
        this.stringAlphabet,
        this.stringMaxLength
      );
    }

    return this.sampleArgument(depth, prng.pickOne(childIds), String(index));
  }

  sampleObjectArgument(
    depth: number,
    objectId: string,
    property: string
  ): Statement {
    const objectType = <ObjectType>(
      this.rootContext.getTypeModel().getObjectDescription(objectId)
    );

    const value = objectType.properties.get(property);
    if (!value) {
      throw new Error(`Property ${property} not found in object ${objectId}`);
    }

    return this.sampleArgument(depth, value, property);
  }

  sampleArgument(depth: number, id: string, name: string): Statement {
    let chosenType: string;

    if (
      this.typeInferenceMode === "proportional" ||
      this.typeInferenceMode === "none"
    ) {
      chosenType = this.rootContext
        .getTypeModel()
        .getRandomType(
          this.incorporateExecutionInformation,
          this.randomTypeProbability,
          id
        );
    } else if (this.typeInferenceMode === "ranked") {
      chosenType = this.rootContext
        .getTypeModel()
        .getHighestProbabilityType(
          this.incorporateExecutionInformation,
          this.randomTypeProbability,
          id
        );
    } else {
      throw new Error("Invalid identifierDescription inference mode selected");
    }

    switch (chosenType) {
      case "boolean": {
        return this.sampleBool(id, name);
      }
      case "string": {
        return this.sampleString(id, name);
      }
      case "numeric": {
        return this.sampleNumber(id, name);
      }
      case "null": {
        return this.sampleNull(id, name);
      }
      case "undefined": {
        return this.sampleUndefined(id, name);
      }
      case "regex": {
        // TODO REGEX
        return this.sampleString(id, name);
      }
      default: {
        // must be object/array/function
        if (chosenType.endsWith("object")) {
          return this.sampleObject(depth, id, name, chosenType);
        } else if (chosenType.endsWith("array")) {
          return this.sampleArray(depth, id, name, chosenType);
        } else if (chosenType.endsWith("function")) {
          return this.sampleArrowFunction(depth, id, name, chosenType);
        }
      }
    }

    throw new Error(`unknown type: ${chosenType}`);
  }

  sampleObject(depth: number, id: string, name: string, type: string) {
    const typeObject = type.includes("<>")
      ? this._rootContext
          .getTypeModel()
          .getObjectDescription(type.split("<>")[0])
      : this._rootContext.getTypeModel().getObjectDescription(id);

    const object_: { [key: string]: Statement } = {};

    for (const [key, id] of typeObject.properties.entries()) {
      object_[key] = this.sampleArgument(depth + 1, id, key);
    }

    return new ObjectStatement(id, name, type, prng.uniqueId(), object_);
  }

  sampleArray(depth: number, id: string, name: string, type: string) {
    const typeObject = type.includes("<>")
      ? this._rootContext
          .getTypeModel()
          .getObjectDescription(type.split("<>")[0])
      : this._rootContext.getTypeModel().getObjectDescription(id);

    const children: Statement[] = [];

    for (const [index] of typeObject.elements.entries()) {
      children[index] = this.sampleArrayArgument(depth + 1, id, index);
    }

    // TODO should be done in the typemodel somehow
    // maybe create types for the subproperties by doing /main/array/id::1::1[element-index]
    // maybe create types for the subproperties by doing /main/array/id::1::1.property

    if (children.length === 0) {
      children.push(
        this.sampleString(
          "anon",
          "anon",
          this.stringAlphabet,
          this.stringMaxLength
        )
      );
    }

    // if some children are missing, fill them with fake params
    const childIds = [...typeObject.elements.values()];
    for (let index = 0; index < children.length; index++) {
      if (!children[index]) {
        children[index] = this.sampleArgument(
          depth + 1,
          prng.pickOne(childIds),
          String(index)
        );
      }
    }

    return new ArrayStatement(id, name, type, prng.uniqueId(), children);
  }

  sampleArrowFunction(
    depth: number,
    id: string,
    name: string,
    type: string
  ): ArrowFunctionStatement {
    const typeObject = type.includes("<>")
      ? this._rootContext
          .getTypeModel()
          .getObjectDescription(type.split("<>")[0])
      : this._rootContext.getTypeModel().getObjectDescription(id);

    const parameters: string[] = [];

    for (const [index, parameterId] of typeObject.parameters.entries()) {
      const element = this.rootContext.getElement(parameterId);

      const name = "name" in element ? element.name : element.value;

      parameters[index] = name;
    }

    // if some params are missing, fill them with fake params
    for (let index = 0; index < parameters.length; index++) {
      if (!parameters[index]) {
        parameters[index] = `param${index}`;
      }
    }

    if (typeObject.return.size === 0) {
      return new ArrowFunctionStatement(
        id,
        name,
        TypeEnum.FUNCTION,
        prng.uniqueId(),
        parameters,
        undefined
      );
    }

    const chosenReturn = prng.pickOne([...typeObject.return]);

    return new ArrowFunctionStatement(
      id,
      name,
      type,
      prng.uniqueId(),
      parameters,
      this.sampleArgument(depth + 1, chosenReturn, "return")
    );
  }

  sampleString(
    id: string,
    name: string,
    alphabet = this.stringAlphabet,
    maxlength = this.stringMaxLength
  ): StringStatement {
    const valueLength = prng.nextInt(0, maxlength - 1);
    let value = "";

    for (let index = 0; index < valueLength; index++) {
      value += prng.pickOne([...alphabet]);
    }

    return new StringStatement(
      id,
      name,
      TypeEnum.STRING,
      prng.uniqueId(),
      value,
      alphabet,
      maxlength
    );
  }

  // primitives
  sampleBool(id: string, name: string): BoolStatement {
    return new BoolStatement(
      id,
      name,
      TypeEnum.BOOLEAN,
      prng.uniqueId(),
      prng.nextBoolean()
    );
  }

  sampleNull(id: string, name: string): NullStatement {
    return new NullStatement(id, name, TypeEnum.NULL, prng.uniqueId());
  }

  sampleNumber(id: string, name: string): NumericStatement {
    // by default we create small numbers (do we need very large numbers?)
    const max = 10;
    const min = -10;

    return new NumericStatement(
      id,
      name,
      TypeEnum.NUMERIC,
      prng.uniqueId(),
      prng.nextDouble(min, max)
    );
  }

  sampleUndefined(id: string, name: string): UndefinedStatement {
    return new UndefinedStatement(
      id,
      name,
      TypeEnum.UNDEFINED,
      prng.uniqueId()
    );
  }

  private _sampleArguments(depth: number, type_: ObjectType): Statement[] {
    const arguments_: Statement[] = [];

    for (const [index, parameterId] of type_.parameters.entries()) {
      const element = this.rootContext.getElement(parameterId);

      if (element) {
        const name = "name" in element ? element.name : element.value;

        arguments_[index] = this.sampleArgument(depth + 1, parameterId, name);
        continue;
      }

      const relation = this.rootContext.getRelation(parameterId);

      if (relation) {
        const name = getRelationName(relation.type);

        arguments_[index] = this.sampleArgument(depth + 1, parameterId, name);
        continue;
      }

      throw new Error(
        `Could not find element or relation with id ${parameterId}`
      );
    }

    // if some params are missing, fill them with fake params
    const parameterIds = [...type_.parameters.values()];
    for (let index = 0; index < arguments_.length; index++) {
      if (!arguments_[index]) {
        arguments_[index] = this.sampleArgument(
          depth + 1,
          prng.pickOne(parameterIds),
          String(index)
        );
      }
    }

    return arguments_;
  }
}
