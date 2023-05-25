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

import { transformSync } from "@babel/core";
import { Visitor } from "./Visitor";
import {
  RootContext,
  Target,
  defaultBabelOptions,
} from "@syntest/analysis-javascript";
import * as path from "node:path";
import { copySync, outputFileSync } from "fs-extra";

export interface OutputObject {
  fileCoverage?: any;
  sourceMappingURL?: any;
}

export class Instrumenter {
  // TODO maybe the instrumenter should not be responsible for copying the files
  async instrumentAll(
    rootContext: RootContext,
    targets: Target[],
    temporaryInstrumentedDirectory: string
  ): Promise<void> {
    const absoluteRootPath = path.resolve(rootContext.rootPath);

    const destinationPath = path.resolve(
      temporaryInstrumentedDirectory,
      path.basename(absoluteRootPath)
    );

    // copy everything
    await copySync(absoluteRootPath, destinationPath);

    // overwrite the stuff that needs instrumentation

    const targetPaths = [...targets.values()].map((target) => target.path);

    for (const targetPath of targetPaths) {
      const source = rootContext.getSource(targetPath);
      const instrumentedSource = await this.instrument(source, targetPath);

      const _path = path
        .normalize(targetPath)
        .replace(absoluteRootPath, destinationPath);

      await outputFileSync(_path, instrumentedSource);
    }
  }

  async instrument(code: string, filename: string) {
    const options = JSON.parse(JSON.stringify(defaultBabelOptions));

    let output: OutputObject = {};

    options.filename = filename;
    options.plugins.push([
      ({ types }) => {
        const ee = new Visitor(types, filename, {
          coverageVariable: "__coverage__",
          // reportLogic: opts.reportLogic,
          // coverageGlobalScope: opts.coverageGlobalScope,
          // coverageGlobalScopeFunc: opts.coverageGlobalScopeFunc,
          ignoreClassMethods: [],
          // inputSourceMap
        });

        return {
          visitor: {
            Program: {
              enter: (path) => ee.enter(path),
              exit(path) {
                output = ee.exit(path);
              },
            },
          },
        };
      },
    ]);

    const codeMap = await transformSync(code, options);

    if (!output || !output.fileCoverage) {
      return code;
    }

    return codeMap.code;
  }
}
