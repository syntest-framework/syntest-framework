import { SecondaryObjectiveComparator } from "./SecondaryObjectiveComparator";
import { TestCase } from "../../../testcase/TestCase";

export class LengthObjectiveComparator
  implements SecondaryObjectiveComparator<TestCase> {
  compare(testCase1: TestCase, testCase2: TestCase): number {
    if (testCase1 === null) {
      return 1;
    }
  }
}
