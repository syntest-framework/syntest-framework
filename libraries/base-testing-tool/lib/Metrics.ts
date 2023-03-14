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

export const Metrics: Metric[] = [
  // general
  {
    type: MetricType.PROPERTY,
    property: "seed",
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
    property: "covered-objectives",
  },
  {
    type: MetricType.PROPERTY,
    property: "objective-value",
  },
  {
    type: MetricType.PROPERTY,
    property: "total-objectives",
  },
  // coverage
  {
    type: MetricType.SERIES,
    seriesName: "covered-branches",
    seriesType: "time",
  },
  {
    type: MetricType.SERIES,
    seriesName: "covered-exceptions",
    seriesType: "time",
  },
  {
    type: MetricType.SERIES,
    seriesName: "covered-functions",
    seriesType: "time",
  },
  {
    type: MetricType.SERIES,
    seriesName: "covered-lines",
    seriesType: "time",
  },
  {
    type: MetricType.SERIES,
    seriesName: "covered-branches",
    seriesType: "iteration",
  },
  {
    type: MetricType.SERIES,
    seriesName: "covered-exceptions",
    seriesType: "iteration",
  },
  {
    type: MetricType.SERIES,
    seriesName: "covered-functions",
    seriesType: "iteration",
  },
  {
    type: MetricType.SERIES,
    seriesName: "covered-lines",
    seriesType: "iteration",
  },
  {
    type: MetricType.SERIES,
    seriesName: "covered-branches",
    seriesType: "evaluation",
  },
  {
    type: MetricType.SERIES,
    seriesName: "covered-exceptions",
    seriesType: "evaluation",
  },
  {
    type: MetricType.SERIES,
    seriesName: "covered-functions",
    seriesType: "evaluation",
  },
  {
    type: MetricType.SERIES,
    seriesName: "covered-lines",
    seriesType: "evaluation",
  },
  {
    type: MetricType.PROPERTY,
    property: "total-branches",
  },
  {
    type: MetricType.PROPERTY,
    property: "total-functions",
  },
  {
    type: MetricType.PROPERTY,
    property: "total-lines",
  },
  // Time
  {
    type: MetricType.PROPERTY,
    property: "initialization-time",
  },
  {
    type: MetricType.PROPERTY,
    property: "search-time",
  },
  {
    type: MetricType.PROPERTY,
    property: "total-time",
  },
  {
    type: MetricType.PROPERTY,
    property: "instrumentation-time",
  },
  // Archive
  {
    type: MetricType.SERIES,
    seriesName: "archive-size",
    seriesType: "time",
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
