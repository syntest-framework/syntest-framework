/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
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
export interface TargetContext {
  path: string;
  name: string;
  targets: Target[];
}

export interface Target {
  type: TargetType;
  id: string;
}

export interface FunctionTarget extends Target {
  type: TargetType.FUNCTION;
  name: string;
}

export interface ClassTarget extends Target {
  type: TargetType.CLASS;
  name: string;
}

export interface MethodTarget extends Target {
  type: TargetType.METHOD;
  className: string;
  name: string;
}

export interface ObjectTarget extends Target {
  type: TargetType.OBJECT;
  name: string;
}

export interface ObjectFunctionTarget extends Target {
  type: TargetType.OBJECT_FUNCTION;
  objectName: string;
  name: string;
}

export interface PathTarget extends Target {
  type: TargetType.PATH;
  ids: string[];
}

export interface BranchTarget extends Target {
  type: TargetType.BRANCH;
}

export interface LineTarget extends Target {
  type: TargetType.LINE;
  line: number;
}

export enum TargetType {
  FUNCTION = "function",

  CLASS = "class",
  METHOD = "method",

  OBJECT = "object",
  OBJECT_FUNCTION = "object-function",

  PATH = "path",
  BRANCH = "branch",
  LINE = "line",
}
