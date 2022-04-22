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

import {
  EncodingSampler, Properties,
} from "@syntest/framework";

import { JavaScriptTestCase } from "../JavaScriptTestCase";
import { ConstructorCall } from "../statements/root/ConstructorCall";
import { MethodCall } from "../statements/action/MethodCall";
import { Statement } from "../statements/Statement";
import { JavaScriptSubject } from "../../search/JavaScriptSubject";
import { IdentifierDescription } from "../../analysis/static/parsing/IdentifierDescription";
import { StringStatement } from "../statements/primitive/StringStatement";

/**
 * JavaScriptRandomSampler class
 *
 * @author Dimitri Stallenberg
 */
export abstract class JavaScriptTestCaseSampler extends EncodingSampler<JavaScriptTestCase> {
  protected constructor(subject: JavaScriptSubject) {
    super(subject);
  }

  abstract sampleConstructor(depth: number): ConstructorCall;
  abstract sampleMethodCall(depth: number): MethodCall;
  abstract sampleArgument(
    depth: number,
    type: IdentifierDescription
  ): Statement;

  // TODO
  // abstract sampleStaticMethodCall(depth: number): MethodCall;
  // abstract sampleFunctionCall(depth: number): FunctionCall;

  abstract sampleString(
    identifierDescription?: IdentifierDescription,
    type?: string,
    alphabet?: string,
    maxlength?: number
  ): StringStatement

  abstract sampleBool(
    identifierDescription?: IdentifierDescription,
    type?: string,
  )

  abstract sampleNumber(
    identifierDescription?: IdentifierDescription,
    type?: string,
  )
}
