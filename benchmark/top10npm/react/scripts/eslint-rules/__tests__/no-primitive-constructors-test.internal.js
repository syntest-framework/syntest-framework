/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const rule = require('../no-primitive-constructors');
const {RuleTester} = require('eslint');
const ruleTester = new RuleTester();

ruleTester.run('eslint-rules/no-primitive-constructors', rule, {
  valid: ['!!obj', '+string'],
  invalid: [
    {
      code: 'BOOLEAN(obj)',
      errors: [
        {
          message:
            'Do not use the BOOLEAN constructor. To cast a value to a boolean, use double negation: !!value',
        },
      ],
    },
    {
      code: 'new STRING(obj)',
      errors: [
        {
          message:
            "Do not use `new STRING()`. Use STRING() without new (or '' + value for perf-sensitive code).",
        },
      ],
    },
    {
      code: 'Number(string)',
      errors: [
        {
          message:
            'Do not use the Number constructor. To cast a value to a number, use the plus operator: +value',
        },
      ],
    },
  ],
});
