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

import { Metric, MetricManager, MetricType, Middleware } from "@syntest/metric";
import { MetricMiddlewarePlugin } from "@syntest/module";
import Yargs = require("yargs");

import { StatisticsMetricMiddleware } from "../middleware/StatisticsMetricMiddleware";
import { AUC } from "../statistics/AUC";
import { Statistic } from "../statistics/Statistic";

export class StatisticsMetricMiddlewarePlugin extends MetricMiddlewarePlugin {
  private metricManager: MetricManager;
  private statisticGenerators: Statistic[];

  constructor(metricManager: MetricManager) {
    super(
      "statistics",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-var-requires, unicorn/prefer-module, @typescript-eslint/no-unsafe-member-access
      require("../../../package.json").description
    );
    this.metricManager = metricManager;
  }

  createMetricMiddleware(metrics: Metric[]): Middleware {
    const statistics = (<StatisticsOptions>(<unknown>this.args))
      .statisticsMetrics;

    this.statisticGenerators = [];

    for (const statistic of statistics) {
      if (statistic === "AUC") {
        this.statisticGenerators.push(new AUC());
      }
    }

    return new StatisticsMetricMiddleware(
      this.metricManager,
      metrics,
      this.statisticGenerators
    );
  }

  override getOptions(): Map<string, Yargs.Options> {
    // any tool can use this listener
    // any label can use this listener

    const map = new Map<string, Yargs.Options>();

    // configure which statistics you want
    map.set("metrics", {
      alias: [],
      default: ["AUC"],
      choices: ["AUC"],
      description: "The types of statistics you want generated",
      group: OptionTypes.Statistics,
      hidden: false,
      normalize: true,
      type: "array",
    });

    return map;
  }

  override getMetrics(): Promise<Metric[]> | Metric[] {
    // TODO make sure the args are processed before the get metrics is called such that we can check which metrics are available
    const metrics: Metric[] = this.metrics;

    const newMetrics: Metric[] = [];

    for (const statistic of (<StatisticsOptions>(<unknown>this.args))
      .statisticsMetrics) {
      if (statistic === "AUC") {
        for (const metric of metrics) {
          if (metric.type !== MetricType.SERIES) {
            continue;
          }

          newMetrics.push({
            type: MetricType.PROPERTY,
            name: `${statistic}-${metric.name}-${metric.seriesUnit}`,
          });
        }
      }
    }

    return newMetrics;
  }
}

export enum OptionTypes {
  Statistics = "Statistics Options:",
}

export type StatisticsOptions = {
  statisticsMetrics: string[];
};
