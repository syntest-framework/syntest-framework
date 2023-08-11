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
  DiscoveredObjectKind,
  ConstantPoolManager,
  FunctionTarget,
  isExported,
  MethodTarget,
  ObjectFunctionTarget,
  ObjectTarget,
  TypeEnum,
} from "@syntest/analysis-javascript";
import { prng } from "@syntest/prng";

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
import { ConstructorCall } from "../statements/action/ConstructorCall";
import { FunctionCall } from "../statements/action/FunctionCall";
import { ConstantObject } from "../statements/action/ConstantObject";
import { Statement } from "../statements/Statement";

import { JavaScriptTestCaseSampler } from "./JavaScriptTestCaseSampler";
import { TargetType } from "@syntest/analysis";
import { ObjectFunctionCall } from "../statements/action/ObjectFunctionCall";
import { ObjectType } from "@syntest/analysis-javascript";
import { IntegerStatement } from "../statements/primitive/IntegerStatement";
import { ActionStatement } from "../statements/action/ActionStatement";
import { StatementPool } from "../StatementPool";

export class JavaScriptRandomSampler extends JavaScriptTestCaseSampler {
  constructor(
    subject: JavaScriptSubject,
    constantPoolManager: ConstantPoolManager,
    constantPoolEnabled: boolean,
    constantPoolProbability: number,
    typePoolEnabled: boolean,
    typePoolProbability: number,
    statementPoolEnabled: boolean,
    statementPoolProbability: number,
    typeInferenceMode: string,
    randomTypeProbability: number,
    incorporateExecutionInformation: boolean,
    maxActionStatements: number,
    stringAlphabet: string,
    stringMaxLength: number,
    deltaMutationProbability: number,
    exploreIllegalValues: boolean
  ) {
    super(
      subject,
      constantPoolManager,
      constantPoolEnabled,
      constantPoolProbability,
      typePoolEnabled,
      typePoolProbability,
      statementPoolEnabled,
      statementPoolProbability,
      typeInferenceMode,
      randomTypeProbability,
      incorporateExecutionInformation,
      maxActionStatements,
      stringAlphabet,
      stringMaxLength,
      deltaMutationProbability,
      exploreIllegalValues
    );
  }

  sample(): JavaScriptTestCase {
    const roots: ActionStatement[] = [];

    for (
      let index = 0;
      index < prng.nextInt(1, this.maxActionStatements); // (i think its better to start with a single statement)
      index++
    ) {
      this.statementPool = new StatementPool(roots);
      roots.push(this.sampleRoot());
    }
    this.statementPool = undefined;

    return new JavaScriptTestCase(roots);
  }

  sampleRoot(): ActionStatement {
    const targets = (<JavaScriptSubject>this._subject).getActionableTargets();

    if (this.statementPoolEnabled) {
      const constructor_ = this.statementPool.getRandomConstructor();

      if (constructor_ && prng.nextBoolean(this.statementPoolProbability)) {
        // TODO ignoring getters and setters for now
        const targets = this.rootContext.getSubTargets(
          constructor_.typeIdentifier.split(":")[0]
        );
        const methods = <MethodTarget[]>(
          targets.filter(
            (target) =>
              target.type === TargetType.METHOD &&
              (<MethodTarget>target).methodType === "method" &&
              (<MethodTarget>target).classId === constructor_.classIdentifier
          )
        );
        if (methods.length > 0) {
          const method = prng.pickOne(methods);

          const type_ = this.rootContext
            .getTypeModel()
            .getObjectDescription(method.typeId);

          const arguments_: Statement[] =
            this.methodCallGenerator.sampleArguments(0, type_);

          return new MethodCall(
            method.id,
            method.typeId,
            method.name,
            TypeEnum.FUNCTION,
            prng.uniqueId(),
            arguments_,
            constructor_
          );
        }
      }
    }

    const action = prng.pickOne(
      targets.filter(
        (target) =>
          (target.type === TargetType.FUNCTION && isExported(target)) ||
          (target.type === TargetType.CLASS && isExported(target)) ||
          (target.type === TargetType.OBJECT && isExported(target)) ||
          (target.type === TargetType.METHOD &&
            (<MethodTarget>target).methodType !== "constructor" &&
            isExported(
              targets.find(
                (classTarget) =>
                  classTarget.id === (<MethodTarget>target).classId
              )
            )) || // check whether parent class is exported
          (target.type === TargetType.OBJECT_FUNCTION &&
            isExported(
              targets.find(
                (objectTarget) =>
                  objectTarget.id === (<ObjectFunctionTarget>target).objectId
              )
            )) // check whether parent object is exported
      )
    );

    switch (action.type) {
      case TargetType.FUNCTION: {
        return this.sampleFunctionCall(0);
      }
      case TargetType.CLASS: {
        return this.sampleConstructorCall(0);
      }
      case TargetType.OBJECT: {
        return this.sampleConstantObject(0);
      }
      case TargetType.METHOD: {
        return this.sampleClassAction(0);
      }
      default: {
        return this.sampleObjectFunctionCall(0);
      }
    }
  }

