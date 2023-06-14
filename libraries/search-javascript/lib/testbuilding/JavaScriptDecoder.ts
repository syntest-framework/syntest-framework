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
import { Decoder } from "@syntest/search";

import { JavaScriptTestCase } from "../testcase/JavaScriptTestCase";
import { RootStatement } from "../testcase/statements/root/RootStatement";
import { Decoding } from "../testcase/statements/Statement";

export class JavaScriptDecoder implements Decoder<JavaScriptTestCase, string> {
  private exports: Export[];
  private targetRootDirectory: string;
  private tempLogDirectory: string;

  constructor(
    exports: Export[],
    targetRootDirectory: string,
    temporaryLogDirectory: string
  ) {
    this.exports = exports;
    this.targetRootDirectory = targetRootDirectory;
    this.tempLogDirectory = temporaryLogDirectory;
  }

  decode(
    testCases: JavaScriptTestCase | JavaScriptTestCase[],
    targetName: string,
    addLogs = false,
    sourceDirectory = "../instrumented"
  ): string {
    if (testCases instanceof JavaScriptTestCase) {
      testCases = [testCases];
    }

    const tests: string[] = [];
    const imports: string[] = [];

    for (const testCase of testCases) {
      const root = testCase.root;

      const importableGenes: RootStatement[] = [];
      let statements: Decoding[] = root.decode(this, testCase.id, {
        addLogs,
        exception: false,
      });

      const testString: string[] = [];
      if (addLogs) {
        testString.push(
          `\t\tawait fs.mkdirSync('${path.join(
            this.tempLogDirectory,
            testCase.id
          )}', { recursive: true })\n
          \t\tlet count = 0;
          \t\ttry {\n`
        );
      }

      if (testCase.assertions.size > 0 && testCase.assertions.has("error")) {
        const index = Number.parseInt(testCase.assertions.get("error"));

        // TODO does not work
        //  the .to.throw stuff does not work somehow
        // const decoded = statements[index].reference instanceof MethodCall
        //   ? (<MethodCall>statements[index].reference).decodeWithObject(testCase.id, { addLogs, exception: true }, statements[index].objectVariable)
        //   : statements[index].reference.decode(testCase.id, { addLogs, exception: true })
        // statements[index] = decoded.find((x) => x.reference === statements[index].reference)

        // delete statements after
        statements = statements.slice(0, index + 1);
      }

      for (const [index, value] of statements.entries()) {
        if (value.reference instanceof RootStatement) {
          importableGenes.push(value.reference);
        }
        if (addLogs) {
          // add log per statement
          testString.push("\t\t" + `count = ${index};`);
        }

        testString.push("\t\t" + value.decoded.replace("\n", "\n\t\t"));
      }

      if (addLogs) {
        testString.push(
          `} catch (e) {`,
          `await fs.writeFileSync('${path.join(
            this.tempLogDirectory,
            testCase.id,
            "error"
          )}', '' + count)`, // TODO we could add the error here and assert that that is the error message we expect
          "}"
        );
      }

      const importsOfTest = this.gatherImports(
        sourceDirectory,
        testString,
        importableGenes
      );
      imports.push(...importsOfTest);

      if (addLogs) {
        imports.push(`import * as fs from 'fs'`);
      }

      if (testCase.assertions.size > 0) {
        imports.push(
          `import chai from 'chai'`,
          `import chaiAsPromised from 'chai-as-promised'`,
          `const expect = chai.expect;`,
          `chai.use(chaiAsPromised);`
        );
      }

      const assertions: string[] = this.generateAssertions(testCase);

      const body = [];

      if (testString.length > 0) {
        let errorStatement: string;
        if (testCase.assertions.size > 0 && testCase.assertions.has("error")) {
          errorStatement = testString.pop();
        }

        body.push(`${testString.join("\n")}`, `${assertions.join("\n")}`);

        if (errorStatement) {
          body.push(
            `\t\ttry {\n\t${errorStatement}\n\t\t} catch (e) {\n\t\t\texpect(e).to.be.an('error')\n\t\t}`
          );
        }
      }

      const metaCommentBlock = [];

      for (const metaComment of testCase.metaComments) {
        metaCommentBlock.push(`\t\t// ${metaComment}`);
      }

      // TODO instead of using the targetName use the function call or a better description of the test
      tests.push(
        `\tit('test for ${targetName}', async () => {\n` +
          `${metaCommentBlock.join("\n")}\n` +
          `${body.join("\n\n")}` +
          `\n\t});`
      );
    }

    if (imports.some((x) => x.includes("import") && !x.includes("require"))) {
      const importsString =
        imports

          // remove duplicates
          .filter((value, index, self) => self.indexOf(value) === index)
          .join("\n") + `\n\n`;

      return (
        importsString +
        `describe('${targetName}', () => {\n` +
        tests.join("\n\n") +
        `\n})`
      );
    } else {
      const importsString =
        imports

          // remove duplicates
          .filter((value, index, self) => self.indexOf(value) === index)
          .join("\n\t") + `\n\n`;

      return (
        `describe('${targetName}', () => {\n\t` +
        importsString +
        tests.join("\n\n") +
        `\n})`
      );
    }
  }

