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

import { ActionStatement } from "../testcase/statements/action/ActionStatement";
import { Decoding } from "../testcase/statements/Statement";
import * as path from "node:path";
import { Export } from "@syntest/analysis-javascript";

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

// TODO we can also use this to generate unique identifier for the statements itself
// TODO gather assertions here too per test case
export class ContextBuilder {
  private targetRootDirectory: string;
  private sourceDirectory: string;

  // name -> count
  private importedNames: Map<string, number>;
  // // name -> import string
  // private imports: Map<string, string>

  // path -> [name]
  private imports: Map<string, Import[]>;

  private logsPresent: boolean;
  private assertionsPresent: boolean;

  // old var -> new var
  private variableMap: Map<string, string>;
  // var -> count
  private variableCount: Map<string, number>;

  constructor(targetRootDirectory: string, sourceDirectory: string) {
    this.targetRootDirectory = targetRootDirectory;
    this.sourceDirectory = sourceDirectory;

    this.importedNames = new Map();
    this.imports = new Map();

    this.logsPresent = false;
    this.assertionsPresent = false;

    this.variableMap = new Map();
    this.variableCount = new Map();
  }

  addDecoding(decoding: Decoding) {
    // This function assumes the decodings to come in order

    if (decoding.reference instanceof ActionStatement) {
      const export_ = decoding.reference.export;
      if (export_) {
        const import_ = this._addImport(export_);
        const newName = import_.renamed ? import_.renamedTo : import_.name;
        decoding.decoded = decoding.decoded.replaceAll(import_.name, newName);
      }
    }

    const variableName = decoding.reference.varName;
    if (this.variableMap.has(variableName)) {
      this.variableCount.set(
        variableName,
        this.variableCount.get(variableName) + 1
      );
    } else {
      this.variableCount.set(variableName, 0);
    }

    this.variableMap.set(
      variableName,
      variableName + this.variableCount.get(variableName)
    );

    for (const [oldVariable, newVariable] of this.variableMap.entries()) {
      decoding.decoded = decoding.decoded.replaceAll(oldVariable, newVariable);
    }
  }

  addLogs() {
    this.logsPresent = true;
  }

  addAssertions() {
    this.assertionsPresent = true;
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

    if (this.importedNames.has(exportedName)) {
      // same name new import
      const count = this.importedNames.get(exportedName);
      this.importedNames.set(exportedName, count + 1);
      newName = exportedName + count.toString();

      import_ = {
        name: exportedName,
        renamed: true,
        renamedTo: newName,
        default: export_.default,
        module: export_.module,
      };
    } else {
      this.importedNames.set(exportedName, 1);
    }

    if (!this.imports.has(path_)) {
      this.imports.set(path_, []);
    }

    this.imports.get(path_).push(import_);
    return import_;
  }

  // TODO we could gather all the imports of a certain path together into one import
  private _getImportString(_path: string, import_: Import): string {
    if (import_.renamed) {
      if (import_.module) {
        return import_.default
          ? `const ${import_.renamedTo} = require("${_path}");`
          : `const {${import_.name}: ${import_.renamedTo}} = require("${_path}");`;
      }
      return import_.default
        ? `import ${import_.renamedTo} from "${_path}";`
        : `import {${import_.name} as ${import_.renamedTo}} from "${_path}";`;
    } else {
      if (import_.module) {
        return import_.default
          ? `const ${import_.name} = require("${_path}");`
          : `const {${import_.name}} = require("${_path}");`;
      }
      return import_.default
        ? `import ${import_.name} from "${_path}";`
        : `import {${import_.name}} from "${_path}";`;
    }
  }

  getImports(): string[] {
    const imports: string[] = [];

    for (const [path_, imports_] of this.imports.entries()) {
      // TODO remove unused imports
      for (const import_ of imports_) {
        imports.push(this._getImportString(path_, import_));
      }
    }

    if (this.assertionsPresent) {
      imports.push(
        `import chai from 'chai'`,
        `import chaiAsPromised from 'chai-as-promised'`,
        `const expect = chai.expect;`,
        `chai.use(chaiAsPromised);`
      );
    }

    if (this.logsPresent) {
      imports.push(`import * as fs from 'fs'`);
    }
    // TODO other post processing?
    return (
      imports
        // remove duplicates
        // there should not be any in theory but lets do it anyway
        .filter((value, index, self) => self.indexOf(value) === index)
        // sort
        .sort()
    );
  }
}
