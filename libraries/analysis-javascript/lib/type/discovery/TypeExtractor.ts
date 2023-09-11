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
import { ObjectVisitor } from "./object/ObjectVisitor";
import traverse from "@babel/traverse";
import { ElementVisitor } from "./element/ElementVisitor";
import { RelationVisitor } from "./relation/RelationVisitor";
import * as t from "@babel/types";

export class TypeExtractor {
  extractElements(filepath: string, ast: t.Node) {
    const elementVisitor = new ElementVisitor(filepath);

    traverse(ast, elementVisitor);

    return elementVisitor.elementMap;
  }

  extractRelations(filepath: string, ast: t.Node) {
    const relationVisitor = new RelationVisitor(filepath);

    traverse(ast, relationVisitor);

    return relationVisitor.relationMap;
  }

  extractObjectTypes(filepath: string, ast: t.Node) {
    const objectVisitor = new ObjectVisitor(filepath);

    traverse(ast, objectVisitor);

    return objectVisitor.objectTypeMap;
  }
}
