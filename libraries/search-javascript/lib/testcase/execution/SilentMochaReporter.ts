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

import Mocha = require("mocha");

const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
} = Mocha.Runner.constants;

export class SilentMochaReporter {
  private _indents: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private failures: any[];

  constructor(runner: Mocha.Runner) {
    this._indents = 0;
    this.failures = [];

    runner
      .once(EVENT_RUN_BEGIN, () => {
        // console.log('start');
      })
      .on(EVENT_SUITE_BEGIN, () => {
        this.increaseIndent();
      })
      .on(EVENT_SUITE_END, () => {
        this.decreaseIndent();
      })
      .on(EVENT_TEST_PASS, (test) => {
        // Test#fullTitle() returns the suite name(s)
        // prepended to the test title
        // console.log(`${this.indent()}pass: ${test.fullTitle()}`);

        if (test.duration > test.slow()) {
          test.speed = "slow";
        } else if (test.duration > test.slow() / 2) {
          test.speed = "medium";
        } else {
          test.speed = "fast";
        }
      })
      .on(EVENT_TEST_FAIL, (test, error) => {
        // if (showDiff(err)) {
        //   stringifyDiffObjs(err);
        // }
        // more than one error per test
        if (test.err && error instanceof Error) {
          (<{ multiple: unknown[] }>(<unknown>test.err)).multiple = (
            (<{ multiple: unknown[] }>(<unknown>test.err)).multiple || []
          )
            // eslint-disable-next-line unicorn/prefer-spread
            .concat(error);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          test.err = error;
        }
        this.failures.push(test);

        // console.log(
        //   `${this.indent()}fail: ${test.fullTitle()} - error: ${err.message}`
        // );
      })
      .once(EVENT_RUN_END, () => {
        // console.log(`end: ${stats.passes}/${stats.passes + stats.failures} ok`);
      });
  }

  indent() {
    return Array.from({ length: this._indents }).join("  ");
  }

  increaseIndent() {
    this._indents++;
  }

  decreaseIndent() {
    this._indents--;
  }
}
