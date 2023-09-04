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
import { SeriesUnit } from "./PropertyTypes";

export type Metric =
  | PropertyMetric
  | DistributionMetric
  | SeriesMetric
  | SeriesDistributionMetric
  | SeriesMeasurementMetric;

export interface PropertyMetric {
  type: MetricType.PROPERTY;
  name: string;
}

export interface DistributionMetric {
  type: MetricType.DISTRIBUTION;
  name: string;
}

export interface SeriesMetric {
  type: MetricType.SERIES;
  name: string;
  seriesUnit: SeriesUnit;
}

export interface SeriesDistributionMetric {
  type: MetricType.SERIES_DISTRUBUTION;
  name: string;
  seriesUnit: SeriesUnit;
}

export interface SeriesMeasurementMetric {
  type: MetricType.SERIES_MEASUREMENT;
  name: string;
  seriesUnit: SeriesUnit;
}

export enum MetricType {
  PROPERTY = "property",
  DISTRIBUTION = "distribution",
  SERIES = "series",
  SERIES_DISTRUBUTION = "series-distribution",
  SERIES_MEASUREMENT = "series-measurement",
}
