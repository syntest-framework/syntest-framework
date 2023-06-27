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
import * as path from "node:path";

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

export class SearchPerformanceListener extends EventListenerPlugin {
  private _userInterface: UserInterface;

  constructor(userInterface: UserInterface) {
    super(
      "SearchPerformanceListener",
      "A listener that shows the performance of the search algorithm."
    );
    this._userInterface = userInterface;
  }

  setupEventListener(): void {
    (<TypedEventEmitter<Events>>process).on(
      "searchStart",
      <E extends Encoding>(
        searchAlgorithm: SearchAlgorithm<E>,
        _subject: SearchSubject<E>,
        _budgetManager: BudgetManager<E>
      ) => {
        const objectives = searchAlgorithm
          .getObjectiveManager()
          .getCurrentObjectives();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const objectivePerformance =
          searchAlgorithm.calculateObjectivePerformance([...objectives]);

        for (const [objective, distance] of objectivePerformance) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          const objectiveName = objective.getIdentifier().split(path.sep).pop();
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          this._userInterface.printBold(`${objectiveName}: ${distance}`);
        }
      }
    );

    (<TypedEventEmitter<Events>>process).on(
      "searchIterationComplete",
      <E extends Encoding>(
        searchAlgorithm: SearchAlgorithm<E>,
        _subject: SearchSubject<E>,
        _budgetManager: BudgetManager<E>
      ) => {
        const objectives = searchAlgorithm
          .getObjectiveManager()
          .getCurrentObjectives();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const objectivePerformance =
          searchAlgorithm.calculateObjectivePerformance([...objectives]);

        for (const [objective, distance] of objectivePerformance) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          const objectiveName = objective.getIdentifier().split(path.sep).pop();
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          this._userInterface.printBold(`${objectiveName}: ${distance}`);
        }
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
