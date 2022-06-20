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
 * Writer for the coverage over time statistics.
 *
 * @author Mitchell Olsthoorn
 */
export class CoverageWriter<T extends Encoding> {
  protected VARIABLES: RuntimeVariable[] = [RuntimeVariable.SUBJECT];

  protected EVENT_VARIABLES: RuntimeVariable[] = [
    RuntimeVariable.COVERED_BRANCHES,
    RuntimeVariable.TOTAL_BRANCHES,
    RuntimeVariable.BRANCH_COVERAGE,

    RuntimeVariable.COVERED_FUNCTIONS,
    RuntimeVariable.TOTAL_FUNCTIONS,
    RuntimeVariable.FUNCTION_COVERAGE,

    RuntimeVariable.COVERED_EXCEPTIONS,

    RuntimeVariable.COVERED_PROBES,
    RuntimeVariable.TOTAL_PROBES,
    RuntimeVariable.PROBE_COVERAGE,

    RuntimeVariable.COVERED_OBJECTIVES,
    RuntimeVariable.TOTAL_OBJECTIVES,
    RuntimeVariable.COVERAGE,
  ];

  /**
   * Write the coverage statistics to file.
   *
   * @param collector The collector for the statistics
   * @param filePath The file path to write to
   */
  write(collector: StatisticsCollector<T>, filePath: string) {
    const staticVariables = collector.getVariables();
    const events = collector.getEventVariables();

    const data = [];
    const lastVariableValues = new Map<RuntimeVariable, any>();

    // Loop over all recorded times
    for (const time of events.keys()) {
      const event = events.get(time);

      const row = {};

      // Add time
      row["TIME"] = time;

      // For each enabled static statistic, copy the data from the collector over
      this.VARIABLES.forEach((variable) => {
        row[RuntimeVariable[variable]] = staticVariables.get(variable);
      });

      // For each enabled event statistic, copy the data from the collector over
      this.EVENT_VARIABLES.forEach((variable) => {
        // If the variable exists in the collector use it, otherwise get the last value
        if (event.has(variable)) {
          const value = event.get(variable);
          row[RuntimeVariable[variable]] = value;

          // Update last values
          if (
            !lastVariableValues.has(variable) ||
            value != lastVariableValues.get(variable)
          ) {
            lastVariableValues.set(variable, value);
          }
        } else {
          if (lastVariableValues.has(variable)) {
            row[RuntimeVariable[variable]] = lastVariableValues.get(variable);
          } else {
            row[RuntimeVariable[variable]] = null;
          }
        }
      });

      data.push(row);
    }

    // Create a write stream in append mode
    const ws = fs.createWriteStream(filePath, { flags: "a" });

    // Write the data to the stream and add headers when the file does not exist
    csv.writeToStream(ws, data, {
      headers: !fs.existsSync(filePath),
      includeEndRowDelimiter: true,
    });
  }
}
