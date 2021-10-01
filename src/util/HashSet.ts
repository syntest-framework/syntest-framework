import { AbstractTestCase } from "../testcase/AbstractTestCase";
import { TestCaseDecoder } from "../testcase/decoder/TestCaseDecoder";

export class HashSet<T extends AbstractTestCase> extends Set<T> {
  private decoder: TestCaseDecoder;

  constructor(props: any, decoder: TestCaseDecoder) {
    super(props);
    this.decoder = decoder;
  }

  add(value: T): this {
    let found = false;
    this.forEach((item) => {
      if (item.hashCode(this.decoder) === value.hashCode(this.decoder)) {
        found = true;
      }
    });

    if (!found) {
      super.add(value);
    }

    return this;
  }
}
