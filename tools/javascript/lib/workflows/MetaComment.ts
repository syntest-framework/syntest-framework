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
import { Archive, ExceptionObjectiveFunction } from "@syntest/search";
import { JavaScriptTestCase } from "@syntest/search-javascript";

export function addMetaComments(
  archives: Map<Target, Archive<JavaScriptTestCase>>
) {
  for (const [, archive] of archives) {
    const encodings = archive.getEncodings();
    for (const encoding of encodings) {
      const uses = archive.getUses(encoding);
      for (const use of uses) {
        if (use instanceof ExceptionObjectiveFunction) {
          encoding.addMetaComment(`Selected for:`);
          for (const line of use.error.stack.split("\n")) {
            encoding.addMetaComment(`\t${line}`);
          }
          encoding.addMetaComment("");
        } else {
          encoding.addMetaComment(
            `Selected for objective: ${use.getIdentifier()}`
          );
        }
      }

      const executionResult = encoding.getExecutionResult();
      if (executionResult) {
        for (const objective of archive.getObjectives()) {
          if (objective.calculateDistance(encoding) === 0) {
            encoding.addMetaComment(
              `Covers objective: ${objective.getIdentifier()}`
            );
          }
        }
      }
    }
  }
}
