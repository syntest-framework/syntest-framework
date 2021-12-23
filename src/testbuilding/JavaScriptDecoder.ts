import { Decoder, PrimitiveStatement, Properties } from "@syntest/framework";
import { JavaScriptTestCase } from "../testcase/JavaScriptTestCase";
import * as path from "path";
import { ConstructorCall } from "../testcase/statements/root/ConstructorCall";
import { MethodCall } from "../testcase/statements/action/MethodCall";
import { Statement } from "../testcase/statements/Statement";


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

  decodeStatement(statement: Statement): string {
    return "";
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
      stack.push(root);

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
          primitiveStatements.push(`\t\t${this.decodeStatement(gene)}`);
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


    }

    return "";
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
}