# Architecture

This document contains a high-level architectural overview of SynTest, and serves as a good place to get to know [the codebase](https://github.com/syntest-framework/syntest-framework).

The Syntest Framework repository serves as common core to automatically generate test cases based on JavaScript. It is important to understand that this repository should not be used directly, but that its architecture defines the underlying structure of extensions based on a language (e.g., Solidity and JavaScript/Typescript).

## Code organization
Below is a brief view of SynTest's structure:

- `src/criterion`: functions to calculate fitness based on (e.g. branch coverage or function coverage).
- `src/graph`: representation of control flow graph (CFG).
- `src/search`: implementation of search algorithms.
  - `budget`: classes to keep track of the available budget using the budget manager.
  - `comparators`: functions that allow the comparison of two or more testcases.
  - `factories`: factory functions to instantiate objects based on the configuration file.
  - `metaheuristics`: classes of search algorithms, e.g. RandomSearch, NSGAII and DynaMOSA.
  - `objective`: functions to calculate fitness values for TestCases using for example branch distance.
  - `operators`: mutation operators used to traverse the search space.
- `src/statistics`: keeps track of test statistics.
- `src/testcase`: representation of test cases.
  - `decoder`: decodes encoded test case to concrete test case.
  - `execution`: runs concrete test case.
  - `sampling`: functions that allow sampling of various statements from test cases based on types.
  - `statements`: action statements (constructor/function call) or primitive statements (bool/numeric assignment).
- `src/util`: several util files, which include helper classes and the logger.

## Understanding internals
To get a better idea of how the Syntest Framework operates, let's take a look at the flow of generating a test case and executing it. This process can be seperated into the following steps:

(This subsection will likely discuss some concrete example)

1. TODO
2. TODO

## Search algorithms
TODO
