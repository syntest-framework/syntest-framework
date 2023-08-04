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
import { MetricManager } from "@syntest/metric";
import {
  Distribution,
  DistributionName,
  Property,
  PropertyName,
  Series,
  SeriesName,
  SeriesTyping,
} from "@syntest/metric/lib/PropertyTypes";

export abstract class Statistic {
  private _name: string;

  constructor(name: string) {
    this._name = name;
  }

  abstract generate(
    metricManager: MetricManager,
    properties: Map<PropertyName, Property>,
    distributions: Map<DistributionName, Distribution>,
    series: Map<SeriesName, Map<SeriesTyping, Series<number>>>,
    seriesDistributions: Map<
      DistributionName,
      Map<SeriesName, Map<SeriesTyping, Series<Distribution>>>
    >
  ): void;

  loopThroughProperties(
    properties: Map<PropertyName, Property>,
    callback: (newPropertyName: string, propertyValue: string) => void
  ) {
    for (const [propertyName, propertyValue] of properties) {
      callback(this.getPropertyName(propertyName), propertyValue);
    }
  }

  loopThroughDistributions(
    distributions: Map<DistributionName, Distribution>,
    callback: (newPropertyName: string, distribution: Distribution) => void
  ) {
    for (const [distributionName, distribution] of distributions) {
      callback(this.getPropertyName(distributionName), distribution);
    }
  }

  loopThroughSeries(
    series: Map<SeriesName, Map<SeriesTyping, Series<number>>>,
    callback: (
      newPropertyName: string,
      seriesByType: Map<SeriesTyping, Series<number>>
    ) => void
  ) {
    for (const [seriesName, seriesByType] of series) {
      callback(this.getPropertyName(seriesName), seriesByType);
    }
  }

  loopThroughSeriesDistribution(
    seriesDistributions: Map<
      DistributionName,
      Map<SeriesName, Map<SeriesTyping, Series<Distribution>>>
    >,
    callback: (
      newPropertyName: string,
      seriesByType: Map<SeriesName, Map<SeriesTyping, Series<Distribution>>>
    ) => void
  ) {
    for (const [distributionName, distribution] of seriesDistributions) {
      callback(this.getPropertyName(distributionName), distribution);
    }
  }

  getPropertyName(property: string): string {
    return `${this.name}-${property}`;
  }

  get name() {
    return this._name;
  }
}
