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
  Archive,
  BudgetManager,
  clearDirectory,
  configureTermination,
  CoverageWriter,
  createAlgorithmFromConfig,
  createDirectoryStructure,
  createTempDirectoryStructure,
  deleteTempDirectories,
  drawGraph,
  EvaluationBudget,
  getSeed,
  getUserInterface,
  guessCWD,
  IterationBudget,
  loadConfig,
  processConfig,
  Properties,
  RuntimeVariable,
  SearchTimeBudget,
  setupLogger,
  setupOptions,
  setUserInterface,
  StatisticsCollector,
  StatisticsSearchListener,
  SummaryWriter,
  TotalTimeBudget,
} from "@syntest/core";

import { JavaScriptTestCase } from "./testcase/JavaScriptTestCase";
import {
  JavaScriptTargetMetaData,
  JavaScriptTargetPool,
} from "./analysis/static/JavaScriptTargetPool";
import { AbstractSyntaxTreeGenerator } from "./analysis/static/ast/AbstractSyntaxTreeGenerator";
import * as path from "path";
import { TargetMapGenerator } from "./analysis/static/map/TargetMapGenerator";
import { JavaScriptSubject } from "./search/JavaScriptSubject";
import { JavaScriptSuiteBuilder } from "./testbuilding/JavaScriptSuiteBuilder";
import { JavaScriptDecoder } from "./testbuilding/JavaScriptDecoder";
import { JavaScriptRunner } from "./testcase/execution/JavaScriptRunner";
import { JavaScriptRandomSampler } from "./testcase/sampling/JavaScriptRandomSampler";
import { JavaScriptTreeCrossover } from "./search/crossover/JavaScriptTreeCrossover";
import {
  collectCoverageData,
  collectInitialVariables,
  collectStatistics,
} from "./utils/collection";
import Messages from "./ui/Messages";
import { JavaScriptCommandLineInterface } from "./ui/JavaScriptCommandLineInterface";
import { ControlFlowGraphGenerator } from "./analysis/static/cfg/ControlFlowGraphGenerator";
import { ImportGenerator } from "./analysis/static/dependency/ImportGenerator";
import { ExportGenerator } from "./analysis/static/dependency/ExportGenerator";
import { Export } from "./analysis/static/dependency/ExportVisitor";
import { TypeResolverInference } from "./analysis/static/types/resolving/logic/TypeResolverInference";
import { TypeResolverUnknown } from "./analysis/static/types/resolving/TypeResolverUnknown";
import { TypeResolver } from "./analysis/static/types/resolving/TypeResolver";
import { ActionType } from "./analysis/static/parsing/ActionType";
import { existsSync } from "fs";

export class Launcher {
  private readonly _program = "syntest-javascript";

  private coveredInPath = new Map<string, Archive<JavaScriptTestCase>>();
  private timings = [];

  public async run() {
    try {
      await guessCWD(null);
      const targetPool = await this.setup();
      const [archive, dependencies, exports] = await this.search(targetPool);
      await this.finalize(targetPool, archive, dependencies, exports);

      await this.exit();
    } catch (e) {
      console.log(e);
      console.trace(e);
    }
  }

