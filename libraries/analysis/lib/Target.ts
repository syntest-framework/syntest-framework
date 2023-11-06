/*
 * Copyright 2020-2021 SynTest contributors
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
export interface Target {
  path: string;
  name: string;
  subTargets: SubTarget[];
}

export interface SubTarget {
  type: TargetType;
  id: string;
}

export interface FunctionTarget extends SubTarget {
  type: TargetType.FUNCTION;
  name: string;
}

export interface ClassTarget extends SubTarget {
  type: TargetType.CLASS;
  name: string;
}

export interface MethodTarget extends SubTarget {
  type: TargetType.METHOD;
  className: string;
  name: string;
}

export interface ObjectTarget extends SubTarget {
  type: TargetType.OBJECT;
  name: string;
}

export interface ObjectFunctionTarget extends SubTarget {
  type: TargetType.OBJECT_FUNCTION;
  objectName: string;
  name: string;
}

export interface PathTarget extends SubTarget {
  type: TargetType.PATH;
  ids: string[];
}

export interface BranchTarget extends SubTarget {
  type: TargetType.BRANCH;
}

export interface LineTarget extends SubTarget {
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
