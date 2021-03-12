import { PrimitiveStatement } from "../PrimitiveStatement";
import { TestCaseSampler } from "../../TestCaseSampler";
import { prng } from "../../../util/prng";
import { getProperty } from "../../../config";

/**
 * @author Dimitri Stallenberg
 */
export class BoolStatement extends PrimitiveStatement<boolean> {
  constructor(type: string, uniqueId: string, value: boolean) {
    super(type, uniqueId, value);
  }

  mutate(sampler: TestCaseSampler, depth: number) {
    if (prng.nextBoolean(getProperty("resample_gene_probability"))) {
      return BoolStatement.getRandom();
    }

    return new BoolStatement(this.type, this.id, !this.value);
  }

  copy() {
    return new BoolStatement(this.type, this.id, this.value);
  }

  static getRandom(type = "bool") {
    return new BoolStatement(type, prng.uniqueId(), prng.nextBoolean());
  }
}
