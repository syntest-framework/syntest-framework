/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
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
import { UserInterface } from "@syntest/cli-graphics";
import { EventListenerPlugin } from "@syntest/module";
import {
  BudgetManager,
  Encoding,
  Events,
  SearchAlgorithm,
  SearchSubject,
} from "@syntest/search";
import TypedEventEmitter from "typed-emitter";

export class SearchProgressBarListener extends EventListenerPlugin {
  private _userInterface: UserInterface;

  /**
   * Constructor.
   */
  constructor(userInterface: UserInterface) {
    super(
      "SearchProgressBarListener",
      "A listener that creates and updates a progress bar for the search process."
    );
    this._userInterface = userInterface;
  }

  setupEventListener(): void {
    (<TypedEventEmitter<Events>>process).on(
      "searchStart",
      <E extends Encoding>(
        searchAlgorithm: SearchAlgorithm<E>,
        subject: SearchSubject<E>,
        budgetManager: BudgetManager<E>
      ) => {
        this._userInterface.startProgressBars([
          {
            name: subject.name,
            value: 0,
            maxValue: subject.getObjectives().length,
            meta: `${budgetManager.getBudget()}`,
          },
        ]);
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "searchIterationComplete",
      <E extends Encoding>(
        searchAlgorithm: SearchAlgorithm<E>,
        subject: SearchSubject<E>,
        budgetManager: BudgetManager<E>
      ) => {
        const originalObjectives = subject.getObjectives();
        this._userInterface.updateProgressBar({
          name: subject.name,
          value: [
            ...searchAlgorithm.getObjectiveManager().getCoveredObjectives(),
          ].filter((coveredObjective) =>
            originalObjectives.find(
              (objective) =>
                objective.getIdentifier() === coveredObjective.getIdentifier()
            )
          ).length,
          maxValue: originalObjectives.length,
          meta: `${budgetManager.getBudget()}`,
        });
      }
    );
    (<TypedEventEmitter<Events>>process).on("searchComplete", () => {
      this._userInterface.stopProgressBars();
    });
  }
  override getOptions() {
    return new Map();
  }

  override getOptionChoices(): string[] {
    return [];
  }
}
