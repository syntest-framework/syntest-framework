/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Javascript.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as path from "node:path";

import { Export } from "@syntest/analysis-javascript";
import {
  globalVariables,
  reservedKeywords,
} from "@syntest/ast-visitor-javascript";
import { getLogger, Logger } from "@syntest/logging";

import { ClassActionStatement } from "../testcase/statements/action/ClassActionStatement";
import { FunctionCall } from "../testcase/statements/action/FunctionCall";
import { ObjectFunctionCall } from "../testcase/statements/action/ObjectFunctionCall";
import { Statement } from "../testcase/statements/Statement";

type Import = RegularImport | RenamedImport;

type RegularImport = {
  name: string;
  renamed: false;
  module: boolean;
  default: boolean;
};

type RenamedImport = {
  name: string;
  renamed: true;
  renamedTo: string;
  module: boolean;
  default: boolean;
};

type Require = {
  left: string;
  right: string;
};

// TODO gather assertions here too per test case
export class ContextBuilder {
  protected static LOGGER: Logger;
  private targetRootDirectory: string;
  private sourceDirectory: string;

  // name -> count
  private globalNameCount: Map<string, number>;
  // name -> count
  private testNameCount: Map<string, number>;

  // path -> [name]
  private imports: Map<string, Import[]>;

  // Statement -> variableName
  private statementVariableNameMap: Map<Statement, string>;

  constructor(targetRootDirectory: string, sourceDirectory: string) {
    ContextBuilder.LOGGER = getLogger("ContextBuilder");
    this.targetRootDirectory = targetRootDirectory;
    this.sourceDirectory = sourceDirectory;

    this.globalNameCount = new Map();
    this.testNameCount = new Map();

    this.imports = new Map();
    this.statementVariableNameMap = new Map();
  }

  nextTestCase() {
    this.statementVariableNameMap = new Map();
    this.testNameCount = new Map();
  }

  getOrCreateVariableName(statement: Statement): string {
    if (this.statementVariableNameMap.has(statement)) {
      return this.statementVariableNameMap.get(statement);
    }

    let variableName = statement.name;

    variableName = variableName.replaceAll(/[^A-Za-z]/g, "");

    variableName = variableName[0].toLowerCase() + variableName.slice(1);

    variableName =
      reservedKeywords.has(variableName) || globalVariables.has(variableName)
        ? "local" + variableName[0].toUpperCase() + variableName.slice(1)
        : variableName;

    if (
      statement instanceof ClassActionStatement ||
      statement instanceof FunctionCall ||
      statement instanceof ObjectFunctionCall
    ) {
      variableName += "ReturnValue";
    }

    let count = -1;
    if (
      this.globalNameCount.has(variableName) &&
      this.testNameCount.has(variableName)
    ) {
      count = Math.max(
        this.globalNameCount.get(variableName),
        this.testNameCount.get(variableName)
      );
    } else if (this.globalNameCount.has(variableName)) {
      count = this.globalNameCount.get(variableName);
    } else if (this.testNameCount.has(variableName)) {
      count = this.testNameCount.get(variableName);
    }

    if (count === -1) {
      this.testNameCount.set(variableName, 1);
    } else {
      this.testNameCount.set(variableName, count + 1);
      variableName += count;
    }

    this.statementVariableNameMap.set(statement, variableName);
    return variableName;
  }

  getOrCreateImportName(export_: Export): string {
    const import_ = this._addImport(export_);

    return import_.renamed ? import_.renamedTo : import_.name;
  }

