import { PrimitiveStatement } from "../PrimitiveStatement";

import { getProperty, prng, Sampler } from "../../../index";

/**
 * @author Dimitri Stallenberg
 */
export class Bool extends PrimitiveStatement<boolean> {
  constructor(type: string, uniqueId: string, value: boolean) {
    super(type, uniqueId, value);
  }

  mutate(sampler: Sampler, depth: number) {
    if (prng.nextBoolean(getProperty("resample_gene_probability"))) {
      return Bool.getRandom();
    }

    return new Bool(this.type, this.id, !this.value);
  }

  copy() {
    return new Bool(this.type, this.id, this.value);
  }

  static getRandom(type = "bool") {
    return new Bool(type, prng.uniqueId(), prng.nextBoolean());
  }
}
