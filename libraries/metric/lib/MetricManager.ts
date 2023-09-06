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
import { getLogger, Logger } from "@syntest/logging";

import {
  Distribution,
  DistributionMetric,
  Metric,
  MetricName,
  PropertyMetric,
  Series,
  SeriesDistributionMetric,
  SeriesIndex,
  SeriesMetric,
  SeriesType,
} from "./Metric";
import { Middleware } from "./Middleware";
import {
  distributionNotRegistered,
  propertyNotRegistered,
  seriesDistributionNotRegistered,
  seriesDistributionTypeNotRegistered,
  seriesNotRegistered,
  seriesTypeNotRegistered,
  shouldNeverHappen,
} from "./util/diagnostics";

export class MetricManager {
  protected static LOGGER: Logger;

  private _namespacedManagers: Map<string, MetricManager>;

  getNamespaced(namespace: string): MetricManager {
    if (!this._namespacedManagers.has(namespace)) {
      const manager = new MetricManager(namespace);
      manager.metrics = this.metrics;
      this._namespacedManagers.set(namespace, manager);
    }

    const namespacedManager = this._namespacedManagers.get(namespace);

    if (namespacedManager === undefined) {
      throw new Error(shouldNeverHappen("MetricManager"));
    }

    return namespacedManager;
  }

  private _namespace: string;
  private _metrics: Metric[] | undefined = undefined;
  private _outputMetrics: Metric[] | undefined = undefined;

  private properties: Map<MetricName, string>;
  private distributions: Map<MetricName, Distribution>;
  private series: Map<MetricName, Map<SeriesType, Series<number>>>;
  private seriesDistributions: Map<
    MetricName,
    Map<SeriesType, Series<Distribution>>
  >;

  constructor(namespace: string) {
    MetricManager.LOGGER = getLogger("MetricManager");
    this._namespace = namespace;
    this._namespacedManagers = new Map();

    this.properties = new Map();
    this.distributions = new Map();
    this.series = new Map();
    this.seriesDistributions = new Map();
  }

  get outputMetrics() {
    if (!this._outputMetrics) {
      throw new Error("Output metrics not set");
    }
    return this._outputMetrics;
  }

  merge(other: MetricManager): void {
    // Merge properties
    for (const [name, value] of other.properties.entries()) {
      if (value.length === 0) {
        // don't overwrite with empty values
        continue;
      }
      this.properties.set(name, value);
    }

    // Merge distributions
    for (const [name, distribution] of other.distributions.entries()) {
      this.distributions.set(name, [...distribution]);
    }

    // Merge series
    for (const [name, seriesByType] of other.series.entries()) {
      const seriesMetricMap = new Map<SeriesType, Series<number>>();
      for (const [type, series] of seriesByType.entries()) {
        seriesMetricMap.set(type, new Map(series));
      }
      this.series.set(name, seriesMetricMap);
    }

    // Merge series distributions
    for (const [name, seriesByType] of other.seriesDistributions.entries()) {
      const seriesDistributionsMetricMap = new Map<
        SeriesType,
        Series<Distribution>
      >();
      for (const [type, series] of seriesByType.entries()) {
        const seriesDistributionMap = new Map<SeriesIndex, Distribution>();
        for (const [seriesIndex, distribution] of series.entries()) {
          seriesDistributionMap.set(seriesIndex, [...distribution]);
        }
        seriesDistributionsMetricMap.set(type, seriesDistributionMap);
      }
      this.seriesDistributions.set(name, seriesDistributionsMetricMap);
    }
  }

