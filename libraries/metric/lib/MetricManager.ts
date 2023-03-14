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
import { singletonAlreadySet, singletonNotSet } from "./util/diagnostics";
import { MiddleWare } from "./Middleware";
import { getLogger } from "@syntest/logging";
import { Metric } from "./Metric";

export class MetricManager {
  private static _instance: MetricManager;
  static LOGGER;

  public static get instance(): MetricManager {
    if (!MetricManager._instance) {
      throw new Error(singletonNotSet("MetricManager"));
    }
    return MetricManager._instance;
  }

  public static initialize(middleware: MiddleWare[], metrics: Metric[]) {
    if (MetricManager._instance) {
      throw new Error(singletonAlreadySet("MetricManager"));
    }

    MetricManager._instance = new MetricManager(middleware, metrics);
    MetricManager.LOGGER = getLogger("ModuleManager");
  }

  private middleware: MiddleWare[];

  private properties: Map<string, string>;
  private distributions: Map<string, number[]>;
  private series: Map<string, Map<string, Map<number, number>>>;
  private seriesDistributions: Map<
    string,
    Map<string, Map<string, Map<number, number[]>>>
  >;

  constructor(middleware: MiddleWare[], metrics: Metric[]) {
    this.middleware = middleware;
    this.properties = new Map();
    this.series = new Map();
    this.distributions = new Map();
    this.seriesDistributions = new Map();

    metrics.forEach((metric) => {
      switch (metric.type) {
        case "property":
          this.properties.set(metric.property, "");
          break;
        case "distribution":
          this.distributions.set(metric.distributionName, []);
          break;
        case "series":
          this.series.set(metric.seriesName, new Map());
          this.series.get(metric.seriesName).set(metric.seriesType, new Map());
          break;
        case "distribution-series":
          this.seriesDistributions.set(metric.distributionName, new Map());
          this.seriesDistributions
            .get(metric.distributionName)
            .set(metric.seriesName, new Map());
          this.seriesDistributions
            .get(metric.distributionName)
            .get(metric.seriesName)
            .set(metric.seriesType, new Map());
          break;
      }
    });
  }

  runPipeline() {
    this.middleware.forEach((middleware) => {
      MetricManager.LOGGER.debug(
        `Running middleware ${middleware.constructor.name}`
      );
      middleware.run(this);
    });
  }

  recordProperty(property: string, value: string) {
    MetricManager.LOGGER.debug(`Recording property ${property} = ${value}`);

    if (!this.properties.has(property)) {
      throw new Error(
        `Cannot record property! Metric '${property}' is not registered by any module!`
      );
    }

    this.properties.set(property, value);
  }

  recordDistribution(distributionName: string, value: number) {
    MetricManager.LOGGER.debug(
      `Recording distribution ${distributionName} = ${value}`
    );

    if (!this.distributions.has(distributionName)) {
      throw new Error(
        `Cannot record distribution! Metric '${distributionName}' is not registered by any module!`
      );
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
      throw new Error(
        `Cannot record series! Metric '${seriesName}' is not registered by any module!`
      );
    }

    if (!this.series.get(seriesName).has(seriesType)) {
      throw new Error(
        `Cannot record series! Metric '${seriesName}.${seriesType}' is not registered by any module!`
      );
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
      this.seriesDistributions.set(distributionName, new Map());
    }

    if (!this.seriesDistributions.get(distributionName).has(seriesName)) {
      this.seriesDistributions.get(distributionName).set(seriesName, new Map());
    }

    if (
      !this.seriesDistributions
        .get(distributionName)
        .get(seriesName)
        .has(seriesType)
    ) {
      this.seriesDistributions
        .get(distributionName)
        .get(seriesName)
        .set(seriesType, new Map());
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
}
