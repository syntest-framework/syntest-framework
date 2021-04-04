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
    RuntimeVariable.SEED,
    RuntimeVariable.COVERAGE,
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
    csv.writeToStream(ws, [data], { headers: !fs.existsSync(filePath) });
  }
}
