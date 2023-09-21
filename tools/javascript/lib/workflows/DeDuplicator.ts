/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
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
import { getLogger, Logger } from "@syntest/logging";
import {
  Archive,
  ObjectiveFunction,
  SecondaryObjectiveComparator,
} from "@syntest/search";
import { JavaScriptTestCase } from "@syntest/search-javascript";

export class DeDuplicator {
  protected static LOGGER: Logger;
  constructor() {
    DeDuplicator.LOGGER = getLogger("DeDuplicator");
  }

  deDuplicate(
    secondaryObjectives: SecondaryObjectiveComparator<JavaScriptTestCase>[],
    objectivesMap: Map<Target, ObjectiveFunction<JavaScriptTestCase>[]>,
    encodingsMap: Map<Target, JavaScriptTestCase[]>
  ): Map<Target, Archive<JavaScriptTestCase>> {
    const archives = new Map<Target, Archive<JavaScriptTestCase>>();
    for (const [target, encodings] of encodingsMap.entries()) {
      const objectives = objectivesMap.get(target);

      const archive = new Archive<JavaScriptTestCase>();
      archives.set(target, archive);

      for (const encoding of encodings) {
        const executionResult = encoding.getExecutionResult();

        if (!executionResult) {
          throw new Error("Invalid encoding without executionResult");
        }

        for (const objective of objectives) {
          if (executionResult.coversId(objective.getIdentifier())) {
            if (!archive.hasObjective(objective)) {
              DeDuplicator.LOGGER.debug("Adding new encoding to archive");
              archive.update(objective, encoding, false);
              continue;
            }

            // If the objective is already in the archive we use secondary objectives
            const currentEncoding = archive.getEncoding(objective);

            // Look at secondary objectives when two solutions are found
            for (const secondaryObjective of secondaryObjectives) {
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

    return archives;
  }
}
