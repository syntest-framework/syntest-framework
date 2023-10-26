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
import {
  Distribution,
  DistributionsMap,
  MetricManager,
  PropertiesMap,
  SeriesMap,
} from "@syntest/metric";

import { Statistic } from "./Statistic";

export class AUC extends Statistic {
  constructor() {
    super("AUC");
  }

  generate(
    metricManager: MetricManager,
    _properties: PropertiesMap<string>,
    _distributions: DistributionsMap,
    series: SeriesMap<number>,
    _seriesDistributions: SeriesMap<Distribution>,
    _seriesMeasurements: SeriesMap<PropertiesMap<number>>
  ): void {
    this.loopThroughSeries(
      series,
      (newPropertyName, _seriesName, _seriesUnit, series) => {
        // Skip calculation if the series is empty
        if (series.size === 0) return;

        let auc = 0;

        let previousIndex = 0;
        let previousValue = 0;
        for (const [index, value] of series) {
          // Trapezoidal rule
          auc += ((index - previousIndex) * (value + previousValue)) / 2;
          previousIndex = index;
          previousValue = value;
        }
        metricManager.recordProperty(newPropertyName, `${auc}`);
      }
    );
  }
}
