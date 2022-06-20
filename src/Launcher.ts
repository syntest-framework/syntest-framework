/*
 * Copyright 2020-2022 Delft University of Technology and SynTest contributors
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
  SearchTimeBudget,
  setupLogger,
  setupOptions,
  setUserInterface,
  StatisticsCollector,
  StatisticsSearchListener,
  SummaryWriter,
  TotalTimeBudget,
} from "@syntest/framework";

import { JavaScriptTestCase } from "./testcase/JavaScriptTestCase";
import { JavaScriptTargetMetaData, JavaScriptTargetPool } from "./analysis/static/JavaScriptTargetPool";
import { AbstractSyntaxTreeGenerator } from "./analysis/static/ast/AbstractSyntaxTreeGenerator";
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
import { Runner } from "mocha";
import { TypeResolverInference } from "./analysis/static/types/resolving/logic/TypeResolverInference";
import { TypeResolverUnknown } from "./analysis/static/types/resolving/TypeResolverUnknown";
import { TypeResolver } from "./analysis/static/types/resolving/TypeResolver";
import { ActionType } from "./analysis/static/parsing/ActionType";
import { existsSync } from "fs";

const originalrequire = require("original-require");
const Mocha = require('mocha')

export class Launcher {
  private readonly _program = "syntest-javascript";

  private coveredInPath = new Map<string, Archive<JavaScriptTestCase>>()

  public async run() {
    try {
      await guessCWD(null);
      const targetPool = await this.setup();
      const [archive, dependencies, exports] = await this.search(targetPool);
      await this.finalize(targetPool, archive, dependencies, exports);

      await this.exit();
    } catch (e) {
      console.log(e)
      console.trace(e)
    }
  }

  private async setup(): Promise<JavaScriptTargetPool> {
    // Filesystem & Compiler Re-configuration
    const additionalOptions = {
      incorporate_execution_information: {
        description: "Incorporate execution information",
        type: "boolean",
        default: true,
      },
      // TODO maybe remove the first one and add a identifierDescription inference mode called "none"
      type_inference_mode: {
        description: "The type inference mode: [roulette, elitist, dynamic]",
        type: "string",
        default: "roulette",
      },
      random_type_probability: {
        description: "The probability we use a random type regardless of the inferred type",
        type: "number",
        default: 0.1,
      },
    };
    setupOptions(this._program, additionalOptions);

    const programArgs = process.argv.filter(
      (a) => a.includes(this._program) || a.includes("bin.ts")
    );
    const index = process.argv.indexOf(programArgs[programArgs.length - 1]);
    const args = process.argv.slice(index + 1);

    const config = loadConfig(args);
    processConfig(config, args);
    setupLogger();

    if (existsSync('.syntest')) {
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
    getUserInterface().report("version", [require("../package.json").version]);

    if (args.includes("--help") || args.includes("-h")) {
      getUserInterface().report("help", []);
      await this.exit();
    } // Exit if --help

    const abstractSyntaxTreeGenerator = new AbstractSyntaxTreeGenerator();
    const targetMapGenerator = new TargetMapGenerator();

    let typeResolver: TypeResolver

    if (Properties['type_inference_mode'] === 'none') {
      typeResolver = new TypeResolverUnknown()
    } else {
      typeResolver = new TypeResolverInference()
    }

    const controlFlowGraphGenerator = new ControlFlowGraphGenerator()
    const importGenerator = new ImportGenerator()
    const exportGenerator = new ExportGenerator()
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
      [
        ["Target Root Directory", Properties.target_root_directory],
      ],
    ]);

    await targetPool.loadTargets();

    if (!targetPool.targets.length) {
      getUserInterface().error(
        `No targets where selected! Try changing the 'include' parameter`
      );
      await this.exit();
    }

    let names: string[] = [];

    targetPool.targets.forEach((target) =>
      names.push(
        `${path.basename(target.canonicalPath)} -> ${target.targetName}`
      )
    );
    getUserInterface().report("targets", names);

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
        ["Sample FUNCTION Result as Argument", Properties.sample_func_as_arg],
        ["Crossover", Properties.crossover_probability],
      ],
    ]);

    getUserInterface().report("property-set", [
      "Type Inference",
      [
        ["Incorporate Execution Information", Properties['incorporate_execution_information']],
        ["Type Inference Mode", Properties['type_inference_mode']],
        ["Random Type Probability", Properties['random_type_probability']],
      ],
    ]);

    return targetPool;
  }

  private async search(
    targetPool: JavaScriptTargetPool
  ): Promise<
    [Archive<JavaScriptTestCase>, Map<string, Export[]>, Export[]]
  > {
    await targetPool.prepareAndInstrument()

    targetPool.scanTargetRootDirectory()

    const finalArchive = new Archive<JavaScriptTestCase>();
    const finalDependencies: Map<string, Export[]> = new Map();
    const finalExports: Export[] = []

    for (const target of targetPool.targets) {
      const archive = await this.testTarget(
        targetPool,
        target.canonicalPath,
        targetPool.getTargetMap(target.canonicalPath).get(target.targetName)
      );

      const dependencies = targetPool.getDependencies(target.canonicalPath);
      finalArchive.merge(archive)

      finalDependencies.set(target.targetName, dependencies)
      finalExports.push(...targetPool.getExports(target.canonicalPath))
    }

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
          `${path.basename(targetPath, '.js').split(".")[0]}.svg`
        )
      );
    }

    const functionMap = targetPool.getFunctionMap(targetPath, targetMeta.name)

    // couple types to parameters
    for (const func of functionMap.values()) {
      for (const param of func.parameters) {
        if (func.type === ActionType.FUNCTION) {
          param.typeProbabilityMap = targetPool.typeResolver.getTyping(func.scope, param.name)
        } else if (func.type === ActionType.METHOD
          || func.type === ActionType.CONSTRUCTOR) {
          param.typeProbabilityMap = targetPool.typeResolver.getTyping(func.scope, param.name)
        } else {
          throw new Error(`Unimplemented action identifierDescription ${func.type}`)
        }
      }
    // TODO return types
    }

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

    const dependencies = targetPool.getDependencies(targetPath);
    const dependencyMap = new Map<string, Export[]>()
    dependencyMap.set(targetMeta.name, dependencies)
    const exports = targetPool.getExports(targetPath)

    const decoder = new JavaScriptDecoder(targetPool, dependencyMap, exports)
    const suiteBuilder = new JavaScriptSuiteBuilder(decoder)
    const runner = new JavaScriptRunner(suiteBuilder)

    // TODO constant pool

    const sampler = new JavaScriptRandomSampler(currentSubject, targetPool)
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

    if (this.coveredInPath.has(targetPath)) {
      archive.merge(this.coveredInPath.get(targetPath))
      this.coveredInPath.set(targetPath, archive)
    } else {
      this.coveredInPath.set(targetPath, archive)
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

    const decoder = new JavaScriptDecoder(
      targetPool,
      dependencies,
      exports,
      '../../.syntest/instrumented'
    );

    const suiteBuilder = new JavaScriptSuiteBuilder(decoder);

    const paths = await suiteBuilder.createSuite(archive);

    const mocha = new Mocha()

    // require('ts-node/register')

    require("regenerator-runtime/runtime");
    require('@babel/register')({
      presets: [
        "@babel/preset-env"
      ]
    })

    for (const _path of paths) {
      delete originalrequire.cache[_path];
      mocha.addFile(_path);
    }

    // // By replacing the global log function we disable the output of the truffle test framework
    // const levels = ['log', 'debug', 'info', 'warn', 'error'];
    // const originalFunctions = levels.map(level => console[level]);
    // levels.forEach((level) => {
    //   // eslint-disable-next-line @typescript-eslint/no-empty-function
    //   console[level] = () => {}
    // })


    // Finally, run mocha.
    process.on("unhandledRejection", reason => {
      throw reason;
    });

    await new Promise((resolve) => {
      mocha.run((failures: number) => {
        resolve(failures)
      })
    })

    // levels.forEach((level, index) => {
    //   console[level] = originalFunctions[index]
    // })

    getUserInterface().report("header", ["SEARCH RESULTS"]);
    const instrumentationData = global.__coverage__

    // Run Istanbul
    // TODO

    getUserInterface().report("report-coverage", ['Coverage report', { branch: 'Branch', statement: 'Statement', function: 'Function' }, true])

    const overall = {
      branch: 0,
      statement: 0,
      function: 0
    }
    let totalBranches = 0
    let totalStatements = 0
    let totalFunctions = 0
    for (const file of Object.keys(instrumentationData)) {
      if (!targetPool.targets.find((t) => t.canonicalPath === file)) {
        continue
      }

      const data = instrumentationData[file]

      const summary = {
        branch: 0,
        statement: 0,
        function: 0
      }

      for (const statementKey of Object.keys(data.s)) {
        summary['statement'] += data.s[statementKey] ? 1 : 0
        overall['statement'] += data.s[statementKey] ? 1 : 0
      }

      for (const branchKey of Object.keys(data.b)) {
        summary['branch'] += data.b[branchKey][0] ? 1 : 0
        overall['branch'] += data.b[branchKey][0] ? 1 : 0
        summary['branch'] += data.b[branchKey][1] ? 1 : 0
        overall['branch'] += data.b[branchKey][1] ? 1 : 0
      }

      for (const functionKey of Object.keys(data.f)) {
        summary['function'] += data.f[functionKey] ? 1 : 0
        overall['function'] += data.f[functionKey] ? 1 : 0
      }

      totalStatements += Object.keys(data.s).length
      totalBranches += (Object.keys(data.b).length * 2)
      totalFunctions += Object.keys(data.f).length

      getUserInterface().report("report-coverage", [file, {
        'statement': summary['statement'] + ' / ' + Object.keys(data.s).length,
        'branch': summary['branch'] + ' / ' + (Object.keys(data.b).length * 2),
        'function': summary['function'] + ' / ' + Object.keys(data.f).length
      }, false])

      // console.log(data.b)
      // console.log(Object.keys(data.s).filter((x) => data.s[x] === 0).map((x) => data.statementMap[x].start.line))
      // console.log(data.f)
      // console.log()
    }

    overall['statement'] /= totalStatements
    overall['branch'] /= totalBranches
    overall['function'] /= totalFunctions

    getUserInterface().report("report-coverage", ['Total', {
      'statement': (overall['statement'] * 100) + ' %',
      'branch': (overall['branch'] * 100) + ' %',
      'function': (overall['function'] * 100) + ' %'
    }, true])


  }

  async exit(): Promise<void> {
    // Finish
    await deleteTempDirectories();

    process.exit(0);
  }
}
