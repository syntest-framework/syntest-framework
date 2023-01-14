/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core Plugin Interface.
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

import { Encoding } from '..'
import { ProgramState } from './ProgramState'

/**
 * The CorePluginInterface is an interface for creating plugins for the core of the Syntest Framework.
 * 
 * Format of functions:
 * on[EVENT]Start
 * on[EVENT]Complete
 */
export abstract class CorePluginInterface<T extends Encoding> {
  // Start
  // called from launcher
  onSetupStart(state: ProgramState<T>) {}
  onInstrumentationStart(state: ProgramState<T>) {}
  onTargetRunStart(state: ProgramState<T>) {}
  onFinalizeStart(state: ProgramState<T>) {}
  onReportStart(state: ProgramState<T>) {}

  // called from search algorithm
  onInitializationStart(state: ProgramState<T>) {}
  onSearchStart(state: ProgramState<T>) {}
  onIterationStart(state: ProgramState<T>) {}

  // called from targetpool
  onSourceResolvingStart(state: ProgramState<T>) {}
  onTargetResolvingStart(state: ProgramState<T>) {}
  onFunctionMapResolvingStart(state: ProgramState<T>) {}
  onDependencyResolvingStart(state: ProgramState<T>) {}
  onControlFlowGraphResolvingStart(state: ProgramState<T>) {}
  onAbstractSyntaxTreeResolvingStart(state: ProgramState<T>) {}

  // Complete
  // called from launcher
  onSetupComplete(state: ProgramState<T>) {}
  onInstrumentationComplete(state: ProgramState<T>) {}
  onTargetRunComplete(state: ProgramState<T>) {}
  onFinalizeComplete(state: ProgramState<T>) {}
  onReportComplete(state: ProgramState<T>) {}

  // called from search algorithm
  onInitializationComplete(state: ProgramState<T>) {}
  onSearchComplete(state: ProgramState<T>) {}
  onIterationComplete(state: ProgramState<T>) {}

  // called from targetpool
  onSourceResolvingComplete(state: ProgramState<T>) {}
  onTargetResolvingComplete(state: ProgramState<T>) {}
  onFunctionMapResolvingComplete(state: ProgramState<T>) {}
  onDependencyResolvingComplete(state: ProgramState<T>) {}
  onControlFlowGraphResolvingComplete(state: ProgramState<T>) {}
  onAbstractSyntaxTreeResolvingComplete(state: ProgramState<T>) {}
}
