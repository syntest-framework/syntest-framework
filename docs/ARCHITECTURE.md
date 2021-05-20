# Architecture

This document contains a high-level architectural overview of SynTest, and serves as a good place to get to know [the codebase](link).

## Code organization
Below is a brief view of SynTest's structure:

- `src/criterion`: functions to calculate fitness based on (e.g. branch coverage or function coverage).
- `src/graph`: representation of control flow graph (CFG).
- `src/search`: does this and that TODO.
  - `budget`: classes to keep track of the available budget using the budget manager.
  - `comparators`: functions that allow the comparison of two or more testcases.
  - `factories`: factory functions to instantiate objects based on the configuration file.
  - `metaheuristics`: classes of search algorithms, e.g. RandomSearch, NSGAII and DynaMOSA.
  - `objective`: functions to calculate fitness values for TestCases using for example branch distance.
  - `operators`: 
- `src/statistics`: does this and that
- `src/testcase`: representation of test cases.
  - `decoder`: decodes encoded test case to concrete test case.
  - `execution`: runs concrete test case.
  - `sampling`: functions that allow sampling of various statements and T
  - `statements`: action statements (constructor/function call) or primitive statements (bool/numeric assignment).
- `src/util`: several util files, e.g. a logger.

## Understanding internals
sdf
