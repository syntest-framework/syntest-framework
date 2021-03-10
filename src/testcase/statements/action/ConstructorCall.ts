import { Statement } from "../Statement";
import { ActionStatement } from "../ActionStatement";

import { getProperty, prng, Sampler } from "../../../index";

/**
 * @author Dimitri Stallenberg
 */
export class ConstructorCall extends ActionStatement {
  get constructorName(): string {
    return this._constructorName;
  }

  private _constructorName: string;

  /**
   * Constructor
   * @param type the return type of the function
   * @param uniqueId optional argument
   * @param constructorName the name of the function
   * @param args the arguments of the function
   */
  constructor(
    type: string,
    uniqueId: string,
    constructorName: string,
    args: Statement[]
  ) {
    super(type, uniqueId, args);
    this._constructorName = constructorName;
  }

  mutate(sampler: Sampler, depth: number) {
    //if (prng.nextBoolean(getProperty("resample_gene_probability"))) {
    // resample the gene
    //    return sampler.sampleGene(depth, this.type, 'constructor')
    //} else {
    // randomly mutate one of the args
    if (this.args.length > 0) {
      const args = [...this.args.map((a: Statement) => a.copy())];
      const index = prng.nextInt(0, args.length - 1);
      args[index] = args[index].mutate(sampler, depth + 1);
    }
    // mutate one of its offspring
    const children = [...this.getChildren().map((a: Statement) => a.copy())];
    const index = prng.nextInt(0, children.length - 1);
    this.setChild(index, children[index].mutate(sampler, depth + 1));
    return this;
    //}
  }

  copy() {
    const deepCopyArgs = [...this.args.map((a: Statement) => a.copy())];
    return new ConstructorCall(
      this.type,
      this.id,
      this.constructorName,
      deepCopyArgs
    );
  }
}
