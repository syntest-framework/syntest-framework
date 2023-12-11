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

import * as path from "node:path";

import {
  AbstractSyntaxTreeFactory,
  ConstantPoolFactory,
  ControlFlowGraphFactory,
  DependencyFactory,
  ExportFactory,
  InferenceTypeModelFactory,
  isExported,
  RootContext,
  Target,
  TargetFactory,
  TypeExtractor,
  TypeModelFactory,
} from "@syntest/analysis-javascript";
import {
  ArgumentsObject,
  CrossoverPlugin,
  FileSelector,
  Launcher,
  ObjectiveManagerPlugin,
  PluginType,
  ProcreationPlugin,
  PropertyName,
  SearchAlgorithmPlugin,
  SecondaryObjectivePlugin,
  TargetSelector,
  TerminationTriggerPlugin,
} from "@syntest/base-language";
import {
  ItemizationItem,
  TableObject,
  UserInterface,
} from "@syntest/cli-graphics";
import { IllegalArgumentError, isFailure, unwrap } from "@syntest/diagnostics";
import { Instrumenter } from "@syntest/instrumentation-javascript";
import { getLogger, Logger } from "@syntest/logging";
import { MetricManager } from "@syntest/metric";
import { ModuleManager } from "@syntest/module";
import {
  ApproachLevelCalculator,
  Archive,
  BudgetManager,
  BudgetType,
  EncodingSampler,
  EvaluationBudget,
  extractBranchObjectivesFromProgram,
  extractFunctionObjectivesFromProgram,
  extractPathObjectivesFromProgram,
  IterationBudget,
  ObjectiveFunction,
  SearchTimeBudget,
  TerminationManager,
  TotalTimeBudget,
} from "@syntest/search";
import {
  BranchDistanceCalculator,
  ExecutionInformationIntegrator,
  JavaScriptDecoder,
  JavaScriptRandomSampler,
  JavaScriptRunner,
  JavaScriptSubject,
  JavaScriptSuiteBuilder,
  JavaScriptTestCase,
  JavaScriptTestCaseSampler,
} from "@syntest/search-javascript";
import { StorageManager } from "@syntest/storage";

import { TestCommandOptions } from "./commands/test";
import { DeDuplicator } from "./workflows/DeDuplicator";
import { MetaCommenter } from "./workflows/MetaCommenter";
import { TestSplitting } from "./workflows/TestSplitter";

export type JavaScriptArguments = ArgumentsObject & TestCommandOptions;
export class JavaScriptLauncher extends Launcher<JavaScriptArguments> {
  protected static override LOGGER: Logger;

  private targets: Target[];

  private rootContext: RootContext;
  private archives: Map<Target, Archive<JavaScriptTestCase>>;

  private coveredInPath = new Map<string, Archive<JavaScriptTestCase>>();

  private decoder: JavaScriptDecoder;
  private runner: JavaScriptRunner;

