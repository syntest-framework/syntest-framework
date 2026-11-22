/*
 * Copyright 2020-2026 SynTest contributors
 *
 * This file is part of SynTest Framework.
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

import { transformSync, traverse } from "@babel/core";
import * as t from "@babel/types";

import { TypeEnum } from "./TypeEnum";
import { TypeModel } from "./TypeModel";

function annotatedTypes(type: t.TSType): TypeEnum[] {
  switch (type.type) {
    case "TSNumberKeyword": {
      return [TypeEnum.NUMERIC];
    }
    case "TSStringKeyword": {
      return [TypeEnum.STRING];
    }
    case "TSBooleanKeyword": {
      return [TypeEnum.BOOLEAN];
    }
    case "TSNullKeyword": {
      return [TypeEnum.NULL];
    }
    case "TSUndefinedKeyword": {
      return [TypeEnum.UNDEFINED];
    }
    case "TSArrayType":
    case "TSTupleType": {
      return [TypeEnum.ARRAY];
    }
    case "TSFunctionType": {
      return [TypeEnum.FUNCTION];
    }
    case "TSTypeLiteral": {
      return [TypeEnum.OBJECT];
    }
    case "TSLiteralType": {
      if (t.isNumericLiteral(type.literal)) return [TypeEnum.NUMERIC];
      // Babel 7 parses a template literal type as a TSLiteralType too
      if (t.isStringLiteral(type.literal) || t.isTemplateLiteral(type.literal))
        return [TypeEnum.STRING];
      if (t.isBooleanLiteral(type.literal)) return [TypeEnum.BOOLEAN];
      return [];
    }
    case "TSTypeOperator": {
      return annotatedTypes(type.typeAnnotation);
    }
    case "TSUnionType": {
      return type.types.flatMap((member) => annotatedTypes(member));
    }
    default: {
      // References, unknown and any name no runtime type by themselves
      return [];
    }
  }
}

/**
 * Scores every annotated function parameter of a TypeScript source with its declared types.
 *
 * The type model is built from the source with its types stripped to whitespace, so a parameter
 * starts at the same line and column in both, and the start identifies its type node.
 */
export function addAnnotatedParameterTypes(
  model: TypeModel,
  filePath: string,
  source: string,
): void {
  // No transform plugins, so the returned AST keeps the annotations
  const { ast } = transformSync(source, {
    ast: true,
    babelrc: false,
    code: false,
    configFile: false,
    filename: filePath,
    parserOpts: { sourceType: "module", plugins: ["typescript"] },
  });

  const idsByStart = new Map<string, string[]>();
  for (const id of model.typeNodes.keys()) {
    const start = id.split(":::")[0];
    idsByStart.set(start, [...(idsByStart.get(start) ?? []), id]);
  }

  traverse(ast, {
    Function(path) {
      for (const parameter of path.node.params) {
        const binding = t.isAssignmentPattern(parameter)
          ? parameter.left
          : parameter;
        if (
          !("typeAnnotation" in binding) ||
          !t.isTSTypeAnnotation(binding.typeAnnotation)
        ) {
          continue;
        }

        const types = annotatedTypes(binding.typeAnnotation.typeAnnotation);
        const { line, column } = parameter.loc.start;
        for (const id of idsByStart.get(`${filePath}:${line}:${column}`) ??
          []) {
          for (const type of types) {
            model.addStrongTypeScore(id, type);
          }
        }
      }
    },
  });
}
