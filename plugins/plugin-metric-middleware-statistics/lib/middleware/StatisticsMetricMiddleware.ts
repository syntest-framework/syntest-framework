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

import { Statistic } from "../statistics/Statistic";

export class StatisticsMetricMiddleware extends Middleware {
  private statistics: Statistic[];

  constructor(
    metricManager: MetricManager,
    metrics: Metric[],
    statistics: Statistic[],
  ) {
    super(metricManager, metrics);

    this.statistics = statistics;
  }

  run(metricManager: MetricManager): void {
    if (metricManager.namespace !== "global") {
      return;
    }
    const namespaces = [...metricManager.namespacedManagers.keys()];
    // process all namespaces
    for (const namespace of namespaces) {
      // get the merged manager (global + local)
      const mergedManager = metricManager.getMergedNamespacedManager(namespace);

      const properties = mergedManager.getAllProperties();

      const distributions = mergedManager.getAllDistributions();

      const series = mergedManager.getAllSeries();

      const seriesDistributions = mergedManager.getAllSeriesDistributions();
      const seriesMeasurements = mergedManager.getAllSeriesMeasurements();

      for (const statistic of this.statistics) {
        statistic.generate(
          metricManager,
          properties,
          distributions,
          series,
          seriesDistributions,
          seriesMeasurements,
        );
      }
    }
  }
}
