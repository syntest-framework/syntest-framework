import { Decoder, Properties } from "@syntest/framework";
import { JavaScriptTestCase } from "../testcase/JavaScriptTestCase";
import * as path from "path";
import { ConstructorCall } from "../testcase/statements/root/ConstructorCall";
import { MethodCall } from "../testcase/statements/action/MethodCall";
import { Statement } from "../testcase/statements/Statement";
import { PrimitiveStatement } from "../testcase/statements/primitive/PrimitiveStatement";


export class JavaScriptDecoder implements Decoder<JavaScriptTestCase, string> {
  private imports: Map<string, string>;
  private contractDependencies: Map<string, string[]>;

  constructor(
    imports: Map<string, string>,
    contractDependencies: Map<string, string[]>
  ) {
    this.imports = imports;
    this.contractDependencies = contractDependencies;
  }

  decodeTestCase(testCases: JavaScriptTestCase | JavaScriptTestCase[], targetName: string, addLogs = false): string {
    if (testCases instanceof JavaScriptTestCase) {
      testCases = [testCases];
    }

    const tests: string[] = []
    const imports: string[] = []

    for (const testCase of testCases) {
      // The stopAfter variable makes sure that when one of the function calls has thrown an exception the test case ends there.
      let stopAfter = -1;
      if (testCase.assertions.size !== 0 && testCase.assertions.has("error")) {
        stopAfter = testCase.assertions.size;
      }

      const testString = [];
      const stack: Statement[] = this.convertToStatementStack(testCase);

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

      const importableGenes: ConstructorCall[] = [];

      const root = testCase.root;

      let primitiveStatements: string[] = [];
      const functionCalls: string[] = [];
      const assertions: string[] = [];

      let count = 1;
      while (stack.length) {
        const gene: Statement = stack.pop()!;

        if (gene instanceof ConstructorCall) {
          if (count === stopAfter) {
            // assertions.push(`\t\t${this.decodeErroringConstructorCall(gene)}`);
            if (Properties.test_minimization) break;
          }
          testString.push(`\t\t${(gene as ConstructorCall).decode()}`);
          importableGenes.push(<ConstructorCall>gene);
          count += 1;
        } else if (gene instanceof PrimitiveStatement) {
          primitiveStatements.push(`\t\t${gene.decode()}`);
        } else if (gene instanceof MethodCall) {
          if (count === stopAfter) {
            assertions.push(
              `\t\t${(gene as MethodCall).decodeErroring(root.varName)}`
            );
            if (Properties.test_minimization) break;
          }
          functionCalls.push(
            `\t\t${(gene as MethodCall).decodeWithObject(root.varName)}`
          );
          count += 1;
        } else {
          throw Error(`The type of gene ${gene} is not recognized`);
        }

        if (addLogs) {
          if (gene instanceof MethodCall) {
            functionCalls.push(
              `\t\tawait fs.writeFileSync('${path.join(
                Properties.temp_log_directory,
                testCase.id,
                gene.varName
              )}', '' + ${gene.varName})`
            );
          } else if (gene instanceof ConstructorCall) {
            testString.push(
              `\t\tawait fs.writeFileSync('${path.join(
                Properties.temp_log_directory,
                testCase.id,
                gene.varName
              )}', '' + ${gene.varName})`
            );
          }
        }
      }
      // filter non-required statements
      primitiveStatements = primitiveStatements.filter((s) => {
        const varName = s.split(" ")[1];
        return (
          functionCalls.find((f) => f.includes(varName)) ||
          assertions.find((f) => f.includes(varName))
        );
      });

      testString.push(...primitiveStatements);
      testString.push(...functionCalls);

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

  convertToStatementStack(testCase: JavaScriptTestCase): Statement[] {
    const stack: Statement[] = [];
    const queue: Statement[] = [testCase.root];
    while (queue.length) {
      const current: Statement = queue.splice(0, 1)[0];

      stack.push(current);

      for (const child of current.getChildren()) {
        queue.push(child);
      }
    }
    return stack;
  }

  gatherImports(importableGenes: ConstructorCall[]): string[] {
    const imports: string[] = [];

    for (const gene of importableGenes) {
      const importName = gene.constructorName;

      const importString: string = this.getImport(importName)

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

  getImport(dependency: string): string {
    if (!this.imports.has(dependency)) {
      throw new Error(
        `Cannot find the import: ${dependency}`
      );
    }

    // TODO module imports etc
    // TODO correct import
    return `import {${dependency}} from "../instrumented/${this.imports.get(dependency)}";`;
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