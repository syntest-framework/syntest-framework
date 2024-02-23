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

import { existsSync } from "node:fs";
import * as path from "node:path";

import * as csv from "@fast-csv/format";
import {
  Distribution,
  DistributionMetric,
  DistributionsMap,
  Metric,
  MetricManager,
  MetricType,
  Middleware,
  PropertiesMap,
  PropertyMetric,
  SeriesDistributionMetric,
  SeriesMap,
  SeriesMeasurementMetric,
  SeriesMetric,
} from "@syntest/metric";
import { StorageManager } from "@syntest/storage";

export class FileWriterMetricMiddleware extends Middleware {
  private fid: string;
  private storageManager: StorageManager;
  private outputDirectory: string;

  constructor(
    metricManager: MetricManager,
    metrics: Metric[],
    fid: string,
    storageManager: StorageManager,
    outputDirectory: string,
  ) {
    super(metricManager, metrics);
    this.fid = fid;
    this.storageManager = storageManager;
    this.outputDirectory = outputDirectory;
  }

  async run(metricManager: MetricManager): Promise<void> {
    if (metricManager.namespace !== "global") {
      return;
    }
    const namespaces = [...metricManager.namespacedManagers.keys()];
    // process all namespaces
    for (const namespace of namespaces) {
      // get the merged manager (global + local)
      const mergedManager = metricManager.getMergedNamespacedManager(namespace);

      const properties = mergedManager.collectProperties(
        <PropertyMetric[]>(
          this.outputMetrics.filter(
            (metric) => metric.type === MetricType.PROPERTY,
          )
        ),
      );

      const distributions = mergedManager.collectDistributions(
        <DistributionMetric[]>(
          this.outputMetrics.filter(
            (metric) => metric.type === MetricType.DISTRIBUTION,
          )
        ),
      );

      const series = mergedManager.collectSeries(
        <SeriesMetric[]>(
          this.outputMetrics.filter(
            (metric) => metric.type === MetricType.SERIES,
          )
        ),
      );

      const seriesDistributions = mergedManager.collectSeriesDistributions(
        <SeriesDistributionMetric[]>(
          this.outputMetrics.filter(
            (metric) => metric.type === MetricType.SERIES_DISTRIBUTION,
          )
        ),
      );

      const seriesMeasurements = mergedManager.collectSeriesMeasurements(
        <SeriesMeasurementMetric[]>(
          this.outputMetrics.filter(
            (metric) => metric.type === MetricType.SERIES_MEASUREMENT,
          )
        ),
      );

      if (properties.size > 0) {
        await this.writePropertiesToCSV(
          this.outputDirectory,
          namespace,
          properties,
        );
      }
      if (distributions.size > 0) {
        await this.writeDistributionsToCSV(
          this.outputDirectory,
          namespace,
          distributions,
        );
      }
      if (series.size > 0) {
        await this.writeSeriesToCSV(this.outputDirectory, namespace, series);
      }
      if (seriesDistributions.size > 0) {
        await this.writeSeriesDistributionToCSV(
          this.outputDirectory,
          namespace,
          seriesDistributions,
        );
      }
      if (seriesMeasurements.size > 0) {
        await this.writeSeriesMeasurementToCSV(
          this.outputDirectory,
          namespace,
          seriesMeasurements,
        );
      }
    }
  }

  /**
   * Creates a CSV file with the properties
   * Create one line per namespace
   *
   * The format is:
   * namespace,property1,property2,property3
   *
   * @param filePath
   * @param namespace
   * @param properties
   */
  async writePropertiesToCSV(
    filePath: string,
    namespace: string,
    properties: PropertiesMap<string>,
  ): Promise<void> {
    const fileName = "properties.csv";
    const exists = existsSync(path.join(filePath, fileName));

    const data = {
      fid: this.fid,
      namespace: namespace,
      ...Object.fromEntries(properties),
    };

    const dataAsString = await csv.writeToString([data], {
      headers: !exists,
      includeEndRowDelimiter: true,
    });

    this.storageManager.store([filePath], fileName, dataAsString, false, true);
  }

