# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [Unreleased]

### Added

- abstract Launcher class with common functions
- EventManager which propogates events to plugins
- ProgramState used to communicate the current state of the tool to plugins
- PluginInterface which is the basis all plugins should extend from
- plugin folder where plugins for the syntest/core will be located
- an example plugin

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.2.0] - 2022-12-22

### Added

- "required" option for tool arguments
- "target_root_directory" property
- Multiple coverage over time statistic variables

### Removed

- Language specific parsing interfaces

## [0.1.2] - 2021-11-29

### Fixed

- CLI help instructions contained boilerplate content

## [0.1.1] - 2021-10-18

### Added

- Meta-heuristic search framework with multiple search algorithms (i.e., random search, NSGA-II, MOSA, DynaMOSA)
- Program search criteria (i.e., function coverage, branch coverage, line coverage, probe coverage)
- Abstract program graph representation to compare different code executions paths
- Abstract test case encoding to represent a test case in memory
- Collector functionality to keep track of statistics regarding the search process
- CLI user interface

[unreleased]: https://github.com/syntest-framework/syntest-core/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/syntest-framework/syntest-core/releases/tag/v0.1.2...v0.2.0
[0.1.2]: https://github.com/syntest-framework/syntest-core/releases/tag/v0.1.1...v0.1.2
[0.1.1]: https://github.com/syntest-framework/syntest-core/releases/tag/v0.1.1
