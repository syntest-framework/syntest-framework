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

import { transformSync } from "@babel/core";
import * as t from "@babel/types";
import { AbstractSyntaxTreeFactory as FrameworkAbstractSyntaxTreeFactory } from "@syntest/analysis";
import { Result, success } from "@syntest/diagnostics";

import { defaultBabelOptions } from "./defaultBabelConfig";

export class AbstractSyntaxTreeFactory
  implements FrameworkAbstractSyntaxTreeFactory<t.Node>
{
  convert(filepath: string, source: string): Result<t.Node> {
    const options: unknown = JSON.parse(JSON.stringify(defaultBabelOptions));

    const codeMap = transformSync(source, options);

    return success(codeMap.ast);
  }
}
