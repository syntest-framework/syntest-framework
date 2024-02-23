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
import { IllegalArgumentError, IllegalStateError } from "@syntest/diagnostics";
import { getLogger, Logger } from "@syntest/logging";

import {
  Distribution,
  DistributionMetric,
  DistributionsMap,
  Metric,
  MetricName,
  MetricType,
  PropertiesMap,
  PropertyMetric,
  Series,
  SeriesDistributionMetric,
  SeriesIndex,
  SeriesMap,
  SeriesMeasurementMetric,
  SeriesMetric,
  SeriesUnit,
} from "./Metric";
import { Middleware } from "./Middleware";

export class MetricManager {
  protected static LOGGER: Logger;

  private _namespacedManagers: Map<string, MetricManager>;

  getNamespaced(namespace: string): MetricManager {
    if (!this._namespacedManagers.has(namespace)) {
      const manager = new MetricManager(namespace);
      manager.metrics = this.metrics;
      this._namespacedManagers.set(namespace, manager);
    }

    return this._namespacedManagers.get(namespace);
  }

  private _namespace: string;
  private _metrics: Metric[] | undefined = undefined;
  private _outputMetrics: Metric[] | undefined = undefined;

  private properties: PropertiesMap<string>;
  private distributions: DistributionsMap;
  private series: SeriesMap<number>;
  private seriesDistributions: SeriesMap<Distribution>;
  private seriesMeasurements: SeriesMap<PropertiesMap<number>>;

  constructor(namespace: string) {
    MetricManager.LOGGER = getLogger("MetricManager");
    this._namespace = namespace;
    this._namespacedManagers = new Map();

    this.properties = new Map();
    this.distributions = new Map();
    this.series = new Map();
    this.seriesDistributions = new Map();
    this.seriesMeasurements = new Map();
  }

  get outputMetrics() {
    if (!this._outputMetrics) {
      throw new IllegalStateError("Output metrics not set");
    }
    return this._outputMetrics;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
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
      const seriesMetricMap = new Map<SeriesUnit, Series<number>>();
      for (const [unit, series] of seriesByType.entries()) {
        seriesMetricMap.set(unit, new Map(series));
      }
      this.series.set(name, seriesMetricMap);
    }

    // Merge series distributions
    for (const [
      name,
      seriesDistributionsByType,
    ] of other.seriesDistributions.entries()) {
      const seriesDistributionsMetricMap = new Map<
        SeriesUnit,
        Series<Distribution>
      >();
      for (const [unit, series] of seriesDistributionsByType.entries()) {
        const seriesDistributionsMap = new Map<SeriesIndex, Distribution>();
        for (const [seriesIndex, distribution] of series.entries()) {
          seriesDistributionsMap.set(seriesIndex, [...distribution]);
        }
        seriesDistributionsMetricMap.set(unit, seriesDistributionsMap);
      }
      this.seriesDistributions.set(name, seriesDistributionsMetricMap);
    }

