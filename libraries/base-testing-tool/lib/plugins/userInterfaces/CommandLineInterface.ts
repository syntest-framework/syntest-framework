/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core.
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

import { UserInterface } from "@syntest/cli";
import * as cliProgress from "cli-progress";

import TypedEventEmitter from "typed-emitter";
import {
  Events,
  SearchAlgorithm,
  BudgetManager,
  Encoding,
} from "@syntest/core";

export class CommandLineInterface extends UserInterface {
  protected showProgressBar: boolean;
  protected progressValue: number;
  protected budgetValue: number;
  protected bar: cliProgress.SingleBar;

  setupEventListener(): void {
    (<TypedEventEmitter<Events>>process).on(
      "searchInitializationStart",
      <E extends Encoding>(
        searchAlgorithm: SearchAlgorithm<E>,
        budgetManager: BudgetManager<E>
      ) => {
        this.startProgressBar();
        this.updateProgressBar(
          searchAlgorithm.progress("branch"),
          budgetManager.getBudget()
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "searchIterationComplete",
      <E extends Encoding>(
        searchAlgorithm: SearchAlgorithm<E>,
        budgetManager: BudgetManager<E>
      ) => {
        this.updateProgressBar(
          searchAlgorithm.progress("branch"),
          budgetManager.getBudget()
        );
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "searchComplete",
      <E extends Encoding>(
        searchAlgorithm: SearchAlgorithm<E>,
        budgetManager: BudgetManager<E>
      ) => {
        this.updateProgressBar(
          searchAlgorithm.progress("branch"),
          budgetManager.getBudget()
        );
        this.stopProgressBar();
      }
    );
  }

  startProgressBar(): void {
    this.showProgressBar = true;

    this.bar = new cliProgress.SingleBar({
      format: "Coverage: {bar} {percentage}% | Remaining budget: {budget}%",
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      hideCursor: true,
      synchronousUpdate: false,
    });

    this.bar.start(100, this.progressValue, {
      budget: "100",
    });
  }

  updateProgressBar(value: number, budget: number): void {
    this.progressValue = value;
    this.budgetValue = budget;

    this.bar.update(value, {
      budget: `${budget}`,
    });
  }

  stopProgressBar(): void {
    this.showProgressBar = false;
    this.bar.stop();
  }
}
