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
import { UserInterface } from "@syntest/cli-graphics";
import { Command, ModuleManager } from "@syntest/module";
import Yargs = require("yargs");

import { JavaScriptArguments, JavaScriptLauncher } from "../JavaScriptLauncher";
import { MetricManager } from "@syntest/metric";
import { StorageManager } from "@syntest/storage";

export function getTestCommand(
  tool: string,
  moduleManager: ModuleManager,
  metricManager: MetricManager,
  storageManager: StorageManager,
  userInterface: UserInterface
): Command {
  const options = new Map<string, Yargs.Options>();

  const commandGroup = "Type Inference Options:";
  const samplingGroup = "Sampling Options:";

  options.set("incorporate-execution-information", {
    alias: [],
    default: true,
    description: "Incorporate execution information.",
    group: commandGroup,
    hidden: false,
    type: "boolean",
  });

  options.set("type-inference-mode", {
    alias: [],
    default: "proportional",
    description: "The type inference mode: [proportional, ranked, none].",
    group: commandGroup,
    hidden: false,
    type: "string",
  });

  options.set("random-type-probability", {
    alias: [],
    default: 0.1,
    description:
      "The probability we use a random type regardless of the inferred type.",
    group: commandGroup,
    hidden: false,
    type: "number",
  });

  options.set("constant-pool", {
    alias: [],
    default: false,
    description: "Enable constant pool.",
    group: samplingGroup,
    hidden: false,
    type: "boolean",
  });

  options.set("constant-pool-probability", {
    alias: [],
    default: 0.5,
    description:
      "Probability to sample from the constant pool instead creating random values",
    group: samplingGroup,
    hidden: false,
    type: "number",
  });

  return new Command(
    moduleManager,
    tool,
    "test",
    "Run the test case generation tool on a certain JavaScript project.",
    options,
    async (arguments_: Yargs.ArgumentsCamelCase) => {
      const launcher = new JavaScriptLauncher(
        <JavaScriptArguments>(<unknown>arguments_),
        moduleManager,
        metricManager,
        storageManager,
        userInterface
      );
      await launcher.run();
    }
  );
}

export type TestCommandOptions = {
  incorporateExecutionInformation: boolean;
  typeInferenceMode: string;
  randomTypeProbability: number;
  constantPool: boolean;
  constantPoolProbability: number;
};
