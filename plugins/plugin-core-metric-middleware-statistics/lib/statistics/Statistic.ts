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
  DistributionsMap,
  MetricManager,
  MetricName,
  PropertiesMap,
  Series,
  SeriesMap,
  SeriesUnit,
} from "@syntest/metric";

export abstract class Statistic {
  private _name: string;

  constructor(name: string) {
    this._name = name;
  }

  abstract generate(
    metricManager: MetricManager,
    properties: PropertiesMap<string>,
    distributions: DistributionsMap,
    series: SeriesMap<number>,
    seriesDistributions: SeriesMap<Distribution>,
    seriesMeasurements: SeriesMap<PropertiesMap<number>>
  ): void;

  loopThroughProperties(
    properties: PropertiesMap<string>,
    callback: (newPropertyName: string, propertyValue: string) => void
  ) {
    for (const [property, value] of properties) {
      callback(`${this.name}-${property}`, value);
    }
  }

  loopThroughDistributions(
    distributions: DistributionsMap,
    callback: (newPropertyName: string, distribution: Distribution) => void
  ) {
    for (const [distributionName, distribution] of distributions) {
      callback(`${this.name}-${distributionName}`, distribution);
    }
  }

  loopThroughSeries(
    series: SeriesMap<number>,
    callback: (
      newPropertyName: string,
      seriesName: MetricName,
      seriesUnit: SeriesUnit,
      series: Series<number>
    ) => void
  ) {
    for (const [seriesName, seriesByUnit] of series) {
      for (const [seriesUnit, series_] of seriesByUnit) {
        callback(
          `${this.name}-${seriesName}-${seriesUnit}`,
          seriesName,
          seriesUnit,
          series_
        );
      }
    }
  }

  loopThroughSeriesDistribution(
    seriesDistributions: SeriesMap<Distribution>,
    callback: (
      newPropertyName: string,
      seriesDistributionName: MetricName,
      seriesUnit: SeriesUnit,
      series: Series<Distribution>
    ) => void
  ) {
    for (const [
      seriesDistributionName,
      seriesDistributionByUnit,
    ] of seriesDistributions) {
      for (const [seriesUnit, series] of seriesDistributionByUnit) {
        callback(
          `${this.name}-${seriesDistributionName}-${seriesUnit}`,
          seriesDistributionName,
          seriesUnit,
          series
        );
      }
    }
  }

  loopThroughSeriesMeasurement(
    seriesMeasurements: SeriesMap<PropertiesMap<number>>,
    callback: (
      newPropertyName: string,
      seriesDistributionName: MetricName,
      seriesUnit: SeriesUnit,
      series: Series<PropertiesMap<number>>
    ) => void
  ) {
    for (const [
      seriesMeasurementName,
      seriesMeasurementsByUnit,
    ] of seriesMeasurements) {
      for (const [seriesUnit, series] of seriesMeasurementsByUnit) {
        callback(
          `${this.name}-${seriesMeasurementName}-${seriesUnit}`,
          seriesMeasurementName,
          seriesUnit,
          series
        );
      }
    }
  }

  get name() {
    return this._name;
  }
}
