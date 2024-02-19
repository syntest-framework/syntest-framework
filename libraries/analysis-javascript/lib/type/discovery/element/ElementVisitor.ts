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
import { NodePath } from "@babel/core";
import * as t from "@babel/types";
import {
  AbstractSyntaxTreeVisitor,
  MemberSeparator,
} from "@syntest/ast-visitor-javascript";
import { ImplementationError } from "@syntest/diagnostics";

import { Element, ElementType } from "../element/Element";

export class ElementVisitor extends AbstractSyntaxTreeVisitor {
  private _elementMap: Map<string, Element>;

  get elementMap(): Map<string, Element> {
    for (const value of this._elementMap.values()) {
      if (
        !this._elementMap.has(value.bindingId) &&
        value.bindingId.includes(MemberSeparator)
      ) {
        this._elementMap.set(value.bindingId, {
          ...value,
          id: value.bindingId,
        });
      }
    }
    return this._elementMap;
  }

  constructor(filePath: string, syntaxForgiving: boolean) {
    super(filePath, syntaxForgiving);
    this._elementMap = new Map();
  }

  private _createElement(
    path: NodePath<t.Node>,
    type: ElementType,
    value: string
  ) {
    const id = this._getNodeId(path);
    const bindingId = this._getBindingId(path);

    // Here we check if the id is already registered (we do not allow this normally)
    if (this._elementMap.has(id)) {
      // Export specifiers can actually have the same exported and local object
      // e.g. export { x }
      if (
        path.parentPath.isExportSpecifier() &&
        path.parentPath.get("exported") === path
      ) {
        return;
      }

      // Import specifiers can actually have the same imported and local object
      // e.g. import { x } from '...'
      if (
        path.parentPath.isImportSpecifier() &&
        path.parentPath.get("imported") === path
      ) {
        return;
      }

      // Object properties can actually have the same value and key object
      // e.g. const obj = { x }
      if (
        path.parentPath.isObjectProperty() &&
        path.parentPath.get("value") === path
      ) {
        return;
      }

      // known cases
      // ({ x = 5 }) => {...} (x is recorded twice)

      ElementVisitor.LOGGER.warn(`Overriding element with id: ${id}`);
      return;
    }

    if (type === ElementType.Identifier) {
      const element: Element = {
        id: id,
        bindingId,
        filePath: this._filePath,
        location: {
          startIndex: (<{ index: number }>(<unknown>path.node.loc.start)).index,
          endIndex: (<{ index: number }>(<unknown>path.node.loc.end)).index,
        },
        type: ElementType.Identifier,
        name: value,
      };
      this._elementMap.set(element.id, element);
    } else {
      const element: Element = {
        id: id,
        bindingId,
        filePath: this._filePath,
        location: {
          startIndex: (<{ index: number }>(<unknown>path.node.loc.start)).index,
          endIndex: (<{ index: number }>(<unknown>path.node.loc.end)).index,
        },
        type,
        value,
      };
      this._elementMap.set(element.id, element);
    }
  }

  public Identifier: (path: NodePath<t.Identifier>) => void = (
    path: NodePath<t.Identifier>
  ) => {
    if (path.node.name === "undefined") {
      this._createElement(path, ElementType.Undefined, "undefined");
    } else {
      if (
        path.parentPath.isLabeledStatement() ||
        path.parentPath.isContinueStatement() ||
        path.parentPath.isBreakStatement()
      ) {
        // we ignore these types of identifiers
        // these all have a label property, but we don't want to add them to the element map
        return;
      }

      this._createElement(path, ElementType.Identifier, path.node.name);
    }
  };

  public Literal: (path: NodePath<t.Literal>) => void = (
    path: NodePath<t.Literal>
  ) => {
    switch (path.node.type) {
      case "StringLiteral": {
        this._createElement(path, ElementType.StringLiteral, path.node.value);
        break;
      }
      case "NumericLiteral": {
        this._createElement(
          path,
          ElementType.NumericalLiteral,
          path.node.value.toString()
        );
        break;
      }
      case "NullLiteral": {
        this._createElement(path, ElementType.NullLiteral, "null");
        break;
      }
      case "BooleanLiteral": {
        this._createElement(
          path,
          ElementType.BooleanLiteral,
          path.node.value.toString()
        );
        break;
      }
      case "RegExpLiteral": {
        this._createElement(path, ElementType.RegExpLiteral, path.node.pattern);
        break;
      }
      case "TemplateLiteral": {
        // we handle template literals as relations
        break;
      }
      case "BigIntLiteral": {
        this._createElement(
          path,
          ElementType.BigIntLiteral,
          path.node.value.toString()
        );
        break;
      }
      case "DecimalLiteral": {
        this._createElement(
          path,
          ElementType.DecimalLiteral,
          path.node.value.toString()
        );
        break;
      }
      default: {
        // should never occur
        throw new ImplementationError(`Unknown literal type`);
      }
    }
  };

  public TemplateElement: (path: NodePath<t.TemplateElement>) => void = (
    path: NodePath<t.TemplateElement>
  ) => {
    this._createElement(path, ElementType.StringLiteral, path.node.value.raw);
  };
}