  sampleFunctionCall(depth: number): FunctionCall {
    // get a random function
    const function_ = <FunctionTarget>(
      prng.pickOne(
        (<JavaScriptSubject>this._subject)
          .getActionableTargetsByType(TargetType.FUNCTION)
          .filter((target) => isExported(target))
      )
    );

    return this.functionCallGenerator.generate(
      depth,
      function_.id,
      function_.typeId,
      function_.id,
      function_.name,
      this.statementPool
    );
  }

  private _getClass(id?: string) {
    if (id) {
      const result = <ClassTarget>(
        (<JavaScriptSubject>this._subject)
          .getActionableTargetsByType(TargetType.CLASS)
          .find((target) => (<ClassTarget>target).id === id)
      );
      if (!result) {
        throw new Error("missing class with id: " + id);
      } else if (!isExported(result)) {
        throw new Error("class with id: " + id + "is not exported");
      }
      return result;
    }

    // random
    return <ClassTarget>(
      prng.pickOne(
        (<JavaScriptSubject>this._subject)
          .getActionableTargetsByType(TargetType.CLASS)
          .filter((target) => isExported(target))
      )
    );
  }

  sampleConstructorCall(depth: number, classId?: string): ConstructorCall {
    // get a random class
    const class_ = this._getClass(classId);

    // get the constructor of the class
    const constructor_ = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter(
        (method) =>
          (<MethodTarget>method).classId === class_.id &&
          (<MethodTarget>method).methodType === "constructor"
      );

    if (constructor_.length > 1) {
      throw new Error("Multiple constructors found for class");
    }

    if (constructor_.length === 0) {
      // default constructor no args
      const export_ = [...this.rootContext.getAllExports().values()]
        .flat()
        .find((export_) => export_.id === class_.id);

      return new ConstructorCall(
        class_.id,
        class_.typeId,
        class_.id,
        class_.name,
        TypeEnum.FUNCTION,
        prng.uniqueId(),
        [],
        export_
      );
    } else {
      const action = constructor_[0];
      return this.constructorCallGenerator.generate(
        depth,
        action.id,
        (<MethodTarget>action).typeId,
        class_.id,
        class_.name,
        this.statementPool
      );
    }
  }

  override sampleClassAction(depth: number): MethodCall | Getter | Setter {
    const targets = (<JavaScriptSubject>this._subject).getActionableTargets();

    const methods = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter(
        (method) =>
          (<MethodTarget>method).methodType !== "constructor" &&
          isExported(
            targets.find(
              (classTarget) => classTarget.id === (<MethodTarget>method).classId
            )
          )
      );

    const randomMethod = <MethodTarget>prng.pickOne(methods);
    switch (randomMethod.methodType) {
      case "method": {
        return this.sampleMethodCall(depth);
      }
      case "get": {
        return this.sampleGetter(depth);
      }
      case "set": {
        return this.sampleSetter(depth);
      }
      case "constructor": {
        throw new Error("invalid path");
      }
      // No default
    }
  }

