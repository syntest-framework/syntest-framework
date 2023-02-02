/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
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

import { ComplexObject } from "../../discovery/object/ComplexObject";
import { TypeProbability } from "../TypeProbability";
import { Element, ElementType } from "../../discovery/Element";
import { Relation, RelationType } from "../../discovery/Relation";
import { TypeEnum } from "../TypeEnum";

export function createAnonObject(
  properties: Element[],
  wrapperElementIsRelation: Map<string, Relation>,
  elementTyping: Map<Element, TypeProbability>
) {
  const anonObject: ComplexObject = {
    name: "anon",
    properties: new Set<string>(),
    functions: new Set<string>(),
    propertyType: new Map<string, TypeProbability>(),
  };

  properties.forEach((p) => {
    if (p.type === ElementType.Relation) {
      if (wrapperElementIsRelation.has(p.value)) {
        const relation: Relation = wrapperElementIsRelation.get(p.value);

        if (relation.relation === RelationType.Call) {
          const call = relation.involved[0];
          anonObject.functions.add(call.value);
          if (elementTyping.has(call)) {
            anonObject.propertyType.set(call.value, elementTyping.get(call));
          } else {
            anonObject.propertyType.set(
              call.value,
              new TypeProbability([[TypeEnum.FUNCTION, 1, null]])
            );
          }
        } else {
          return;
        }
      }

      return;
    }

    anonObject.properties.add(p.value);
    if (elementTyping.has(p)) {
      anonObject.propertyType.set(p.value, elementTyping.get(p));
    }
  });

  return anonObject;
}
