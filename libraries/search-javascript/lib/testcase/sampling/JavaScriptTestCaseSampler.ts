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

import { EncodingSampler } from "@syntest/search";

import { JavaScriptSubject } from "../../search/JavaScriptSubject";
import { JavaScriptTestCase } from "../JavaScriptTestCase";
import { Getter } from "../statements/action/Getter";
import { MethodCall } from "../statements/action/MethodCall";
import { Setter } from "../statements/action/Setter";
import { BoolStatement } from "../statements/primitive/BoolStatement";
import { NumericStatement } from "../statements/primitive/NumericStatement";
import { StringStatement } from "../statements/primitive/StringStatement";
import { ConstructorCall } from "../statements/root/ConstructorCall";
import { Statement } from "../statements/Statement";
import { RootObject } from "../statements/root/RootObject";
import { ObjectFunctionCall } from "../statements/action/ObjectFunctionCall";
import { NullStatement } from "../statements/primitive/NullStatement";
import { UndefinedStatement } from "../statements/primitive/UndefinedStatement";
import { ArrowFunctionStatement } from "../statements/complex/ArrowFunctionStatement";
import { ArrayStatement } from "../statements/complex/ArrayStatement";
import { ObjectStatement } from "../statements/complex/ObjectStatement";
import { IntegerStatement } from "../statements/primitive/IntegerStatement";
import { ConstantPoolManager } from "@syntest/analysis-javascript";

/**
 * JavaScriptRandomSampler class
 *
 * @author Dimitri Stallenberg
 */
export abstract class JavaScriptTestCaseSampler extends EncodingSampler<JavaScriptTestCase> {
  private _constantPoolManager: ConstantPoolManager;
  private _constantPoolEnabled: boolean;
  private _constantPoolProbability: number;
  private _typeInferenceMode: string;
  private _randomTypeProbability: number;
  private _incorporateExecutionInformation: boolean;
  private _maxActionStatements: number;
  private _stringAlphabet: string;
  private _stringMaxLength: number;
  private _resampleGeneProbability: number;
  private _deltaMutationProbability: number;
  private _exploreIllegalValues: boolean;

  constructor(
    subject: JavaScriptSubject,
    constantPoolManager: ConstantPoolManager,
    constantPoolEnabled: boolean,
    constantPoolProbability: number,
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
    super(subject);
    this._constantPoolManager = constantPoolManager;
    this._constantPoolEnabled = constantPoolEnabled;
    this._constantPoolProbability = constantPoolProbability;
    this._typeInferenceMode = typeInferenceMode;
    this._randomTypeProbability = randomTypeProbability;
    this._incorporateExecutionInformation = incorporateExecutionInformation;
    this._maxActionStatements = maxActionStatements;
    this._stringAlphabet = stringAlphabet;
    this._stringMaxLength = stringMaxLength;
    this._resampleGeneProbability = resampleGeneProbability;
    this._deltaMutationProbability = deltaMutationProbability;
    this._exploreIllegalValues = exploreIllegalValues;
  }

  abstract sampleClass(depth: number): ConstructorCall;
  // TODO sampleConstructor
  abstract sampleClassCall(
    depth: number,
    className: string
  ): MethodCall | Getter | Setter;
  abstract sampleMethodCall(depth: number, className: string): MethodCall;

  abstract sampleGetter(depth: number, className: string): Getter;

  abstract sampleSetter(depth: number, className: string): Setter;

  abstract sampleRootObject(depth: number): RootObject;
  abstract sampleObjectFunctionCall(
    depth: number,
    objectName: string
  ): ObjectFunctionCall;

  // TODO
  // abstract sampleStaticMethodCall(depth: number): MethodCall;
  // abstract sampleFunctionCall(depth: number): FunctionCall;

  abstract sampleArrayArgument(
    depth: number,
    arrayId: string,
    index?: number
  ): Statement;

  abstract sampleObjectArgument(
    depth: number,
    objectId: string,
    property?: string
  ): Statement;

  abstract sampleArgument(depth: number, id: string, name: string): Statement;

  abstract sampleObject(
    depth: number,
    id: string,
    name: string,
    type: string
  ): ObjectStatement;

  abstract sampleArray(
    depth: number,
    id: string,
    name: string,
    type: string
  ): ArrayStatement;

  abstract sampleArrowFunction(
    depth: number,
    id: string,
    name: string,
    type: string
  ): ArrowFunctionStatement;

  abstract sampleString(
    id: string,
    name: string,
    alphabet?: string,
    maxlength?: number
  ): StringStatement;

  // primitive types
  abstract sampleBool(id: string, name: string): BoolStatement;

  abstract sampleNull(id: string, name: string): NullStatement;

  abstract sampleNumber(id: string, name: string): NumericStatement;
  abstract sampleInteger(id: string, name: string): IntegerStatement;

  abstract sampleUndefined(id: string, name: string): UndefinedStatement;

  get constantPoolManager(): ConstantPoolManager {
    return this._constantPoolManager;
  }

  get constantPoolEnabled(): boolean {
    return this._constantPoolEnabled;
  }

  get constantPoolProbability(): number {
    return this._constantPoolProbability;
  }

  get typeInferenceMode(): string {
    return this._typeInferenceMode;
  }

  get randomTypeProbability(): number {
    return this._randomTypeProbability;
  }

  get incorporateExecutionInformation(): boolean {
    return this._incorporateExecutionInformation;
  }

  get maxActionStatements(): number {
    return this._maxActionStatements;
  }

  get stringAlphabet(): string {
    return this._stringAlphabet;
  }

  get stringMaxLength(): number {
    return this._stringMaxLength;
  }

  get resampleGeneProbability(): number {
    return this._resampleGeneProbability;
  }

  get deltaMutationProbability(): number {
    return this._deltaMutationProbability;
  }

  get exploreIllegalValues(): boolean {
    return this._exploreIllegalValues;
  }
}
