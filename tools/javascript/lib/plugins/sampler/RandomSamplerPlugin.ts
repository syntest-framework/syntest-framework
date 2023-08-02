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
import { SamplerOptions, SamplerPlugin } from "@syntest/base-language";
import {
  JavaScriptRandomSampler,
  JavaScriptSubject,
  JavaScriptTestCase,
} from "@syntest/search-javascript";
import { JavaScriptArguments } from "../../JavaScriptLauncher";
import { EncodingSampler } from "@syntest/search";

/**
 * Plugin for RandomSampler
 *
 * @author Dimitri Stallenberg
 */
export class RandomSamplerPlugin extends SamplerPlugin<JavaScriptTestCase> {
  constructor() {
    super("javascript-random", "A JavaScript random sampler plugin");
  }

  createSamplerOperator(
    options: SamplerOptions<JavaScriptTestCase>
  ): EncodingSampler<JavaScriptTestCase> {
    return new JavaScriptRandomSampler(
      options.subject as unknown as JavaScriptSubject,
      undefined,
      undefined,
      undefined,
      (<JavaScriptArguments>(<unknown>this.args)).typeInferenceMode,
      (<JavaScriptArguments>(<unknown>this.args)).randomTypeProbability,
      (<JavaScriptArguments>(
        (<unknown>this.args)
      )).incorporateExecutionInformation,
      (<JavaScriptArguments>(<unknown>this.args)).maxActionStatements,
      (<JavaScriptArguments>(<unknown>this.args)).stringAlphabet,
      (<JavaScriptArguments>(<unknown>this.args)).stringMaxLength,
      (<JavaScriptArguments>(<unknown>this.args)).resampleGeneProbability,
      (<JavaScriptArguments>(<unknown>this.args)).deltaMutationProbability,
      (<JavaScriptArguments>(<unknown>this.args)).exploreIllegalValues
    );
  }

  override getOptions() {
    return new Map();
  }
}