  /**
   * Creates a CSV file with the distributions
   * Create one line per value
   *
   * The format is:
   * namespace,distributionName,value
   *
   * @param filePath
   * @param namespace
   * @param distributions
   */
  async writeDistributionsToCSV(
    filePath: string,
    namespace: string,
    distributions: DistributionsMap,
  ): Promise<void> {
    const fileName = "distributions.csv";
    const exists = existsSync(path.join(filePath, fileName));

    const fullData = [];

    for (const [
      distributionName,
      distributionData,
    ] of distributions.entries()) {
      for (const value of distributionData) {
        fullData.push({
          fid: this.fid,
          namespace: namespace,
          distributionName: distributionName,
          value: value,
        });
      }
    }

    const dataAsString = await csv.writeToString(fullData, {
      headers: !exists,
      includeEndRowDelimiter: true,
    });

    this.storageManager.store([filePath], fileName, dataAsString);
  }

  /**
   * Creates a CSV file with the series
   * Create one line per index
   *
   * The format is:
   * namespace,seriesName,seriesUnit,seriesIndex,value
   *
   * @param filePath
   * @param namespace
   * @param series
   */
  async writeSeriesToCSV(
    filePath: string,
    namespace: string,
    series: SeriesMap<number>,
  ): Promise<void> {
    const fileName = "series.csv";
    const exists = existsSync(path.join(filePath, fileName));

    const fullData = [];

    for (const [seriesName, seriesByUnit] of series.entries()) {
      for (const [seriesUnit, seriesData] of seriesByUnit.entries()) {
        for (const [seriesIndex, value] of seriesData.entries()) {
          fullData.push({
            fid: this.fid,
            namespace: namespace,
            seriesName: seriesName,
            seriesUnit: seriesUnit,
            seriesIndex: seriesIndex,
            value: value,
          });
        }
      }
    }

    const dataAsString = await csv.writeToString(fullData, {
      headers: !exists,
      includeEndRowDelimiter: true,
    });

    this.storageManager.store([filePath], fileName, dataAsString);
  }

  /**
   * Creates a CSV file with the series distributions
   * Create one line per value
   *
   * The format is:
   * namespace,seriesDistributionName,seriesUnit,seriesIndex,value
   *
   * @param filePath
   * @param namespace
   * @param seriesDistributions
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async writeSeriesDistributionToCSV(
    filePath: string,
    namespace: string,
    seriesDistributions: SeriesMap<Distribution>,
  ): Promise<void> {
    const fileName = "series-distributions.csv";
    const exists = existsSync(path.join(filePath, fileName));

    const fullData = [];

    for (const [
      seriesDistributionName,
      seriesDistributionsByType,
    ] of seriesDistributions.entries()) {
      for (const [seriesUnit, series] of seriesDistributionsByType.entries()) {
        for (const [seriesIndex, distribution] of series.entries()) {
          for (const value of distribution) {
            fullData.push({
              fid: this.fid,
              namespace: namespace,
              seriesDistributionName: seriesDistributionName,
              seriesUnit: seriesUnit,
              seriesIndex: seriesIndex,
              value: value,
            });
          }
        }
      }
    }

    const dataAsString = await csv.writeToString(fullData, {
      headers: !exists,
      includeEndRowDelimiter: true,
    });

    this.storageManager.store([filePath], fileName, dataAsString);
  }

  /**
   * Creates a CSV file with the series measurements
   * Create one line per index
   *
   * The format is:
   * namespace,seriesMeasurementName,seriesUnit,seriesIndex,key,value
   *
   * @param filePath
   * @param namespace
   * @param seriesMeasurements
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async writeSeriesMeasurementToCSV(
    filePath: string,
    namespace: string,
    seriesDistributions: SeriesMap<PropertiesMap<number>>,
  ): Promise<void> {
    const fileName = "series-measurements.csv";
    const exists = existsSync(path.join(filePath, fileName));

    const fullData = [];

    for (const [
      seriesMeasurementName,
      seriesMeasurementsByType,
    ] of seriesDistributions.entries()) {
      for (const [seriesUnit, series] of seriesMeasurementsByType.entries()) {
        for (const [seriesIndex, measurements] of series.entries()) {
          for (const [key, value] of measurements.entries()) {
            fullData.push({
              fid: this.fid,
              namespace: namespace,
              seriesMeasurementName: seriesMeasurementName,
              seriesUnit: seriesUnit,
              seriesIndex: seriesIndex,
              key: key,
              value: value,
            });
          }
        }
      }
    }

    const dataAsString = await csv.writeToString(fullData, {
      headers: !exists,
      includeEndRowDelimiter: true,
    });

    this.storageManager.store([filePath], fileName, dataAsString);
  }
}
