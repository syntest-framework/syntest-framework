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
  processConfig,
  saveTempFiles,
  setupLogger,
  setupOptions,
  TargetFile,
  getCommonBasePath,
  Properties,
  deleteTempDirectories,
  createDirectoryStructure,
  createTempDirectoryStructure, drawGraph, getUserInterface,
} from "@syntest/framework";

import { JavaScriptTestCase } from "./testcase/JavaScriptTestCase";
import { JavaScriptTargetPool } from "./analysis/static/JavaScriptTargetPool";
import { AbstractSyntaxTreeGenerator } from "./analysis/static/ast/AbstractSyntaxTreeGenerator";
import { Instrumenter } from "./instrumentation/Instrumenter";
import * as path from "path";
import { TargetMapGenerator } from "./analysis/static/map/TargetMapGenerator";
import { JavaScriptSubject } from "./search/JavaScriptSubject";

export class Launcher {
  private readonly _program = "syntest-javascript";

  public async run() {
    await guessCWD(null);
    const targetPool = await this.setup();
    const [archive, imports, dependencies] = await this.search(targetPool);
    await this.finalize(archive, imports, dependencies);

    await this.exit();
  }

  private async setup(): Promise<JavaScriptTargetPool> {
    // Filesystem & Compiler Re-configuration
    const additionalOptions = {}; // TODO
    setupOptions(this._program, additionalOptions);

    const programArgs = process.argv.filter(
      (a) => a.includes(this._program) || a.includes("bin.ts")
    );
    const index = process.argv.indexOf(programArgs[programArgs.length - 1]);
    const args = process.argv.slice(index + 1);

    const config = loadConfig(args);
    processConfig(config, args);
    setupLogger();
    await createDirectoryStructure();
    await createTempDirectoryStructure();

    // TODO ui setup

    const abstractSyntaxTreeGenerator = new AbstractSyntaxTreeGenerator();
    const targetMapGenerator = new TargetMapGenerator();
    const targetPool = new JavaScriptTargetPool(
      abstractSyntaxTreeGenerator,
      targetMapGenerator
    );

    await loadTargets(targetPool);
    if (!targetPool.included.length) {
      // TODO ui error
      console.log("nothing included");
      process.exit(1);
    }

    // TODO ui info messages

    return targetPool;
  }

  private async search(
    targetPool: JavaScriptTargetPool
  ): Promise<
    [Archive<JavaScriptTestCase>, Map<string, string>, Map<string, string[]>]
  > {
    const excludedSet = new Set(
      ...targetPool.excluded.map((x) => x.canonicalPath)
    );

    const instrumenter = new Instrumenter();
    // TODO setup temp folders

    const instrumentedTargets: TargetFile[] = [];

    for (const targetFile of targetPool.targetFiles) {
      const instrumentedSource = await instrumenter.instrument(
        targetFile.source,
        targetFile.canonicalPath
      );

      instrumentedTargets.push({
        source: instrumentedSource,
        canonicalPath: targetFile.canonicalPath,
        relativePath: targetFile.relativePath,
        targets: targetFile.targets,
      });
    }

    const commonBasePath = getCommonBasePath(instrumentedTargets);

    // save instrumented files to
    await saveTempFiles(
      instrumentedTargets,
      commonBasePath,
      Properties.temp_instrumented_directory
    );

    const finalArchive = new Archive<JavaScriptTestCase>();
    let finalImports: Map<string, string> = new Map();
    let finalDependencies: Map<string, string[]> = new Map();

    // TODO search targets
    for (const targetFile of targetPool.included) {
      const includedTargets = targetFile.targets;

      const targetMap = targetPool.getTargetMap(targetFile.canonicalPath);
      for (const target of targetMap.keys()) {
        // check if included
        if (
          !includedTargets.includes("*") &&
          !includedTargets.includes(target)
        ) {
          continue;
        }

        // check if excluded
        if (excludedSet.has(targetFile.canonicalPath)) {
          const excludedTargets = targetPool.excluded.find(
            (x) => x.canonicalPath === targetFile.canonicalPath
          ).targets;
          if (
            excludedTargets.includes("*") ||
            excludedTargets.includes(target)
          ) {
            continue;
          }
        }

        const archive = await this.testTarget(
          targetPool,
          targetFile.canonicalPath,
          target
        );
        const [importsMap, dependencyMap] = targetPool.getImportDependencies(
          targetFile.canonicalPath,
          target
        );
        finalArchive.merge(archive);

        finalImports = new Map([
          ...Array.from(finalImports.entries()),
          ...Array.from(importsMap.entries()),
        ]);
        finalDependencies = new Map([
          ...Array.from(finalDependencies.entries()),
          ...Array.from(dependencyMap.entries()),
        ]);
      }
    }

    return [finalArchive, finalImports, finalDependencies];
  }

  private async testTarget(
    targetPool: JavaScriptTargetPool,
    targetPath: string,
    target: string
  ): Promise<Archive<JavaScriptTestCase>> {
    const cfg = targetPool.getCFG(targetPath, target);

    if (Properties.draw_cfg) {
      drawGraph(
        cfg,
        path.join(
          Properties.cfg_directory,
          // TODO also support .ts
          `${path.basename(targetPath, '.js').split(".")[0]}.svg`
        )
      );
    }

    const ast = targetPool.getAST(targetPath)
    const functionMap = targetPool.getFunctionMap(targetPath, target)

    const currentSubject = new JavaScriptSubject(
      path.basename(targetPath),
      target,
      cfg,
      [...functionMap.values()]
    )

    if (!currentSubject.getPossibleActions().length) {
      return new Archive();
    }

    const [importsMap, dependencyMap] = targetPool.getImportDependencies(
      targetPath,
      target
    );

    // const suiteBuilder = new


  }

  private async finalize(
    archive: Archive<JavaScriptTestCase>,
    imports: Map<string, string>,
    dependencies: Map<string, string[]>
  ): Promise<void> {}

  async exit(): Promise<void> {
    // Finish
    await deleteTempDirectories();

    process.exit(0);
  }
}
