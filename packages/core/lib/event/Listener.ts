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
import { ProgramState } from "./ProgramState";

/**
 * The ListenerInterface is an interface for creating plugins for the core of the Syntest Framework.
 *
 * Format of functions:
 * on[EVENT]Start
 * on[EVENT]Complete
 */
export interface Listener<T extends Encoding> {
  // called from launcher
  onInitializeStart?(state: ProgramState<T>): void;
  onInitializeComplete?(state: ProgramState<T>): void;
  onPreprocessStart?(state: ProgramState<T>): void;
  onPreprocessComplete?(state: ProgramState<T>): void;
  onProcessStart?(state: ProgramState<T>): void;
  onProcessComplete?(state: ProgramState<T>): void;
  onPostprocessStart?(state: ProgramState<T>): void;
  onPostprocessComplete?(state: ProgramState<T>): void;
  onExit?(state: ProgramState<T>): void;

  onInstrumentationStart?(state: ProgramState<T>): void;
  onInstrumentationComplete?(state: ProgramState<T>): void;
  onTargetRunStart?(state: ProgramState<T>): void;
  onTargetRunComplete?(state: ProgramState<T>): void;
  onReportStart?(state: ProgramState<T>): void;
  onReportComplete?(state: ProgramState<T>): void;

  // called from search algorithm
  onSearchInitializationStart?(state: ProgramState<T>): void;
  onSearchInitializationComplete?(state: ProgramState<T>): void;
  onSearchSearchStart?(state: ProgramState<T>): void;
  onSearchComplete?(state: ProgramState<T>): void;
  onSearchIterationStart?(state: ProgramState<T>): void;
  onSearchIterationComplete?(state: ProgramState<T>): void;

  // called from targetpool
  onSourceResolvingStart?(state: ProgramState<T>): void;
  onSourceResolvingComplete?(state: ProgramState<T>): void;
  onTargetResolvingStart?(state: ProgramState<T>): void;
  onTargetResolvingComplete?(state: ProgramState<T>): void;
  onFunctionMapResolvingStart?(state: ProgramState<T>): void;
  onFunctionMapResolvingComplete?(state: ProgramState<T>): void;
  onDependencyResolvingStart?(state: ProgramState<T>): void;
  onDependencyResolvingComplete?(state: ProgramState<T>): void;
  onControlFlowGraphResolvingStart?(state: ProgramState<T>): void;
  onControlFlowGraphResolvingComplete?(state: ProgramState<T>): void;
  onAbstractSyntaxTreeResolvingStart?(state: ProgramState<T>): void;
  onAbstractSyntaxTreeResolvingComplete?(state: ProgramState<T>): void;
}
