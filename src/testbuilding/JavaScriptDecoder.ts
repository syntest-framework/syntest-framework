import { Statement, TestCaseDecoder } from "@syntest/framework";
import { JavaScriptTestCase } from "../testcase/JavaScriptTestCase";


export class JavaScriptDecoder implements TestCaseDecoder {
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

  decodeTestCase(testCase: JavaScriptTestCase | JavaScriptTestCase[], targetName: string, addLogs = false): string {
    return "";
  }

}