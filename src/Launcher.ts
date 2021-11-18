/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Javascript.
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
  Archive,
  guessCWD,
  loadConfig,
  loadTargets,
  processConfig, properties,
  setupLogger,
  setupOptions,
} from "@syntest/framework";
import { JavaScriptTestCase } from "./testcase/JavaScriptTestCase";
import { TargetPool } from "./cache/TargetPool";
import { AbstractSyntaxTreeGenerator } from "./analysis/AbstractSyntaxTreeGenerator";
import { CustomInstrumenter } from "./instrumentation/CustomInstrumenter";
import * as schema from "@istanbuljs/schema"

export class Launcher {
  private readonly _program = "syntest-javascript";

  public async run() {
    await guessCWD(null)
    const [included, excluded] = await this.setup()
    const [archive, imports, dependencies] = await this.search(
      included,
      excluded
    );
    await this.finalize(archive, imports, dependencies);

    await this.exit()
  }

  private async setup(): Promise<[Map<string, string[]>, Map<string, string[]>]> {
    // Filesystem & Compiler Re-configuration
    const additionalOptions = {}; // TODO
    setupOptions(this._program, additionalOptions);

    const programArgs = process.argv.filter((a) => a.includes(this._program) || a.includes("bin.ts"))
    const index = process.argv.indexOf(programArgs[programArgs.length - 1])
    const args = process.argv.slice(index + 1);

    const config = loadConfig(args);
    processConfig(config, args);
    setupLogger();

    // TODO ui setup

    const [included, excluded] = await loadTargets();
    if (!included.size) {
      // TODO ui error
      console.log('nothing included')
      process.exit(1);
    }

    // TODO ui info messages

    return [included, excluded]
  }

  private async search(
    included: Map<string, string[]>,
    excluded: Map<string, string[]>
  ): Promise<
    [Archive<JavaScriptTestCase>, Map<string, string>, Map<string, string[]>]
    > {
    console.log(included)

    const opts = {

      autoWrap: true,
      coverageVariable: '__coverage__',
      embedSource: true,
      ignoreClassMethods: [],
      produceSourceMap: true,
      compact: true,
      preserveComments: true,
      esModules: [null, 'instrument'],
      parserPlugins: [
        'asyncGenerators',
        'bigInt',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'dynamicImport',
        'importMeta',
        'numericSeparator',
        'objectRestSpread',
        'optionalCatchBinding',
        'topLevelAwait'
      ]
    }
    const abstractSyntaxTreeGenerator = new AbstractSyntaxTreeGenerator(opts)
    const targetPool = new TargetPool(abstractSyntaxTreeGenerator)

    const instrumenter = new CustomInstrumenter(opts)

    // TODO setup temp folders

    // TODO instrument targets
    for (const _path of included.keys()) {
      const source = targetPool.getSource(_path)
      console.log('source')
      console.log(source)
      const instrumented = await instrumenter.instrumentSync(source, _path, {})
      console.log('instrumented')
      console.log(instrumented)

    }



    // TODO save instrumented files

    const finalArchive = new Archive<JavaScriptTestCase>();
    let finalImports: Map<string, string> = new Map();
    let finalDependencies: Map<string, string[]> = new Map();

    // TODO search targets

    return [finalArchive, finalImports, finalDependencies]
  }

  private async finalize(
    archive: Archive<JavaScriptTestCase>,
    imports: Map<string, string>,
    dependencies: Map<string, string[]>
  ): Promise<void> {

  }

  async exit(): Promise<void> {
    // Finish
    // TODO delete temp folders

    process.exit(0);
  }
}
