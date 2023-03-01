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
  ArgumentsObject,
  BudgetManager,
  clearDirectory,
  CONFIG,
  CoverageWriter,
  createDirectoryStructure,
  createSearchAlgorithmFromConfig,
  createTempDirectoryStructure,
  createTerminationManagerFromConfig,
  deleteTempDirectories,
  EvaluationBudget,
  getSeed,
  getUserInterface,
  IterationBudget,
  Launcher,
  RuntimeVariable,
  SearchTimeBudget,
  setupLogger,
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
import { AbstractSyntaxTreeGenerator } from "@syntest/ast-javascript";
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
import { ControlFlowGraphGenerator } from "@syntest/cfg-javascript";
import { ImportGenerator } from "./analysis/static/dependency/ImportGenerator";
import { ExportGenerator } from "./analysis/static/dependency/ExportGenerator";
import { Export } from "./analysis/static/dependency/ExportVisitor";
import { TypeResolverInference } from "./analysis/static/types/resolving/logic/TypeResolverInference";
import { TypeResolverUnknown } from "./analysis/static/types/resolving/TypeResolverUnknown";
import { TypeResolver } from "./analysis/static/types/resolving/TypeResolver";
import { ActionType } from "./analysis/static/parsing/ActionType";
import { existsSync } from "fs";
import Yargs = require("yargs");

export interface JavaScriptArguments extends ArgumentsObject {
  incorporateExecutionInformation: boolean;
  typeInferenceMode: string;
  randomTypeProbability: number;
}

export class JavaScriptLauncher extends Launcher<JavaScriptTestCase> {
  private exports: Export[];
  private dependencyMap: Map<string, Export[]>;

  private coveredInPath = new Map<string, Archive<JavaScriptTestCase>>();

  addOptions<Y>(yargs: Yargs.Argv<Y>) {
    return yargs
      .options("incorporate-execution-information", {
        alias: [],
        default: true,
        description: "Incorporate execution information.",
        group: "Type Inference Options:",
        hidden: false,
        type: "boolean",
      })
      .options("type-inference-mode", {
        alias: [],
        default: "proportional",
        description: "The type inference mode: [proportional, ranked, none].",
        group: "Type Inference Options:",
        hidden: false,
        type: "string",
      })
      .options("random-type-probability", {
        alias: [],
        default: 0.1,
        description:
          "The probability we use a random type regardless of the inferred type.",
        group: "Type Inference Options:",
        hidden: false,
        type: "number",
      });
  }
  async initialize(): Promise<void> {
    setupLogger();
    if (existsSync(".syntest")) {
      await deleteTempDirectories();
    }

    await createDirectoryStructure();
    await createTempDirectoryStructure();

    const messages = new Messages();
    setUserInterface(
      new JavaScriptCommandLineInterface(
        CONFIG.consoleLogLevel === "silent",
        CONFIG.consoleLogLevel === "verbose",
        messages
      )
    );

    getUserInterface().report("clear", []);
    getUserInterface().report("asciiArt", ["Syntest"]);
    // eslint-disable-next-line
    getUserInterface().report("version", [require("../package.json").version]);

    const abstractSyntaxTreeGenerator = new AbstractSyntaxTreeGenerator();
    const targetMapGenerator = new TargetMapGenerator();

    let typeResolver: TypeResolver;

    if ((<JavaScriptArguments>CONFIG).typeInferenceMode === "none") {
      typeResolver = new TypeResolverUnknown();
    } else {
      typeResolver = new TypeResolverInference();
    }

    const controlFlowGraphGenerator = new ControlFlowGraphGenerator();
    const importGenerator = new ImportGenerator();
    const exportGenerator = new ExportGenerator();
    const targetPool = new JavaScriptTargetPool(
      this.eventManager,
      abstractSyntaxTreeGenerator,
      targetMapGenerator,
      controlFlowGraphGenerator,
      importGenerator,
      exportGenerator,
      typeResolver
    );
    this.programState.targetPool = targetPool;

    getUserInterface().report("header", ["GENERAL INFO"]);
    // TODO ui info messages

    getUserInterface().report("header", ["TARGETS"]);

    getUserInterface().report("property-set", [
      "Target Settings",
      <string>(
        (<unknown>[["Target Root Directory", CONFIG.targetRootDirectory]])
      ),
    ]);
  }

