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
import { timer } from "./Timer";
import { DeDuplicator } from "./workflows/DeDuplicator";
import { MetaCommenter } from "./workflows/MetaCommenter";
import { TestSplitter } from "./workflows/TestSplitter";

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

    if (this.targets.length === 0) {
      // Shut down
      this.userInterface.printError(
        `No targets where selected! Try changing the 'target-include' parameter`
      );
      await this.exit();
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit();
    }

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
      const testSplitter = new TestSplitter(this.userInterface, this.runner);
      const timedResult = await timer(() =>
        testSplitter.execute(finalEncodings)
      );
      finalEncodings = timedResult.result;

      JavaScriptLauncher.LOGGER.info(`Splitting took: ${timedResult.time}`);
      this.userInterface.printSuccess(`Splitting took: ${timedResult.time}`);

      // TODO
      // this.metricManager.recordProperty(PropertyName., `${timeInMs}`);
    }

    if (this.arguments_.testMinimization) {
      // TODO
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
      const timedResult = await timer(() =>
        deDuplicator.execute(finalEncodings)
      );
      finalEncodings = timedResult.result;

      JavaScriptLauncher.LOGGER.info(
        `De-Duplication took: ${timedResult.time}`
      );
      this.userInterface.printSuccess(
        `De-Duplication took: ${timedResult.time}`
      );

      // TODO
      // this.metricManager.recordProperty(PropertyName., `${timeInMs}`);
    }

    if (this.arguments_.metaComments) {
      const metaCommenter = new MetaCommenter(
        this.userInterface,
        secondaryObjectives,
        objectives
      );

      const timedResult = await timer(() =>
        metaCommenter.execute(finalEncodings)
      );
      finalEncodings = timedResult.result;

      JavaScriptLauncher.LOGGER.info(
        `Meta-Commenting done took: ${timedResult.time}`
      );
      this.userInterface.printSuccess(
        `Meta-Commenting done took: ${timedResult.time}`
      );

      // TODO
      // this.metricManager.recordProperty(PropertyName., `${timeInMs}`);
    }

    const suiteBuilder = new JavaScriptSuiteBuilder(
      this.storageManager,
      this.decoder,
      this.runner
    );

    try {
      // gather assertions
      let paths = suiteBuilder.createSuite(
        finalEncodings,
        "../instrumented", // TODO fix hardcoded paths
        this.arguments_.testDirectory,
        true,
        false,
        false
      );
      await suiteBuilder.runSuite(finalEncodings, paths, true);

      // reset states
      this.storageManager.clearTemporaryDirectory([
        this.arguments_.testDirectory,
      ]);

      // get final results
      paths = suiteBuilder.createSuite(
        finalEncodings,
        "../instrumented", // TODO fix hardcoded paths
        this.arguments_.testDirectory,
        false,
        false,
        false
      );
      const results = await suiteBuilder.runSuite(finalEncodings, paths, false);
      const summaryTotal = suiteBuilder.summariseResults(results, this.targets);
      if (summaryTotal.failures > 0) {
        this.userInterface.printError(
          `${summaryTotal.failures} test case(s) have failed!`
        );
      }

      const table: TableObject = {
        headers: ["Target", "Statement", "Branch", "Function", "File"],
        rows: [],
        footers: ["Average"],
      };

      let coveredStatements = 0;
      let coveredBranches = 0;
      let coveredFunctions = 0;
      let totalStatements = 0;
      let totalBranches = 0;
      let totalFunctions = 0;

      for (const [target, summary] of summaryTotal.data.entries()) {
        table.rows.push([
          `${path.basename(target.path)}: ${target.name}`,
          `${summary["statement"].covered.size} / ${summary["statement"].total.size}`,
          `${summary["branch"].covered.size} / ${summary["branch"].total.size}`,
          `${summary["function"].covered.size} / ${summary["function"].total.size}`,
          target.path,
        ]);

        coveredStatements += summary["statement"].covered.size;
        coveredBranches += summary["branch"].covered.size;
        coveredFunctions += summary["function"].covered.size;

        totalStatements += summary["statement"].total.size;
        totalBranches += summary["branch"].total.size;
        totalFunctions += summary["function"].total.size;
      }

      this.userInterface.printHeader("SEARCH RESULTS");

      let statementPercentage = coveredStatements / totalStatements;
      if (totalStatements === 0) statementPercentage = 1;

      let branchPercentage = coveredBranches / totalBranches;
      if (totalBranches === 0) branchPercentage = 1;

      let functionPercentage = coveredFunctions / totalFunctions;
      if (totalFunctions === 0) functionPercentage = 1;

      table.footers.push(
        `${statementPercentage * 100} %`,
        `${branchPercentage * 100} %`,
        `${functionPercentage * 100} %`,
        ""
      );
      this.userInterface.printTable("Coverage", table);

      this.metricManager.recordProperty(
        PropertyName.STATEMENTS_COVERED,
        `${coveredStatements}`
      );
      this.metricManager.recordProperty(
        PropertyName.BRANCHES_COVERED,
        `${coveredBranches}`
      );
      this.metricManager.recordProperty(
        PropertyName.FUNCTIONS_COVERED,
        `${coveredFunctions}`
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
    } catch (error) {
      if (error === "timeout") {
        JavaScriptLauncher.LOGGER.error(
          "A timeout error occured during assertion gathering or final results processing, cannot calculate the final results unfortunately"
        );
      } else {
        throw error;
      }
    }

    // other results
    const archiveSizeBefore = [...this.archives.values()].reduce(
      (p, c) => p + c.size,
      0
    );
    this.metricManager.recordProperty(
      PropertyName.ARCHIVE_SIZE,
      `${archiveSizeBefore}`
    );
    const archiveSizeAfter = [...finalEncodings.values()].reduce(
      (p, c) => p + c.length,
      0
    );
    this.metricManager.recordProperty(
      PropertyName.MINIMIZED_ARCHIVE_SIZE,
      `${archiveSizeAfter}`
    );

    const originalSourceDirectory = path
      .join(
        "../../",
        path.relative(process.cwd(), this.arguments_.targetRootDirectory)
      )
      .replace(path.basename(this.arguments_.targetRootDirectory), "");

    // create final suite
    suiteBuilder.createSuite(
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

    const functionObjectives =
      extractFunctionObjectivesFromProgram<JavaScriptTestCase>(cfp);

    const branchObjectives =
      extractBranchObjectivesFromProgram<JavaScriptTestCase>(
        cfp,
        new ApproachLevelCalculator(),
        new BranchDistanceCalculator(
          this.arguments_.syntaxForgiving,
          this.arguments_.stringAlphabet
        ),
        this.arguments_.functionObjectivesEnabled
          ? functionObjectives
          : undefined
      );
    const pathObjectives = extractPathObjectivesFromProgram<JavaScriptTestCase>(
      cfp,
      new ApproachLevelCalculator(),
      new BranchDistanceCalculator(
        this.arguments_.syntaxForgiving,
        this.arguments_.stringAlphabet
      ),
      this.arguments_.functionObjectivesEnabled ? functionObjectives : undefined
    );

    this.userInterface.printTable("Objective Counts", {
      headers: ["Type", "Count", "Enabled"],
      rows: [
        [
          "function",
          `${functionObjectives.length}`,
          String(this.arguments_.functionObjectivesEnabled),
        ],
        [
          "branch",
          `${branchObjectives.length}`,
          String(this.arguments_.branchObjectivesEnabled),
        ],
        [
          "path",
          `${pathObjectives.length}`,
          String(this.arguments_.pathObjectivesEnabled),
        ],
      ],
    });

    if (
      !this.arguments_.functionObjectivesEnabled &&
      !this.arguments_.branchObjectivesEnabled &&
      !this.arguments_.pathObjectivesEnabled
    ) {
      JavaScriptLauncher.LOGGER.warn("All objectives are disabled!");
    }

    const objectives: ObjectiveFunction<JavaScriptTestCase>[] = [];

    if (this.arguments_.functionObjectivesEnabled) {
      objectives.push(...functionObjectives);
    }
    if (this.arguments_.branchObjectivesEnabled) {
      objectives.push(...branchObjectives);
    }
    if (this.arguments_.pathObjectivesEnabled) {
      objectives.push(...pathObjectives);
    }

    const currentSubject = new JavaScriptSubject(target, objectives);

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
