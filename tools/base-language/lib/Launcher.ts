/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
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

import { UserInterface } from "@syntest/cli-graphics";
import { MetricManager } from "@syntest/metric";
import { ModuleManager } from "@syntest/module";
import { StorageManager } from "@syntest/storage";
import TypedEventEmitter from "typed-emitter";

import { ArgumentsObject } from "./Configuration";
import { PropertyName } from "./Metrics";
import { Events } from "./util/Events";

export abstract class Launcher {
  protected arguments_: ArgumentsObject;

  protected moduleManager: ModuleManager;
  protected metricManager: MetricManager;
  protected storageManager: StorageManager;
  protected userInterface: UserInterface;

  constructor(
    arguments_: ArgumentsObject,
    moduleManager: ModuleManager,
    metricManager: MetricManager,
    storageManager: StorageManager,
    userInterface: UserInterface
  ) {
    this.arguments_ = arguments_;
    this.moduleManager = moduleManager;
    this.metricManager = metricManager;
    this.storageManager = storageManager;
    this.userInterface = userInterface;
  }

  public async run(): Promise<void> {
    try {
      this.registerProperties();
      (<TypedEventEmitter<Events>>process).emit("initializeStart");
      await this.initialize();
      (<TypedEventEmitter<Events>>process).emit("initializeComplete");
      (<TypedEventEmitter<Events>>process).emit("preprocessStart");
      await this.preprocess();
      (<TypedEventEmitter<Events>>process).emit("preprocessComplete");
      (<TypedEventEmitter<Events>>process).emit("processStart");
      await this.process();
      (<TypedEventEmitter<Events>>process).emit("processComplete");
      (<TypedEventEmitter<Events>>process).emit("postprocessStart");
      await this.postprocess();
      (<TypedEventEmitter<Events>>process).emit("postprocessComplete");
      (<TypedEventEmitter<Events>>process).emit("exitting");
      await this.exit();
    } catch (error) {
      console.log(error);
      console.trace(error);
      await this.exit();
    }
  }

  protected registerProperties() {
    this.metricManager.recordProperty(
      PropertyName.PRESET,
      `${this.arguments_.preset}`
    );

    this.metricManager.recordProperty(
      PropertyName.TARGET_ROOT_DIRECTORY,
      `${this.arguments_.targetRootDirectory}`
    );
    this.metricManager.recordProperty(
      PropertyName.INCLUDE,
      `[${this.arguments_.include.join(", ")}]`
    );
    this.metricManager.recordProperty(
      PropertyName.EXCLUDE,
      `[${this.arguments_.exclude.join(", ")}]`
    );

    this.metricManager.recordProperty(
      PropertyName.SEARCH_ALGORITHM,
      `${this.arguments_.searchAlgorithm}`
    );
    this.metricManager.recordProperty(
      PropertyName.POPULATION_SIZE,
      `${this.arguments_.populationSize}`
    );
    this.metricManager.recordProperty(
      PropertyName.OBJECTIVE_MANAGER,
      `${this.arguments_.objectiveManager}`
    );
    this.metricManager.recordProperty(
      PropertyName.SECONDARY_OBJECTIVES,
      `[${this.arguments_.secondaryObjectives.join(", ")}]`
    );
    this.metricManager.recordProperty(
      PropertyName.PROCREATION,
      `${this.arguments_.procreation}`
    );
    this.metricManager.recordProperty(
      PropertyName.CROSSOVER,
      `${this.arguments_.crossover}`
    );
    this.metricManager.recordProperty(
      PropertyName.SAMPLER,
      `${this.arguments_.sampler}`
    );
    this.metricManager.recordProperty(
      PropertyName.TERMINATION_TRIGGERS,
      `[${this.arguments_.terminationTriggers.join(", ")}]`
    );

    this.metricManager.recordProperty(
      PropertyName.MAX_TOTAL_TIME,
      `${this.arguments_.totalTime}`
    );
    this.metricManager.recordProperty(
      PropertyName.MAX_SEARCH_TIME,
      `${this.arguments_.searchTime}`
    );
    this.metricManager.recordProperty(
      PropertyName.MAX_EVALUATIONS,
      `${this.arguments_.evaluations}`
    );
    this.metricManager.recordProperty(
      PropertyName.MAX_ITERATIONS,
      `${this.arguments_.iterations}`
    );

    this.metricManager.recordProperty(
      PropertyName.TEST_MINIMIZATION,
      `${this.arguments_.testMinimization.toString()}`
    );

    this.metricManager.recordProperty(
      PropertyName.RANDOM_SEED,
      `${this.arguments_.randomSeed.toString()}`
    );
    this.metricManager.recordProperty(
      PropertyName.MAX_DEPTH,
      `${this.arguments_.maxDepth.toString()}`
    );
    this.metricManager.recordProperty(
      PropertyName.MAX_ACTION_STATEMENTS,
      `${this.arguments_.maxActionStatements.toString()}`
    );
    this.metricManager.recordProperty(
      PropertyName.EXPLORE_ILLEGAL_VALUES,
      `${this.arguments_.exploreIllegalValues.toString()}`
    );
    this.metricManager.recordProperty(
      PropertyName.DELTA_MUTATION_PROBABILITY,
      `${this.arguments_.deltaMutationProbability.toString()}`
    );
    this.metricManager.recordProperty(
      PropertyName.MULTI_POINT_CROSSOVER_PROBABILITY,
      `${this.arguments_.multiPointCrossoverProbability.toString()}`
    );
    this.metricManager.recordProperty(
      PropertyName.CROSSOVER_PROBABILITY,
      `${this.arguments_.crossoverProbability.toString()}`
    );
    this.metricManager.recordProperty(
      PropertyName.STRING_ALPHABET,
      `${this.arguments_.stringAlphabet.toString()}`
    );
    this.metricManager.recordProperty(
      PropertyName.STRING_MAX_LENGTH,
      `${this.arguments_.stringMaxLength.toString()}`
    );
    this.metricManager.recordProperty(
      PropertyName.NUMERIC_MAX_VALUE,
      `${this.arguments_.numericMaxValue.toString()}`
    );

    this.metricManager.recordProperty(
      PropertyName.CONFIGURATION,
      `${this.arguments_.configuration.toString()}`
    );
  }

  abstract initialize(): Promise<void>;
  abstract preprocess(): Promise<void>;
  abstract process(): Promise<void>;
  abstract postprocess(): Promise<void>;
  abstract exit(): Promise<void>;
}
