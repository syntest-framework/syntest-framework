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
  createTempDirectoryStructure,
  drawGraph,
  getUserInterface,
  createAlgorithmFromConfig,
  IterationBudget,
  EvaluationBudget,
  SearchTimeBudget,
  TotalTimeBudget,
  BudgetManager,
  configureTermination,
  StatisticsCollector,
  StatisticsSearchListener, SummaryWriter, CoverageWriter, clearDirectory, setUserInterface, getSeed,
} from "@syntest/framework";

import { JavaScriptTestCase } from "./testcase/JavaScriptTestCase";
import { JavaScriptTargetMetaData, JavaScriptTargetPool } from "./analysis/static/JavaScriptTargetPool";
import { AbstractSyntaxTreeGenerator } from "./analysis/static/ast/AbstractSyntaxTreeGenerator";
import { Instrumenter } from "./instrumentation/Instrumenter";
import * as path from "path";
import { TargetMapGenerator } from "./analysis/static/map/TargetMapGenerator";
import { JavaScriptSubject } from "./search/JavaScriptSubject";
import { JavaScriptSuiteBuilder } from "./testbuilding/JavaScriptSuiteBuilder";
import { JavaScriptDecoder } from "./testbuilding/JavaScriptDecoder";
import { JavaScriptRunner } from "./testcase/execution/JavaScriptRunner";
import { JavaScriptRandomSampler } from "./testcase/sampling/JavaScriptRandomSampler";
import { JavaScriptTreeCrossover } from "./search/crossover/JavaScriptTreeCrossover";
import { collectCoverageData, collectInitialVariables, collectStatistics } from "./utils/collection";
import Messages from "./ui/Messages";
import { JavaScriptCommandLineInterface } from "./ui/JavaScriptCommandLineInterface";
import { ControlFlowGraphGenerator } from "./analysis/static/cfg/ControlFlowGraphGenerator";
import { ImportGenerator } from "./analysis/static/dependency/ImportGenerator";
import { ExportGenerator } from "./analysis/static/dependency/ExportGenerator";
import { Export } from "./analysis/static/dependency/ExportVisitor";

export class Launcher {
  private readonly _program = "syntest-javascript";

  public async run() {
    try {
      await guessCWD(null);
      const targetPool = await this.setup();
      const [archive, imports, dependencies, exports] = await this.search(targetPool);
      await this.finalize(archive, imports, dependencies, exports);

      await this.exit();
    } catch (e) {
      console.log(e)
      console.trace(e)
    }
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

    const messages = new Messages();
    setUserInterface(
      new JavaScriptCommandLineInterface(
        Properties.console_log_level === "silent",
        Properties.console_log_level === "verbose",
        messages
      )
    );

    getUserInterface().report("clear", []);
    getUserInterface().report("asciiArt", ["Syntest"]);
    getUserInterface().report("version", [require("../package.json").version]);

    if (args.includes("--help") || args.includes("-h")) {
      getUserInterface().report("help", []);
      await this.exit();
    } // Exit if --help

    const abstractSyntaxTreeGenerator = new AbstractSyntaxTreeGenerator();
    const targetMapGenerator = new TargetMapGenerator();
    const controlFlowGraphGenerator = new ControlFlowGraphGenerator()
    const importGenerator = new ImportGenerator()
    const exportGenerator = new ExportGenerator()
    const targetPool = new JavaScriptTargetPool(
      abstractSyntaxTreeGenerator,
      targetMapGenerator,
      controlFlowGraphGenerator,
      importGenerator,
      exportGenerator
    );


    getUserInterface().report("header", ["GENERAL INFO"]);
    // TODO ui info messages


    getUserInterface().report("header", ["TARGETS"]);

    await loadTargets(targetPool);
    if (!targetPool.included.length) {
      getUserInterface().error(
        `No targets where selected! Try changing the 'include' parameter`
      );
      await this.exit();
    }

    let names = [];

    targetPool.included.forEach((targetFile) =>
      names.push(
        `${path.basename(
          targetFile.canonicalPath
        )} -> ${targetFile.targets.join(", ")}`
      )
    );
    getUserInterface().report("targets", names);

    names = [];
    targetPool.excluded.forEach((targetFile) =>
      names.push(
        `${path.basename(
          targetFile.canonicalPath
        )} -> ${targetFile.targets.join(", ")}`
      )
    );
    getUserInterface().report("skip-files", names);

    getUserInterface().report("header", ["CONFIGURATION"]);

    getUserInterface().report("single-property", ["Seed", getSeed()]);
    getUserInterface().report("property-set", [
      "Budgets",
      [
        ["Iteration Budget", `${Properties.iteration_budget} iterations`],
        ["Evaluation Budget", `${Properties.evaluation_budget} evaluations`],
        ["Search Time Budget", `${Properties.search_time} seconds`],
        ["Total Time Budget", `${Properties.total_time} seconds`],
      ],
    ]);
    getUserInterface().report("property-set", [
      "Algorithm",
      [
        ["Algorithm", Properties.algorithm],
        ["Population Size", Properties.population_size],
      ],
    ]);
    getUserInterface().report("property-set", [
      "Variation Probabilities",
      [
        ["Resampling", Properties.resample_gene_probability],
        ["Delta mutation", Properties.delta_mutation_probability],
        [
          "Re-sampling from chromosome",
          Properties.sample_existing_value_probability,
        ],
        ["Crossover", Properties.crossover_probability],
      ],
    ]);

    getUserInterface().report("property-set", [
      "Sampling",
      [
        ["Max Depth", Properties.max_depth],
        ["Explore Illegal Values", Properties.explore_illegal_values],
        ["Sample Function Result as Argument", Properties.sample_func_as_arg],
        ["Crossover", Properties.crossover_probability],
      ],
    ]);

    return targetPool;
  }

