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

/**
 * The CorePluginInterface is an interface for creating plugins for the core of the SynTest Framework.
 *
 * Format of functions:
 * on[EVENT]Start
 * on[EVENT]Complete
 */
export default abstract class CorePluginInterface {
  // Start
  // called from launcher
  onSetupStart(state) {}
  onInstrumentationStart() {}
  onTargetRunStart() {}
  onFinalizeStart() {}
  onReportStart() {}

  // called from search algorithm
  onInitializationStart() {}
  onSearchStart() {}
  onIterationStart() {}

  // called from targetpool
  onSourceResolvingStart() {}
  onTargetResolvingStart() {}
  onFunctionMapResolvingStart() {}
  onDependencyResolvingStart() {}
  onControlFlowGraphResolvingStart() {}
  onAbstractSyntaxTreeResolvingStart() {}

  // Complete
  // called from launcher
  onSetupComplete() {}
  onInstrumentationComplete() {}
  onTargetRunComplete() {}
  onFinalizeComplete() {}
  onReportComplete() {}

  // called from search algorithm
  onInitializationComplete() {}
  onSearchComplete() {}
  onIterationComplete() {}

  // called from targetpool
  onSourceResolvingComplete() {}
  onTargetResolvingComplete() {}
  onFunctionMapResolvingComplete() {}
  onDependencyResolvingComplete() {}
  onControlFlowGraphResolvingComplete() {}
  onAbstractSyntaxTreeResolvingComplete() {}
}
