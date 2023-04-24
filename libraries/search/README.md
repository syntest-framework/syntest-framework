# SynTest Framework - Common Core

> The aim of the common core of the SynTest Framework is to extract the common parts (e.g., core infrastructure, search algorithms, encodings) of the different language specific SynTest Tools.

[![build](https://github.com/syntest-framework/syntest-core/actions/workflows/build.yml/badge.svg)](https://github.com/syntest-framework/syntest-core/actions/workflows/build.yml)
[![verify](https://github.com/syntest-framework/syntest-core/actions/workflows/verify.yml/badge.svg)](https://github.com/syntest-framework/syntest-core/actions/workflows/verify.yml)
[![publish pre-release](https://github.com/syntest-framework/syntest-core/actions/workflows/publish-prerelease.yml/badge.svg)](https://github.com/syntest-framework/syntest-core/actions/workflows/publish-prerelease.yml)
[![publish release](https://github.com/syntest-framework/syntest-core/actions/workflows/publish-release.yml/badge.svg)](https://github.com/syntest-framework/syntest-core/actions/workflows/publish-release.yml)

core:
![latest NPM version](https://img.shields.io/npm/v/@syntest/search/latest?style=flat)
![beta NPM version](https://img.shields.io/npm/v/@syntest/search/beta?style=flat) <br />

The common core of the [SynTest Framework](https://www.syntest.org).

### What is SynTest?

SynTest is a framework for automating the generation of test cases based on JavaScript. This library is not meant to be used directly. To make use of the framework, please use one of the specific implementation for the different supported languages (e.g., Solidity and JavaScript/Typescript). These implementations can be found in the [SynTest Framework organization](https://github.com/syntest-framework).

### Overview

The common core contains the common interfaces for the code control-flow representation, test case structure, genes, and the implementation for the meta-heuristic search algorithms.

For more in-depth information about the architecture we refer to: [Architecture](docs/ARCHITECTURE.md).

## Installation

### NPM

The simplest way to use syntest-core is by installing the npm package.

```bash
$ npm install @syntest/search
```

### From source

The library can be used by cloning the project, installing its dependencies, compiling the TypeScript, and requiring it in your project:

- Clone the project

```bash
$ git clone git@github.com:syntest-framework/syntest-core.git
```

- Install dependencies

```bash
$ npm install
```

- Build the core

```bash
$ npm run build
```

- Install as npm module in your project

```bash
$ npm install /path/to/syntest-core
```

## Support

For questions and help with how to use this library, please see [SUPPORT.md](SUPPORT.md).

## Contributing

Contributions are welcome! For major changes, please open an issue first to discuss what you would like to change. For more information, please see [CONTRIBUTING.md](CONTRIBUTING.md).

## Authors and acknowledgment

- Annibale Panichella (PI)
- Mitchell Olsthoorn (Project Lead)
- Dimitri Stallenberg (Developer)

## License

The code within this project is licensed under the [Apache-2.0 license](LICENSE).
