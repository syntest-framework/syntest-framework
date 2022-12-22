# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.2.0] - 2022-12-22

### Added

- "required" option for tool arguments
- "target_root_directory" property
- Node version 19 to the CI matrix
- Develop as a CI branch

### Changed

- Improved coverage over time statistics

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

[unreleased]: https://github.com/syntest-framework/syntest-framework/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/syntest-framework/syntest-framework/releases/tag/v0.1.2...v0.2.0
[0.1.2]: https://github.com/syntest-framework/syntest-framework/releases/tag/v0.1.1...v0.1.2
[0.1.1]: https://github.com/syntest-framework/syntest-framework/releases/tag/v0.1.1
