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
import traverse from "@babel/traverse";
import { AbstractSyntaxTreeFactory } from "../../lib/ast/AbstractSyntaxTreeFactory";
import { ElementVisitor } from "../../lib/type/discovery/element/ElementVisitor";
import { InferenceTypeModelFactory } from "../../lib/type/resolving/InferenceTypeModelFactory";
import { RelationVisitor } from "../../lib/type/discovery/relation/RelationVisitor";

function helper(source: string) {
  const generator = new AbstractSyntaxTreeFactory();
  const ast = generator.convert("", source);

  const elementVisitor = new ElementVisitor("");
  traverse(ast, elementVisitor);

  const relationVisitor = new RelationVisitor("");
  traverse(ast, relationVisitor);

  const factory = new InferenceTypeModelFactory();
  const model = factory.resolveTypes(
    new Map([["", elementVisitor.elementMap]]),
    new Map([["", relationVisitor.relationMap]])
  );

  return {
    elements: elementVisitor.elementMap,
    relations: relationVisitor.relationMap,
    model,
  };
}

describe("InferenceTypeModelFactory test", () => {
  it("Identifiers: Block", () => {
    const code = `
            const x = (a) => {}
            x(0)
        `;

    const { elements, relations, model } = helper(code);
    console.log(elements);
    console.log(relations);
    console.log();

    const x = [...elements.values()].find((v) => "name" in v && v.name === "x");

    model.getObjectDescription(x.id);
  });
});
