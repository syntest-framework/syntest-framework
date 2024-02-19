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
import { SubTarget, Target } from "@syntest/analysis-javascript";
import { ObjectiveFunction, SearchSubject } from "@syntest/search";

import { JavaScriptTestCase } from "../testcase/JavaScriptTestCase";

export class JavaScriptSubject extends SearchSubject<JavaScriptTestCase> {
  constructor(
    target: Target,
    objectives: ObjectiveFunction<JavaScriptTestCase>[]
  ) {
    super(target, objectives);
  }

  getActionableTargets(): SubTarget[] {
    return this._target.subTargets.filter((t) => {
      return (
        t.type === TargetType.FUNCTION ||
        t.type === TargetType.CLASS ||
        t.type === TargetType.METHOD ||
        t.type === TargetType.OBJECT ||
        t.type === TargetType.OBJECT_FUNCTION
      );
    });
  }

  getActionableTargetsByType(type: TargetType): SubTarget[] {
    return this.getActionableTargets().filter((t) => t.type === type);
  }
}
