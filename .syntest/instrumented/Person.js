function cov_6zq80znqc() {
  var path = "/home/dimitri/Documents/git/university/syntest/syntest-javascript/benchmark/Person.js";
  var hash = "6f832c84d59eb287cec8568d0b0b8ff3ac2c04a8";
  var global = new Function("return this")();
  var gcv = "__coverage__";
  var coverageData = {
    path: "/home/dimitri/Documents/git/university/syntest/syntest-javascript/benchmark/Person.js",
    statementMap: {
      "0": {
        start: {
          line: 1,
          column: 19
        },
        end: {
          line: 1,
          column: 38
        }
      },
      "1": {
        start: {
          line: 7,
          column: 4
        },
        end: {
          line: 7,
          column: 30
        }
      },
      "2": {
        start: {
          line: 11,
          column: 4
        },
        end: {
          line: 11,
          column: 22
        }
      },
      "3": {
        start: {
          line: 16,
          column: 0
        },
        end: {
          line: 16,
          column: 25
        }
      }
    },
    fnMap: {
      "0": {
        name: "(anonymous_0)",
        decl: {
          start: {
            line: 6,
            column: 2
          },
          end: {
            line: 6,
            column: 3
          }
        },
        loc: {
          start: {
            line: 6,
            column: 16
          },
          end: {
            line: 8,
            column: 3
          }
        },
        line: 6
      },
      "1": {
        name: "(anonymous_1)",
        decl: {
          start: {
            line: 10,
            column: 2
          },
          end: {
            line: 10,
            column: 3
          }
        },
        loc: {
          start: {
            line: 10,
            column: 14
          },
          end: {
            line: 12,
            column: 3
          }
        },
        line: 10
      }
    },
    branchMap: {},
    s: {
      "0": 0,
      "1": 0,
      "2": 0,
      "3": 0
    },
    f: {
      "0": 0,
      "1": 0
    },
    b: {},
    _coverageSchema: "8aacd2c69f3818e8835b8329134f41b943bdc06f",
    hash: "6f832c84d59eb287cec8568d0b0b8ff3ac2c04a8"
  };
  var coverage = global[gcv] || (global[gcv] = {});

  if (!coverage[path] || coverage[path].hash !== hash) {
    coverage[path] = coverageData;
  }

  var actualCoverage = coverage[path];
  {
    // @ts-ignore
    cov_6zq80znqc = function () {
      return actualCoverage;
    };
  }
  return actualCoverage;
}

cov_6zq80znqc();
const {
  Wallet
} = (cov_6zq80znqc().s[0]++, require('./Wallet'));

class Person {
  wallet;

  constructor() {
    cov_6zq80znqc().f[0]++;
    cov_6zq80znqc().s[1]++;
    this.wallet = new Wallet();
  }

  getWallet() {
    cov_6zq80znqc().f[1]++;
    cov_6zq80znqc().s[2]++;
    return this.wallet;
  }

}

cov_6zq80znqc().s[3]++;
module.exports = {
  Person
};