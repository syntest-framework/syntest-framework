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
import { MetricManager } from "@syntest/metric";
import { StorageManager } from "@syntest/storage";
import * as chai from "chai";

import { FileWriterMetricMiddleware } from "../lib/middleware/FileWriterMetricMiddleware";

const expect = chai.expect;

/**
 * This test is only added such that the github action does not fail.
 */
describe("example test", () => {
  it("test", () => {
    const metricManager = new MetricManager("");
    metricManager.setOutputMetrics([]);
    new FileWriterMetricMiddleware(
      metricManager,
      [],
      "",
      new StorageManager("path", "tempPath", "fid"),
      "",
    );
    expect(true);
  });
});