  async preprocess(): Promise<void> {
    this.programState.targetPool.loadTargets();

    if (!this.programState.targetPool.targets.length) {
      // Shut server down
      getUserInterface().error(
        `No targets where selected! Try changing the 'include' parameter`
      );
      await this.exit();
    }

    const names: string[] = [];

    this.programState.targetPool.targets.forEach((target) =>
      names.push(
        `${path.basename(target.canonicalPath)} -> ${target.targetName}`
      )
    );
    getUserInterface().report("targets", names);

    getUserInterface().report("header", ["CONFIGURATION"]);

    getUserInterface().report("single-property", ["Seed", getSeed()]);
    getUserInterface().report("property-set", ["Budgets", <string>(<unknown>[
        ["Iteration Budget", `${CONFIG.iterationBudget} iterations`],
        ["Evaluation Budget", `${CONFIG.evaluationBudget} evaluations`],
        ["Search Time Budget", `${CONFIG.searchTimeBudget} seconds`],
        ["Total Time Budget", `${CONFIG.totalTimeBudget} seconds`],
      ])]);
    getUserInterface().report("property-set", ["Algorithm", <string>(<unknown>[
        ["Algorithm", CONFIG.algorithm],
        ["Population Size", CONFIG.populationSize],
      ])]);
    getUserInterface().report("property-set", [
      "Variation Probabilities",
      <string>(<unknown>[
        ["Resampling", CONFIG.resampleGeneProbability],
        ["Delta mutation", CONFIG.deltaMutationProbability],
        ["Re-sampling from chromosome", CONFIG.sampleExistingValueProbability],
        ["Crossover", CONFIG.crossoverProbability],
      ]),
    ]);

    getUserInterface().report("property-set", ["Sampling", <string>(<unknown>[
        ["Max Depth", CONFIG.maxDepth],
        ["Explore Illegal Values", CONFIG.exploreIllegalValues],
        [
          "Sample FUNCTION Result as Argument",
          CONFIG.sampleFunctionOutputAsArgument,
        ],
        ["Crossover", CONFIG.crossoverProbability],
      ])]);

    getUserInterface().report("property-set", ["Type Inference", <string>(<
        unknown
      >[
        [
          "Incorporate Execution Information",
          (<JavaScriptArguments>CONFIG).incorporateExecutionInformation,
        ],
        [
          "Type Inference Mode",
          (<JavaScriptArguments>CONFIG).typeInferenceMode,
        ],
        [
          "Random Type Probability",
          (<JavaScriptArguments>CONFIG).randomTypeProbability,
        ],
      ])]);

    await (<JavaScriptTargetPool>(
      this.programState.targetPool
    )).prepareAndInstrument();
    await (<JavaScriptTargetPool>(
      this.programState.targetPool
    )).scanTargetRootDirectory();
  }

  async process(): Promise<void> {
    this.programState.archive = new Archive<JavaScriptTestCase>();
    this.exports = [];
    this.dependencyMap = new Map();

    for (const target of this.programState.targetPool.targets) {
      const archive = await this.testTarget(
        <JavaScriptTargetPool>this.programState.targetPool,
        target.canonicalPath,
        (<JavaScriptTargetPool>this.programState.targetPool)
          .getTargetMap(target.canonicalPath)
          .get(target.targetName)
      );

      const dependencies = (<JavaScriptTargetPool>(
        this.programState.targetPool
      )).getDependencies(target.canonicalPath);
      this.programState.archive.merge(archive);

      this.dependencyMap.set(target.targetName, dependencies);
      this.exports.push(
        ...(<JavaScriptTargetPool>this.programState.targetPool).getExports(
          target.canonicalPath
        )
      );
    }
  }

