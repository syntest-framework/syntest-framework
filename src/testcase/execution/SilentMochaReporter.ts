const Mocha = require('mocha')

const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END
} = Mocha.Runner.constants;

export class SilentMochaReporter {
  private _indents: number
  private failures;

  constructor(runner) {
    this._indents = 0;
    this.failures = []
    const stats = runner.stats;

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
      .on(EVENT_TEST_PASS, test => {
        // Test#fullTitle() returns the suite name(s)
        // prepended to the test title
        // console.log(`${this.indent()}pass: ${test.fullTitle()}`);

        if (test.duration > test.slow()) {
          test.speed = 'slow';
        } else if (test.duration > test.slow() / 2) {
          test.speed = 'medium';
        } else {
          test.speed = 'fast';
        }
      })
      .on(EVENT_TEST_FAIL, (test, err) => {
        // if (showDiff(err)) {
        //   stringifyDiffObjs(err);
        // }
        // more than one error per test
        if (test.err && err instanceof Error) {
          test.err.multiple = (test.err.multiple || []).concat(err);
        } else {
          test.err = err;
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
    return Array(this._indents).join('  ');
  }

  increaseIndent() {
    this._indents++;
  }

  decreaseIndent() {
    this._indents--;
  }
}