  constructor(
    arguments_: JavaScriptArguments,
    moduleManager: ModuleManager,
    metricManager: MetricManager,
    storageManager: StorageManager,
    userInterface: UserInterface
  ) {
    super(
      arguments_,
      moduleManager,
      metricManager,
      storageManager,
      userInterface
    );
    JavaScriptLauncher.LOGGER = getLogger(JavaScriptLauncher.name);
    this.archives = new Map();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async initialize(): Promise<void> {
    JavaScriptLauncher.LOGGER.info("Initialization started");
    const start = Date.now();

    this.metricManager.recordProperty(
      PropertyName.CONSTANT_POOL_ENABLED,
      `${this.arguments_.constantPool.toString()}`
    );
    this.metricManager.recordProperty(
      PropertyName.CONSTANT_POOL_PROBABILITY,
      `${this.arguments_.constantPoolProbability.toString()}`
    );

    this.storageManager.deleteTemporaryDirectories([
      [this.arguments_.testDirectory],
      [this.arguments_.logDirectory],
      [this.arguments_.instrumentedDirectory],
    ]);

    JavaScriptLauncher.LOGGER.info("Creating directories");
    this.storageManager.createDirectories([
      [this.arguments_.testDirectory],
      [this.arguments_.statisticsDirectory],
      [this.arguments_.logDirectory],
    ]);

    JavaScriptLauncher.LOGGER.info("Creating temp directories");
    this.storageManager.createDirectories(
      [
        [this.arguments_.testDirectory],
        [this.arguments_.logDirectory],
        [this.arguments_.instrumentedDirectory],
      ],
      true
    );

    const abstractSyntaxTreeFactory = new AbstractSyntaxTreeFactory();
    const targetFactory = new TargetFactory(this.arguments_.syntaxForgiving);
    const controlFlowGraphFactory = new ControlFlowGraphFactory(
      this.arguments_.syntaxForgiving
    );
    const dependencyFactory = new DependencyFactory(
      this.arguments_.syntaxForgiving
    );
    const exportFactory = new ExportFactory(this.arguments_.syntaxForgiving);
    const typeExtractor = new TypeExtractor(this.arguments_.syntaxForgiving);
    const typeResolver: TypeModelFactory = new InferenceTypeModelFactory();
    const constantPoolFactory = new ConstantPoolFactory(
      this.arguments_.syntaxForgiving
    );

    const fileSelector = new FileSelector();
    const targetFiles = fileSelector.loadFilePaths(
      this.arguments_.targetInclude,
      this.arguments_.targetExclude
    );

    if (this.arguments_.analysisInclude.length === 0) {
      JavaScriptLauncher.LOGGER.warn(
        "'analysis-include' config parameter is empty so we only use the target files for analysis"
      );
    }

    for (const target of targetFiles) {
      if (this.arguments_.analysisExclude.includes(target)) {
        throw new IllegalArgumentError(
          "Target files cannot be excluded from analysis",
          { context: { targetFile: target } }
        );
      }
    }

    const analysisFiles = fileSelector.loadFilePaths(
      [...targetFiles, ...this.arguments_.analysisInclude],
      this.arguments_.analysisExclude
    );

    this.rootContext = new RootContext(
      this.arguments_.targetRootDirectory,
      targetFiles,
      analysisFiles,
      abstractSyntaxTreeFactory,
      controlFlowGraphFactory,
      targetFactory,
      dependencyFactory,
      exportFactory,
      typeExtractor,
      typeResolver,
      constantPoolFactory
    );

    this.userInterface.printHeader("GENERAL INFO");

    const timeInMs = (Date.now() - start) / 1000;
    this.metricManager.recordProperty(
      PropertyName.INITIALIZATION_TIME,
      `${timeInMs}`
    );

    JavaScriptLauncher.LOGGER.info("Initialization done");
  }

  async preprocess(): Promise<void> {
    JavaScriptLauncher.LOGGER.info("Preprocessing started");
    const startPreProcessing = Date.now();

    const startTargetSelection = Date.now();
    const targetSelector = new TargetSelector(this.rootContext);
    this.targets = targetSelector.loadTargets(
      this.arguments_.targetInclude,
      this.arguments_.targetExclude
    );
    let timeInMs = (Date.now() - startTargetSelection) / 1000;
    this.metricManager.recordProperty(
      PropertyName.TARGET_LOAD_TIME,
      `${timeInMs}`
    );

    if (this.targets.length === 0) {
      // Shut server down
      this.userInterface.printError(
        `No targets where selected! Try changing the 'target-include' parameter`
      );
      await this.exit();
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit();
    }

    const itemization: ItemizationItem[] = [];

    for (const target of this.targets) {
      itemization.push({
        text: `${target.path}: ${target.name} #${target.subTargets.length}`,
        subItems: target.subTargets.map((subtarget) => {
          return {
            text: `${subtarget.type} ${subtarget.id}`,
          };
        }),
      });
    }

    this.userInterface.printItemization("TARGETS", itemization);

    const selectionSettings: TableObject = {
      headers: ["Setting", "Value"],
      rows: [
        ["Target Root Directory", this.arguments_.targetRootDirectory],
        ["Target Include", `${this.arguments_.targetInclude.join(", ")}`],
        ["Target Exclude", `${this.arguments_.targetExclude.join(", ")}`],
        ["Analysis Include", `${this.arguments_.analysisInclude.join(", ")}`],
        ["Analysis Exclude", `${this.arguments_.analysisExclude.join(", ")}`],
      ],
    };
    this.userInterface.printTable("SELECTION SETTINGS", selectionSettings);

    const settings: TableObject = {
      headers: ["Setting", "Value"],
      rows: [
        ["Preset", this.arguments_.preset],
        ["Search Algorithm", this.arguments_.searchAlgorithm],
        ["Population Size", `${this.arguments_.populationSize}`],
        ["Objective Manager", `${this.arguments_.objectiveManager}`],
        [
          "Secondary Objectives",
          `[${this.arguments_.secondaryObjectives.join(", ")}]`,
        ],
        ["Procreation Operator", `${this.arguments_.procreation}`],
        ["Crossover Operator", `${this.arguments_.crossover}`],
        ["Sampling Operator", `${this.arguments_.sampler}`],
        [
          "Termination Triggers",
          `[${this.arguments_.terminationTriggers.join(", ")}]`,
        ],
        ["Test Minimization Enabled", String(this.arguments_.testMinimization)],

        ["Seed", `${this.arguments_.randomSeed.toString()}`],
      ],
    };

    this.userInterface.printTable("SETTINGS", settings);

    const budgetSettings: TableObject = {
      headers: ["Setting", "Value"],
      rows: [
        ["Iteration Budget", `${this.arguments_.iterations} iterations`],
        ["Evaluation Budget", `${this.arguments_.evaluations} evaluations`],
        ["Search Time Budget", `${this.arguments_.searchTime} seconds`],
        ["Total Time Budget", `${this.arguments_.totalTime} seconds`],
      ],
    };

    this.userInterface.printTable("BUDGET SETTINGS", budgetSettings);

    const mutationSettings: TableObject = {
      headers: ["Setting", "Value"],
      rows: [
        [
          "Delta Mutation Probability",
          `${this.arguments_.deltaMutationProbability}`,
        ],
        ["Crossover Probability", `${this.arguments_.crossoverProbability}`],
        [
          "Multi-point Crossover Probability",
          `${this.arguments_.multiPointCrossoverProbability}`,
        ],
        // sampling
        ["Max Depth", `${this.arguments_.maxDepth}`],
        ["Max Action Statements", `${this.arguments_.maxActionStatements}`],
        [
          "Explore Illegal Values",
          String(this.arguments_.exploreIllegalValues),
        ],
        ["Use Constant Pool Values", String(this.arguments_.constantPool)],
        [
          "Use Constant Pool Probability",
          `${this.arguments_.constantPoolProbability}`,
        ],
        ["Use Type Pool Values", String(this.arguments_.typePool)],
        ["Use Type Pool Probability", `${this.arguments_.typePoolProbability}`],
        ["Use Statement Pool Values", String(this.arguments_.statementPool)],
        [
          "Use Statement Pool Probability",
          `${this.arguments_.statementPoolProbability}`,
        ],
      ],
    };
    this.userInterface.printTable("MUTATION SETTINGS", mutationSettings);

    const typeSettings: TableObject = {
      headers: ["Setting", "Value"],
      rows: [
        ["Type Inference Mode", `${this.arguments_.typeInferenceMode}`],
        [
          "Incorporate Execution Information",
          String(this.arguments_.incorporateExecutionInformation),
        ],
        ["Random Type Probability", `${this.arguments_.randomTypeProbability}`],
      ],
    };
    this.userInterface.printTable("Type SETTINGS", typeSettings);

    const directorySettings: TableObject = {
      headers: ["Setting", "Value"],
      rows: [
        ["Syntest Directory", `${this.arguments_.syntestDirectory}`],
        ["Temporary Directory", `${this.arguments_.tempSyntestDirectory}`],
        ["Target Root Directory", `${this.arguments_.targetRootDirectory}`],
      ],
    };

    this.userInterface.printTable("DIRECTORY SETTINGS", directorySettings);

    JavaScriptLauncher.LOGGER.info("Instrumenting targets");
    const startInstrumentation = Date.now();
    const instrumenter = new Instrumenter();
    await instrumenter.instrumentAll(
      this.storageManager,
      this.rootContext,
      this.targets,
      this.arguments_.instrumentedDirectory
    );
    timeInMs = (Date.now() - startInstrumentation) / 1000;
    this.metricManager.recordProperty(
      PropertyName.INSTRUMENTATION_TIME,
      `${timeInMs}`
    );

    const startTypeResolving = Date.now();
    JavaScriptLauncher.LOGGER.info("Extracting & Resolving types");
    this.rootContext.resolveTypes();
    timeInMs = (Date.now() - startTypeResolving) / 1000;
    this.metricManager.recordProperty(
      PropertyName.TYPE_RESOLVE_TIME,
      `${timeInMs}`
    );

    timeInMs = (Date.now() - startPreProcessing) / 1000;
    this.metricManager.recordProperty(
      PropertyName.PREPROCESS_TIME,
      `${timeInMs}`
    );

    this.decoder = new JavaScriptDecoder(this.arguments_.targetRootDirectory);
    const executionInformationIntegrator = new ExecutionInformationIntegrator(
      this.rootContext.getTypeModel()
    );
    this.runner = new JavaScriptRunner(
      this.storageManager,
      this.decoder,
      executionInformationIntegrator,
      this.arguments_.testDirectory,
      this.arguments_.executionTimeout,
      this.arguments_.testTimeout,
      this.arguments_.silenceTestOutput
    );

    JavaScriptLauncher.LOGGER.info("Preprocessing done");
  }

  async process(): Promise<void> {
    JavaScriptLauncher.LOGGER.info("Processing started");
    const start = Date.now();

    for (const target of this.targets) {
      JavaScriptLauncher.LOGGER.info(`Processing ${target.name}`);
      const archive = await this.testTarget(this.rootContext, target);
      this.archives.set(target, archive);
    }
    JavaScriptLauncher.LOGGER.info("Processing done");
    const timeInMs = (Date.now() - start) / 1000;
    this.metricManager.recordProperty(PropertyName.PROCESS_TIME, `${timeInMs}`);
  }

  async postprocess(): Promise<void> {
    this.userInterface.printHeader("Postprocessing started");
    JavaScriptLauncher.LOGGER.info("Postprocessing started");
    const start = Date.now();
    const objectives = new Map<Target, ObjectiveFunction<JavaScriptTestCase>[]>(
      [...this.archives.entries()].map(([target, archive]) => [
        target,
        archive.getObjectives(),
      ])
    );
    let finalEncodings = new Map<Target, JavaScriptTestCase[]>(
      [...this.archives.entries()].map(([target, archive]) => [
        target,
        archive.getEncodings(),
      ])
    );

    if (this.arguments_.testSplitting) {
      const testSplitter = new TestSplitting(this.userInterface, this.runner);

      const start = Date.now();
      const before = [...finalEncodings.values()].reduce(
        (p, c) => p + c.length,
        0
      );
      JavaScriptLauncher.LOGGER.info("Splitting started");
      finalEncodings = await testSplitter.execute(finalEncodings);

      const timeInMs = (Date.now() - start) / 1000;
      const after = [...finalEncodings.values()].reduce(
        (p, c) => p + c.length,
        0
      );

      JavaScriptLauncher.LOGGER.info(
        `Splitting done took: ${timeInMs}, went from ${before} to ${after} test cases`
      );
      this.userInterface.printSuccess(
        `Splitting done took: ${timeInMs}, went from ${before} to ${after} test cases`
      );

      // this.metricManager.recordProperty(PropertyName., `${timeInMs}`); // TODO new metric
    }

    if (this.arguments_.testMinimization) {
      const start = Date.now();
      JavaScriptLauncher.LOGGER.info("Minimization started");
      // TODO
      const timeInMs = (Date.now() - start) / 1000;
      JavaScriptLauncher.LOGGER.info(`Minimization done, took: ${timeInMs}`);
      // this.metricManager.recordProperty(PropertyName., `${timeInMs}`); // TODO new metric
    }

    const secondaryObjectives = this.arguments_.secondaryObjectives.map(
      (secondaryObjective) => {
        return (<SecondaryObjectivePlugin<JavaScriptTestCase>>(
          this.moduleManager.getPlugin(
            PluginType.SecondaryObjective,
            secondaryObjective
          )
        )).createSecondaryObjective();
      }
    );

    if (this.arguments_.testDeDuplication) {
      const deDuplicator = new DeDuplicator(
        this.userInterface,
        secondaryObjectives,
        objectives
      );

      const start = Date.now();
      const before = [...finalEncodings.values()].reduce(
        (p, c) => p + c.length,
        0
      );
      JavaScriptLauncher.LOGGER.info("De-Duplication started");

      finalEncodings = await deDuplicator.execute(finalEncodings);

      const timeInMs = (Date.now() - start) / 1000;
      const after = [...finalEncodings.values()].reduce(
        (p, c) => p + c.length,
        0
      );

      JavaScriptLauncher.LOGGER.info(
        `De-Duplication done took: ${timeInMs}, went from ${before} to ${after} test cases`
      );
      this.userInterface.printSuccess(
        `De-Duplication done took: ${timeInMs}, went from ${before} to ${after} test cases`
      );
    }

    if (this.arguments_.metaComments) {
      const metaCommenter = new MetaCommenter(
        this.userInterface,
        secondaryObjectives,
        objectives
      );
      const start = Date.now();
      JavaScriptLauncher.LOGGER.info("Meta-Commenting started");
      finalEncodings = await metaCommenter.execute(finalEncodings);
      const timeInMs = (Date.now() - start) / 1000;

      JavaScriptLauncher.LOGGER.info(`Meta-Commenting done took: ${timeInMs}`);
      this.userInterface.printSuccess(`Meta-Commenting done took: ${timeInMs}`);
    }

    const suiteBuilder = new JavaScriptSuiteBuilder(
      this.storageManager,
      this.decoder,
      this.runner
    );

    // TODO fix hardcoded paths
    await suiteBuilder.runSuite(
      finalEncodings,
      "../instrumented",
      this.arguments_.testDirectory,
      true,
      false
    );

    // reset states
    this.storageManager.clearTemporaryDirectory([
      this.arguments_.testDirectory,
    ]);

    const { stats, instrumentationData } = await suiteBuilder.runSuite(
      finalEncodings,
      "../instrumented",
      this.arguments_.testDirectory,
      false,
      true
    );

    if (stats.failures > 0) {
      this.userInterface.printError("Test case has failed!");
    }

    this.userInterface.printHeader("SEARCH RESULTS");

    const table: TableObject = {
      headers: ["Target", "Statement", "Branch", "Function", "File"],
      rows: [],
      footers: ["Average"],
    };

    const overall = {
      branch: 0,
      statement: 0,
      function: 0,
    };
    let totalBranches = 0;
    let totalStatements = 0;
    let totalFunctions = 0;
    for (const file of Object.keys(instrumentationData)) {
      const target = this.targets.find(
        (target: Target) => target.path === file
      );
      if (!target) {
        continue;
      }

      const data = instrumentationData[file];

      const summary = {
        branch: 0,
        statement: 0,
        function: 0,
      };

      for (const statementKey of Object.keys(data.s)) {
        summary["statement"] += data.s[statementKey] ? 1 : 0;
        overall["statement"] += data.s[statementKey] ? 1 : 0;
      }

      for (const branchKey of Object.keys(data.b)) {
        summary["branch"] += data.b[branchKey][0] ? 1 : 0;
        overall["branch"] += data.b[branchKey][0] ? 1 : 0;
        summary["branch"] += data.b[branchKey][1] ? 1 : 0;
        overall["branch"] += data.b[branchKey][1] ? 1 : 0;
      }

      for (const functionKey of Object.keys(data.f)) {
        summary["function"] += data.f[functionKey] ? 1 : 0;
        overall["function"] += data.f[functionKey] ? 1 : 0;
      }

      totalStatements += Object.keys(data.s).length;
      totalBranches += Object.keys(data.b).length * 2;
      totalFunctions += Object.keys(data.f).length;

      table.rows.push([
        `${path.basename(target.path)}: ${target.name}`,
        `${summary["statement"]} / ${Object.keys(data.s).length}`,
        `${summary["branch"]} / ${Object.keys(data.b).length * 2}`,
        `${summary["function"]} / ${Object.keys(data.f).length}`,
        target.path,
      ]);
    }

    this.metricManager.recordProperty(
      PropertyName.BRANCHES_COVERED,
      `${overall["branch"]}`
    );
    this.metricManager.recordProperty(
      PropertyName.STATEMENTS_COVERED,
      `${overall["statement"]}`
    );
    this.metricManager.recordProperty(
      PropertyName.FUNCTIONS_COVERED,
      `${overall["function"]}`
    );
    this.metricManager.recordProperty(
      PropertyName.BRANCHES_TOTAL,
      `${totalBranches}`
    );
    this.metricManager.recordProperty(
      PropertyName.STATEMENTS_TOTAL,
      `${totalStatements}`
    );
    this.metricManager.recordProperty(
      PropertyName.FUNCTIONS_TOTAL,
      `${totalFunctions}`
    );

    // other results
    this.metricManager.recordProperty(
      PropertyName.ARCHIVE_SIZE,
      `${this.archives.size}`
    );
    this.metricManager.recordProperty(
      PropertyName.MINIMIZED_ARCHIVE_SIZE,
      `${this.archives.size}`
    );

    overall["statement"] /= totalStatements;
    if (totalStatements === 0) overall["statement"] = 1;

    overall["branch"] /= totalBranches;
    if (totalBranches === 0) overall["branch"] = 1;

    overall["function"] /= totalFunctions;
    if (totalFunctions === 0) overall["function"] = 1;

    table.footers.push(
      `${overall["statement"] * 100} %`,
      `${overall["branch"] * 100} %`,
      `${overall["function"] * 100} %`,
      ""
    );

    const originalSourceDirectory = path
      .join(
        "../../",
        path.relative(process.cwd(), this.arguments_.targetRootDirectory)
      )
      .replace(path.basename(this.arguments_.targetRootDirectory), "");

    this.userInterface.printTable("Coverage", table);

    // create final suite
    await suiteBuilder.runSuite(
      finalEncodings,
      originalSourceDirectory,
      this.arguments_.testDirectory,
      false,
      true,
      true
    );
    JavaScriptLauncher.LOGGER.info("Postprocessing done");
    const timeInMs = (Date.now() - start) / 1000;
    this.metricManager.recordProperty(
      PropertyName.POSTPROCESS_TIME,
      `${timeInMs}`
    );
  }

  private async testTarget(
    rootContext: RootContext,
    target: Target
  ): Promise<Archive<JavaScriptTestCase>> {
    JavaScriptLauncher.LOGGER.info(
      `Testing target ${target.name} in ${target.path}`
    );

    const result = rootContext.getControlFlowProgram(target.path);

    if (isFailure(result)) throw result.error;

    const cfp = unwrap(result);

    const branchObjectives =
      extractBranchObjectivesFromProgram<JavaScriptTestCase>(
        cfp,
        new ApproachLevelCalculator(),
        new BranchDistanceCalculator(
          this.arguments_.syntaxForgiving,
          this.arguments_.stringAlphabet
        )
      );
    const pathObjectives = extractPathObjectivesFromProgram<JavaScriptTestCase>(
      cfp,
      new ApproachLevelCalculator(),
      new BranchDistanceCalculator(
        this.arguments_.syntaxForgiving,
        this.arguments_.stringAlphabet
      )
    );
    const functionObjectives =
      extractFunctionObjectivesFromProgram<JavaScriptTestCase>(cfp);

    this.userInterface.printTable("Objective Counts", {
      headers: ["Type", "Count"],
      rows: [
        ["branch", `${branchObjectives.length}`],
        ["path", `${pathObjectives.length}`],
        ["function", `${functionObjectives.length}`],
      ],
    });

    const currentSubject = new JavaScriptSubject(target, [
      // ...branchObjectives,
      // ...functionObjectives,
      ...pathObjectives,
    ]);

    const rootTargets = currentSubject
      .getActionableTargets()
      .filter((target) => isExported(target));

    if (rootTargets.length === 0) {
      JavaScriptLauncher.LOGGER.info(
        `No actionable exported root targets found for ${target.name} in ${target.path}`
      );
      // report skipped
      return new Archive();
    }

    const constantPoolManagerResult = rootContext.getConstantPoolManager(
      target.path
    );

    if (isFailure(constantPoolManagerResult))
      throw constantPoolManagerResult.error;

    const constantPoolManager = unwrap(constantPoolManagerResult);

    const sampler = new JavaScriptRandomSampler(
      currentSubject,
      constantPoolManager,
      this.arguments_.constantPool,
      this.arguments_.constantPoolProbability,
      this.arguments_.typePool,
      this.arguments_.typePoolProbability,
      this.arguments_.statementPool,
      this.arguments_.statementPoolProbability,

      this.arguments_.typeInferenceMode,
      this.arguments_.randomTypeProbability,
      this.arguments_.incorporateExecutionInformation,
      this.arguments_.maxActionStatements,
      this.arguments_.stringAlphabet,
      this.arguments_.stringMaxLength,
      this.arguments_.deltaMutationProbability,
      this.arguments_.exploreIllegalValues,
      this.arguments_.addRemoveArgumentProbability,
      this.arguments_.addArgumentProbability,
      this.arguments_.removeArgumentProbability
    );
    sampler.rootContext = rootContext;

    const secondaryObjectives = this.arguments_.secondaryObjectives.map(
      (secondaryObjective) => {
        return (<SecondaryObjectivePlugin<JavaScriptTestCase>>(
          this.moduleManager.getPlugin(
            PluginType.SecondaryObjective,
            secondaryObjective
          )
        )).createSecondaryObjective();
      }
    );

    const objectiveManager = (<ObjectiveManagerPlugin<JavaScriptTestCase>>(
      this.moduleManager.getPlugin(
        PluginType.ObjectiveManager,
        this.arguments_.objectiveManager
      )
    )).createObjectiveManager({
      runner: this.runner,
      secondaryObjectives: secondaryObjectives,
      exceptionObjectivesEnabled: this.arguments_.exceptionObjectives,
    });

    const crossover = (<CrossoverPlugin<JavaScriptTestCase>>(
      this.moduleManager.getPlugin(
        PluginType.Crossover,
        this.arguments_.crossover
      )
    )).createCrossoverOperator({
      crossoverEncodingProbability: this.arguments_.crossoverProbability,
      crossoverStatementProbability:
        this.arguments_.multiPointCrossoverProbability,
    });

    const procreation = (<ProcreationPlugin<JavaScriptTestCase>>(
      this.moduleManager.getPlugin(
        PluginType.Procreation,
        this.arguments_.procreation
      )
    )).createProcreationOperator({
      crossover: crossover,
      mutateFunction: (
        sampler: EncodingSampler<JavaScriptTestCase>,
        encoding: JavaScriptTestCase
      ) => {
        return encoding.mutate(<JavaScriptTestCaseSampler>(<unknown>sampler));
      },
      sampler: sampler,
    });

    const algorithm = (<SearchAlgorithmPlugin<JavaScriptTestCase>>(
      this.moduleManager.getPlugin(
        PluginType.SearchAlgorithm,
        this.arguments_.searchAlgorithm
      )
    )).createSearchAlgorithm({
      objectiveManager: objectiveManager,
      encodingSampler: sampler,
      procreation: procreation,
      populationSize: this.arguments_.populationSize,
    });

    this.storageManager.clearTemporaryDirectory([
      this.arguments_.testDirectory,
    ]);

    // allocate budget manager
    const iterationBudget = new IterationBudget(this.arguments_.iterations);
    const evaluationBudget = new EvaluationBudget(this.arguments_.evaluations);
    const searchBudget = new SearchTimeBudget(this.arguments_.searchTime);
    const totalTimeBudget = new TotalTimeBudget(this.arguments_.totalTime);
    const budgetManager = new BudgetManager();
    budgetManager.addBudget(BudgetType.ITERATION, iterationBudget);
    budgetManager.addBudget(BudgetType.EVALUATION, evaluationBudget);
    budgetManager.addBudget(BudgetType.SEARCH_TIME, searchBudget);
    budgetManager.addBudget(BudgetType.TOTAL_TIME, totalTimeBudget);

    // Termination
    const terminationManager = new TerminationManager();

    for (const trigger of this.arguments_.terminationTriggers) {
      terminationManager.addTrigger(
        (<TerminationTriggerPlugin>(
          this.moduleManager.getPlugin(PluginType.TerminationTrigger, trigger)
        )).createTerminationTrigger({
          objectiveManager: objectiveManager,
          encodingSampler: sampler,
          runner: this.runner,
          crossover: crossover,
          populationSize: this.arguments_.populationSize,
        })
      );
    }

    // This searches for a covering population
    const archive = await algorithm.search(
      currentSubject,
      budgetManager,
      terminationManager
    );

    if (this.coveredInPath.has(target.path)) {
      archive.merge(this.coveredInPath.get(target.path));
      this.coveredInPath.set(target.path, archive);
    } else {
      this.coveredInPath.set(target.path, archive);
    }

    this.storageManager.clearTemporaryDirectory([this.arguments_.logDirectory]);
    this.storageManager.clearTemporaryDirectory([
      this.arguments_.testDirectory,
    ]);

    // timing and iterations/evaluations
    this.metricManager.recordProperty(
      PropertyName.TOTAL_TIME,
      `${budgetManager.getBudgetObject(BudgetType.TOTAL_TIME).getUsedBudget()}`
    );
    this.metricManager.recordProperty(
      PropertyName.SEARCH_TIME,
      `${budgetManager.getBudgetObject(BudgetType.SEARCH_TIME).getUsedBudget()}`
    );
    this.metricManager.recordProperty(
      PropertyName.EVALUATIONS,
      `${budgetManager.getBudgetObject(BudgetType.EVALUATION).getUsedBudget()}`
    );
    this.metricManager.recordProperty(
      PropertyName.ITERATIONS,
      `${budgetManager.getBudgetObject(BudgetType.ITERATION).getUsedBudget()}`
    );

    JavaScriptLauncher.LOGGER.info(
      `Finished testing target ${target.name} in ${target.path}`
    );
    return archive;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async exit(): Promise<void> {
    JavaScriptLauncher.LOGGER.info("Exiting");
    if (this.runner && this.runner.process) {
      this.runner.process.kill();
    }
    // TODO should be cleanup step in tool
    // Finish
    JavaScriptLauncher.LOGGER.info("Deleting temporary directories");
    this.storageManager.deleteTemporaryDirectories([
      [this.arguments_.testDirectory],
      [this.arguments_.logDirectory],
      [this.arguments_.instrumentedDirectory],
    ]);

    this.storageManager.deleteMainTemporary();
  }
}
