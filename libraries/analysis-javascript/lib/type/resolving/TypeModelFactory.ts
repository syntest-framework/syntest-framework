/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Javascript.
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

import { Element } from "../discovery/element/Element";
import { Relation } from "../discovery/relation/Relation";

import { TypeModel } from "./TypeModel";

/**
 * Abstract TypeResolver class
 */
export abstract class TypeModelFactory {
  /**
   * Resolves the types of all given elements and relations
   * @param elementMap the elements to resolve the types of
   * @param relationMap the relations to resolve the types of
   */
  abstract resolveTypes(
    elementMaps: Map<string, Map<string, Element>>,
    relationMaps: Map<string, Map<string, Relation>>
  ): TypeModel;
}
