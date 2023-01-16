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

import { ProgramState } from "./ProgramState";

/**
 * The PluginInterface is an interface for creating plugins for the core of the Syntest Framework.
 *
 * Format of functions:
 * on[EVENT]Start
 * on[EVENT]Complete
 */
export abstract class PluginInterface {
  // called from launcher
  onInitializeStart(state: ProgramState) {}
  onInitializeComplete(state: ProgramState) {}
  onPreprocessStart(state: ProgramState) {}
  onPreprocessComplete(state: ProgramState) {}
  onProcessStart(state: ProgramState) {}
  onProcessComplete(state: ProgramState) {}
  onPostprocessStart(state: ProgramState) {}
  onPostprocessComplete(state: ProgramState) {}
  onExit(state: ProgramState) {}

  onInstrumentationStart(state: ProgramState) {}
  onInstrumentationComplete(state: ProgramState) {}
  onTargetRunStart(state: ProgramState) {}
  onTargetRunComplete(state: ProgramState) {}
  onReportStart(state: ProgramState) {}
  onReportComplete(state: ProgramState) {}

  // called from search algorithm
  onSearchInitializationStart(state: ProgramState) {}
  onSearchInitializationComplete(state: ProgramState) {}
  onSearchSearchStart(state: ProgramState) {}
  onSearchComplete(state: ProgramState) {}
  onSearchIterationStart(state: ProgramState) {}
  onSearchIterationComplete(state: ProgramState) {}

  // called from targetpool
  onSourceResolvingStart(state: ProgramState) {}
  onSourceResolvingComplete(state: ProgramState) {}
  onTargetResolvingStart(state: ProgramState) {}
  onTargetResolvingComplete(state: ProgramState) {}
  onFunctionMapResolvingStart(state: ProgramState) {}
  onFunctionMapResolvingComplete(state: ProgramState) {}
  onDependencyResolvingStart(state: ProgramState) {}
  onDependencyResolvingComplete(state: ProgramState) {}
  onControlFlowGraphResolvingStart(state: ProgramState) {}
  onControlFlowGraphResolvingComplete(state: ProgramState) {}
  onAbstractSyntaxTreeResolvingStart(state: ProgramState) {}
  onAbstractSyntaxTreeResolvingComplete(state: ProgramState) {}
}