  getMergedNamespacedManager(namespace: string) {
    if (!this._namespacedManagers.has(namespace)) {
      throw new Error(`Namespace ${namespace} not registered`);
    }

    const namespaced = this.getNamespaced(namespace);

    const manager = new MetricManager(`${this._namespace}.${namespace}`);

    manager._metrics = this._metrics;
    manager._outputMetrics = this._outputMetrics;

    manager.merge(this);
    manager.merge(namespaced);

    return manager;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  setOutputMetrics(metrics: string[]) {
    if (metrics.includes("*")) {
      this._outputMetrics = [...this.metrics];
    } else {
      const outputMetrics = metrics.map((metric) => {
        const split = metric.split(".");
        const found = this.metrics.find((m) => {
          if (m.type !== split[0]) {
            return false;
          }

          switch (m.type) {
            case "property":
            case "distribution": {
              return split[1] === "*" || m.name === split[1];
            }
            case "series":
            case "series-distribution": {
              return (
                (split[1] === "*" || m.name === split[1]) &&
                (split[2] === "*" || m.seriesType === split[2])
              );
            }
          }
          return false;
        });

        if (!found) {
          throw new Error(`Output metric ${metric} not found`);
        }
        return found;
      });

      this._outputMetrics = outputMetrics;
    }

    for (const manager of this.namespacedManagers.values()) {
      manager._outputMetrics = this.outputMetrics;
    }
  }

  get metrics() {
    if (!this._metrics) {
      throw new Error("Metrics not set");
    }
    return this._metrics;
  }

  set metrics(metrics: Metric[]) {
    this._metrics = metrics;

    for (const metric of this._metrics) {
      switch (metric.type) {
        case "property": {
          this.properties.set(metric.name, "");
          break;
        }
        case "distribution": {
          this.distributions.set(metric.name, []);
          break;
        }
        case "series": {
          if (!this.series.has(metric.name)) {
            this.series.set(metric.name, new Map());
          }
          this.series.get(metric.name).set(metric.seriesType, new Map());
          break;
        }
        case "series-distribution": {
          if (!this.seriesDistributions.has(metric.name)) {
            this.seriesDistributions.set(metric.seriesType, new Map());
          }
          this.seriesDistributions
            .get(metric.name)
            .set(metric.seriesType, new Map());
          break;
        }
      }
    }
  }

  get namespacedManagers() {
    return this._namespacedManagers;
  }

  get namespace() {
    return this._namespace;
  }

  async runPipeline(middleware: Middleware[]): Promise<void> {
    for (const _middleware of middleware) {
      MetricManager.LOGGER.debug(
        `Running middleware ${_middleware.constructor.name}`
      );
      await _middleware.run(this);
    }

    for (const manager of this._namespacedManagers.values()) {
      await manager.runPipeline(middleware);
    }
  }

  recordProperty(property: MetricName, value: string) {
    MetricManager.LOGGER.debug(`Recording property ${property} = ${value}`);

    if (!this.properties.has(property)) {
      throw new Error(propertyNotRegistered(property));
    }

    this.properties.set(property, value);
  }

  recordDistribution(distributionName: MetricName, value: number) {
    MetricManager.LOGGER.debug(
      `Recording distribution ${distributionName} = ${value}`
    );

    if (!this.distributions.has(distributionName)) {
      throw new Error(distributionNotRegistered(distributionName));
    }

    this.distributions.get(distributionName).push(value);
  }

  recordSeries(
    seriesName: MetricName,
    seriesType: SeriesType,
    seriesIndex: SeriesIndex,
    value: number
  ) {
    MetricManager.LOGGER.debug(
      `Recording series ${seriesName}.${seriesType}[${seriesIndex}] = ${value}`
    );

    if (!this.series.has(seriesName)) {
      throw new Error(seriesNotRegistered(seriesName));
    }

    if (!this.series.get(seriesName).has(seriesType)) {
      throw new Error(seriesTypeNotRegistered(seriesName, seriesType));
    }

    this.series.get(seriesName).get(seriesType).set(seriesIndex, value);
  }

  recordSeriesDistribution(
    seriesDistributionName: MetricName,
    seriesType: SeriesType,
    seriesIndex: SeriesIndex,
    value: number
  ) {
    MetricManager.LOGGER.debug(
      `Recording series distribution ${seriesDistributionName}.${seriesType}[${seriesIndex}] = ${value}`
    );

    if (!this.seriesDistributions.has(seriesDistributionName)) {
      throw new Error(seriesDistributionNotRegistered(seriesDistributionName));
    }

    if (!this.seriesDistributions.get(seriesDistributionName).has(seriesType)) {
      throw new Error(
        seriesDistributionTypeNotRegistered(seriesDistributionName, seriesType)
      );
    }

    if (
      !this.seriesDistributions
        .get(seriesDistributionName)
        .get(seriesType)
        .has(seriesIndex)
    ) {
      this.seriesDistributions
        .get(seriesDistributionName)
        .get(seriesType)
        .set(seriesIndex, []);
    }

    this.seriesDistributions
      .get(seriesDistributionName)
      .get(seriesType)
      .get(seriesIndex)
      .push(value);
  }

  getProperty(property: MetricName): string | undefined {
    MetricManager.LOGGER.debug(`Getting property ${property}`);

    return this.properties.get(property);
  }

  getDistribution(distributionName: MetricName): Distribution | undefined {
    MetricManager.LOGGER.debug(`Getting distribution ${distributionName}`);

    return this.distributions.get(distributionName);
  }

  getSeries(
    seriesName: MetricName,
    seriesType: SeriesType
  ): Map<SeriesIndex, number> | undefined {
    MetricManager.LOGGER.debug(`Getting series ${seriesName}.${seriesType}`);

    if (!this.series.has(seriesName)) {
      return undefined;
    }

    return this.series.get(seriesName).get(seriesType);
  }

  getSeriesDistribution(
    seriesDistributionName: MetricName,
    seriesType: SeriesType
  ): Map<SeriesIndex, number[]> | undefined {
    MetricManager.LOGGER.debug(
      `Getting series distribution ${seriesDistributionName}.${seriesType}`
    );

    if (!this.seriesDistributions.has(seriesDistributionName)) {
      return undefined;
    }

    return this.seriesDistributions.get(seriesDistributionName).get(seriesType);
  }

  getAllProperties(): Map<MetricName, string> {
    return this.properties;
  }

  getAllDistributions(): Map<MetricName, Distribution> {
    return this.distributions;
  }

  getAllSeries(): Map<MetricName, Map<SeriesType, Series<number>>> {
    return this.series;
  }

  getAllSeriesDistributions(): Map<
    MetricName,
    Map<SeriesType, Series<Distribution>>
  > {
    return this.seriesDistributions;
  }

  collectProperties(wanted: PropertyMetric[]): Map<MetricName, string> {
    const properties = new Map<MetricName, string>();

    for (const property of wanted) {
      const value = this.getProperty(property.name);

      properties.set(property.name, value);
    }

    return properties;
  }

  collectDistributions(
    wanted: DistributionMetric[]
  ): Map<MetricName, Distribution> {
    const distributions = new Map<MetricName, Distribution>();

    for (const distribution of wanted) {
      const value = this.getDistribution(distribution.name);

      distributions.set(distribution.name, value);
    }

    return distributions;
  }

  collectSeries(
    wanted: SeriesMetric[]
  ): Map<MetricName, Map<SeriesType, Map<SeriesIndex, number>>> {
    const series = new Map<
      MetricName,
      Map<SeriesType, Map<SeriesIndex, number>>
    >();

    for (const seriesMetric of wanted) {
      const value = this.getSeries(seriesMetric.name, seriesMetric.seriesType);

      if (!series.has(seriesMetric.name)) {
        series.set(seriesMetric.name, new Map());
      }

      series.get(seriesMetric.name).set(seriesMetric.seriesType, value);
    }

    return series;
  }

  collectSeriesDistributions(
    wanted: SeriesDistributionMetric[]
  ): Map<MetricName, Map<SeriesType, Map<SeriesIndex, Distribution>>> {
    const seriesDistributions = new Map<
      MetricName,
      Map<SeriesType, Map<SeriesIndex, Distribution>>
    >();

    for (const seriesDistribution of wanted) {
      const value = this.getSeriesDistribution(
        seriesDistribution.name,
        seriesDistribution.seriesType
      );

      if (!seriesDistributions.has(seriesDistribution.name)) {
        seriesDistributions.set(seriesDistribution.name, new Map());
      }

      seriesDistributions
        .get(seriesDistribution.name)
        .set(seriesDistribution.seriesType, value);
    }

    return seriesDistributions;
  }
}
