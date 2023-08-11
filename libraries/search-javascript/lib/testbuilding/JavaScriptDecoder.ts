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

import { Decoder } from "@syntest/search";

import { JavaScriptTestCase } from "../testcase/JavaScriptTestCase";
import { Decoding } from "../testcase/statements/Statement";
import { ActionStatement } from "../testcase/statements/action/ActionStatement";
import { ContextBuilder } from "./ContextBuilder";

export class JavaScriptDecoder implements Decoder<JavaScriptTestCase, string> {
  private targetRootDirectory: string;
  private tempLogDirectory: string;

  constructor(targetRootDirectory: string, temporaryLogDirectory: string) {
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

    const context = new ContextBuilder(
      this.targetRootDirectory,
      sourceDirectory
    );

    const tests: string[] = [];

    for (const testCase of testCases) {
      const roots: ActionStatement[] = testCase.roots;

      const importableGenes: ActionStatement[] = [];
      let decodings: Decoding[] = roots.flatMap((root) =>
        root.decode(this, testCase.id, {
          addLogs,
          exception: false,
        })
      );

      if (decodings.length === 0) {
        throw new Error("No statements in test case");
      }

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
        decodings = decodings.slice(0, index + 1);
      }

      if (decodings.length === 0) {
        throw new Error("No statements in test case after error reduction");
      }

      for (const [index, value] of decodings.entries()) {
        context.addDecoding(value);
        const asString = "\t\t" + value.decoded.replace("\n", "\n\t\t");
        if (testString.includes(asString)) {
          // skip repeated statements
          continue;
        }

        if (
          value.reference instanceof ActionStatement &&
          value.reference.export
        ) {
          importableGenes.push(value.reference);
        }

        if (addLogs) {
          // add log per statement
          testString.push("\t\t" + `count = ${index};`);
        }

        testString.push(asString);
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

      // const importsOfTest = this.gatherImports(
      //   context,
      //   sourceDirectory,
      //   testString,
      //   importableGenes
      // );

      // for (const import_ of importsOfTest) {
      //   if (!imports.includes(import_)) {
      //     // filter duplicates
      //     imports.push(import_);
      //   }
      // }

      if (addLogs) {
        context.addLogs();
      }

      if (testCase.assertions.size > 0) {
        context.addAssertions();
      }

      const assertions: string[] = this.generateAssertions(testCase);

      if (assertions.length > 0) {
        assertions.splice(0, 0, "\n\t\t// Assertions");
      }

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

      if (metaCommentBlock.length > 0) {
        metaCommentBlock.splice(0, 0, "\n\t\t// Meta information");
      }

      // TODO instead of using the targetName use the function call or a better description of the test
      tests.push(
        `${metaCommentBlock.join("\n")}\n` +
          `\n\t\t// Test\n` +
          `${body.join("\n\n")}`
      );
    }

    const imports = context.getImports();

    if (imports.some((x) => x.includes("import") && !x.includes("require"))) {
      const importsString = imports.join("\n") + `\n\n`;

      return (
        `// Imports\n` +
        importsString +
        `describe('${targetName}', function() {\n\t` +
        tests
          .map(
            (test) =>
              `\tit('test for ${targetName}', async () => {\n` +
              test +
              `\n\t});`
          )
          .join("\n\n") +
        `\n})`
      );
    } else {
      const importsString = `\t\t` + imports.join("\n\t\t") + `\n`;

      return (
        `describe('${targetName}', function() {\n\t` +
        tests
          .map(
            (test) =>
              `\tit('test for ${targetName}', async () => {\n` +
              `\t\t// Imports\n` +
              importsString +
              test +
              `\n\t});`
          )
          .join("\n\n") +
        `\n})`
      );
    }
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
