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

import { ProgramState } from './ProgramState'

/**
 * The PluginInterface is an interface for creating plugins for the core of the Syntest Framework.
 * 
 * Format of functions:
 * on[EVENT]Start
 * on[EVENT]Complete
 */
export abstract class PluginInterface {
  // Start
  // called from launcher
  onSetupStart(state: ProgramState) {}
  onPreprocessStart(state: ProgramState) {}
  onProcessStart(state: ProgramState) {}
  onPostprocessStart(state: ProgramState) {}
  onExit(state: ProgramState) {}
  
  onInstrumentationStart(state: ProgramState) {}
  onTargetRunStart(state: ProgramState) {}
  onReportStart(state: ProgramState) {}

  // called from search algorithm
  onInitializationStart(state: ProgramState) {}
  onSearchStart(state: ProgramState) {}
  onIterationStart(state: ProgramState) {}

  // called from targetpool
  onSourceResolvingStart(state: ProgramState) {}
  onTargetResolvingStart(state: ProgramState) {}
  onFunctionMapResolvingStart(state: ProgramState) {}
  onDependencyResolvingStart(state: ProgramState) {}
  onControlFlowGraphResolvingStart(state: ProgramState) {}
  onAbstractSyntaxTreeResolvingStart(state: ProgramState) {}

  // Complete
  // called from launcher
  onSetupComplete(state: ProgramState) {}
  onPreprocessComplete(state: ProgramState) {}
  onProcessComplete(state: ProgramState) {}
  onPostprocessComplete(state: ProgramState) {}

  onInstrumentationComplete(state: ProgramState) {}
  onTargetRunComplete(state: ProgramState) {}
  onReportComplete(state: ProgramState) {}

  // called from search algorithm
  onInitializationComplete(state: ProgramState) {}
  onSearchComplete(state: ProgramState) {}
  onIterationComplete(state: ProgramState) {}

  // called from targetpool
  onSourceResolvingComplete(state: ProgramState) {}
  onTargetResolvingComplete(state: ProgramState) {}
  onFunctionMapResolvingComplete(state: ProgramState) {}
  onDependencyResolvingComplete(state: ProgramState) {}
  onControlFlowGraphResolvingComplete(state: ProgramState) {}
  onAbstractSyntaxTreeResolvingComplete(state: ProgramState) {}
}
