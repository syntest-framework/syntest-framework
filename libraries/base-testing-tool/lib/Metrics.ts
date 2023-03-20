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

import { Metric, MetricType } from "@syntest/metric";

export enum SeriesType {
  SEARCH_TIME = "search-time",
  TOTAL_TIME = "total-time",
  ITERATION = "iteration",
  EVALUATION = "evaluation",
}

export const metrics: Metric[] = [
  // coverage
  // search time
  {
    type: MetricType.SERIES,
    seriesName: "paths-covered",
    seriesType: SeriesType.SEARCH_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: "branches-covered",
    seriesType: SeriesType.SEARCH_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: "exceptions-covered",
    seriesType: SeriesType.SEARCH_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: "functions-covered",
    seriesType: SeriesType.SEARCH_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: "lines-covered",
    seriesType: SeriesType.SEARCH_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: "probes-covered",
    seriesType: SeriesType.SEARCH_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: "objectives-covered",
    seriesType: SeriesType.SEARCH_TIME,
  },
  // total time
  {
    type: MetricType.SERIES,
    seriesName: "paths-covered",
    seriesType: SeriesType.TOTAL_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: "branches-covered",
    seriesType: SeriesType.TOTAL_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: "exceptions-covered",
    seriesType: SeriesType.TOTAL_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: "functions-covered",
    seriesType: SeriesType.TOTAL_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: "lines-covered",
    seriesType: SeriesType.TOTAL_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: "probes-covered",
    seriesType: SeriesType.TOTAL_TIME,
  },
  {
    type: MetricType.SERIES,
    seriesName: "objectives-covered",
    seriesType: SeriesType.TOTAL_TIME,
  },
  // iterations
  {
    type: MetricType.SERIES,
    seriesName: "paths-covered",
    seriesType: SeriesType.ITERATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: "branches-covered",
    seriesType: SeriesType.ITERATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: "exceptions-covered",
    seriesType: SeriesType.ITERATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: "functions-covered",
    seriesType: SeriesType.ITERATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: "lines-covered",
    seriesType: SeriesType.ITERATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: "probes-covered",
    seriesType: SeriesType.ITERATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: "objectives-covered",
    seriesType: SeriesType.ITERATION,
  },
  // evaluations
  {
    type: MetricType.SERIES,
    seriesName: "branches-covered",
    seriesType: SeriesType.EVALUATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: "paths-covered",
    seriesType: SeriesType.EVALUATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: "exceptions-covered",
    seriesType: SeriesType.EVALUATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: "functions-covered",
    seriesType: SeriesType.EVALUATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: "lines-covered",
    seriesType: SeriesType.EVALUATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: "probes-covered",
    seriesType: SeriesType.EVALUATION,
  },
  {
    type: MetricType.SERIES,
    seriesName: "objectives-covered",
    seriesType: SeriesType.EVALUATION,
  },
  // totals
  {
    type: MetricType.PROPERTY,
    property: "paths-total",
  },
  {
    type: MetricType.PROPERTY,
    property: "branches-total",
  },
  {
    type: MetricType.PROPERTY,
    property: "functions-total",
  },
  {
    type: MetricType.PROPERTY,
    property: "lines-total",
  },
  {
    type: MetricType.PROPERTY,
    property: "probes-total",
  },
  {
    type: MetricType.PROPERTY,
    property: "objectives-total",
  },
  // final coverage
  {
    type: MetricType.PROPERTY,
    property: "path-coverage",
  },
  {
    type: MetricType.PROPERTY,
    property: "branch-coverage",
  },
  {
    type: MetricType.PROPERTY,
    property: "function-coverage",
  },
  {
    type: MetricType.PROPERTY,
    property: "line-coverage",
  },
  {
    type: MetricType.PROPERTY,
    property: "probe-coverage",
  },
  {
    type: MetricType.PROPERTY,
    property: "objective-coverage",
  },

  // TODO

  // general properties
  {
    type: MetricType.PROPERTY,
    property: "random-seed",
  },
  {
    type: MetricType.PROPERTY,
    property: "subject",
  },
  // search
  {
    type: MetricType.PROPERTY,
    property: "algorithm",
  },
  {
    type: MetricType.PROPERTY,
    property: "evaluations",
  },
  {
    type: MetricType.PROPERTY,
    property: "iterations",
  },
  {
    type: MetricType.PROPERTY,
    property: "constant-pool",
  },
  // objectives
  {
    type: MetricType.PROPERTY,
    property: "objective-value",
  },

  // Time
  {
    type: MetricType.PROPERTY,
    property: "initialization-time",
  },
  {
    type: MetricType.PROPERTY,
    property: SeriesType.SEARCH_TIME,
  },
  {
    type: MetricType.PROPERTY,
    property: SeriesType.TOTAL_TIME,
  },
  {
    type: MetricType.PROPERTY,
    property: "instrumentation-time",
  },
  // Archive
  {
    type: MetricType.SERIES,
    seriesName: "archive-size",
    seriesType: SeriesType.TOTAL_TIME,
  },
  {
    type: MetricType.PROPERTY,
    property: "archive-size",
  },
  {
    type: MetricType.PROPERTY,
    property: "minimized-size",
  },
];
