import { PrimitiveStatement } from "../PrimitiveStatement";

import { getProperty, prng, Sampler } from "../../../index";
import BigNumber from "bignumber.js";

/**
 * Generic number class
 *
 * Uses BigNumber to allow for numbers larger than allowed by javascript.
 *
 * Documentation on BigNumber:
 * https://www.npmjs.com/package/bignumber.js
 *
 * @author Dimitri Stallenberg
 */
export class NumericStatement extends PrimitiveStatement<BigNumber> {
  private decimals: number;
  private max_value: number;
  private signed: boolean;

  constructor(
    type: string,
    uniqueId: string,
    value: BigNumber,
    decimals = 0,
    max_value: number = Number.MAX_SAFE_INTEGER,
    signed = true
  ) {
    super(type, uniqueId, value);
    this.decimals = decimals;
    this.max_value = max_value;
    this.signed = signed;
  }

  mutate(sampler: Sampler, depth: number): NumericStatement {
    if (prng.nextBoolean(getProperty("resample_gene_probability"))) {
      // let's generate a random number with the same characteristics (upper an
      return NumericStatement.getRandom(
        this.type,
        this.decimals,
        this.max_value,
        this.signed
      );
    }

    if (prng.nextBoolean(getProperty("delta_mutation_probability"))) {
      return this.deltaMutation();
    }

    const max = this.max_value;
    const min = this.signed ? -max : 0;

    // TODO: Maybe we need to generate small numbers
    const newValue = prng.nextDouble(min, max);

    return new NumericStatement(
      this.type,
      this.id,
      new BigNumber(newValue),
      this.decimals,
      this.max_value,
      this.signed
    );
  }

  deltaMutation() {
    // small mutation
    const change = prng.nextGaussian(0, 3);

    let newValue = this.value.plus(change);

    // If illegal values are not allowed we make sure the value does not exceed the specified bounds
    if (!getProperty("explore_illegal_values")) {
      const max = this.max_value;
      const min = this.signed ? -max : 0;

      if (newValue.isGreaterThan(max)) {
        newValue = new BigNumber(max);
      } else if (newValue.isLessThan(min)) {
        newValue = new BigNumber(min);
      }
    }

    return new NumericStatement(
      this.type,
      this.id,
      newValue,
      this.decimals,
      this.max_value,
      this.signed
    );
  }

  copy() {
    return new NumericStatement(
      this.type,
      this.id,
      new BigNumber(this.value),
      this.decimals,
      this.max_value,
      this.signed
    );
  }

  static getRandom(
    type = "number",
    decimals = getProperty("numeric_decimals"),
    max_value = getProperty("numeric_max_value"),
    signed = getProperty("numeric_signed")
  ) {
    // by default we create small numbers (do we need very large numbers?)
    const max = Math.min(max_value, Math.pow(2, 11) - 1);
    const min = signed ? -max : 0;

    return new NumericStatement(
      type,
      prng.uniqueId(),
      new BigNumber(prng.nextDouble(min, max)),
      decimals,
      max_value,
      signed
    );
  }

  /**
   * Make sure that whenever the value is used it is the wanted precision.
   */
  get value(): BigNumber {
    return super.value.decimalPlaces(this.decimals);
  }
}
