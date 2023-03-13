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
import { singletonAlreadySet, singletonNotSet } from "@syntest/module";
import { MiddleWare } from "./middleware/Middleware";
import { getLogger } from "@syntest/logging";

export class MetricManager {
  private static _instance: MetricManager;
  static LOGGER;

  public static get instance() {
    if (!MetricManager._instance) {
      throw new Error(singletonNotSet("MetricManager"));
    }
    return MetricManager._instance;
  }

  public static initialize(middleware: MiddleWare[]) {
    if (MetricManager.instance) {
      throw new Error(singletonAlreadySet("MetricManager"));
    }

    MetricManager._instance = new MetricManager(middleware);
    MetricManager.LOGGER = getLogger("ModuleManager");
  }

  private middleware: MiddleWare[] = [];

  private properties: Map<string, Map<string, string>>;
  private distributions: Map<string, Map<string, number[]>>;
  private series: Map<string, Map<string, Map<string, Map<number, number>>>>;
  private seriesDistributions: Map<
    string,
    Map<string, Map<string, Map<string, Map<number, number[]>>>>
  >;

  constructor(middleware: MiddleWare[]) {
    this.middleware = middleware;
    this.properties = new Map();
    this.series = new Map();
    this.distributions = new Map();
    this.seriesDistributions = new Map();
  }

  runPipeline() {
    this.middleware.forEach((middleware) => {
      MetricManager.LOGGER.debug(
        `Running middleware ${middleware.constructor.name}`
      );
      middleware.run(this);
    });
  }

  recordProperty(namespace: string, property: string, value: string) {
    MetricManager.LOGGER.debug(
      `Recording property ${namespace}.${property} = ${value}`
    );
    if (!this.properties.has(namespace)) {
      this.properties.set(namespace, new Map());
    }

    this.properties.get(namespace).set(property, value);
  }

  recordDistribution(
    namespace: string,
    distributionName: string,
    value: number
  ) {
    MetricManager.LOGGER.debug(
      `Recording distribution ${namespace}.${distributionName} = ${value}`
    );
    if (!this.distributions.has(namespace)) {
      this.distributions.set(namespace, new Map());
    }

    if (!this.distributions.get(namespace).has(distributionName)) {
      this.distributions.get(namespace).set(distributionName, []);
    }

    this.distributions.get(namespace).get(distributionName).push(value);
  }

  recordSeries(
    namespace: string,
    seriesName: string,
    seriesType: string,
    index: number,
    value: number
  ) {
    MetricManager.LOGGER.debug(
      `Recording series ${namespace}.${seriesName}.${seriesType}[${index}] = ${value}`
    );
    if (!this.series.has(namespace)) {
      this.series.set(namespace, new Map());
    }

    if (!this.series.get(namespace).has(seriesName)) {
      this.series.get(namespace).set(seriesName, new Map());
    }

    if (!this.series.get(namespace).get(seriesName).has(seriesType)) {
      this.series.get(namespace).get(seriesName).set(seriesType, new Map());
    }

    this.series
      .get(namespace)
      .get(seriesName)
      .get(seriesType)
      .set(index, value);
  }

  recordSeriesDistribution(
    namespace: string,
    distributionName: string,
    seriesName: string,
    seriesType: string,
    index: number,
    value: number
  ) {
    MetricManager.LOGGER.debug(
      `Recording series distribution ${namespace}.${distributionName}.${seriesName}.${seriesType}[${index}] = ${value}`
    );
    if (!this.seriesDistributions.has(namespace)) {
      this.seriesDistributions.set(namespace, new Map());
    }

    if (!this.seriesDistributions.get(namespace).has(distributionName)) {
      this.seriesDistributions.get(namespace).set(distributionName, new Map());
    }

    if (
      !this.seriesDistributions
        .get(namespace)
        .get(distributionName)
        .has(seriesName)
    ) {
      this.seriesDistributions
        .get(namespace)
        .get(distributionName)
        .set(seriesName, new Map());
    }

    if (
      !this.seriesDistributions
        .get(namespace)
        .get(distributionName)
        .get(seriesName)
        .has(seriesType)
    ) {
      this.seriesDistributions
        .get(namespace)
        .get(distributionName)
        .get(seriesName)
        .set(seriesType, new Map());
    }

    if (
      !this.seriesDistributions
        .get(namespace)
        .get(distributionName)
        .get(seriesName)
        .get(seriesType)
        .has(index)
    ) {
      this.seriesDistributions
        .get(namespace)
        .get(distributionName)
        .get(seriesName)
        .get(seriesType)
        .set(index, []);
    }

    this.seriesDistributions
      .get(namespace)
      .get(distributionName)
      .get(seriesName)
      .get(seriesType)
      .get(index)
      .push(value);
  }

  getProperty(namespace: string, property: string): string | undefined {
    MetricManager.LOGGER.debug(`Getting property ${namespace}.${property}`);
    if (!this.properties.has(namespace)) {
      return undefined;
    }

    return this.properties.get(namespace).get(property);
  }

  getDistribution(
    namespace: string,
    distributionName: string
  ): number[] | undefined {
    MetricManager.LOGGER.debug(
      `Getting distribution ${namespace}.${distributionName}`
    );
    if (!this.distributions.has(namespace)) {
      return undefined;
    }

    return this.distributions.get(namespace).get(distributionName);
  }

  getSeries(
    namespace: string,
    seriesName: string,
    seriesType: string
  ): Map<number, number> | undefined {
    MetricManager.LOGGER.debug(
      `Getting series ${namespace}.${seriesName}.${seriesType}`
    );
    if (!this.series.has(namespace)) {
      return undefined;
    }

    if (!this.series.get(namespace).has(seriesName)) {
      return undefined;
    }

    return this.series.get(namespace).get(seriesName).get(seriesType);
  }

  getSeriesDistribution(
    namespace: string,
    distributionName: string,
    seriesName: string,
    seriesType: string
  ): Map<number, number[]> | undefined {
    MetricManager.LOGGER.debug(
      `Getting series distribution ${namespace}.${distributionName}.${seriesName}.${seriesType}`
    );
    if (!this.seriesDistributions.has(namespace)) {
      return undefined;
    }

    if (!this.seriesDistributions.get(namespace).has(distributionName)) {
      return undefined;
    }

    if (
      !this.seriesDistributions
        .get(namespace)
        .get(distributionName)
        .has(seriesName)
    ) {
      return undefined;
    }

    return this.seriesDistributions
      .get(namespace)
      .get(distributionName)
      .get(seriesName)
      .get(seriesType);
  }

  getAllProperties(): Map<string, Map<string, string>> {
    return this.properties;
  }

  getAllDistributions(): Map<string, Map<string, number[]>> {
    return this.distributions;
  }

  getAllSeries(): Map<string, Map<string, Map<string, Map<number, number>>>> {
    return this.series;
  }

  getAllSeriesDistributions(): Map<
    string,
    Map<string, Map<string, Map<string, Map<number, number[]>>>>
  > {
    return this.seriesDistributions;
  }
}
