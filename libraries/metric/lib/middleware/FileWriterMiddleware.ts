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
import { MetricManager } from "../MetricManager";
import { MiddleWare } from "../Middleware";
import * as fs from "fs";
import * as csv from "@fast-csv/format";
import { Metric, PropertyMetric } from "../Metric";

export class FileWriterMiddleware extends MiddleWare {
  constructor(metrics: Metric[], outputMetrics: Metric[]) {
    super(metrics, outputMetrics);
  }

  run(metricManager: MetricManager): void {
    // const filePath = metricManager.

    const properties = metricManager.collectProperties(
      <PropertyMetric[]>(
        this.outputMetrics.filter((metric) => metric.type === "property")
      )
    );

    this.writePropertiesToCSV("", properties);
  }

  writePropertiesToCSV(
    filePath: string,
    properties: Map<string, string>
  ): void {
    // Create a write stream in append mode
    const ws = fs.createWriteStream(filePath, { flags: "a" });

    // Write the data to the stream and add headers when the file does not exist
    csv.writeToStream(ws, [properties], {
      headers: !fs.existsSync(filePath),
      includeEndRowDelimiter: true,
    });
  }

  writeSeriesToCSV(metrics: Metric[]): string {
    let csv = "";
    for (const metric of metrics) {
      csv += metric.name + ",";
    }
    csv += "\n";
    for (const metric of metrics) {
      csv += metric.value + ",";
    }
    csv += "\n";
    return csv;
  }
}