  override sampleMethodCall(depth: number): MethodCall {
    const methods = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter((method) => (<MethodTarget>method).methodType === "method");

    const method = <MethodTarget>prng.pickOne(methods);
    const class_ = this._getClass(method.classId);

    return this.methodCallGenerator.generate(
      depth,
      method.id,
      method.typeId,
      class_.id,
      method.name,
      this.statementPool
    );
  }

  sampleGetter(depth: number): Getter {
    const methods = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter((method) => (<MethodTarget>method).methodType === "get");

    const method = <MethodTarget>prng.pickOne(methods);
    const class_ = this._getClass(method.classId);

    return this.getterGenerator.generate(
      depth,
      method.id,
      method.id,
      class_.id,
      method.name,
      this.statementPool
    );
  }

  sampleSetter(depth: number): Setter {
    const methods = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter((method) => (<MethodTarget>method).methodType === "set");

    const method = <MethodTarget>prng.pickOne(methods);
    const class_ = this._getClass(method.classId);

    return this.setterGenerator.generate(
      depth,
      method.id,
      method.typeId,
      class_.id,
      method.name,
      this.statementPool
    );
  }

  private _getObject(id?: string) {
    if (id) {
      const result = <ObjectTarget>(
        (<JavaScriptSubject>this._subject)
          .getActionableTargetsByType(TargetType.OBJECT)
          .find((target) => (<ObjectTarget>target).id === id)
      );
      if (!result) {
        throw new Error("missing object with id: " + id);
      } else if (!isExported(result)) {
        throw new Error("object with id: " + id + "is not exported");
      }
      return result;
    }

    // random
    return <ObjectTarget>(
      prng.pickOne(
        (<JavaScriptSubject>this._subject)
          .getActionableTargetsByType(TargetType.OBJECT)
          .filter((target) => isExported(target))
      )
    );
  }

  sampleConstantObject(depth: number, objectId?: string): ConstantObject {
    // get a random object
    const object_ = this._getObject(objectId);

    return this.constantObjectGenerator.generate(
      depth,
      object_.id,
      object_.typeId,
      object_.id,
      object_.name,
      this.statementPool
    );
  }

  sampleObjectFunctionCall(depth: number): ObjectFunctionCall {
    const functions = (<JavaScriptSubject>(
      this._subject
    )).getActionableTargetsByType(TargetType.OBJECT_FUNCTION);

    const randomFunction = <ObjectFunctionTarget>prng.pickOne(functions);
    const object_ = this._getObject(randomFunction.objectId);

    return this.objectFunctionCallGenerator.generate(
      depth,
      randomFunction.id,
      randomFunction.typeId,
      object_.id,
      randomFunction.name,
      this.statementPool
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
      return this.sampleArgument(depth, "anon", "anon");
    }

    return this.sampleArgument(depth, prng.pickOne(childIds), String(index));
  }

  sampleObjectArgument(
    depth: number,
    objectTypeId: string,
    property: string
  ): Statement {
    const objectType = <ObjectType>(
      this.rootContext.getTypeModel().getObjectDescription(objectTypeId)
    );

    const value = objectType.properties.get(property);
    if (!value) {
      throw new Error(
        `Property ${property} not found in object ${objectTypeId}`
      );
    }

    return this.sampleArgument(depth, value, property);
  }

