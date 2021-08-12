import { AbstractTestCase } from "../AbstractTestCase";
import { Statement } from "../statements/Statement";

/**
 * TestCaseDecoder interface.
 *
 * @author Dimitri Stallenberg
 * @author Mitchell Olsthoorn
 */
export interface TestCaseDecoder {
  /**
   * Creates a string version of a test case.
   *
   * @param testCase             the testCase to decode
   * @param addLogs              whether to add log statements in the test case
   * @param additionalAssertions a dictionary of additional assertions to put in the test case
   * @param targetName           the name of the target, used to create informative test cases
   * @return                     the decoded test case
   */
  decodeTestCase(
    testCase: AbstractTestCase | AbstractTestCase[],
    targetName: string,
    addLogs?: boolean,
    additionalAssertions?: Map<AbstractTestCase, { [p: string]: string }>
  ): string;

  /**
   * Creates a string version of any type of statement.
   *
   * @param statement the statement to decode
   * @return          the decoded statement
   */
  decodeStatement(statement: Statement): string;
}
