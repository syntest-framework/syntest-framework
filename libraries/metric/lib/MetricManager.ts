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
  SeriesMeasurementMetric,
  SeriesMetric,
} from "./Metric";
import { MiddleWare } from "./Middleware";
import {
  Distribution,
  DistributionsMap,
  Name,
  PropertiesMap,
  Series,
  SeriesMap,
  SeriesUnit,
} from "./PropertyTypes";
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

  private properties: PropertiesMap<string>;
  private distributions: DistributionsMap;
  private series: SeriesMap<number>;
  private seriesDistributions: SeriesMap<Distribution>;
  private seriesMeasurement: SeriesMap<PropertiesMap<number>>;

  constructor(namespace: string) {
    MetricManager.LOGGER = getLogger("MetricManager");
    this._namespace = namespace;
    this._namespacedManagers = new Map();

    this.properties = new Map();
    this.distributions = new Map();
    this.series = new Map();
    this.seriesDistributions = new Map();
    this.seriesMeasurement = new Map();
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
      const seriesMap = new Map<SeriesUnit, Map<number, number>>();
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
      const seriesMap = new Map<SeriesUnit, Series<Distribution>>();
      for (const [
        seriesUnit,
        seriesTypeData,
      ] of seriesDistributionData.entries()) {
        seriesMap.set(seriesUnit, new Map(seriesTypeData));
      }

      this.seriesDistributions.set(name, seriesMap);
    }

    // Merge series measurements
    for (const [
      name,
      seriesMeasurementData,
    ] of other.seriesMeasurement.entries()) {
      const seriesMap = new Map<SeriesUnit, Series<PropertiesMap<number>>>();
      for (const [
        seriesUnit,
        seriesTypeData,
      ] of seriesMeasurementData.entries()) {
        seriesMap.set(seriesUnit, new Map(seriesTypeData));
      }

      this.seriesMeasurement.set(name, seriesMap);
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
              return split[1] === "*" || m.name === split[1];
            }
            case "distribution": {
              return split[1] === "*" || m.name === split[1];
            }
            case "series":
            case "series-distribution":
            case "series-measurement": {
              return (
                (split[1] === "*" || m.name === split[1]) &&
                (split[2] === "*" || m.seriesUnit === split[2])
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
          this.series.get(metric.name).set(metric.seriesUnit, new Map());
          break;
        }
        case "series-distribution": {
          if (!this.seriesDistributions.has(metric.name)) {
            this.seriesDistributions.set(metric.name, new Map());
          }

          this.seriesDistributions
            .get(metric.name)
            .set(metric.seriesUnit, new Map());

          break;
        }

        case "series-measurement": {
          if (!this.seriesMeasurement.has(metric.name)) {
            this.seriesMeasurement.set(metric.name, new Map());
          }

          this.seriesMeasurement
            .get(metric.name)
            .set(metric.seriesUnit, new Map());

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

  recordProperty(property: Name, value: string) {
    MetricManager.LOGGER.debug(`Recording property ${property} = ${value}`);

    if (!this.properties.has(property)) {
      throw new Error(propertyNotRegistered(property));
    }

    this.properties.set(property, value);
  }

  recordDistribution(distributionName: Name, value: number) {
    MetricManager.LOGGER.debug(
      `Recording distribution ${distributionName} = ${value}`
    );

    if (!this.distributions.has(distributionName)) {
      throw new Error(distributionNotRegistered(distributionName));
    }

    this.distributions.get(distributionName).push(value);
  }

  recordSeries(
    seriesName: Name,
    seriesUnit: SeriesUnit,
    index: number,
    value: number
  ) {
    MetricManager.LOGGER.debug(
      `Recording series ${seriesName}.${seriesUnit}[${index}] = ${value}`
    );

    if (!this.series.has(seriesName)) {
      throw new Error(seriesNotRegistered(seriesName));
    }

    if (!this.series.get(seriesName).has(seriesUnit)) {
      throw new Error(seriesTypeNotRegistered(seriesName, seriesUnit));
    }

    this.series.get(seriesName).get(seriesUnit).set(index, value);
  }

  recordSeriesDistribution(
    name: Name,
    seriesUnit: SeriesUnit,
    index: number,
    value: number
  ) {
    MetricManager.LOGGER.debug(
      `Recording series distribution ${name}.${seriesUnit}[${index}] = ${value}`
    );

    if (!this.seriesDistributions.has(name)) {
      throw new Error(seriesDistributionNotRegistered(name));
    }

    if (!this.seriesDistributions.get(name).has(seriesUnit)) {
      throw new Error(seriesDistributionTypeNotRegistered(name, seriesUnit));
    }

    if (!this.seriesDistributions.get(name).get(seriesUnit).has(index)) {
      this.seriesDistributions.get(name).get(seriesUnit).set(index, []);
    }

    this.seriesDistributions.get(name).get(seriesUnit).get(index).push(value);
  }

  recordSeriesMeasurement(
    name: Name,
    seriesUnit: SeriesUnit,
    index: number,
    key: string,
    value: number
  ) {
    MetricManager.LOGGER.debug(
      `Recording series measurement ${name}.${seriesUnit}[${index}].${key} = ${value}`
    );

    if (!this.seriesMeasurement.has(name)) {
      throw new Error(seriesDistributionNotRegistered(name));
    }

    if (!this.seriesMeasurement.get(name).has(seriesUnit)) {
      throw new Error(seriesDistributionTypeNotRegistered(name, seriesUnit));
    }

    if (!this.seriesMeasurement.get(name).get(seriesUnit).has(index)) {
      this.seriesMeasurement.get(name).get(seriesUnit).set(index, new Map());
    }

    this.seriesMeasurement.get(name).get(seriesUnit).get(index).set(key, value);
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
    seriesUnit: SeriesUnit
  ): Map<number, number> | undefined {
    MetricManager.LOGGER.debug(`Getting series ${seriesName}.${seriesUnit}`);

    if (!this.series.has(seriesName)) {
      return undefined;
    }

    return this.series.get(seriesName).get(seriesUnit);
  }

  getSeriesDistribution(
    name: string,
    seriesUnit: SeriesUnit
  ): Map<number, number[]> | undefined {
    MetricManager.LOGGER.debug(
      `Getting series distribution ${name}.${seriesUnit}`
    );

    if (!this.seriesDistributions.has(name)) {
      return undefined;
    }

    return this.seriesDistributions.get(name).get(seriesUnit);
  }

  getSeriesMeasurement(
    name: string,
    seriesUnit: SeriesUnit
  ): Series<PropertiesMap<number>> | undefined {
    MetricManager.LOGGER.debug(
      `Getting series measurement ${name}.${seriesUnit}`
    );

    if (!this.seriesMeasurement.has(name)) {
      return undefined;
    }

    return this.seriesMeasurement.get(name).get(seriesUnit);
  }

  getAllProperties(): PropertiesMap<string> {
    return this.properties;
  }

  getAllDistributions(): DistributionsMap {
    return this.distributions;
  }

  getAllSeries(): SeriesMap<number> {
    return this.series;
  }

  getAllSeriesDistributions(): SeriesMap<Distribution> {
    return this.seriesDistributions;
  }

  getAllSeriesMeasurements(): SeriesMap<PropertiesMap<number>> {
    return this.seriesMeasurement;
  }

  collectProperties(wanted: PropertyMetric[]): Map<string, string> {
    const properties = new Map<string, string>();

    for (const property of wanted) {
      const value = this.getProperty(property.name);

      properties.set(property.name, value);
    }

    return properties;
  }

  collectDistributions(wanted: DistributionMetric[]): DistributionsMap {
    const distributions = new Map<string, number[]>();

    for (const distribution of wanted) {
      const value = this.getDistribution(distribution.name);

      distributions.set(distribution.name, value);
    }

    return distributions;
  }

  collectSeries(wanted: SeriesMetric[]): SeriesMap<number> {
    const series = new Map<string, Map<SeriesUnit, Series<number>>>();

    for (const seriesMetric of wanted) {
      const value = this.getSeries(seriesMetric.name, seriesMetric.seriesUnit);

      if (!series.has(seriesMetric.name)) {
        series.set(seriesMetric.name, new Map());
      }

      series.get(seriesMetric.name).set(seriesMetric.seriesUnit, value);
    }

    return series;
  }

  collectSeriesDistributions(
    wanted: SeriesDistributionMetric[]
  ): SeriesMap<Distribution> {
    const seriesDistributions = new Map<
      Name,
      Map<SeriesUnit, Series<Distribution>>
    >();

    for (const seriesDistribution of wanted) {
      const value = this.getSeriesDistribution(
        seriesDistribution.name,
        seriesDistribution.seriesUnit
      );

      if (!seriesDistributions.has(seriesDistribution.name)) {
        seriesDistributions.set(seriesDistribution.name, new Map());
      }

      seriesDistributions
        .get(seriesDistribution.name)
        .set(seriesDistribution.seriesUnit, value);
    }

    return seriesDistributions;
  }

  collectSeriesMeasurements(
    wanted: SeriesMeasurementMetric[]
  ): SeriesMap<PropertiesMap<number>> {
    const seriesMeasurements = new Map<
      Name,
      Map<SeriesUnit, Series<PropertiesMap<number>>>
    >();

    for (const seriesMeasurement of wanted) {
      const value = this.getSeriesMeasurement(
        seriesMeasurement.name,
        seriesMeasurement.seriesUnit
      );

      if (!seriesMeasurements.has(seriesMeasurement.name)) {
        seriesMeasurements.set(seriesMeasurement.name, new Map());
      }

      seriesMeasurements
        .get(seriesMeasurement.name)
        .set(seriesMeasurement.seriesUnit, value);
    }

    return seriesMeasurements;
  }
}
