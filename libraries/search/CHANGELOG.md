# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.5.0-beta.8](https://github.com/syntest-framework/syntest-framework/compare/@syntest/search@0.5.0-beta.7...@syntest/search@0.5.0-beta.8) (2023-11-02)

**Note:** Version bump only for package @syntest/search

## [0.5.0-beta.7](https://github.com/syntest-framework/syntest-framework/compare/@syntest/search@0.5.0-beta.6...@syntest/search@0.5.0-beta.7) (2023-11-02)

**Note:** Version bump only for package @syntest/search

## [0.5.0-beta.6](https://github.com/syntest-framework/syntest-framework/compare/@syntest/search@0.5.0-beta.5...@syntest/search@0.5.0-beta.6) (2023-11-02)

**Note:** Version bump only for package @syntest/search

## [0.5.0-beta.5](https://github.com/syntest-framework/syntest-framework/compare/@syntest/search@0.5.0-beta.4...@syntest/search@0.5.0-beta.5) (2023-11-01)

**Note:** Version bump only for package @syntest/search

## [0.5.0-beta.4](https://github.com/syntest-framework/syntest-framework/compare/@syntest/search@0.5.0-beta.3...@syntest/search@0.5.0-beta.4) (2023-10-26)

**Note:** Version bump only for package @syntest/search

## [0.5.0-beta.3](https://github.com/syntest-framework/syntest-framework/compare/@syntest/search@0.5.0-beta.2...@syntest/search@0.5.0-beta.3) (2023-09-21)

### Features

- improve secondary objectives ([#377](https://github.com/syntest-framework/syntest-framework/issues/377)) ([99275f1](https://github.com/syntest-framework/syntest-framework/commit/99275f111abe675e10f5a04b271e61d8ff0b0789))

## [0.5.0-beta.2](https://github.com/syntest-framework/syntest-framework/compare/@syntest/search@0.5.0-beta.1...@syntest/search@0.5.0-beta.2) (2023-09-20)

### Features

- post processing options ([#376](https://github.com/syntest-framework/syntest-framework/issues/376)) ([5d42cd8](https://github.com/syntest-framework/syntest-framework/commit/5d42cd8050d6d6601689201e445aedb66b54a699))

## [0.5.0-beta.1](https://github.com/syntest-framework/syntest-framework/compare/@syntest/search@0.5.0-beta.0...@syntest/search@0.5.0-beta.1) (2023-09-20)

### Features

- enable exception objective option ([#375](https://github.com/syntest-framework/syntest-framework/issues/375)) ([b6d0b94](https://github.com/syntest-framework/syntest-framework/commit/b6d0b949b6eaa8dd89410f0e72b564d649d65e7b))

## [0.5.0-beta.0](https://github.com/syntest-framework/syntest-framework/compare/@syntest/search@0.4.1...@syntest/search@0.5.0-beta.0) (2023-09-20)

### Features

- remove subject from runner ([#374](https://github.com/syntest-framework/syntest-framework/issues/374)) ([062e090](https://github.com/syntest-framework/syntest-framework/commit/062e090aff8fc8cc7af73fd0578dc63e91ce7a76))

## [0.4.1](https://github.com/syntest-framework/syntest-framework/compare/@syntest/search@0.4.1-beta.0...@syntest/search@0.4.1) (2023-09-19)

**Note:** Version bump only for package @syntest/search

## [0.4.1-beta.0](https://github.com/syntest-framework/syntest-framework/compare/@syntest/search@0.4.0-beta.56...@syntest/search@0.4.1-beta.0) (2023-09-19)

**Note:** Version bump only for package @syntest/search

## [0.4.0](https://github.com/syntest-framework/syntest-framework/compare/@syntest/search@0.4.0-beta.56...@syntest/search@0.4.0) (2023-09-19)

**Note:** Version bump only for package @syntest/search

## [0.3.0](https://github.com/syntest-framework/syntest-framework/releases/tag/v0.2.0...v0.3.0) (2023-02-17)

### Features

- add event emissions in search algorithm and target pool ([#201](https://github.com/syntest-framework/syntest-framework/issues/201)) ([c5e499a](https://github.com/syntest-framework/syntest-framework/commit/c5e499af53097b6881416528d914795f67ab541d))
- change changelog preset ([#198](https://github.com/syntest-framework/syntest-framework/issues/198)) ([01df511](https://github.com/syntest-framework/syntest-framework/commit/01df511a936cce6851259a512b6ea70760ad8dd4))
- Extract sFuzz as a plugin
- Extract graphing related code as plugin
- Extract CFG related code as a library
- abstract Launcher class with common functions
- EventManager which propogates events to plugins
- ProgramState used to communicate the current state of the tool to plugins
- PluginInterface which is the basis all plugins should extend from
- Plugin folder where plugins for the syntest/core will be located

### Bug Fixes

- configuration alias bug ([#199](https://github.com/syntest-framework/syntest-framework/issues/199)) ([0211cc6](https://github.com/syntest-framework/syntest-framework/commit/0211cc63ffb97005d0f4eb8de1fe6b0772822b82))

## [0.2.0] (2022-12-22)

### Added

- "required" option for tool arguments
- "target_root_directory" property
- Multiple coverage over time statistic variables

### Removed

- Language specific parsing interfaces

## [0.1.2] (2021-11-29)

### Fixed

- CLI help instructions contained boilerplate content

## [0.1.1] (2021-10-18)

### Added

- Meta-heuristic search framework with multiple search algorithms (i.e., random search, NSGA-II, MOSA, DynaMOSA)
- Program search criteria (i.e., function coverage, branch coverage, line coverage, implicit-branch coverage)
- Abstract program graph representation to compare different code executions paths
- Abstract test case encoding to represent a test case in memory
- Collector functionality to keep track of statistics regarding the search process
- CLI user interface

[0.2.0]: https://github.com/syntest-framework/syntest-framework/releases/tag/v0.1.2...v0.2.0
[0.1.2]: https://github.com/syntest-framework/syntest-framework/releases/tag/v0.1.1...v0.1.2
[0.1.1]: https://github.com/syntest-framework/syntest-framework/releases/tag/v0.1.1