  gatherImports(
    sourceDirectory: string,
    testStrings: string[],
    importableGenes: RootStatement[]
  ): string[] {
    const imports: string[] = [];
    const importedDependencies: Set<string> = new Set<string>();

    for (const gene of importableGenes) {
      // TODO how to get the export of a variable?
      // the below does not work with duplicate exports
      let export_: Export = this.exports.find((x) => x.id === gene.id);

      if (!export_) {
        // dirty hack to fix certain exports
        export_ = this.exports.find(
          (x) =>
            gene.id.split(":")[0] === x.filePath &&
            (x.name === gene.name || x.renamedTo === gene.name)
        );
      }

      if (!export_) {
        throw new Error(
          "Cannot find an export corresponding to the importable gene: " +
            gene.id
        );
      }

      // no duplicates
      if (importedDependencies.has(export_.name)) {
        continue;
      }
      importedDependencies.add(export_.name);

      // skip non-used imports
      if (!testStrings.some((s) => s.includes(export_.name))) {
        continue;
      }

      const importString: string = this.getImport(sourceDirectory, export_);

      if (imports.includes(importString) || importString.length === 0) {
        continue;
      }

      imports.push(importString);

      // let count = 0;
      // for (const dependency of this.dependencies.get(importName)) {
      //   // no duplicates
      //   if (importedDependencies.has(dependency.name)) {
      //     continue
      //   }
      //   importedDependencies.add(dependency.name)
      //
      //   // skip non-used imports
      //   if (!testStrings.find((s) => s.includes(dependency.name))) {
      //     continue
      //   }
      //
      //   const importString: string = this.getImport(dependency);
      //
      //   if (imports.includes(importString) || importString.length === 0) {
      //     continue;
      //   }
      //
      //   imports.push(importString);
      //
      //   count += 1;
      // }
    }

    return imports;
  }

  getImport(sourceDirectory: string, dependency: Export): string {
    const _path = dependency.filePath.replace(
      path.resolve(this.targetRootDirectory),
      path.join(sourceDirectory, path.basename(this.targetRootDirectory))
    );

    // if (dependency.module) {
    //   return dependency.default
    //     ? `import * as ${dependency.name} from "${_path}";`
    //     : `import {${dependency.name}} from "${_path}";`;
    // }
    if (dependency.module) {
      return dependency.default
        ? `const ${dependency.name} = require("${_path}");`
        : `const {${dependency.name}} = require("${_path}");`;
    }
    return dependency.default
      ? `import ${dependency.name} from "${_path}";`
      : `import {${dependency.name}} from "${_path}";`;
  }

  generateAssertions(testCase: JavaScriptTestCase): string[] {
    const assertions: string[] = [];
    if (testCase.assertions.size > 0) {
      for (const variableName of testCase.assertions.keys()) {
        if (variableName === "error") {
          continue;
        }

        const assertion = testCase.assertions.get(variableName).split(";sep;");
        const original = assertion[0];
        let stringified = assertion[1];

        if (original === "undefined") {
          assertions.push(`\t\texpect(${variableName}).to.equal(${original})`);
          continue;
        } else if (original === "NaN") {
          assertions.push(`\t\texpect(${variableName}).to.be.NaN`);
          continue;
        }

        // TODO dirty hack because json.parse does not allow undefined/NaN
        // TODO undefined/NaN can happen in arrays
        stringified = stringified.replace("undefined", "null");
        stringified = stringified.replace("NaN", "null");

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const value = JSON.parse(stringified);

        if (typeof value === "object" || typeof value === "function") {
          assertions.push(
            `\t\texpect(JSON.parse(JSON.stringify(${variableName}))).to.deep.equal(${stringified})`
          );
        } else {
          assertions.push(
            `\t\texpect(${variableName}).to.equal(${stringified})`
          );
        }
      }
    }

    return assertions;
  }

  getLogDirectory(id: string, variableName: string): string {
    return path.join(this.tempLogDirectory, id, variableName);
  }
}