  sampleArgument(depth: number, id: string, name: string): Statement {
    let chosenType: string;

    switch (this.typeInferenceMode) {
      case "none": {
        chosenType = this.rootContext
          .getTypeModel()
          .getRandomType(false, 1, id);

        break;
      }
      case "proportional": {
        chosenType = this.rootContext
          .getTypeModel()
          .getRandomType(
            this.incorporateExecutionInformation,
            this.randomTypeProbability,
            id
          );

        break;
      }
      case "ranked": {
        chosenType = this.rootContext
          .getTypeModel()
          .getHighestProbabilityType(
            this.incorporateExecutionInformation,
            this.randomTypeProbability,
            id
          );

        break;
      }
      default: {
        throw new Error(
          "Invalid identifierDescription inference mode selected"
        );
      }
    }

    if (chosenType.endsWith("object")) {
      return this.sampleObject(depth, id, name, chosenType);
    } else if (chosenType.endsWith("array")) {
      return this.sampleArray(depth, id, name, chosenType);
    } else if (chosenType.endsWith("function")) {
      return this.sampleArrowFunction(depth, id, name, chosenType);
    }

    // take from pool
    if (this.statementPoolEnabled) {
      const statementFromPool =
        this.statementPool.getRandomStatement(chosenType);

      if (
        statementFromPool &&
        prng.nextBoolean(this.statementPoolProbability)
      ) {
        return statementFromPool;
      }
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
      case "integer": {
        return this.sampleInteger(id, name);
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
    }

    throw new Error(`unknown type: ${chosenType}`);
  }

  sampleObject(depth: number, id: string, name: string, type: string) {
    const typeId = type.includes("<>") ? type.split("<>")[0] : id;

    const typeObject = this.rootContext
      .getTypeModel()
      .getObjectDescription(typeId);

    if (this.typePoolEnabled) {
      // TODO maybe we should sample from the typepool for the other stuff as well (move this to sample arg for example)
      const typeFromTypePool = this.rootContext
        .getTypePool()
        // .getRandomMatchingType(typeObject)
        // TODO this prevents ONLY allows sampling of matching class constructors
        .getRandomMatchingType(
          typeObject,
          (type_) => type_.kind === DiscoveredObjectKind.CLASS
        );

      if (typeFromTypePool && prng.nextBoolean(this.typePoolProbability)) {
        // always prefer type from type pool
        switch (typeFromTypePool.kind) {
          case DiscoveredObjectKind.CLASS: {
            // find constructor of class
            const targets = this.rootContext.getSubTargets(
              typeFromTypePool.id.split(":")[0]
            );
            const constructor_ = <MethodTarget>(
              targets.find(
                (target) =>
                  target.type === TargetType.METHOD &&
                  (<MethodTarget>target).methodType === "constructor" &&
                  (<MethodTarget>target).classId === typeFromTypePool.id
              )
            );

            if (constructor_) {
              return this.constructorCallGenerator.generate(
                depth,
                id, // variable id
                constructor_.typeId, // constructor call id
                typeFromTypePool.id, // class export id
                name,
                this.statementPool
              );
            }

            return this.constructorCallGenerator.generate(
              depth,
              id, // variable id
              typeFromTypePool.id, // constructor call id
              typeFromTypePool.id, // class export id
              name,
              this.statementPool
            );
          }
          case DiscoveredObjectKind.FUNCTION: {
            return this.functionCallGenerator.generate(
              depth,
              id,
              typeFromTypePool.id,
              typeFromTypePool.id,
              name,
              this.statementPool
            );
          }
          case DiscoveredObjectKind.INTERFACE: {
            // TODO
            return this.constructorCallGenerator.generate(
              depth,
              id,
              typeFromTypePool.id,
              typeFromTypePool.id,
              name,
              this.statementPool
            );
          }
          case DiscoveredObjectKind.OBJECT: {
            return this.constantObjectGenerator.generate(
              depth,
              id,
              typeFromTypePool.id,
              typeFromTypePool.id,
              name,
              this.statementPool
            );
          }
          // No default
        }
      }
    }

    const object_: { [key: string]: Statement } = {};

    for (const key of typeObject.properties.keys()) {
      object_[key] = this.sampleObjectArgument(depth + 1, typeId, key);
    }

    return new ObjectStatement(
      id,
      typeId,
      name,
      type,
      prng.uniqueId(),
      object_
    );
  }

  sampleArray(depth: number, id: string, name: string, type: string) {
    const typeId = type.includes("<>") ? type.split("<>")[0] : id;

    const typeObject = this.rootContext
      .getTypeModel()
      .getObjectDescription(typeId);

    const children: Statement[] = [];

    for (const [index] of typeObject.elements.entries()) {
      children[index] = this.sampleArrayArgument(depth + 1, id, index);
    }

    // TODO should be done in the typemodel somehow
    // maybe create types for the subproperties by doing /main/array/id::1::1[element-index]
    // maybe create types for the subproperties by doing /main/array/id::1::1.property

    if (children.length === 0) {
      children.push(this.sampleArrayArgument(depth + 1, id, 0));
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

    return new ArrayStatement(
      id,
      typeId,
      name,
      type,
      prng.uniqueId(),
      children
    );
  }

  sampleArrowFunction(
    depth: number,
    id: string,
    name: string,
    type: string
  ): ArrowFunctionStatement {
    const typeId = type.includes("<>") ? type.split("<>")[0] : id;

    const typeObject = this.rootContext
      .getTypeModel()
      .getObjectDescription(typeId);

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
        typeId,
        name,
        TypeEnum.FUNCTION,
        prng.uniqueId(),
        parameters,
        undefined // maybe something random?
      );
    }

    const chosenReturn = prng.pickOne([...typeObject.return]);

    return new ArrowFunctionStatement(
      id,
      typeId,
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
    let value: string;
    if (
      this.constantPoolEnabled &&
      prng.nextBoolean(this.constantPoolProbability)
    ) {
      value = this.constantPoolManager.contextConstantPool.getRandomString();
    }

    if (value === undefined) {
      value = "";
      const valueLength = prng.nextInt(0, maxlength - 1);

      for (let index = 0; index < valueLength; index++) {
        value += prng.pickOne([...alphabet]);
      }
    }

    return new StringStatement(
      id,
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
      id,
      name,
      TypeEnum.BOOLEAN,
      prng.uniqueId(),
      prng.nextBoolean()
    );
  }

  sampleNull(id: string, name: string): NullStatement {
    return new NullStatement(id, id, name, TypeEnum.NULL, prng.uniqueId());
  }

  sampleNumber(id: string, name: string): NumericStatement {
    // by default we create small numbers (do we need very large numbers?)
    const max = 1000;
    const min = -1000;

    const value =
      this.constantPoolEnabled && prng.nextBoolean(this.constantPoolProbability)
        ? this.constantPoolManager.contextConstantPool.getRandomNumeric()
        : prng.nextDouble(min, max);

    if (value === undefined) {
      prng.nextDouble(min, max);
    }

    return new NumericStatement(
      id,
      id,
      name,
      TypeEnum.NUMERIC,
      prng.uniqueId(),
      value
    );
  }

  sampleInteger(id: string, name: string): IntegerStatement {
    // by default we create small numbers (do we need very large numbers?)
    const max = 1000;
    const min = -1000;

    const value =
      this.constantPoolEnabled && prng.nextBoolean(this.constantPoolProbability)
        ? this.constantPoolManager.contextConstantPool.getRandomInteger()
        : prng.nextInt(min, max);

    if (value === undefined) {
      prng.nextInt(min, max);
    }

    return new IntegerStatement(
      id,
      id,
      name,
      TypeEnum.INTEGER,
      prng.uniqueId(),
      value
    );
  }

  sampleUndefined(id: string, name: string): UndefinedStatement {
    return new UndefinedStatement(
      id,
      id,
      name,
      TypeEnum.UNDEFINED,
      prng.uniqueId()
    );
  }
}
