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

import { existsSync } from "node:fs";
import * as path from "node:path";

import * as csv from "@fast-csv/format";
import {
  Distribution,
  DistributionMetric,
  Metric,
  MetricManager,
  MetricName,
  Middleware,
  PropertyMetric,
  SeriesDistributionMetric,
  SeriesIndex,
  SeriesMetric,
  SeriesType,
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
    outputDirectory: string
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
          this.outputMetrics.filter((metric) => metric.type === "property")
        )
      );

      const distributions = mergedManager.collectDistributions(
        <DistributionMetric[]>(
          this.outputMetrics.filter((metric) => metric.type === "distribution")
        )
      );

      const series = mergedManager.collectSeries(
        <SeriesMetric[]>(
          this.outputMetrics.filter((metric) => metric.type === "series")
        )
      );

      const seriesDistributions = mergedManager.collectSeriesDistributions(
        <SeriesDistributionMetric[]>(
          this.outputMetrics.filter(
            (metric) => metric.type === "series-distribution"
          )
        )
      );

      if (properties.size > 0) {
        await this.writePropertiesToCSV(
          this.outputDirectory,
          namespace,
          properties
        );
      }
      if (distributions.size > 0) {
        await this.writeDistributionsToCSV(
          this.outputDirectory,
          namespace,
          distributions
        );
      }
      if (series.size > 0) {
        await this.writeSeriesToCSV(this.outputDirectory, namespace, series);
      }
      if (seriesDistributions.size > 0) {
        await this.writeSeriesDistributionToCSV(
          this.outputDirectory,
          namespace,
          seriesDistributions
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
    properties: Map<MetricName, string>
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
    distributions: Map<MetricName, Distribution>
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
   * namespace,seriesName,seriesTypeName,index,value
   *
   * @param filePath
   * @param namespace
   * @param series
   */
  async writeSeriesToCSV(
    filePath: string,
    namespace: string,
    series: Map<MetricName, Map<SeriesType, Map<SeriesIndex, number>>>
  ): Promise<void> {
    const fileName = "series.csv";
    const exists = existsSync(path.join(filePath, fileName));

    const fullData = [];

    for (const [seriesName, seriesByType] of series.entries()) {
      for (const [seriesType, seriesData] of seriesByType.entries()) {
        for (const [seriesIndex, value] of seriesData.entries()) {
          fullData.push({
            fid: this.fid,
            namespace: namespace,
            seriesName: seriesName,
            seriesTypeName: seriesType,
            index: seriesIndex,
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
   * namespace,distributionName,seriesName,seriesType,index,value
   *
   * @param filePath
   * @param namespace
   * @param seriesDistributions
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async writeSeriesDistributionToCSV(
    filePath: string,
    namespace: string,
    seriesDistributions: Map<
      MetricName,
      Map<SeriesType, Map<SeriesIndex, Distribution>>
    >
  ): Promise<void> {
    const fileName = "series-distributions.csv";
    const exists = existsSync(path.join(filePath, fileName));

    const fullData = [];

    for (const [
      seriesDistributionName,
      seriesDistributionByType,
    ] of seriesDistributions.entries()) {
      for (const [seriesType, series] of seriesDistributionByType.entries()) {
        for (const [seriesIndex, distribution] of series.entries()) {
          for (const value of distribution) {
            fullData.push({
              fid: this.fid,
              namespace: namespace,
              seriesDistributionName: seriesDistributionName,
              seriesType: seriesType,
              index: seriesIndex,
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
