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
  protected VARIABLES: RuntimeVariable[] = [
    RuntimeVariable.SUBJECT,
    RuntimeVariable.COVERAGE,
  ];

  /**
   * Write the coverage statistics to file.
   *
   * @param collector The collector for the statistics
   * @param filePath The file path to write to
   */
  write(collector: StatisticsCollector<T>, filePath: string) {
    const variables = collector.getEventVariables();

    const data = [];

    const variableCounter = {};

    // Initialize counters
    this.VARIABLES.forEach((variable) => {
      variableCounter[variable] = 0;
    });

    // Loop over all recorded times
    for (const time of variables.keys()) {
      const row = {};

      // Add time
      row["TIME"] = time;

      // For each enabled statistic, copy the data from the collector over
      const eventVariable = variables.get(time);
      this.VARIABLES.forEach((variable) => {
        // If the variable exists in the collector use it, otherwise get the last value
        if (eventVariable.has(variable)) {
          const value = eventVariable.get(variable);
          row[RuntimeVariable[variable]] = value;

          // Update last values
          if (value != variableCounter[variable]) {
            variableCounter[variable] = value;
          }
        } else {
          row[RuntimeVariable[variable]] = variableCounter[variable];
        }
      });

      data.push(row);
    }

    // Create a write stream in append mode
    const ws = fs.createWriteStream(filePath, { flags: "a" });

    // Write the data to the stream and add headers when the file does not exist
    csv.writeToStream(ws, data, { headers: !fs.existsSync(filePath) });
  }
}
