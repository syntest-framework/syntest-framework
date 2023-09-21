/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest JavaScript.
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

import {
  InstrumentationDataMap,
  MetaDataMap,
} from "@syntest/instrumentation-javascript";
import cloneDeep = require("lodash.clonedeep");
import { Runner } from "mocha";
import Mocha = require("mocha");

import { JavaScriptExecutionStatus } from "../../search/JavaScriptExecutionResult";

import { AssertionData } from "./AssertionData";
import { SilentMochaReporter } from "./SilentMochaReporter";

export type Message = RunMessage | DoneMessage;

export type RunMessage = {
  message: "run";
  silent: boolean;
  paths: string[];
  timeout: number;
};

export type DoneMessage = {
  message: "done";
  suites: Suite[];
  stats: Mocha.Stats;
  instrumentationData: InstrumentationDataMap;
  metaData: MetaDataMap;
  assertionData?: AssertionData;
  error?: string;
};

export type Suite = {
  tests: Test[];
};

export type Test = {
  status: JavaScriptExecutionStatus;
  error?: Error | undefined;
  duration: number;
};

process.on("uncaughtException", (reason) => {
  throw reason;
});
process.on("unhandledRejection", (reason) => {
  throw reason;
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on("message", async (data: Message) => {
  if (typeof data !== "object") {
    throw new TypeError("Invalid data received from child process");
  }
  if (data.message === "run") {
    await runMocha(data.silent, data.paths, data.timeout);
  }
});

async function runMocha(silent: boolean, paths: string[], timeout: number) {
  const argv: Mocha.MochaOptions = <Mocha.MochaOptions>(<unknown>{
    reporter: silent ? SilentMochaReporter : undefined,
    // diff: false,
    // checkLeaks: false,
    // slow: 75,
    timeout: timeout,

    // watch: false,
    // parallel: false,
    // recursive: false,
    // sort: false,
  });

  const mocha = new Mocha(argv); // require('ts-node/register')
  // eslint-disable-next-line unicorn/prefer-module
  require("regenerator-runtime/runtime");
  // eslint-disable-next-line unicorn/prefer-module, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires
  require("@babel/register")({
    // eslint-disable-next-line unicorn/prefer-module
    presets: [require.resolve("@babel/preset-env")],
  });

  for (const _path of paths) {
    // eslint-disable-next-line unicorn/prefer-module
    delete require.cache[_path];
    mocha.addFile(_path);
  }

  let runner: Runner;

  // Finally, run mocha.
  await new Promise((resolve) => {
    runner = mocha.run((failures) => resolve(failures));
  });

  const suites: Suite[] = runner.suite.suites.map((suite) => {
    return {
      tests: suite.tests.map((test) => {
        let status: JavaScriptExecutionStatus;
        if (test.isPassed()) {
          status = JavaScriptExecutionStatus.PASSED;
        } else if (test.timedOut) {
          status = JavaScriptExecutionStatus.TIMED_OUT;
        } else {
          status = JavaScriptExecutionStatus.FAILED;
        }

        return {
          status: status,
          error:
            status === JavaScriptExecutionStatus.FAILED
              ? {
                  name: test.err.name,
                  message: test.err.message,
                  stack: test.err.stack,
                }
              : undefined,
          duration: test.duration,
        };
      }),
    };
  });

  // Retrieve execution traces
  const result: DoneMessage = {
    message: "done",
    suites: suites,
    stats: runner.stats,
    instrumentationData: cloneDeep(
      (<GlobalType>(<unknown>global)).__coverage__
    ),
    metaData: cloneDeep((<GlobalType>(<unknown>global)).__meta__),
    assertionData: cloneDeep((<GlobalType>(<unknown>global)).__assertion__),
  };
  resetInstrumentationData();
  (<GlobalType>(<unknown>global)).__meta__ = undefined;
  (<GlobalType>(<unknown>global)).__assertion__ = undefined;
  process.send(result);

  mocha.dispose();
}

function resetInstrumentationData() {
  const coverage = (<GlobalType>(<unknown>global)).__coverage__;

  if (coverage === undefined) {
    return;
  }

  for (const key of Object.keys(coverage)) {
    for (const statementKey of Object.keys(coverage[key].s)) {
      coverage[key].s[statementKey] = 0;
    }
    for (const functionKey of Object.keys(coverage[key].f)) {
      coverage[key].f[functionKey] = 0;
    }
    for (const branchKey of Object.keys(coverage[key].b)) {
      coverage[key].b[branchKey] = [0, 0];
    }
  }
}

type GlobalType = {
  __coverage__: InstrumentationDataMap;
  __meta__: MetaDataMap;
  __assertion__: AssertionData;
};
