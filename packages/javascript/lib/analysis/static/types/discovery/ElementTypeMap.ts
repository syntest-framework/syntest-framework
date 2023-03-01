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

import { Element } from "@syntest/ast-javascript";
import { TypeProbability } from "../resolving/TypeProbability";

export class ElementTypeMap {
  private elementMap: Map<string, Element>;
  private typeMap: Map<string, TypeProbability>;

  constructor() {
    this.elementMap = new Map<string, Element>();
    this.typeMap = new Map<string, TypeProbability>();
  }

  elementAsString(element: Element) {
    if (!element.scope) {
      return `scope=null;
    type=${element.type};
    value=${element.value}`;
    }
    return `scope={
    name=${element.scope.uid};
    filePath=${element.scope.filePath}
    };
    type=${element.type};
    value=${element.value}`;
  }

  set(element: Element, typeProbability: TypeProbability) {
    const elString = this.elementAsString(element);

    this.elementMap.set(elString, element);
    this.typeMap.set(elString, typeProbability);
  }

  has(element: Element): boolean {
    const elString = this.elementAsString(element);

    return this.elementMap.has(elString);
  }

  get(element: Element): TypeProbability {
    const elString = this.elementAsString(element);

    return this.typeMap.get(elString);
  }

  keys(): IterableIterator<Element> {
    return this.elementMap.values();
  }

  values(): IterableIterator<TypeProbability> {
    return this.typeMap.values();
  }
}
