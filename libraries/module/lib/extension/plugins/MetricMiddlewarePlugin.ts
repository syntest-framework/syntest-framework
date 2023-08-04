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
import { Metric, MiddleWare } from "@syntest/metric";

import { Plugin } from "../Plugin";

import { PluginType } from "./PluginType";

export abstract class MetricMiddlewarePlugin extends Plugin {
  protected metrics: Metric[];

  constructor(name: string, describe: string) {
    super(PluginType.METRIC_MIDDLEWARE, name, describe);
  }

  abstract createMetricMiddleware(metrics: Metric[]): MiddleWare;

  setMetrics(metrics: Metric[]): void {
    this.metrics = metrics;
  }

  override getOptionChoices(option: string): string[] {
    // for every tool/label

    if (option === "metric-middleware-pipeline") {
      return [this.name];
    }

    return [];
  }
}
