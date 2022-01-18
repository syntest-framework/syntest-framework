import { Decoder, Properties } from "@syntest/framework";
import { JavaScriptTestCase } from "../testcase/JavaScriptTestCase";
import * as path from "path";
import { ConstructorCall } from "../testcase/statements/root/ConstructorCall";
import { MethodCall } from "../testcase/statements/action/MethodCall";
import { Decoding, Statement } from "../testcase/statements/Statement";
import { PrimitiveStatement } from "../testcase/statements/primitive/PrimitiveStatement";
import { Export } from "../analysis/static/dependency/ExportVisitor";
import { FunctionCall } from "../testcase/statements/root/FunctionCall";
import { RootStatement } from "../testcase/statements/root/RootStatement";


export class JavaScriptDecoder implements Decoder<JavaScriptTestCase, string> {
  private imports: Map<string, string>;
  private contractDependencies: Map<string, Export[]>;
  private exports: Export[]
  private folder: string

  constructor(
    imports: Map<string, string>,
    contractDependencies: Map<string, Export[]>,
    exports: Export[],
    folder: string = '../instrumented'
  ) {
    this.imports = imports;
    this.contractDependencies = contractDependencies;
    this.exports = exports
    this.folder = folder
  }

  decodeTestCase(testCases: JavaScriptTestCase | JavaScriptTestCase[], targetName: string, addLogs = false): string {
    if (testCases instanceof JavaScriptTestCase) {
      testCases = [testCases];
    }

    const tests: string[] = []
    const imports: string[] = []

    for (const testCase of testCases) {
      const root = testCase.root;

      const importableGenes: RootStatement[] = [];
      const statements: Decoding[] = root.decode(addLogs)
      const assertions: string[] = [];

      const testString: string[] = [];
      if (addLogs) {
        imports.push(`const fs = require('fs');\n\n`);
        testString.push(
          `\t\tawait fs.mkdirSync('${path.join(
            Properties.temp_log_directory,
            testCase.id
          )}', { recursive: true })\n`
        );
        testString.push("try {");
      }

      if (testCase.assertions.size !== 0 && testCase.assertions.has("error")) {
        const stopAfter = testCase.assertions.size;
        // TODO this would only work if each variable is printed...
        // TODO best would be to extract the stack trace and do it based on line number
      }

      statements.forEach((value) => {
        if (value.reference instanceof RootStatement) {
          importableGenes.push(value.reference)
        }
        testString.push(
          '\t\t' + value.decoded.replace('\n', '\n\t\t')
        )
      })

      if (addLogs) {
        testString.push(`} catch (e) {`);
        testString.push(
          `await fs.writeFileSync('${path.join(
            Properties.temp_log_directory,
            testCase.id,
            "error"
          )}', '' + e.stack)`
        );
        testString.push("}");
      }

      const importsOfTest = this.gatherImports(importableGenes);
      imports.push(...importsOfTest);

      if (testCase.assertions.size) {
        imports.push(`const chai = require('chai');`);
        imports.push(`const expect = chai.expect;`);
        imports.push(`chai.use(require('chai-as-promised'));`);
      }

      assertions.unshift(...this.generateAssertions(testCase));

      const body = [];
      if (testString.length) {
        body.push(`${testString.join("\n")}`);
      }
      if (assertions.length) {
        body.push(`${assertions.join("\n")}`);
      }

      // TODO instead of using the targetName use the function call or a better description of the test
      tests.push(
        `\tit('test for ${targetName}', async () => {\n` +
        `${body.join("\n\n")}` +
        `\n\t});`
      );
    }

    let test =
      `describe('${targetName}', () => {\n` +
      tests.join("\n\n") +
      `\n})`;

    // Add the imports
    test =
      imports
        .filter((value, index, self) => self.indexOf(value) === index)
        .join("\n") +
      `\n\n` +
      test;

    return test;
  }

  gatherImports(importableGenes: RootStatement[]): string[] {
    const imports: string[] = [];

    for (const gene of importableGenes) {
      const importName = gene instanceof FunctionCall ? gene.functionName : (gene instanceof ConstructorCall ? gene.constructorName : null);
      const export_: Export = this.exports.find((x) => x.name === importName)
      if (!export_) {
        throw new Error('Cannot find an export corresponding to the importable gene: ' + importName)
      }
      const importString: string = this.getImport(export_)

      if (imports.includes(importString) || importString.length === 0) {
        continue;
      }

      imports.push(importString);

      let count = 0;
      for (const dependency of this.contractDependencies.get(importName)) {
        const importString: string = this.getImport(dependency);

        if (imports.includes(importString) || importString.length === 0) {
          continue;
        }

        imports.push(importString);

        count += 1;
      }
    }

    return imports;
  }

  getImport(dependency: Export): string {
    if (!this.imports.has(dependency.name)) {
      throw new Error(
        `Cannot find the import: ${dependency}`
      );
    }

    // TODO correct import (something without the hardcoded "/instrumented/" stuff
    const _path = dependency.filePath.replace(process.cwd(), '')
    // TODO module imports etc

    if (dependency.default) {
      return `import ${dependency.name} from "${this.folder}${_path}";`;
    } else {
      return `import {${dependency.name}} from "${this.folder}${_path}";`;
    }
  }

  generateAssertions(testCase: JavaScriptTestCase): string[] {
    const assertions: string[] = [];
    if (testCase.assertions.size !== 0) {
      for (const variableName of testCase.assertions.keys()) {
        if (variableName === "error") {
          continue;
        }

        if (testCase.assertions.get(variableName) === "[object Object]") continue;

        if (variableName.includes("string")) {
          assertions.push(
            `\t\tassert.equal(${variableName}, "${testCase.assertions.get(
              variableName
            )}")`
          );
        } else {
          assertions.push(
            `\t\tassert.equal(${variableName}, ${testCase.assertions.get(
              variableName
            )})`
          );
        }
      }
    }

    return assertions;
  }
}
