import { Statement, TestCaseDecoder } from "@syntest/framework";
import { JavaScriptTestCase } from "../testcase/JavaScriptTestCase";


export class JavaScriptDecoder implements TestCaseDecoder {
  decodeStatement(statement: Statement): string {
    return "";
  }

  decodeTestCase(testCase: JavaScriptTestCase | JavaScriptTestCase[], targetName: string, addLogs = false): string {
    return "";
  }

}