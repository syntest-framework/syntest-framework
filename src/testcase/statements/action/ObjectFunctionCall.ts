import { Statement } from "../Statement";
import { ActionStatement } from "../ActionStatement";
import { Constructor } from "./Constructor";
import { getProperty, prng, Sampler } from "../../../index";

/**
 * @author Dimitri Stallenberg
 */
export class ObjectFunctionCall extends ActionStatement {
  get functionName(): string {
    return this._functionName;
  }

  private _functionName: string;

  /**
   * Constructor
   * @param type the return type of the function
   * @param uniqueId id of the gene
   * @param instance the object to call the function on
   * @param functionName the name of the function
   * @param args the arguments of the function
   */
  constructor(
    type: string,
    uniqueId: string,
    instance: Constructor,
    functionName: string,
    args: Statement[]
  ) {
    super(type, uniqueId, [instance, ...args]);
    this._functionName = functionName;
  }

  mutate(sampler: Sampler, depth: number) {
    if (prng.nextBoolean(getProperty("resample_gene_probability"))) {
      // resample the gene
      return sampler.sampleGene(depth, this.type, "functionCall");
    } else if (!this.args.length) {
      return this.copy();
    } else {
      // randomly mutate one of the args (including the instance)
      const args = [...this.args.map((a: Statement) => a.copy())];
      const index = prng.nextInt(0, args.length - 1);
      args[index] = args[index].mutate(sampler, depth + 1);
      const instance = args.shift() as Constructor;
      return new ObjectFunctionCall(
        this.type,
        this.id,
        instance,
        this.functionName,
        args
      );
    }
  }

  copy() {
    const deepCopyArgs = [...this.args.map((a: Statement) => a.copy())];
    const instance = deepCopyArgs.shift() as Constructor;

    return new ObjectFunctionCall(
      this.type,
      this.id,
      instance,
      this.functionName,
      deepCopyArgs
    );
  }

  hasChildren(): boolean {
    // since every object function call has an instance there must be atleast one child
    return true;
  }

  getChildren(): Statement[] {
    return [...this.args];
  }
}
