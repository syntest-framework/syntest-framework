/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Framework.
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

import { Metric, MetricManager, Middleware } from "@syntest/metric";
import { ExtensionAPI, MetricMiddlewarePlugin } from "@syntest/module";
import { StorageManager } from "@syntest/storage";
import Yargs = require("yargs");

import { FileWriterMetricMiddleware } from "../middleware/FileWriterMetricMiddleware";

export class FileWriterMetricMiddlewarePlugin extends MetricMiddlewarePlugin {
  private metricManager: MetricManager;
  private storageManager: StorageManager;
  private args: unknown;

  constructor() {
    super(
      "file-writer",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-var-requires, unicorn/prefer-module, @typescript-eslint/no-unsafe-member-access
      require("../../../package.json").description
    );
  }

  public override setup(extensionApi: ExtensionAPI): void {
    this.metricManager = extensionApi.metricManager;
    this.storageManager = extensionApi.storageManager;
    this.args = extensionApi.config;
  }

  createMetricMiddleware(metrics: Metric[]): Middleware {
    return new FileWriterMetricMiddleware(
      this.metricManager,
      metrics,
      (<StorageOptions>this.args).fid,
      this.storageManager,
      (<StorageOptions>this.args).fileWriterMetricsDirectory
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
  fid: string;
  fileWriterMetricsDirectory: string;
};
