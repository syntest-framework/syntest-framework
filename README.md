# SynTest Framework - JavaScript

> The aim of this tool is make it easier for JavaScript developers to test their code in a more effective and efficient way.

A tool to generate synthetic tests for the JavaScript language

### What is SynTest JavaScript?

SynTest JavaScript is a tool for automatically generating test cases for the JavaScript language. This tool is part of the [SynTest Framework](https://www.syntest.org). This framework contains multiple tools related to the generation of synthetic tests.

### Overview

The framework contains the common interfaces for the code control-flow representation, test case structure, genes, and the implementation for the meta-heuristic search algorithms.

## Installation

#### NPM

The simplest way to use syntest javascript is by installing the following two npm packages: [@syntest/cli](https://www.npmjs.com/package/syntest/cli), [@syntest/javascript](https://www.npmjs.com/package/syntest/javascript).

```bash
$ npm install @syntest/cli
$ npm install @syntest/javascript
```

You can install it in your project as shown in the snippit above or you can install the package globally by using the npm options `-g`.

## Usage

To start you need to be in the root of the project folder containing the code you want to create test-cases for. Next, you need to install two dev-dependencies in your project, namely [chai](https://www.npmjs.com/package/chai) and [chai-as-promised](https://www.npmjs.com/package/chai-as-promised). Both are needed to run the tests.

Next, you want to run the following command:

```bash
$ npx syntest init config --modules @syntest/javascript
```

This will create the `.syntest.json` configuration file for you with some pre filled in parameters.
The file should look somewhat like this:

```
{
  ...,
  "target-root-directory": "./express",
  "include": [
    "./express/lib/**/*.js"
  ],
  "exclude": [],
  "modules": [
    "@syntest/javascript"
  ],
  "preset": "DynaMOSA"
  ...
}
```

In the above example the most important configuration options are shown.

- The preset value which decides the algorithms the tool will use.
- The loaded module "@syntest/javascript".
- The target root directory which is the source directory of all the files you want to target.
- The include array where you can specify which files to target.
- The exclude array where you can specify which files to exclude specifically

Once these properties are set you can run:

```bash
$ npx syntest javascript test
```

If everything is correct the tool will now start.
The results can be found in the `syntest` folder

SynTest-JavaScript is highly configurable and supports a bunch of options and arguments, all of them can be found by providing the `--help` option or `-h` for short. Another way of configuring the tool is through the .syntest.json file in the root of your project.

## Documentation

For questions and help with how to use this tool, please see the [documentation](https://www.syntest.org).

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
