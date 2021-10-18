/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
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

import { Encoding } from "../search/Encoding";
import { StatisticsCollector } from "./StatisticsCollector";
import * as csv from "@fast-csv/format";
import { RuntimeVariable } from "./RuntimeVariable";
import * as fs from "fs";

/**
 * Writer for the summary statistics.
 *
 * @author Mitchell Olsthoorn
 */
export class SummaryWriter<T extends Encoding> {
  protected VARIABLES: RuntimeVariable[] = [
    RuntimeVariable.SUBJECT,
    RuntimeVariable.CONFIGURATION,
    RuntimeVariable.SEED,
    RuntimeVariable.ALGORITHM,
    RuntimeVariable.PROBE_ENABLED,
    RuntimeVariable.CONSTANT_POOL_ENABLED,
    RuntimeVariable.COVERAGE,
    RuntimeVariable.COVERED_BRANCHES,
    RuntimeVariable.TOTAL_BRANCHES,
    RuntimeVariable.BRANCH_COVERAGE,
    RuntimeVariable.COVERED_LINES,
    RuntimeVariable.TOTAL_LINES,
    RuntimeVariable.LINE_COVERAGE,
    RuntimeVariable.COVERED_FUNCTIONS,
    RuntimeVariable.TOTAL_FUNCTIONS,
    RuntimeVariable.FUNCTION_COVERAGE,
    RuntimeVariable.COVERED_PROBES,
    RuntimeVariable.TOTAL_PROBES,
    RuntimeVariable.PROBE_COVERAGE,
    RuntimeVariable.INITIALIZATION_TIME,
    RuntimeVariable.SEARCH_TIME,
    RuntimeVariable.TOTAL_TIME,
    RuntimeVariable.ITERATIONS,
    RuntimeVariable.EVALUATIONS,
    RuntimeVariable.VERSION,
  ];

  /**
   * Write the summary statistics to file.
   *
   * @param collector The collector for the statistics
   * @param filePath The file path to write to
   */
  public write(collector: StatisticsCollector<T>, filePath: string): void {
    const variables = collector.getVariables();

    // For each enabled statistic, copy the data from the collector over
    const data = {};
    this.VARIABLES.forEach((variable) => {
      data[RuntimeVariable[variable]] = variables.get(variable);
    });

    // Create a write stream in append mode
    const ws = fs.createWriteStream(filePath, { flags: "a" });

    // Write the data to the stream and add headers when the file does not exist
    csv.writeToStream(ws, [data], {
      headers: !fs.existsSync(filePath),
      includeEndRowDelimiter: true,
    });
  }
}
