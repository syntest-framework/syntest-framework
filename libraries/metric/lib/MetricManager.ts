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
  DistributionMetric,
  Metric,
  PropertyMetric,
  SeriesDistributionMetric,
  SeriesMetric,
} from "./Metric";
import { MiddleWare } from "./Middleware";
import {
  distributionNotRegistered,
  propertyNotRegistered,
  seriesDistributionNotRegistered,
  seriesDistributionSeriesNotRegistered,
  seriesDistributionTypeNotRegistered,
  seriesNotRegistered,
  seriesTypeNotRegistered,
  UndefinedValueError,
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
      throw new UndefinedValueError("MetricManager was undefined");
    }

    return namespacedManager;
  }

  private _namespace: string;
  private _metrics: Metric[] | undefined = undefined;
  private _outputMetrics: Metric[] | undefined = undefined;

  private properties: Map<string, string>;
  private distributions: Map<string, number[]>;
  private series: Map<string, Map<string, Map<number, number>>>;
  private seriesDistributions: Map<
    string,
    Map<string, Map<string, Map<number, number[]>>>
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
    for (const [name, seriesData] of other.series.entries()) {
      const seriesMap = new Map<string, Map<number, number>>();
      for (const [type, seriesTypeData] of seriesData.entries()) {
        seriesMap.set(type, new Map(seriesTypeData));
      }
      this.series.set(name, seriesMap);
    }

    // Merge series distributions
    for (const [
      name,
      seriesDistributionData,
    ] of other.seriesDistributions.entries()) {
      const seriesDistributionsMap = new Map<
        string,
        Map<string, Map<number, number[]>>
      >();
      for (const [seriesName, seriesData] of seriesDistributionData.entries()) {
        const seriesMap = new Map<string, Map<number, number[]>>();
        for (const [seriesType, seriesTypeData] of seriesData.entries()) {
          seriesMap.set(seriesType, new Map(seriesTypeData));
        }
        seriesDistributionsMap.set(seriesName, seriesMap);
      }
      this.seriesDistributions.set(name, seriesDistributionsMap);
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
            case "property": {
              return split[1] === "*" || m.property === split[1];
            }
            case "distribution": {
              return split[1] === "*" || m.distributionName === split[1];
            }
            case "series": {
              return (
                (split[1] === "*" || m.seriesName === split[1]) &&
                (split[2] === "*" || m.seriesType === split[2])
              );
            }
            case "series-distribution": {
              return (
                (split[1] === "*" || m.distributionName === split[1]) &&
                (split[2] === "*" || m.seriesName === split[2]) &&
                (split[3] === "*" || m.seriesType === split[3])
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
          this.properties.set(metric.property, "");
          break;
        }
        case "distribution": {
          this.distributions.set(metric.distributionName, []);
          break;
        }
        case "series": {
          if (!this.series.has(metric.seriesName)) {
            this.series.set(metric.seriesName, new Map());
          }
          this.series.get(metric.seriesName).set(metric.seriesType, new Map());
          break;
        }
        case "series-distribution": {
          if (!this.seriesDistributions.has(metric.distributionName)) {
            this.seriesDistributions.set(metric.distributionName, new Map());
          }

          if (
            !this.seriesDistributions
              .get(metric.distributionName)
              .has(metric.seriesName)
          ) {
            this.seriesDistributions
              .get(metric.distributionName)
              .set(metric.seriesName, new Map());
          }
          this.seriesDistributions
            .get(metric.distributionName)
            .get(metric.seriesName)
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

  async runPipeline(middleware: MiddleWare[]): Promise<void> {
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

  recordProperty(property: string, value: string) {
    MetricManager.LOGGER.debug(`Recording property ${property} = ${value}`);

    if (!this.properties.has(property)) {
      throw new Error(propertyNotRegistered(property));
    }

    this.properties.set(property, value);
  }

  recordDistribution(distributionName: string, value: number) {
    MetricManager.LOGGER.debug(
      `Recording distribution ${distributionName} = ${value}`
    );

    if (!this.distributions.has(distributionName)) {
      throw new Error(distributionNotRegistered(distributionName));
    }

    this.distributions.get(distributionName).push(value);
  }

  recordSeries(
    seriesName: string,
    seriesType: string,
    index: number,
    value: number
  ) {
    MetricManager.LOGGER.debug(
      `Recording series ${seriesName}.${seriesType}[${index}] = ${value}`
    );

    if (!this.series.has(seriesName)) {
      throw new Error(seriesNotRegistered(seriesName));
    }

    if (!this.series.get(seriesName).has(seriesType)) {
      throw new Error(seriesTypeNotRegistered(seriesName, seriesType));
    }

    this.series.get(seriesName).get(seriesType).set(index, value);
  }

  recordSeriesDistribution(
    distributionName: string,
    seriesName: string,
    seriesType: string,
    index: number,
    value: number
  ) {
    MetricManager.LOGGER.debug(
      `Recording series distribution ${distributionName}.${seriesName}.${seriesType}[${index}] = ${value}`
    );

    if (!this.seriesDistributions.has(distributionName)) {
      throw new Error(seriesDistributionNotRegistered(distributionName));
    }

    if (!this.seriesDistributions.get(distributionName).has(seriesName)) {
      throw new Error(
        seriesDistributionSeriesNotRegistered(distributionName, seriesName)
      );
    }

    if (
      !this.seriesDistributions
        .get(distributionName)
        .get(seriesName)
        .has(seriesType)
    ) {
      throw new Error(
        seriesDistributionTypeNotRegistered(
          distributionName,
          seriesName,
          seriesType
        )
      );
    }

    if (
      !this.seriesDistributions
        .get(distributionName)
        .get(seriesName)
        .get(seriesType)
        .has(index)
    ) {
      this.seriesDistributions
        .get(distributionName)
        .get(seriesName)
        .get(seriesType)
        .set(index, []);
    }

    this.seriesDistributions
      .get(distributionName)
      .get(seriesName)
      .get(seriesType)
      .get(index)
      .push(value);
  }

  getProperty(property: string): string | undefined {
    MetricManager.LOGGER.debug(`Getting property ${property}`);

    return this.properties.get(property);
  }

  getDistribution(distributionName: string): number[] | undefined {
    MetricManager.LOGGER.debug(`Getting distribution ${distributionName}`);

    return this.distributions.get(distributionName);
  }

  getSeries(
    seriesName: string,
    seriesType: string
  ): Map<number, number> | undefined {
    MetricManager.LOGGER.debug(`Getting series ${seriesName}.${seriesType}`);

    if (!this.series.has(seriesName)) {
      return undefined;
    }

    return this.series.get(seriesName).get(seriesType);
  }

  getSeriesDistribution(
    distributionName: string,
    seriesName: string,
    seriesType: string
  ): Map<number, number[]> | undefined {
    MetricManager.LOGGER.debug(
      `Getting series distribution ${distributionName}.${seriesName}.${seriesType}`
    );

    if (!this.seriesDistributions.has(distributionName)) {
      return undefined;
    }

    if (!this.seriesDistributions.get(distributionName).has(seriesName)) {
      return undefined;
    }

    return this.seriesDistributions
      .get(distributionName)
      .get(seriesName)
      .get(seriesType);
  }

  getAllProperties(): Map<string, string> {
    return this.properties;
  }

  getAllDistributions(): Map<string, number[]> {
    return this.distributions;
  }

  getAllSeries(): Map<string, Map<string, Map<number, number>>> {
    return this.series;
  }

  getAllSeriesDistributions(): Map<
    string,
    Map<string, Map<string, Map<number, number[]>>>
  > {
    return this.seriesDistributions;
  }

  collectProperties(wanted: PropertyMetric[]): Map<string, string> {
    const properties = new Map<string, string>();

    for (const property of wanted) {
      const value = this.getProperty(property.property);

      properties.set(property.property, value);
    }

    return properties;
  }

  collectDistributions(wanted: DistributionMetric[]): Map<string, number[]> {
    const distributions = new Map<string, number[]>();

    for (const distribution of wanted) {
      const value = this.getDistribution(distribution.distributionName);

      distributions.set(distribution.distributionName, value);
    }

    return distributions;
  }

  collectSeries(
    wanted: SeriesMetric[]
  ): Map<string, Map<string, Map<number, number>>> {
    const series = new Map<string, Map<string, Map<number, number>>>();

    for (const seriesMetric of wanted) {
      const value = this.getSeries(
        seriesMetric.seriesName,
        seriesMetric.seriesType
      );

      if (!series.has(seriesMetric.seriesName)) {
        series.set(seriesMetric.seriesName, new Map());
      }

      series.get(seriesMetric.seriesName).set(seriesMetric.seriesType, value);
    }

    return series;
  }

  collectSeriesDistributions(
    wanted: SeriesDistributionMetric[]
  ): Map<string, Map<string, Map<string, Map<number, number[]>>>> {
    const seriesDistributions = new Map<
      string,
      Map<string, Map<string, Map<number, number[]>>>
    >();

    for (const seriesDistribution of wanted) {
      const value = this.getSeriesDistribution(
        seriesDistribution.distributionName,
        seriesDistribution.seriesName,
        seriesDistribution.seriesType
      );

      if (!seriesDistributions.has(seriesDistribution.distributionName)) {
        seriesDistributions.set(seriesDistribution.distributionName, new Map());
      }

      if (
        !seriesDistributions
          .get(seriesDistribution.distributionName)
          .has(seriesDistribution.seriesName)
      ) {
        seriesDistributions
          .get(seriesDistribution.distributionName)
          .set(seriesDistribution.seriesName, new Map());
      }

      seriesDistributions
        .get(seriesDistribution.distributionName)
        .get(seriesDistribution.seriesName)
        .set(seriesDistribution.seriesType, value);
    }

    return seriesDistributions;
  }
}
