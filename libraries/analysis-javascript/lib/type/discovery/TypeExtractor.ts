/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
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
import { getAllFiles } from "../../utils/fileSystem";
import { ObjectVisitor } from "./object/ObjectVisitor";
import traverse from "@babel/traverse";
import { ElementVisitor } from "./element/ElementVisitor";
import { RelationVisitor } from "./relation/RelationVisitor";
import { RootContext } from "../../RootContext";
import { Element } from "./element/Element";
import { Relation } from "./relation/Relation";
import { DiscoveredObjectType } from "./object/DiscoveredType";

export class TypeExtractor {
  private _elementMap: Map<string, Element>;
  private _relationMap: Map<string, Relation>;
  private _objectMap: Map<string, DiscoveredObjectType>;

  constructor() {
    this._elementMap = new Map();
    this._relationMap = new Map();
    this._objectMap = new Map();
  }

  extractAll(rootContext: RootContext) {
    const files = getAllFiles(rootContext.rootPath, ".js").filter(
      (x) =>
        !x.includes("/test/") &&
        !x.includes(".test.js") &&
        !x.includes("node_modules")
    ); // maybe we should also take those into account

    for (const file of files) {
      this.extract(rootContext, file);
    }
  }

  extract(rootContext: RootContext, filePath: string) {
    const elementVisitor = new ElementVisitor(filePath);
    const relationVisitor = new RelationVisitor(filePath);
    const complexTypeVisitor = new ObjectVisitor(filePath);

    const ast = rootContext.getAbstractSyntaxTree(filePath);
    // traverse(
    //     ast,
    //   visitors.merge([elementVisitor, relationVisitor, complexTypeVisitor])
    // );

    traverse(ast, elementVisitor);
    traverse(ast, relationVisitor);
    traverse(ast, complexTypeVisitor);

    this._elementMap = new Map([
      ...this._elementMap,
      ...elementVisitor.elementMap,
    ]);
    this._relationMap = new Map([
      ...this._relationMap,
      ...relationVisitor.relationMap,
    ]);
    this._objectMap = new Map([
      ...this._objectMap,
      ...complexTypeVisitor.complexTypeMap,
    ]);
  }

  getElement(id: string): Element {
    if (!this._elementMap.has(id)) {
      throw new Error(`Element with id ${id} does not exist`);
    }
    return this._elementMap.get(id);
  }

  getRelation(id: string): Relation {
    if (!this._relationMap.has(id)) {
      throw new Error(`Relation with id ${id} does not exist`);
    }
    return this._relationMap.get(id);
  }

  getObjectType(id: string): DiscoveredObjectType {
    if (!this._objectMap.has(id)) {
      throw new Error(`ComplexType with id ${id} does not exist`);
    }
    return this._objectMap.get(id);
  }

  get elementMap(): Map<string, Element> {
    return this._elementMap;
  }

  get relationMap(): Map<string, Relation> {
    return this._relationMap;
  }

  get objectMap(): Map<string, DiscoveredObjectType> {
    return this._objectMap;
  }
}
