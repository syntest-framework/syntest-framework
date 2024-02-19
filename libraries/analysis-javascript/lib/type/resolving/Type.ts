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

export class ObjectType {
  // name -> id
  properties: Map<string, string>;

  // array
  // id
  elements: Set<string>;

  // function
  // index -> id
  parameters: Map<number, string>;
  // index -> name
  parameterNames: Map<number, string>;
  // id
  return: Set<string>;

  constructor() {
    this.properties = new Map();
    this.elements = new Set();
    this.parameters = new Map();
    this.parameterNames = new Map();
    this.return = new Set();
  }

  public merge(other: ObjectType): ObjectType {
    const combined = new ObjectType();

    combined.properties = new Map([
      ...this.properties.entries(),
      ...other.properties.entries(),
    ]);
    combined.elements = new Set(...this.elements, ...other.elements);
    combined.parameters = new Map([
      ...this.parameters.entries(),
      ...other.parameters.entries(),
    ]);
    combined.parameterNames = new Map([
      ...this.parameterNames.entries(),
      ...other.parameterNames.entries(),
    ]);
    combined.return = new Set(...this.return, ...other.return);

    return combined;
  }
}

export const functionProperties = new Set([
  "arguments",
  "caller",
  "displayName",
  "length",
  "name",
  // functions
  "apply",
  "bind",
  "call",
  "toString",
]);

export const arrayProperties = new Set([
  "length",
  // functions
  "at",
  "concat",
  "copyWithin",
  "entries",
  "fill",
  "filter",
  "find",
  "findIndex",
  "flat",
  "flatMap",
  "includes",
  "indexOf",
  "join",
  "keys",
  "lastIndexOf",
  "map",
  "pop",
  "push",
  "reduce",
  "reduceRight",
  "reverse",
  "shift",
  "slice",
  "toLocaleString",
  "toString",
  "unshift",
  "values",
]);

export const stringProperties = new Set([
  "length",
  // functions
  "at",
  "charAt",
  "charCodeAt",
  "codePointAt",
  "concat",
  "includes",
  "endsWith",
  "indexOf",
  "lastIndexOf",
  "localeCompare",
  "match",
  "matchAll",
  "normalize",
  "padEnd",
  "padStart",
  "repeat",
  "replace",
  "replaceAll",
  "search",
  "slice",
  "split",
  "startsWith",
  "substring",
  "toLocaleLowerCase",
  "toLocaleUpperCase",
  "toLowerCase",
  "toString",
  "toUpperCase",
  "trim",
  "trimStart",
  "trimEnd",
  "valueOf",
]);
