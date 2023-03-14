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

import { Module, Plugin, Tool } from "@syntest/module";
import {
  ResearchModeOptions,
  SearchStatisticsListener,
  StorageOptions,
} from "./listeners/SearchStatisticsListener";
import { StatisticsCollector } from "./statistics/StatisticsCollector";
import { Timing } from "./statistics/Timing";
import { CoverageWriter } from "./statistics/CoverageWriter";
import { SummaryWriter } from "./statistics/SummaryWriter";
import * as path from "path";
import { existsSync, mkdirSync } from "fs";
import { Metric } from "@syntest/metric";

export default class StatisticsModule extends Module {
  private searchStatisticsListener: SearchStatisticsListener;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    super("Statistics", require("../package.json").version);
    this.searchStatisticsListener = new SearchStatisticsListener(
      new StatisticsCollector(),
      new Timing()
    );
  }

  getTools(): Tool[] | Promise<Tool[]> {
    return [];
  }

  getPlugins(): Plugin[] | Promise<Plugin[]> {
    return [this.searchStatisticsListener];
  }

  getMetrics(): Metric[] | Promise<Metric[]> {
    return [];
  }

  prepare(): void | Promise<void> {
    const statisticsDirectory = path.join(
      (<{ syntestDirectory: string }>(<unknown>this.args)).syntestDirectory,
      (<AllOptions>(<unknown>this.args)).statisticsDirectory
    );
    if (!existsSync(statisticsDirectory)) {
      mkdirSync(statisticsDirectory);
    }
  }

  cleanup(): void | Promise<void> {
    const statisticsDirectory = path.resolve(
      (<AllOptions>(<unknown>this.args)).statisticsDirectory
    );

    const summaryWriter = new SummaryWriter();
    summaryWriter.write(
      this.searchStatisticsListener.collector,
      path.join(statisticsDirectory, "statistics.csv")
    );

    const coverageWriter = new CoverageWriter();
    coverageWriter.write(
      this.searchStatisticsListener.collector,
      path.join(statisticsDirectory, "coverage.csv")
    );
  }
}

export type AllOptions = StorageOptions & ResearchModeOptions;
