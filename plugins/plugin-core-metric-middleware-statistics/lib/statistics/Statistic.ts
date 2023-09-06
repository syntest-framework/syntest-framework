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
  Distribution,
  MetricManager,
  MetricName,
  Series,
  SeriesType,
} from "@syntest/metric";

export abstract class Statistic {
  private _name: string;

  constructor(name: string) {
    this._name = name;
  }

  abstract generate(
    metricManager: MetricManager,
    properties: Map<MetricName, string>,
    distributions: Map<MetricName, Distribution>,
    series: Map<MetricName, Map<SeriesType, Series<number>>>,
    seriesDistributions: Map<MetricName, Map<SeriesType, Series<Distribution>>>
  ): void;

  loopThroughProperties(
    properties: Map<MetricName, string>,
    callback: (newPropertyName: string, propertyValue: string) => void
  ) {
    for (const [property, value] of properties) {
      callback(`${this.name}-${property}`, value);
    }
  }

  loopThroughDistributions(
    distributions: Map<MetricName, Distribution>,
    callback: (newPropertyName: string, distribution: Distribution) => void
  ) {
    for (const [distributionName, distribution] of distributions) {
      callback(`${this.name}-${distributionName}`, distribution);
    }
  }

  loopThroughSeries(
    series: Map<MetricName, Map<SeriesType, Series<number>>>,
    callback: (
      newPropertyName: string,
      seriesName: MetricName,
      seriesType: SeriesType,
      series: Series<number>
    ) => void
  ) {
    for (const [seriesName, seriesByType] of series) {
      for (const [seriesType, series_] of seriesByType) {
        callback(
          `${this.name}-${seriesName}-${seriesType}`,
          seriesName,
          seriesType,
          series_
        );
      }
    }
  }

  loopThroughSeriesDistribution(
    seriesDistributions: Map<MetricName, Map<SeriesType, Series<Distribution>>>,
    callback: (
      newPropertyName: string,
      seriesDistributionName: MetricName,
      seriesType: SeriesType,
      series: Series<Distribution>
    ) => void
  ) {
    for (const [
      seriesDistributionName,
      seriesDistributionByType,
    ] of seriesDistributions) {
      for (const [seriesType, series] of seriesDistributionByType) {
        callback(
          `${this.name}-${seriesDistributionName}-${seriesType}`,
          seriesDistributionName,
          seriesType,
          series
        );
      }
    }
  }

  get name() {
    return this._name;
  }
}
