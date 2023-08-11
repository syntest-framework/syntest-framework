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

import { Runner } from "mocha";
import Mocha = require("mocha");
import { JavaScriptExecutionStatus } from "../../search/JavaScriptExecutionResult";
import {
  InstrumentationData,
  MetaData,
} from "@syntest/instrumentation-javascript";
import cloneDeep = require("lodash.clonedeep");
import { SilentMochaReporter } from "./SilentMochaReporter";

export type Message = RunMessage | DoneMessage;

export type RunMessage = {
  message: "run";
  paths: string[];
  timeout: number;
};

export type DoneMessage = {
  message: "done";
  suites: Suite[];
  stats: Mocha.Stats;
  instrumentationData: InstrumentationData;
  metaData: MetaData;
  error?: string;
};

export type Suite = {
  tests: Test[];
};

export type Test = {
  status: JavaScriptExecutionStatus;
  exception?: string;
  duration: number;
};

process.on("uncaughtException", (reason) => {
  throw reason;
});
process.on("unhandledRejection", (reason) => {
  throw reason;
});

process.on("message", async (data: Message) => {
  if (typeof data !== "object") {
    console.log(data);
    throw new TypeError("Invalid data received from child process");
  }
  if (data.message === "run") {
    await runMocha(data.paths, data.timeout);
  }
});

async function runMocha(paths: string[], timeout: number) {
  const argv: Mocha.MochaOptions = <Mocha.MochaOptions>(<unknown>{
    reporter: SilentMochaReporter,
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
          exception:
            status === JavaScriptExecutionStatus.FAILED
              ? test.err.message
              : undefined,
          duration: test.duration,
        };
      }),
    };
  });

  // Retrieve execution traces
  const instrumentationData = <InstrumentationData>(
    cloneDeep(
      (<{ __coverage__: InstrumentationData }>(<unknown>global)).__coverage__
    )
  );
  const metaData = <MetaData>(
    cloneDeep((<{ __meta__: MetaData }>(<unknown>global)).__meta__)
  );

  const result: DoneMessage = {
    message: "done",
    suites: suites,
    stats: runner.stats,
    instrumentationData: instrumentationData,
    metaData: metaData,
  };
  process.send(result);

  mocha.dispose();
}
