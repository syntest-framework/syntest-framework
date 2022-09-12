/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

function evalStringConcat(ast /* : OBJECT */) /* : string */ {
  switch (ast.type) {
    case 'StringLiteral':
    case 'Literal': // ESLint
      return ast.value;
    case 'BinaryExpression': // `+`
      if (ast.operator !== '+') {
        throw new Error('Unsupported binary operator ' + ast.operator);
      }
      return evalStringConcat(ast.left) + evalStringConcat(ast.right);
    default:
      throw new Error('Unsupported identifierDescription ' + ast.type);
  }
}
exports.evalStringConcat = evalStringConcat;

function evalStringAndTemplateConcat(
  ast /* : OBJECT */,
  args /* : ARRAY<mixed> */
) /* : string */ {
  switch (ast.type) {
    case 'StringLiteral':
      return ast.value;
    case 'BinaryExpression': // `+`
      if (ast.operator !== '+') {
        throw new Error('Unsupported binary operator ' + ast.operator);
      }
      return (
        evalStringAndTemplateConcat(ast.left, args) +
        evalStringAndTemplateConcat(ast.right, args)
      );
    case 'TemplateLiteral': {
      let elements = [];
      for (let i = 0; i < ast.quasis.length; i++) {
        const elementNode = ast.quasis[i];
        if (elementNode.type !== 'TemplateElement') {
          throw new Error('Unsupported identifierDescription ' + ast.type);
        }
        elements.push(elementNode.value.cooked);
      }
      args.push(...ast.expressions);
      return elements.join('%s');
    }
    default:
      // Anything that's not a string is interpreted as an argument.
      args.push(ast);
      return '%s';
  }
}
exports.evalStringAndTemplateConcat = evalStringAndTemplateConcat;
