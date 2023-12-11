/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest JavaScript.
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

import { RootContext } from "./RootContext";
import { Export } from "./target/export/Export";
import { Element } from "./type/discovery/element/Element";
import { DiscoveredObjectType } from "./type/discovery/object/DiscoveredType";
import { Relation } from "./type/discovery/relation/Relation";

export type Events = {
  exportExtractionStart: (rootContext: RootContext, filepath: string) => void;
  exportExtractionComplete: (
    rootContext: RootContext,
    filepath: string,
    exports_: Export[]
  ) => void;
  elementExtractionStart: (rootContext: RootContext, filepath: string) => void;
  elementExtractionComplete: (
    rootContext: RootContext,
    filepath: string,
    elements: Map<string, Element>
  ) => void;
  relationExtractionStart: (rootContext: RootContext, filepath: string) => void;
  relationExtractionComplete: (
    rootContext: RootContext,
    filepath: string,
    relations: Map<string, Relation>
  ) => void;
  objectTypeExtractionStart: (
    rootContext: RootContext,
    filepath: string
  ) => void;
  objectTypeExtractionComplete: (
    rootContext: RootContext,
    filepath: string,
    objects: Map<string, DiscoveredObjectType>
  ) => void;

  typeResolvingStart: (rootContext: RootContext) => void;
  typeResolvingComplete: (rootContext: RootContext) => void;
};
