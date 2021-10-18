# SynTest Framework - Common Core

> The aim of the common core of the SynTest framework is to extract the common parts (e.g., framework infrastructure, search algorithms, encodings) of the different language specific SynTest Tools.

[![](https://github.com/syntest-framework/syntest-framework/actions/workflows/node.js.yml/badge.svg)](https://github.com/syntest-framework/syntest-framework/actions/workflows/node.js.yml)
[![publish](https://github.com/syntest-framework/syntest-framework/actions/workflows/publish.yml/badge.svg)](https://github.com/syntest-framework/syntest-framework/actions/workflows/publish.yml)
![npm (scoped)](https://img.shields.io/npm/v/@syntest/framework?style=flat)
![node-current (scoped)](https://img.shields.io/node/v/@syntest/framework)

The common core of the [SynTest Framework](https://www.syntest.org).

### What is SynTest?

SynTest is a framework for automating the generation of test cases based on JavaScript. This library is not meant to be used directly. To make use of the framework, please use one of the specific implementation for the different supported languages (e.g., Solidity and JavaScript/Typescript). These implementations can be found in the [SynTest Framework organization](https://github.com/syntest-framework).

### Overview

The common core contains the common interfaces for the code control-flow representation, test case structure, genes, and the implementation for the meta-heuristic search algorithms.

For more in-depth information about the architecture we refer to: [Architecture](docs/ARCHITECTURE.md).

## Installation

### NPM

The simplest way to use syntest-framework is by installing the npm package.

```bash
$ npm install @syntest/framework
```

### From source

The library can be used by cloning the project, installing its dependencies, compiling the TypeScript, and requiring it in your project:

- Clone the project

```bash
$ git clone git@github.com:syntest-framework/syntest-framework.git
```

- Install dependencies

```bash
$ npm install
```

- Build the framework

```bash
$ npm run build
```

- Install as npm module in your project

```bash
$ npm install /path/to/syntest-framework
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