  private _addImport(export_: Export): Import {
    const path_ = export_.filePath.replace(
      path.resolve(this.targetRootDirectory),
      path.join(this.sourceDirectory, path.basename(this.targetRootDirectory))
    );

    const exportedName = export_.renamedTo;
    let import_: Import = {
      name: exportedName === "default" ? "defaultExport" : exportedName,
      renamed: false,
      default: export_.default,
      module: export_.module,
    };
    let newName: string = exportedName;

    if (this.imports.has(path_)) {
      const foundImport = this.imports.get(path_).find((value) => {
        return (
          value.name === import_.name &&
          value.default === import_.default &&
          value.module === import_.module
        );
      });
      if (foundImport !== undefined) {
        // already in there so we return the already found on
        return foundImport;
      }
    }

    let count = -1;
    // same name new import
    if (
      this.globalNameCount.has(exportedName) &&
      this.testNameCount.has(exportedName)
    ) {
      count = Math.max(
        this.globalNameCount.get(exportedName),
        this.testNameCount.get(exportedName)
      );
    } else if (this.globalNameCount.has(exportedName)) {
      count = this.globalNameCount.get(exportedName);
    } else if (this.testNameCount.has(exportedName)) {
      count = this.testNameCount.get(exportedName);
    }

    if (count === -1) {
      this.globalNameCount.set(exportedName, 1);
    } else {
      this.globalNameCount.set(exportedName, count + 1);
      this.testNameCount.set(exportedName, count + 1);
      newName = exportedName + count.toString();

      import_ = {
        name: exportedName,
        renamed: true,
        renamedTo: newName,
        default: export_.default,
        module: export_.module,
      };
    }

    if (!this.imports.has(path_)) {
      this.imports.set(path_, []);
    }

    this.imports.get(path_).push(import_);
    return import_;
  }

  // TODO we could gather all the imports of a certain path together into one import
  private _getImportString(_path: string, import_: Import): string {
    if (import_.module) {
      throw new Error("Only non module imports can use import statements");
    }

    // if (import_.renamed) {
    //   return import_.default
    //     ? `const ${import_.renamedTo} = require("${_path}";`
    //     : `const {${import_.name} as ${import_.renamedTo}} =  equire("${_path}";`;
    // } else {
    //   return import_.default
    //     ? `const ${import_.name} = require("${_path}";`
    //     : `const {${import_.name}} = require("${_path}";`;
    // }

    if (import_.renamed) {
      return import_.default
        ? `import ${import_.renamedTo} from "${_path}";`
        : `import {${import_.name} as ${import_.renamedTo}} from "${_path}";`;
    } else {
      return import_.default
        ? `import ${import_.name} from "${_path}";`
        : `import {${import_.name}} from "${_path}";`;
    }
  }

  private _getRequireString(_path: string, import_: Import): Require {
    if (!import_.module) {
      throw new Error("Only module imports can use require statements");
    }

    const require: Require = {
      left: "",
      right: `require("${_path}")`,
    };

    if (import_.renamed) {
      require.left = import_.default
        ? import_.renamedTo
        : `{${import_.name}: ${import_.renamedTo}}`;
    } else {
      require.left = import_.default ? import_.name : `{${import_.name}}`;
    }

    return require;
  }

  getImports(assertionsPresent: boolean) {
    let requires: Require[] = [];
    let imports: string[] = [];

    for (const [path_, imports_] of this.imports.entries()) {
      // TODO remove unused imports
      for (const import_ of imports_) {
        if (import_.module) {
          requires.push(this._getRequireString(path_, import_));
        } else {
          imports.push(this._getImportString(path_, import_));
        }
      }
    }

    requires = requires // remove duplicates
      // there should not be any in theory but lets do it anyway
      .filter((value, index, self) => self.indexOf(value) === index)
      // sort
      .sort();

    imports = imports // remove duplicates
      // there should not be any in theory but lets do it anyway
      .filter((value, index, self) => self.indexOf(value) === index)
      // sort
      .sort();

    if (assertionsPresent) {
      imports.push(
        `import chai from 'chai'`,
        `import chaiAsPromised from 'chai-as-promised'`,
        `const expect = chai.expect;`,
        `chai.use(chaiAsPromised);`
      );
    }

    // TODO other post processing?
    return {
      imports,
      requires,
    };
  }
}
