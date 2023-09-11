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
import {
  DistributionsMap,
  MetricManager,
  PropertiesMap,
  SeriesMap,
} from "@syntest/metric";
import { Distribution } from "@syntest/metric/lib/PropertyTypes";

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
    this.loopThroughSeries(series, (newPropertyName, seriesByType) => {
      let auc = 0;
      for (const [, series_] of seriesByType) {
        for (const [, value] of series_) {
          auc += value;
        }
        // one per
        break;
      }
      metricManager.recordProperty(newPropertyName, `${auc}`);
    });
  }
}
