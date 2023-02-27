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
import { Plugin } from "./Plugin";
import { Tool } from "./Tool";

export abstract class Module {
  name: Readonly<string>;

  abstract getTools(): Promise<Tool[]>;
  abstract getPlugins(): Promise<Plugin[]>;
}

/**
 * We have defined both an abstract class and interface called Module here.
 * This is called 'merging' it allows an abstract class to have optional methods.
 */
export interface Module {
  /**
   * Called after the initialization step
   */
  prepare?(): Promise<void>;
  /**
   * Called before the exit step
   */
  cleanup?(): Promise<void>;
}
