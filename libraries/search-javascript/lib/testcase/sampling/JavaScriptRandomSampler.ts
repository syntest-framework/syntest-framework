/*
 * Copyright 2020-2023 SynTest contributors
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

import { TargetType } from "@syntest/analysis";
import {
  ClassTarget,
  ConstantPoolManager,
  DiscoveredObjectKind,
  FunctionTarget,
  isExported,
  MethodTarget,
  ObjectFunctionTarget,
  ObjectTarget,
} from "@syntest/analysis-javascript";
import { ImplementationError, isFailure, unwrap } from "@syntest/diagnostics";
import { prng } from "@syntest/prng";

import { JavaScriptSubject } from "../../search/JavaScriptSubject";
import { JavaScriptTestCase } from "../JavaScriptTestCase";
import { StatementPool } from "../StatementPool";
import { ActionStatement } from "../statements/action/ActionStatement";
import { ConstantObject } from "../statements/action/ConstantObject";
import { ConstructorCall } from "../statements/action/ConstructorCall";
import { FunctionCall } from "../statements/action/FunctionCall";
import { Getter } from "../statements/action/Getter";
import { MethodCall } from "../statements/action/MethodCall";
import { ObjectFunctionCall } from "../statements/action/ObjectFunctionCall";
import { Setter } from "../statements/action/Setter";
import { ArrayStatement } from "../statements/complex/ArrayStatement";
import { ArrowFunctionStatement } from "../statements/complex/ArrowFunctionStatement";
import { ObjectStatement } from "../statements/complex/ObjectStatement";
import { BoolStatement } from "../statements/primitive/BoolStatement";
import { IntegerStatement } from "../statements/primitive/IntegerStatement";
import { NullStatement } from "../statements/primitive/NullStatement";
import { NumericStatement } from "../statements/primitive/NumericStatement";
import { StringStatement } from "../statements/primitive/StringStatement";
import { UndefinedStatement } from "../statements/primitive/UndefinedStatement";
import { Statement } from "../statements/Statement";

import { JavaScriptTestCaseSampler } from "./JavaScriptTestCaseSampler";

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
        const result = this.rootContext.getSubTargets(
          constructor_.typeIdentifier.split(":")[0]
        );

        if (isFailure(result)) throw result.error;

        const targets = unwrap(result);

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
        throw new ImplementationError("missing class with id: " + id);
      } else if (!isExported(result)) {
        throw new ImplementationError(
          "class with id: " + id + "is not exported"
        );
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
      throw new ImplementationError("Multiple constructors found for class");
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
        throw new ImplementationError("invalid path");
      }
      // No default
    }
  }

  override sampleMethodCall(depth: number): MethodCall {
    const targets = (<JavaScriptSubject>this._subject).getActionableTargets();

    const methods = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter((method) => (<MethodTarget>method).methodType === "method")
      .filter((target) =>
        isExported(
          targets.find(
            (objectTarget) => objectTarget.id === (<MethodTarget>target).classId
          )
        )
      );

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
    const targets = (<JavaScriptSubject>this._subject).getActionableTargets();

    const methods = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter((method) => (<MethodTarget>method).methodType === "get")
      .filter((target) =>
        isExported(
          targets.find(
            (objectTarget) => objectTarget.id === (<MethodTarget>target).classId
          )
        )
      );

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
    const targets = (<JavaScriptSubject>this._subject).getActionableTargets();

    const methods = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.METHOD)
      .filter((method) => (<MethodTarget>method).methodType === "set")
      .filter((target) =>
        isExported(
          targets.find(
            (objectTarget) => objectTarget.id === (<MethodTarget>target).classId
          )
        )
      );

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
        throw new ImplementationError("missing object with id: " + id);
      } else if (!isExported(result)) {
        throw new ImplementationError(
          "object with id: " + id + " is not exported"
        );
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
    const targets = (<JavaScriptSubject>this._subject).getActionableTargets();

    const functions = (<JavaScriptSubject>this._subject)
      .getActionableTargetsByType(TargetType.OBJECT_FUNCTION)
      .filter((target) =>
        isExported(
          targets.find(
            (objectTarget) =>
              objectTarget.id === (<ObjectFunctionTarget>target).objectId
          )
        )
      );

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
  sampleArrayArgument(depth: number, arrayId: string): Statement {
    const arrayType = this.rootContext
      .getTypeModel()
      .getObjectDescription(arrayId);

    const childIds = [...arrayType.elements];

    if (childIds.length === 0) {
      // TODO should be done in the typemodel somehow
      // maybe create types for the subproperties by doing /main/array/id::1::1[element-index]
      // maybe create types for the subproperties by doing /main/array/id::1::1.property
      return this.sampleArgument(depth, "anon", "arrayElement");
    }

    const element = prng.pickOne(childIds);
    return this.sampleArgument(depth, element, "arrayElement");
  }

  sampleObjectArgument(
    depth: number,
    objectTypeId: string,
    property: string
  ): Statement {
    const objectType = this.rootContext
      .getTypeModel()
      .getObjectDescription(objectTypeId);

    const value = objectType.properties.get(property);
    if (!value) {
      throw new ImplementationError(
        `Property ${property} not found in object ${objectTypeId}`
      );
    }

    return this.sampleArgument(depth, value, property);
  }

  sampleArgument(depth: number, id: string, name: string): Statement {
    if (depth > 10) {
      // max depth
      // TODO should be any primitive type
      return this.sampleBool(id, id, name);
    }

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
        throw new ImplementationError(
          "Invalid identifierDescription inference mode selected"
        );
      }
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

    const typeId = chosenType.includes("<>") ? chosenType.split("<>")[0] : id;
    const type = chosenType.includes("<>")
      ? chosenType.split("<>")[1]
      : chosenType;

    switch (type) {
      case "boolean": {
        return this.sampleBool(id, typeId, name);
      }
      case "string": {
        return this.sampleString(id, typeId, name);
      }
      case "numeric": {
        return this.sampleNumber(id, typeId, name);
      }
      case "integer": {
        return this.sampleInteger(id, typeId, name);
      }
      case "null": {
        return this.sampleNull(id, typeId, name);
      }
      case "undefined": {
        return this.sampleUndefined(id, typeId, name);
      }
      case "object": {
        return this.sampleObject(depth, id, typeId, name);
      }
      case "array": {
        return this.sampleArray(depth, id, typeId, name);
      }
      case "function": {
        return this.sampleArrowFunction(depth, id, typeId, name);
      }
      case "regex": {
        // TODO REGEX
        return this.sampleString(id, typeId, name);
      }
    }

    throw new ImplementationError(`unknown type: ${chosenType}`);
  }

  sampleObject(depth: number, id: string, typeId: string, name: string) {
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
            const result = this.rootContext.getSubTargets(
              typeFromTypePool.id.split(":")[0]
            );

            if (isFailure(result)) throw result.error;

            const targets = unwrap(result);
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

    return new ObjectStatement(id, typeId, name, prng.uniqueId(), object_);
  }

  sampleArray(depth: number, id: string, typeId: string, name: string) {
    const elements: Statement[] = [];

    for (
      let index = 0;
      index < prng.nextInt(0, this.maxActionStatements);
      index++
    ) {
      elements.push(this.sampleArrayArgument(depth + 1, typeId));
    }

    return new ArrayStatement(id, typeId, name, prng.uniqueId(), elements);
  }

  sampleArrowFunction(
    depth: number,
    id: string,
    typeId: string,
    name: string
  ): ArrowFunctionStatement {
    const typeObject = this.rootContext
      .getTypeModel()
      .getObjectDescription(typeId);

    const parameters: string[] = [];

    for (const [index, name] of typeObject.parameterNames.entries()) {
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
      prng.uniqueId(),
      parameters,
      this.sampleArgument(depth + 1, chosenReturn, "return")
    );
  }

  sampleString(id: string, typeId: string, name: string): StringStatement {
    let value: string;
    if (
      this.constantPoolEnabled &&
      prng.nextBoolean(this.constantPoolProbability)
    ) {
      value = this.constantPoolManager.contextConstantPool.getRandomString();
    }

    if (value === undefined) {
      value = "";
      const valueLength = prng.nextInt(0, this.stringMaxLength - 1);

      for (let index = 0; index < valueLength; index++) {
        value += prng.pickOne([...this.stringAlphabet]);
      }
    }

    return new StringStatement(id, typeId, name, prng.uniqueId(), value);
  }

  // primitives
  sampleBool(id: string, typeId: string, name: string): BoolStatement {
    return new BoolStatement(
      id,
      typeId,
      name,
      prng.uniqueId(),
      prng.nextBoolean()
    );
  }

  sampleNull(id: string, typeId: string, name: string): NullStatement {
    return new NullStatement(id, typeId, name, prng.uniqueId());
  }

  sampleNumber(id: string, typeId: string, name: string): NumericStatement {
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

    return new NumericStatement(id, typeId, name, prng.uniqueId(), value);
  }

  sampleInteger(id: string, typeId: string, name: string): IntegerStatement {
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

    return new IntegerStatement(id, typeId, name, prng.uniqueId(), value);
  }

  sampleUndefined(
    id: string,
    typeId: string,
    name: string
  ): UndefinedStatement {
    return new UndefinedStatement(id, typeId, name, prng.uniqueId());
  }
}
