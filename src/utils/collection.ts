/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
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

import * as path from "path";
import {
  Archive,
  EvaluationBudget,
  ExceptionObjectiveFunction,
  ExecutionResult,
  getSeed,
  IterationBudget,
  RuntimeVariable,
  SearchTimeBudget,
  StatisticsCollector,
  TotalTimeBudget,
  Encoding,
  CONFIG,
} from "@syntest/core";
import { JavaScriptSubject } from "../search/JavaScriptSubject";

export function collectInitialVariables<T extends Encoding>(
  collector: StatisticsCollector<T>,
  currentSubject: JavaScriptSubject,
  targetPath: string
) {
  collector.recordVariable(RuntimeVariable.VERSION, "1");
  collector.recordVariable(RuntimeVariable.CONFIGURATION, CONFIG.configuration);
  collector.recordVariable(RuntimeVariable.SEED, getSeed());
  collector.recordVariable(RuntimeVariable.SUBJECT, path.basename(targetPath));
  collector.recordVariable(
    RuntimeVariable.CONSTANT_POOL_ENABLED,
    `${CONFIG.constantPool}`
  );
  collector.recordVariable(RuntimeVariable.ALGORITHM, CONFIG.algorithm);
  collector.recordVariable(
    RuntimeVariable.TOTAL_OBJECTIVES,
    `${currentSubject.getObjectives().length}`
  );
}

export function collectStatistics<T extends Encoding>(
  collector: StatisticsCollector<T>,
  currentSubject: JavaScriptSubject,
  archive: Archive<T>,
  totalTimeBudget: TotalTimeBudget<T>,
  searchBudget: SearchTimeBudget<T>,
  iterationBudget: IterationBudget<T>,
  evaluationBudget: EvaluationBudget<T>
) {
  collector.recordVariable(
    RuntimeVariable.COVERED_OBJECTIVES,
    `${archive.getObjectives().length}`
  );

  collector.recordVariable(
    RuntimeVariable.INITIALIZATION_TIME,
    `${totalTimeBudget.getUsedBudget() - searchBudget.getUsedBudget()}`
  );
  collector.recordVariable(
    RuntimeVariable.SEARCH_TIME,
    `${searchBudget.getUsedBudget()}`
  );
  collector.recordVariable(
    RuntimeVariable.TOTAL_TIME,
    `${totalTimeBudget.getUsedBudget()}`
  );
  collector.recordVariable(
    RuntimeVariable.ITERATIONS,
    `${iterationBudget.getUsedBudget()}`
  );
  collector.recordVariable(
    RuntimeVariable.EVALUATIONS,
    `${evaluationBudget.getUsedBudget()}`
  );

  const numOfExceptions = archive
    .getObjectives()
    .filter(
      (objective) => objective instanceof ExceptionObjectiveFunction
    ).length;

  collector.recordVariable(
    RuntimeVariable.COVERED_EXCEPTIONS,
    `${numOfExceptions}`
  );

  collector.recordVariable(
    RuntimeVariable.COVERAGE,
    `${
      (archive.getObjectives().length - numOfExceptions) /
      currentSubject.getObjectives().length
    }`
  );
}

export function collectCoverageData<T extends Encoding>(
  collector: StatisticsCollector<T>,
  archive: Archive<T>,
  objectiveType: string
): void {
  const total = new Set();
  const covered = new Set();

  for (const key of archive.getObjectives()) {
    const test = archive.getEncoding(key);
    const result: ExecutionResult = test.getExecutionResult();
    // TODO this does not work when there are files with the same name in different directories!!
    const paths = key.getSubject().path.split("/");
    const fileName = paths[paths.length - 1];

    result
      .getTraces()
      .filter((element) => element.type.includes(objectiveType))
      .filter((element) => element.path.includes(fileName))
      .forEach((current) => {
        total.add(current.id + "_" + current.branchType);

        if (current.hits > 0)
          covered.add(current.id + "_" + current.branchType);
      });
  }

  switch (objectiveType) {
    case "branch":
      {
        collector.recordVariable(
          RuntimeVariable.COVERED_BRANCHES,
          `${covered.size}`
        );
        collector.recordVariable(
          RuntimeVariable.TOTAL_BRANCHES,
          `${total.size}`
        );

        if (total.size > 0.0) {
          collector.recordVariable(
            RuntimeVariable.BRANCH_COVERAGE,
            `${covered.size / total.size}`
          );
        } else {
          collector.recordVariable(RuntimeVariable.BRANCH_COVERAGE, "0");
        }
      }
      break;
    case "statement":
      {
        collector.recordVariable(
          RuntimeVariable.COVERED_LINES,
          `${covered.size}`
        );
        collector.recordVariable(RuntimeVariable.TOTAL_LINES, `${total.size}`);

        if (total.size > 0.0) {
          collector.recordVariable(
            RuntimeVariable.LINE_COVERAGE,
            `${covered.size / total.size}`
          );
        } else {
          collector.recordVariable(RuntimeVariable.LINE_COVERAGE, "0");
        }
      }
      break;
    case "function":
      {
        collector.recordVariable(
          RuntimeVariable.COVERED_FUNCTIONS,
          `${covered.size}`
        );
        collector.recordVariable(
          RuntimeVariable.TOTAL_FUNCTIONS,
          `${total.size}`
        );

        if (total.size > 0.0) {
          collector.recordVariable(
            RuntimeVariable.FUNCTION_COVERAGE,
            `${covered.size / total.size}`
          );
        } else {
          collector.recordVariable(RuntimeVariable.FUNCTION_COVERAGE, "0");
        }
      }
      break;
  }
}
