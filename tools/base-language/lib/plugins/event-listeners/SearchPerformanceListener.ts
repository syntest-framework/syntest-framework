/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Framework.
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

import { getLogger, Logger } from "@syntest/logging";
import { EventListenerPlugin } from "@syntest/module";
import {
  BudgetManager,
  Encoding,
  Events,
  ObjectiveFunction,
  SearchAlgorithm,
  SearchSubject,
} from "@syntest/search";
import TypedEventEmitter from "typed-emitter";

export class SearchPerformanceListener extends EventListenerPlugin {
  protected static LOGGER: Logger;

  constructor() {
    super(
      "SearchPerformanceListener",
      "A listener that outputs the performance of the search algorithm."
    );
    SearchPerformanceListener.LOGGER = getLogger("SearchPerformanceListener");
  }

  setupEventListener(): void {
    (<TypedEventEmitter<Events>>process).on(
      "searchStart",
      <E extends Encoding>(
        searchAlgorithm: SearchAlgorithm<E>,
        _subject: SearchSubject<E>,
        _budgetManager: BudgetManager<E>
      ) => {
        const objectives: Set<ObjectiveFunction<E>> = searchAlgorithm
          .getObjectiveManager()
          .getCurrentObjectives();
        const objectivePerformance =
          searchAlgorithm.calculateObjectivePerformance([...objectives]);

        SearchPerformanceListener.LOGGER.info("Objective performance:");
        for (const [objective, distance] of objectivePerformance) {
          const objectiveName = objective.getIdentifier().split(path.sep).pop();
          SearchPerformanceListener.LOGGER.info(
            `${objectiveName}: ${distance} (lowest: ${objective.getLowestDistance()})`
          );
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

        SearchPerformanceListener.LOGGER.info("Objective performance:");
        for (const [objective, distance] of objectivePerformance) {
          const objectiveName = objective.getIdentifier().split(path.sep).pop();
          SearchPerformanceListener.LOGGER.info(
            `${objectiveName}: ${distance} (lowest: ${objective.getLowestDistance()})`
          );
        }
      }
    );
  }

  override getOptions() {
    return new Map();
  }

  override getOptionChoices(): string[] {
    return [];
  }
}