  private async setup(): Promise<JavaScriptTargetPool> {
    this.timings.push({ time: Date.now(), what: "start setup" });
    // Filesystem & Compiler Re-configuration
    const additionalOptions = {
      incorporate_execution_information: {
        description: "Incorporate execution information",
        type: "boolean",
        default: true,
      },
      type_inference_mode: {
        description: "The type inference mode: [proportional, ranked, none]",
        type: "string",
        default: "proportional",
      },
      random_type_probability: {
        description:
          "The probability we use a random type regardless of the inferred type",
        type: "number",
        default: 0.1,
      },
    };
    setupOptions(
      this._program,
      <Record<string, unknown>[]>(<unknown>additionalOptions)
    );

    const programArgs = process.argv.filter(
      (a) => a.includes(this._program) || a.includes("bin.ts")
    );
    const index = process.argv.indexOf(programArgs[programArgs.length - 1]);
    const args = process.argv.slice(index + 1);

    const config = loadConfig(args);
    processConfig(config, args);
    setupLogger();

    if (existsSync(".syntest")) {
      await deleteTempDirectories();
    }

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
    // eslint-disable-next-line
    getUserInterface().report("version", [require("../package.json").version]);

    if (args.includes("--help") || args.includes("-h")) {
      getUserInterface().report("help", []);
      await this.exit();
    } // Exit if --help

    const abstractSyntaxTreeGenerator = new AbstractSyntaxTreeGenerator();
    const targetMapGenerator = new TargetMapGenerator();

    let typeResolver: TypeResolver;

    if (Properties["type_inference_mode"] === "none") {
      typeResolver = new TypeResolverUnknown();
    } else {
      typeResolver = new TypeResolverInference();
    }

    const controlFlowGraphGenerator = new ControlFlowGraphGenerator();
    const importGenerator = new ImportGenerator();
    const exportGenerator = new ExportGenerator();
    const targetPool = new JavaScriptTargetPool(
      abstractSyntaxTreeGenerator,
      targetMapGenerator,
      controlFlowGraphGenerator,
      importGenerator,
      exportGenerator,
      typeResolver
    );

    getUserInterface().report("header", ["GENERAL INFO"]);
    // TODO ui info messages

    getUserInterface().report("header", ["TARGETS"]);

    getUserInterface().report("property-set", [
      "Target Settings",
      <string>(
        (<unknown>[["Target Root Directory", Properties.target_root_directory]])
      ),
    ]);

    this.timings.push({ time: Date.now(), what: "start load targets" });

    await targetPool.loadTargets();

    this.timings.push({ time: Date.now(), what: "end load targets" });

    if (!targetPool.targets.length) {
      getUserInterface().error(
        `No targets where selected! Try changing the 'include' parameter`
      );
      await this.exit();
    }

    const names: string[] = [];

    targetPool.targets.forEach((target) =>
      names.push(
        `${path.basename(target.canonicalPath)} -> ${target.targetName}`
      )
    );
    getUserInterface().report("targets", names);

    getUserInterface().report("header", ["CONFIGURATION"]);

    getUserInterface().report("single-property", ["Seed", getSeed()]);
    getUserInterface().report("property-set", ["Budgets", <string>(<unknown>[
        ["Iteration Budget", `${Properties.iteration_budget} iterations`],
        ["Evaluation Budget", `${Properties.evaluation_budget} evaluations`],
        ["Search Time Budget", `${Properties.search_time} seconds`],
        ["Total Time Budget", `${Properties.total_time} seconds`],
      ])]);
    getUserInterface().report("property-set", ["Algorithm", <string>(<unknown>[
        ["Algorithm", Properties.algorithm],
        ["Population Size", Properties.population_size],
      ])]);
    getUserInterface().report("property-set", [
      "Variation Probabilities",
      <string>(<unknown>[
        ["Resampling", Properties.resample_gene_probability],
        ["Delta mutation", Properties.delta_mutation_probability],
        [
          "Re-sampling from chromosome",
          Properties.sample_existing_value_probability,
        ],
        ["Crossover", Properties.crossover_probability],
      ]),
    ]);

    getUserInterface().report("property-set", ["Sampling", <string>(<unknown>[
        ["Max Depth", Properties.max_depth],
        ["Explore Illegal Values", Properties.explore_illegal_values],
        ["Sample FUNCTION Result as Argument", Properties.sample_func_as_arg],
        ["Crossover", Properties.crossover_probability],
      ])]);

    getUserInterface().report("property-set", ["Type Inference", <string>(<
        unknown
      >[
        [
          "Incorporate Execution Information",
          Properties["incorporate_execution_information"],
        ],
        ["Type Inference Mode", Properties["type_inference_mode"]],
        ["Random Type Probability", Properties["random_type_probability"]],
      ])]);
    this.timings.push({ time: Date.now(), what: "end setup" });
    return targetPool;
  }

  private async search(
    targetPool: JavaScriptTargetPool
  ): Promise<[Archive<JavaScriptTestCase>, Map<string, Export[]>, Export[]]> {
    this.timings.push({ time: Date.now(), what: "start search" });

    this.timings.push({ time: Date.now(), what: "start instrumenting" });
    await targetPool.prepareAndInstrument();
    this.timings.push({ time: Date.now(), what: "end instrumenting" });

    this.timings.push({ time: Date.now(), what: "start type resolving" });
    targetPool.scanTargetRootDirectory();
    this.timings.push({ time: Date.now(), what: "end type resolving" });

    const finalArchive = new Archive<JavaScriptTestCase>();
    const finalDependencies: Map<string, Export[]> = new Map();
    const finalExports: Export[] = [];

    this.timings.push({ time: Date.now(), what: "start testing targets" });

    for (const target of targetPool.targets) {
      const archive = await this.testTarget(
        targetPool,
        target.canonicalPath,
        targetPool.getTargetMap(target.canonicalPath).get(target.targetName)
      );

      const dependencies = targetPool.getDependencies(target.canonicalPath);
      finalArchive.merge(archive);

      finalDependencies.set(target.targetName, dependencies);
      finalExports.push(...targetPool.getExports(target.canonicalPath));
    }
    this.timings.push({ time: Date.now(), what: "end testing targets" });

    this.timings.push({ time: Date.now(), what: "end search" });

    return [finalArchive, finalDependencies, finalExports];
  }

