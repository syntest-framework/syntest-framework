/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest JavaScript.
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
import { Target } from "@syntest/analysis-javascript";
import { UserInterface } from "@syntest/cli-graphics";
import { IllegalStateError } from "@syntest/diagnostics";
import { getLogger, Logger } from "@syntest/logging";
import {
  Archive,
  ObjectiveFunction,
  SecondaryObjectiveComparator,
} from "@syntest/search";
import { JavaScriptTestCase } from "@syntest/search-javascript";

import { Workflow } from "./Workflow";

export class DeDuplicator implements Workflow {
  protected static LOGGER: Logger;

  protected userInterface: UserInterface;
  protected secondaryObjectives: SecondaryObjectiveComparator<JavaScriptTestCase>[];
  protected objectivesMap: Map<Target, ObjectiveFunction<JavaScriptTestCase>[]>;

  constructor(
    userInterface: UserInterface,
    secondaryObjectives: SecondaryObjectiveComparator<JavaScriptTestCase>[],
    objectivesMap: Map<Target, ObjectiveFunction<JavaScriptTestCase>[]>
  ) {
    DeDuplicator.LOGGER = getLogger(DeDuplicator.name);
    this.userInterface = userInterface;
    this.secondaryObjectives = secondaryObjectives;
    this.objectivesMap = objectivesMap;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  execute(
    encodingsMap: Map<Target, JavaScriptTestCase[]>
  ): Promise<Map<Target, JavaScriptTestCase[]>> {
    DeDuplicator.LOGGER.info("De-Duplication started");
    const before = [...encodingsMap.values()].reduce((p, c) => p + c.length, 0);

    const totalEncodings = [...encodingsMap.values()].reduce(
      (counter, value) => counter + value.length,
      0
    );
    this.userInterface.startProgressBars([
      {
        name: `De-Duplication`,
        value: 0,
        maxValue: totalEncodings,
        meta: "",
      },
    ]);

    let count = 1;
    const archives = new Map<Target, Archive<JavaScriptTestCase>>();
    for (const [target, encodings] of encodingsMap.entries()) {
      const objectives = this.objectivesMap.get(target);

      const archive = new Archive<JavaScriptTestCase>();
      archives.set(target, archive);

      for (const encoding of encodings) {
        this.userInterface.updateProgressBar({
          name: `De-Duplication`,
          value: count++,
          maxValue: totalEncodings,
          meta: "",
        });

        if (!encoding.getExecutionResult()) {
          throw new IllegalStateError(
            "Invalid encoding without executionResult"
          );
        }

        for (const objective of objectives) {
          if (objective.calculateDistance(encoding) === 0) {
            if (!archive.hasObjective(objective)) {
              DeDuplicator.LOGGER.debug("Adding new encoding to archive");
              archive.update(objective, encoding, false);
              continue;
            }

            // If the objective is already in the archive we use secondary objectives
            const currentEncoding = archive.getEncoding(objective);

            // Look at secondary objectives when two solutions are found
            for (const secondaryObjective of this.secondaryObjectives) {
              const comparison = secondaryObjective.compare(
                encoding,
                currentEncoding
              );

              // If one of the two encodings is better, don't evaluate the next objectives
              if (comparison != 0) {
                // Override the encoding if the current one is better
                if (comparison > 0) {
                  DeDuplicator.LOGGER.debug(
                    "Overwriting archive with better encoding"
                  );

                  archive.update(objective, encoding, false);
                }
                break;
              }
            }
          }
        }
      }
    }

    this.userInterface.stopProgressBars();
    const finalEncodings = new Map<Target, JavaScriptTestCase[]>(
      [...archives.entries()].map(([target, archive]) => [
        target,
        archive.getEncodings(),
      ])
    );
    const after = [...finalEncodings.values()].reduce(
      (p, c) => p + c.length,
      0
    );

    DeDuplicator.LOGGER.info(
      `De-Duplication done, went from ${before} to ${after} test cases`
    );
    this.userInterface.printSuccess(
      `De-Duplication done, went from ${before} to ${after} test cases`
    );

    return new Promise((resolve) => resolve(finalEncodings));
  }
}
