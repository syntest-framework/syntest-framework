/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Framework.
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

import { ControlFlowProgram } from "@syntest/cfg";

import { RootContext } from "../RootContext";
import { Target } from "../Target";

export type Events = {
  sourceResolvingStart: <S>(
    rootContext: RootContext<S>,
    filePath: string
  ) => void;
  sourceResolvingComplete: <S>(
    rootContext: RootContext<S>,
    filePath: string,
    source: string
  ) => void;

  abstractSyntaxTreeResolvingStart: <S>(
    rootContext: RootContext<S>,
    filePath: string
  ) => void;
  abstractSyntaxTreeResolvingComplete: <S>(
    rootContext: RootContext<S>,
    filePath: string,
    abstractSyntaxTree: S
  ) => void;

  controlFlowGraphResolvingStart: <S>(
    rootContext: RootContext<S>,
    filePath: string
  ) => void;
  controlFlowGraphResolvingComplete: <S>(
    rootContext: RootContext<S>,
    filePath: string,
    cfp: ControlFlowProgram
  ) => void;

  targetExtractionStart: <S>(
    rootContext: RootContext<S>,
    filePath: string
  ) => void;
  targetExtractionComplete: <S>(
    rootContext: RootContext<S>,
    filePath: string,
    target: Target
  ) => void;

  dependencyResolvingStart: <S>(
    rootContext: RootContext<S>,
    filePath: string
  ) => void;
  dependencyResolvingComplete: <S>(
    rootContext: RootContext<S>,
    filePath: string,
    dependencies: string[]
  ) => void;
};
