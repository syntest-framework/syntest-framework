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
import { Metric, MetricManager, MiddleWare } from "@syntest/metric";
import { MetricMiddlewarePlugin } from "@syntest/module";
import Yargs = require("yargs");

import { FileWriterMetricMiddleware } from "../middleware/FileWriterMetricMiddleware";

export class FileWriterMetricMiddlewarePlugin extends MetricMiddlewarePlugin {
  private metricManager: MetricManager;

  constructor(metricManager: MetricManager) {
    super(
      "FileWriterMetricMiddlewarePlugin",
      "A middleware that writes the metrics to a file."
    );
    this.metricManager = metricManager;
  }

  createMetricMiddleware(metrics: Metric[]): MiddleWare {
    return new FileWriterMetricMiddleware(
      metrics,
      this.metricManager.outputMetrics,
      (<StorageOptions>(<unknown>this.args)).metricsDirectory
    );
  }

  override getOptions(): Map<string, Yargs.Options> {
    // any tool can use this listener
    // any label can use this listener

    const map = new Map<string, Yargs.Options>();

    map.set("metrics-directory", {
      alias: [],
      default: "metrics",
      description:
        "The path where the csv's should be saved (within the syntest-directory)",
      group: OptionTypes.Storage,
      hidden: false,
      normalize: true,
      type: "string",
    });

    return map;
  }
}

export enum OptionTypes {
  Storage = "Storage Options:",
}

export type StorageOptions = {
  metricsDirectory: string;
};