  private async testTarget(
    targetPool: JavaScriptTargetPool,
    targetPath: string,
    targetMeta: JavaScriptTargetMetaData
  ): Promise<Archive<JavaScriptTestCase>> {
    const cfg = targetPool.getCFG(targetPath, targetMeta.name);

    if (Properties.draw_cfg) {
      drawGraph(
        cfg,
        path.join(
          Properties.cfg_directory,
          // TODO also support .ts
          `${path.basename(targetPath, ".js").split(".")[0]}.svg`
        )
      );
    }

    const functionMap = targetPool.getFunctionMapSpecific(
      targetPath,
      targetMeta.name
    );

    // couple types to parameters
    // TODO do this type matching already in the target visitor
    for (const func of functionMap.values()) {
      for (const param of func.parameters) {
        if (func.type === ActionType.FUNCTION) {
          param.typeProbabilityMap = targetPool.typeResolver.getTyping(
            func.scope,
            param.name
          );
        } else if (
          func.type === ActionType.METHOD ||
          func.type === ActionType.CONSTRUCTOR
        ) {
          param.typeProbabilityMap = targetPool.typeResolver.getTyping(
            func.scope,
            param.name
          );
        } else {
          throw new Error(
            `Unimplemented action identifierDescription ${func.type}`
          );
        }
      }
      // TODO return types
    }

    const currentSubject = new JavaScriptSubject(
      path.basename(targetPath),
      targetMeta,
      cfg,
      [...functionMap.values()]
    );

    if (!currentSubject.getPossibleActions().length) {
      // report skipped
      return new Archive();
    }

    const dependencies = targetPool.getDependencies(targetPath);
    const dependencyMap = new Map<string, Export[]>();
    dependencyMap.set(targetMeta.name, dependencies);
    const exports = targetPool.getExports(targetPath);

    const decoder = new JavaScriptDecoder(targetPool, dependencyMap, exports);
    const runner = new JavaScriptRunner(decoder);

    const suiteBuilder = new JavaScriptSuiteBuilder(decoder, runner);

    // TODO constant pool

    const sampler = new JavaScriptRandomSampler(currentSubject, targetPool);
    const crossover = new JavaScriptTreeCrossover();
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

    if (this.coveredInPath.has(targetPath)) {
      archive.merge(this.coveredInPath.get(targetPath));
      this.coveredInPath.set(targetPath, archive);
    } else {
      this.coveredInPath.set(targetPath, archive);
    }

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

    collector.recordVariable(
      RuntimeVariable.INSTRUMENTATION_TIME,
      `${
        (this.timings.find((x) => x.what === "end instrumenting").time -
          this.timings.find((x) => x.what === "start instrumenting").time) /
        1000
      }`
    );

    collector.recordVariable(
      RuntimeVariable.TYPE_RESOLVING_TIME,
      `${
        (this.timings.find((x) => x.what === "end type resolving").time -
          this.timings.find((x) => x.what === "start type resolving").time) /
        1000
      }`
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
    targetPool: JavaScriptTargetPool,
    archive: Archive<JavaScriptTestCase>,
    dependencies: Map<string, Export[]>,
    exports: Export[]
  ): Promise<void> {
    const testDir = path.resolve(Properties.final_suite_directory);
    await clearDirectory(testDir);

    const decoder = new JavaScriptDecoder(targetPool, dependencies, exports);
    const runner = new JavaScriptRunner(decoder);

    const suiteBuilder = new JavaScriptSuiteBuilder(decoder, runner);

    // TODO fix hardcoded paths

    const reducedArchive = suiteBuilder.reduceArchive(archive);

    let paths = await suiteBuilder.createSuite(
      reducedArchive,
      "../instrumented",
      Properties.temp_test_directory,
      true,
      false
    );
    await suiteBuilder.runSuite(paths, false, targetPool);

    // reset states
    await suiteBuilder.clearDirectory(Properties.temp_test_directory);

    // run with assertions and report results
    for (const key of reducedArchive.keys()) {
      await suiteBuilder.gatherAssertions(reducedArchive.get(key));
    }
    paths = await suiteBuilder.createSuite(
      reducedArchive,
      "../instrumented",
      Properties.temp_test_directory,
      false,
      true
    );
    await suiteBuilder.runSuite(paths, true, targetPool);

    const originalSourceDir = path
      .join(
        "../../",
        path.relative(process.cwd(), Properties.target_root_directory)
      )
      .replace(path.basename(Properties.target_root_directory), "");

    // create final suite
    await suiteBuilder.createSuite(
      reducedArchive,
      originalSourceDir,
      Properties.final_suite_directory,
      false,
      true
    );
  }

  async exit(): Promise<void> {
    // Finish
    await deleteTempDirectories();

    process.exit(0);
  }
}
