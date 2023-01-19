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
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */

import { Encoding } from "..";
import { ArgumentOptions } from "../Configuration";
import { ProgramState } from "./ProgramState";

/**
 * The PluginInterface is an interface for creating plugins for the core of the Syntest Framework.
 *
 * Format of functions:
 * on[EVENT]Start
 * on[EVENT]Complete
 */
export abstract class PluginInterface<T extends Encoding> {
  abstract addConfigurationOptions<A extends ArgumentOptions>(yargs: ArgumentOptions): A

  // called from launcher
  onInitializeStart(state: ProgramState<T>) {}
  onInitializeComplete(state: ProgramState<T>) {}
  onPreprocessStart(state: ProgramState<T>) {}
  onPreprocessComplete(state: ProgramState<T>) {}
  onProcessStart(state: ProgramState<T>) {}
  onProcessComplete(state: ProgramState<T>) {}
  onPostprocessStart(state: ProgramState<T>) {}
  onPostprocessComplete(state: ProgramState<T>) {}
  onExit(state: ProgramState<T>) {}

  onInstrumentationStart(state: ProgramState<T>) {}
  onInstrumentationComplete(state: ProgramState<T>) {}
  onTargetRunStart(state: ProgramState<T>) {}
  onTargetRunComplete(state: ProgramState<T>) {}
  onReportStart(state: ProgramState<T>) {}
  onReportComplete(state: ProgramState<T>) {}

  // called from search algorithm
  onSearchInitializationStart(state: ProgramState<T>) {}
  onSearchInitializationComplete(state: ProgramState<T>) {}
  onSearchSearchStart(state: ProgramState<T>) {}
  onSearchComplete(state: ProgramState<T>) {}
  onSearchIterationStart(state: ProgramState<T>) {}
  onSearchIterationComplete(state: ProgramState<T>) {}

  // called from targetpool
  onSourceResolvingStart(state: ProgramState<T>) {}
  onSourceResolvingComplete(state: ProgramState<T>) {}
  onTargetResolvingStart(state: ProgramState<T>) {}
  onTargetResolvingComplete(state: ProgramState<T>) {}
  onFunctionMapResolvingStart(state: ProgramState<T>) {}
  onFunctionMapResolvingComplete(state: ProgramState<T>) {}
  onDependencyResolvingStart(state: ProgramState<T>) {}
  onDependencyResolvingComplete(state: ProgramState<T>) {}
  onControlFlowGraphResolvingStart(state: ProgramState<T>) {}
  onControlFlowGraphResolvingComplete(state: ProgramState<T>) {}
  onAbstractSyntaxTreeResolvingStart(state: ProgramState<T>) {}
  onAbstractSyntaxTreeResolvingComplete(state: ProgramState<T>) {}
}