    // Merge series measurements
    for (const [
      name,
      seriesMeasurementsByType,
    ] of other.seriesMeasurements.entries()) {
      const seriesMeasurementsMetricMap = new Map<
        SeriesUnit,
        Series<PropertiesMap<number>>
      >();
      for (const [unit, series] of seriesMeasurementsByType.entries()) {
        const seriesMeasurementsMap = new Map<
          SeriesIndex,
          PropertiesMap<number>
        >();
        for (const [seriesIndex, measurements] of series.entries()) {
          const measurementsMap = new Map<string, number>();
          for (const [key, value] of measurements.entries()) {
            measurementsMap.set(key, value);
          }
          seriesMeasurementsMap.set(seriesIndex, measurementsMap);
        }
        seriesMeasurementsMetricMap.set(unit, seriesMeasurementsMap);
      }
      this.seriesMeasurements.set(name, seriesMeasurementsMetricMap);
    }
  }

  getMergedNamespacedManager(namespace: string): MetricManager {
    if (!this._namespacedManagers.has(namespace)) {
      throw new IllegalStateError("Namespace not registered", {
        context: { namespace: namespace },
      });
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
          if (m.type !== split[0]) {
            return false;
          }

          switch (m.type) {
            case MetricType.PROPERTY:
            case MetricType.DISTRIBUTION: {
              return split[1] === "*" || m.name === split[1];
            }
            case MetricType.SERIES:
            case MetricType.SERIES_DISTRIBUTION:
            case MetricType.SERIES_MEASUREMENT: {
              return (
                (split[1] === "*" || m.name === split[1]) &&
                (split[2] === "*" || m.seriesUnit === split[2]) // eslint-disable-line @typescript-eslint/no-unsafe-enum-comparison
              );
            }
          }
        });

        if (!found) {
          throw new IllegalArgumentError("Output metric not found", {
            context: { metric: metric },
          });
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
      throw new IllegalStateError("Metrics not set");
    }
    return this._metrics;
  }

  set metrics(metrics: Metric[]) {
    this._metrics = metrics;

    for (const metric of this._metrics) {
      switch (metric.type) {
        case MetricType.PROPERTY: {
          this.properties.set(metric.name, "");
          break;
        }
        case MetricType.DISTRIBUTION: {
          this.distributions.set(metric.name, []);
          break;
        }
        case MetricType.SERIES: {
          if (!this.series.has(metric.name)) {
            this.series.set(metric.name, new Map());
          }
          this.series.get(metric.name).set(metric.seriesUnit, new Map());
          break;
        }
        case MetricType.SERIES_DISTRIBUTION: {
          if (!this.seriesDistributions.has(metric.name)) {
            this.seriesDistributions.set(metric.name, new Map());
          }
          this.seriesDistributions
            .get(metric.name)
            .set(metric.seriesUnit, new Map());
          break;
        }
        case MetricType.SERIES_MEASUREMENT: {
          if (!this.seriesMeasurements.has(metric.name)) {
            this.seriesMeasurements.set(metric.name, new Map());
          }
          this.seriesMeasurements
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

  async runPipeline(middleware: Middleware[]): Promise<void> {
    for (const _middleware of middleware) {
      MetricManager.LOGGER.debug(
        `Running middleware ${_middleware.constructor.name}`,
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
      throw new IllegalStateError("Cannot record unregistered property", {
        context: { property: property },
      });
    }

    this.properties.set(property, value);
  }

  recordDistribution(distributionName: MetricName, value: number) {
    MetricManager.LOGGER.debug(
      `Recording distribution ${distributionName} = ${value}`,
    );

    if (!this.distributions.has(distributionName)) {
      throw new IllegalStateError("Cannot record unregistered distribution", {
        context: { distribution: distributionName },
      });
    }

    this.distributions.get(distributionName).push(value);
  }

  recordSeries(
    seriesName: MetricName,
    seriesUnit: SeriesUnit,
    seriesIndex: SeriesIndex,
    value: number,
  ) {
    MetricManager.LOGGER.debug(
      `Recording series ${seriesName}.${seriesUnit}[${seriesIndex}] = ${value}`,
    );

    if (!this.series.has(seriesName)) {
      throw new IllegalStateError("Cannot record unregistered series", {
        context: { series: seriesName },
      });
    }

    if (!this.series.get(seriesName).has(seriesUnit)) {
      throw new IllegalStateError("Cannot record unregistered series unit", {
        context: { series: seriesName, unit: seriesUnit },
      });
    }

    this.series.get(seriesName).get(seriesUnit).set(seriesIndex, value);
  }

  recordSeriesDistribution(
    seriesDistributionName: MetricName,
    seriesUnit: SeriesUnit,
    seriesIndex: SeriesIndex,
    value: number,
  ) {
    MetricManager.LOGGER.debug(
      `Recording series distribution ${seriesDistributionName}.${seriesUnit}[${seriesIndex}] = ${value}`,
    );

    if (!this.seriesDistributions.has(seriesDistributionName)) {
      throw new IllegalStateError(
        "Cannot record unregistered series distribution",
        { context: { seriesDistribution: seriesDistributionName } },
      );
    }

    if (!this.seriesDistributions.get(seriesDistributionName).has(seriesUnit)) {
      throw new IllegalStateError(
        "Cannot record unregistered series distribution unit",
        {
          context: {
            seriesDistribution: seriesDistributionName,
            unit: seriesUnit,
          },
        },
      );
    }

    if (
      !this.seriesDistributions
        .get(seriesDistributionName)
        .get(seriesUnit)
        .has(seriesIndex)
    ) {
      this.seriesDistributions
        .get(seriesDistributionName)
        .get(seriesUnit)
        .set(seriesIndex, []);
    }

    this.seriesDistributions
      .get(seriesDistributionName)
      .get(seriesUnit)
      .get(seriesIndex)
      .push(value);
  }

  recordSeriesMeasurement(
    seriesMeasurementName: MetricName,
    seriesUnit: SeriesUnit,
    seriesIndex: SeriesIndex,
    key: string,
    value: number,
  ) {
    MetricManager.LOGGER.debug(
      `Recording series measurement ${seriesMeasurementName}.${seriesUnit}[${seriesIndex}].${key} = ${value}`,
    );

    if (!this.seriesMeasurements.has(seriesMeasurementName)) {
      throw new IllegalStateError(
        "Cannot record unregistered series measurement",
        { context: { seriesMeasurement: seriesMeasurementName } },
      );
    }

    if (!this.seriesMeasurements.get(seriesMeasurementName).has(seriesUnit)) {
      throw new IllegalStateError(
        "Cannot record unregistered series measurement unit",
        {
          context: {
            seriesMeasurement: seriesMeasurementName,
            unit: seriesUnit,
          },
        },
      );
    }

    if (
      !this.seriesMeasurements
        .get(seriesMeasurementName)
        .get(seriesUnit)
        .has(seriesIndex)
    ) {
      this.seriesMeasurements
        .get(seriesMeasurementName)
        .get(seriesUnit)
        .set(seriesIndex, new Map());
    }

    this.seriesMeasurements
      .get(seriesMeasurementName)
      .get(seriesUnit)
      .get(seriesIndex)
      .set(key, value);
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
    seriesUnit: SeriesUnit,
  ): Map<SeriesIndex, number> | undefined {
    MetricManager.LOGGER.debug(`Getting series ${seriesName}.${seriesUnit}`);

    if (!this.series.has(seriesName)) {
      return undefined;
    }

    return this.series.get(seriesName).get(seriesUnit);
  }

  getSeriesDistribution(
    seriesDistributionName: MetricName,
    seriesUnit: SeriesUnit,
  ): Map<SeriesIndex, number[]> | undefined {
    MetricManager.LOGGER.debug(
      `Getting series distribution ${seriesDistributionName}.${seriesUnit}`,
    );

    if (!this.seriesDistributions.has(seriesDistributionName)) {
      return undefined;
    }

    return this.seriesDistributions.get(seriesDistributionName).get(seriesUnit);
  }

  getSeriesMeasurement(
    seriesMeasurementName: string,
    seriesUnit: SeriesUnit,
  ): Series<PropertiesMap<number>> | undefined {
    MetricManager.LOGGER.debug(
      `Getting series measurement ${seriesMeasurementName}.${seriesUnit}`,
    );

    if (!this.seriesMeasurements.has(seriesMeasurementName)) {
      return undefined;
    }

    return this.seriesMeasurements.get(seriesMeasurementName).get(seriesUnit);
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
    return this.seriesMeasurements;
  }

  collectProperties(wanted: PropertyMetric[]): PropertiesMap<string> {
    const properties = new Map<MetricName, string>();

    for (const property of wanted) {
      const value = this.getProperty(property.name);

      properties.set(property.name, value);
    }

    return properties;
  }

  collectDistributions(wanted: DistributionMetric[]): DistributionsMap {
    const distributions = new Map<MetricName, number[]>();

    for (const distribution of wanted) {
      const value = this.getDistribution(distribution.name);

      distributions.set(distribution.name, value);
    }

    return distributions;
  }

  collectSeries(wanted: SeriesMetric[]): SeriesMap<number> {
    const series = new Map<MetricName, Map<SeriesUnit, Series<number>>>();

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
    wanted: SeriesDistributionMetric[],
  ): SeriesMap<Distribution> {
    const seriesDistributions = new Map<
      MetricName,
      Map<SeriesUnit, Series<Distribution>>
    >();

    for (const seriesDistribution of wanted) {
      const value = this.getSeriesDistribution(
        seriesDistribution.name,
        seriesDistribution.seriesUnit,
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
    wanted: SeriesMeasurementMetric[],
  ): SeriesMap<PropertiesMap<number>> {
    const seriesMeasurements = new Map<
      MetricName,
      Map<SeriesUnit, Series<PropertiesMap<number>>>
    >();

    for (const seriesMeasurement of wanted) {
      const value = this.getSeriesMeasurement(
        seriesMeasurement.name,
        seriesMeasurement.seriesUnit,
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