  private async search(
    targetPool: JavaScriptTargetPool
  ): Promise<
    [Archive<JavaScriptTestCase>, Map<string, string>, Map<string, Export[]>, Export[]]
  > {
    const excludedSet = new Set(
      ...targetPool.excluded.map((x) => x.canonicalPath)
    );

    const instrumenter = new Instrumenter();
    // TODO setup temp folders

    const instrumentedTargets: TargetFile[] = [];

    for (const targetFile of targetPool.included) {
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
    let finalDependencies: Map<string, Export[]> = new Map();
    let finalExports: Export[] = []

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
          targetMap.get(target)
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
        finalExports.push(...targetPool.getExports(targetFile.canonicalPath))
      }
    }

    return [finalArchive, finalImports, finalDependencies, finalExports];
  }

  private async testTarget(
    targetPool: JavaScriptTargetPool,
    targetPath: string,
    targetMeta: JavaScriptTargetMetaData
  ): Promise<Archive<JavaScriptTestCase>> {
    const cfg = targetPool.getCFG(targetPath, targetMeta.name);

    if (Properties.draw_cfg || true) {
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
    const functionMap = targetPool.getFunctionMap(targetPath, targetMeta.name)

    console.log(functionMap)
    const currentSubject = new JavaScriptSubject(
      path.basename(targetPath),
      targetMeta,
      cfg,
      [...functionMap.values()],
    )

    if (!currentSubject.getPossibleActions().length) {
      // report skipped
      return new Archive();
    }

    const [importsMap, dependencyMap] = targetPool.getImportDependencies(
      targetPath,
      targetMeta.name
    );

    const exports = targetPool.getExports(targetPath)

    const decoder = new JavaScriptDecoder(importsMap, dependencyMap, exports)
    const suiteBuilder = new JavaScriptSuiteBuilder(decoder)
    const runner = new JavaScriptRunner(suiteBuilder)

    // TODO constant pool

    const sampler = new JavaScriptRandomSampler(currentSubject)
    const crossover = new JavaScriptTreeCrossover()
    const algorithm = createAlgorithmFromConfig(sampler, runner, crossover);

    await suiteBuilder.clearDirectory(Properties.temp_test_directory);

    // allocate budget manager
    const iterationBudget = new IterationBudget(Properties.iteration_budget);
    const evaluationBudget = new EvaluationBudget();
    const searchBudget = new SearchTimeBudget(Properties.search_time);
    const totalTimeBudget = new TotalTimeBudget(Properties.total_time);
    const budgetManager = new BudgetManager();
    budgetManager.addBudget(iterationBudget);
    budgetManager.addBudget(evaluationBudget);
    budgetManager.addBudget(searchBudget);
    budgetManager.addBudget(totalTimeBudget);


    // Termination
    const terminationManager = configureTermination();

    // Collector
    const collector = new StatisticsCollector(totalTimeBudget);
    collectInitialVariables(collector, currentSubject, targetPath);

    // Statistics listener
    const statisticsSearchListener = new StatisticsSearchListener(collector);
    algorithm.addListener(statisticsSearchListener);

    // This searches for a covering population
    const archive = await algorithm.search(
      currentSubject,
      budgetManager,
      terminationManager
    );

    // Gather statistics after the search
    collectStatistics(
      collector,
      currentSubject,
      archive,
      totalTimeBudget,
      searchBudget,
      iterationBudget,
      evaluationBudget
    );

    collectCoverageData(collector, archive, "branch");
    collectCoverageData(collector, archive, "statement");
    collectCoverageData(collector, archive, "function");

    const statisticsDirectory = path.resolve(Properties.statistics_directory);

    const summaryWriter = new SummaryWriter();
    summaryWriter.write(collector, statisticsDirectory + "/statistics.csv");

    const coverageWriter = new CoverageWriter();
    coverageWriter.write(collector, statisticsDirectory + "/coverage.csv");

    await clearDirectory(Properties.temp_test_directory);
    await clearDirectory(Properties.temp_log_directory);

    return archive;
  }

  private async finalize(
    archive: Archive<JavaScriptTestCase>,
    imports: Map<string, string>,
    dependencies: Map<string, Export[]>,
    exports: Export[]
  ): Promise<void> {
    const testDir = path.resolve(Properties.final_suite_directory);
    await clearDirectory(testDir);

    const decoder = new JavaScriptDecoder(
      imports,
      dependencies,
      exports
    );

    const suiteBuilder = new JavaScriptSuiteBuilder(decoder);

    await suiteBuilder.createSuite(archive);

    // Run tests
    try {
      // TODO
    } catch (e) {
      getUserInterface().error(e);
      console.trace(e);
    }

    // Run Istanbul
    // TODO
  }

  async exit(): Promise<void> {
    // Finish
    await deleteTempDirectories();

    process.exit(0);
  }
}
