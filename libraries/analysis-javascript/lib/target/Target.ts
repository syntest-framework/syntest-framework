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
import {
  SubTarget as CoreSubTarget,
  Target as CoreTarget,
  TargetType,
} from "@syntest/analysis";

import { VisibilityType } from "./VisibilityType";

export interface Target extends CoreTarget {
  path: string;
  name: string;
  subTargets: SubTarget[];
}

export interface SubTarget extends CoreSubTarget {
  type: TargetType;
  id: string;
}

export interface NamedSubTarget extends SubTarget {
  name: string;
  typeId: string;
}

export type Exportable = {
  exported: boolean;
  // maybe scope?
  renamedTo?: string;
  module?: boolean;
  default?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isExported(target: any): target is Exportable {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return "exported" in target && target.exported === true;
}

export interface Callable {
  isAsync: boolean;
}

export interface FunctionTarget extends NamedSubTarget, Exportable, Callable {
  type: TargetType.FUNCTION;
}

export interface ClassTarget extends NamedSubTarget, Exportable {
  type: TargetType.CLASS;
}

export interface MethodTarget extends NamedSubTarget, Callable {
  type: TargetType.METHOD;
  classId: string;

  visibility: VisibilityType;

  methodType: "constructor" | "method" | "get" | "set";
  isStatic: boolean;
}

export interface ObjectTarget extends NamedSubTarget, Exportable {
  type: TargetType.OBJECT;
}

export interface ObjectFunctionTarget extends NamedSubTarget, Callable {
  type: TargetType.OBJECT_FUNCTION;
  objectId: string;
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