  async postprocess(): Promise<void> {
    const testDir = path.resolve(CONFIG.finalSuiteDirectory);
    await clearDirectory(testDir);

    const decoder = new JavaScriptDecoder(
      <JavaScriptTargetPool>this.programState.targetPool,
      this.dependencyMap,
      this.exports
    );
    const runner = new JavaScriptRunner(decoder);

    const suiteBuilder = new JavaScriptSuiteBuilder(decoder, runner);

    // TODO fix hardcoded paths

    const reducedArchive = suiteBuilder.reduceArchive(
      this.programState.archive
    );

    let paths = await suiteBuilder.createSuite(
      reducedArchive,
      "../instrumented",
      CONFIG.tempTestDirectory,
      true,
      false
    );
    await suiteBuilder.runSuite(
      paths,
      false,
      <JavaScriptTargetPool>this.programState.targetPool
    );

    // reset states
    await suiteBuilder.clearDirectory(CONFIG.tempTestDirectory);

    // run with assertions and report results
    for (const key of reducedArchive.keys()) {
      await suiteBuilder.gatherAssertions(reducedArchive.get(key));
    }
    paths = await suiteBuilder.createSuite(
      reducedArchive,
      "../instrumented",
      CONFIG.tempTestDirectory,
      false,
      true
    );
    await suiteBuilder.runSuite(
      paths,
      true,
      <JavaScriptTargetPool>this.programState.targetPool
    );

    const originalSourceDir = path
      .join("../../", path.relative(process.cwd(), CONFIG.targetRootDirectory))
      .replace(path.basename(CONFIG.targetRootDirectory), "");

    // create final suite
    await suiteBuilder.createSuite(
      reducedArchive,
      originalSourceDir,
      CONFIG.finalSuiteDirectory,
      false,
      true
    );
  }

  private async testTarget(
    targetPool: JavaScriptTargetPool,
    targetPath: string,
    targetMeta: JavaScriptTargetMetaData
  ): Promise<Archive<JavaScriptTestCase>> {
    const cfg = targetPool.getCFG(targetPath, targetMeta.name);

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
    const algorithm = createSearchAlgorithmFromConfig(
      this.eventManager,
      this.pluginManager,
      null,
      sampler,
      runner,
      crossover
    );

    await suiteBuilder.clearDirectory(CONFIG.tempTestDirectory);

    // allocate budget manager
    const iterationBudget = new IterationBudget(CONFIG.iterationBudget);
    const evaluationBudget = new EvaluationBudget();
    const searchBudget = new SearchTimeBudget(CONFIG.searchTimeBudget);
    const totalTimeBudget = new TotalTimeBudget(CONFIG.totalTimeBudget);
    const budgetManager = new BudgetManager();
    budgetManager.addBudget(iterationBudget);
    budgetManager.addBudget(evaluationBudget);
    budgetManager.addBudget(searchBudget);
    budgetManager.addBudget(totalTimeBudget);

    // Termination
    const terminationManager = createTerminationManagerFromConfig(
      this.pluginManager
    );

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

    collector.recordVariable(RuntimeVariable.INSTRUMENTATION_TIME, `unknown`);

    collector.recordVariable(RuntimeVariable.TYPE_RESOLVING_TIME, `unknown`);

    collectCoverageData(collector, archive, "branch");
    collectCoverageData(collector, archive, "statement");
    collectCoverageData(collector, archive, "function");

    const statisticsDirectory = path.resolve(CONFIG.statisticsDirectory);

    const summaryWriter = new SummaryWriter();
    summaryWriter.write(collector, statisticsDirectory + "/statistics.csv");

    const coverageWriter = new CoverageWriter();
    coverageWriter.write(collector, statisticsDirectory + "/coverage.csv");

    await clearDirectory(CONFIG.tempTestDirectory);
    await clearDirectory(CONFIG.tempLogDirectory);

    return archive;
  }

  async exit(): Promise<void> {
    // Finish
    await deleteTempDirectories();

    process.exit(0);
  }
}
