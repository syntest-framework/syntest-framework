/*
 * Copyright 2020-2021 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework.
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

import { Node, NodeType } from "./Node";
import { Parameter } from "../parsing/Parameter";
import { Visibility } from "../parsing/Visibility";

/**
 * Interface for a RootNode
 *
 * @author Dimitri Stallenberg
 */
export interface RootNode extends Node {
  type: NodeType.Root;

  // if it is a root node
  contractName: string;
  functionName: string;
  isConstructor: boolean;

  parameters: Parameter[];
  returnParameters: Parameter[];
  visibility: Visibility;
}
