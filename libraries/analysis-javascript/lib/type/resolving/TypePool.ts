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

import { prng } from "@syntest/prng";

import { Export } from "../../target/export/Export";
import { DiscoveredObjectType } from "../discovery/object/DiscoveredType";

import { ObjectType } from "./Type";

// TODO we could cache some of this stuff (unless we do dynamic adding of properties at some point)
export class TypePool {
  private _objectMap: Map<string, Map<string, DiscoveredObjectType>>;
  private _exports: Map<string, Export[]>;

  private _exportedObjects: Map<string, DiscoveredObjectType>;

  constructor(
    objectMap: Map<string, Map<string, DiscoveredObjectType>>,
    exports: Map<string, Export[]>
  ) {
    this._objectMap = objectMap;
    this._exports = exports;

    this._exportedObjects = this._extractExportedTypes();
  }

  private _extractExportedTypes(): Map<string, DiscoveredObjectType> {
    const exportedTypes: Map<string, DiscoveredObjectType> = new Map();

    for (const [, exports] of this._exports.entries()) {
      for (const export_ of exports) {
        for (const objectMap of this._objectMap.values()) {
          for (const [objectName, discoveredObject] of objectMap.entries()) {
            if (discoveredObject.id === export_.id) {
              exportedTypes.set(objectName, discoveredObject);
            }
          }
        }
      }
    }

    return exportedTypes;
  }

  protected _getMatchingTypes(objectType: ObjectType): DiscoveredObjectType[] {
    const matchingTypes: DiscoveredObjectType[] = [];
    for (const object_ of this._exportedObjects.values()) {
      let match = true;
      for (const property of objectType.properties.keys()) {
        if (!object_.properties.has(property)) {
          match = false;
          break;
        }
      }
      if (match) {
        matchingTypes.push(object_);
      }
    }
    return matchingTypes;
  }

  public getRandomMatchingType(
    objectType: ObjectType,
    extraFilter?: (type: DiscoveredObjectType) => boolean
  ): DiscoveredObjectType {
    let matchingTypes: DiscoveredObjectType[] =
      this._getMatchingTypes(objectType);

    if (extraFilter) {
      matchingTypes = matchingTypes.filter((type) => extraFilter(type));
    }

    if (matchingTypes.length === 0) {
      return undefined;
    }

    return prng.pickOne(matchingTypes);
  }
}
