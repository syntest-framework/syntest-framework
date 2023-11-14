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
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import { Result, success } from "@syntest/diagnostics";

import { Factory } from "../../Factory";

import { Element } from "./element/Element";
import { ElementVisitor } from "./element/ElementVisitor";
import { DiscoveredObjectType } from "./object/DiscoveredType";
import { ObjectVisitor } from "./object/ObjectVisitor";
import { Relation } from "./relation/Relation";
import { RelationVisitor } from "./relation/RelationVisitor";

export class TypeExtractor extends Factory {
  extractElements(filepath: string, ast: t.Node): Result<Map<string, Element>> {
    const elementVisitor = new ElementVisitor(filepath, this.syntaxForgiving);

    traverse(ast, elementVisitor);

    return success(elementVisitor.elementMap);
  }

  extractRelations(
    filepath: string,
    ast: t.Node
  ): Result<Map<string, Relation>> {
    const relationVisitor = new RelationVisitor(filepath, this.syntaxForgiving);

    traverse(ast, relationVisitor);

    return success(relationVisitor.relationMap);
  }

  extractObjectTypes(
    filepath: string,
    ast: t.Node
  ): Result<Map<string, DiscoveredObjectType>> {
    const objectVisitor = new ObjectVisitor(filepath, this.syntaxForgiving);

    traverse(ast, objectVisitor);

    return success(objectVisitor.objectTypeMap);
  }
}
