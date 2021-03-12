import { Statement } from "../Statement";
import { ActionStatement } from "../ActionStatement";
import { TestCaseSampler } from "../../sampling/TestCaseSampler";
import { getProperty } from "../../../config";
import { prng } from "../../../util/prng";

/**
 * @author Dimitri Stallenberg
 */
export class FunctionCall extends ActionStatement {
  get functionName(): string {
    return this._functionName;
  }

  private _functionName: string;

  /**
   * Constructor
   * @param type the return type of the function
   * @param uniqueId id of the gene
   * @param functionName the name of the function
   * @param args the arguments of the function
   */
  constructor(
    type: string,
    uniqueId: string,
    functionName: string,
    args: Statement[]
  ) {
    super(type, uniqueId, [...args]);
    this._functionName = functionName;
  }

  mutate(sampler: TestCaseSampler, depth: number) {
    if (prng.nextBoolean(getProperty("resample_gene_probability"))) {
      // resample the gene
      return sampler.sampleStatement(depth, this.type, "functionCall");
    } else if (!this.args.length) {
      return this.copy();
    } else {
      // randomly mutate one of the args
      const args = [...this.args.map((a: Statement) => a.copy())];
      const index = prng.nextInt(0, args.length - 1);
      args[index] = args[index].mutate(sampler, depth + 1);

      return new FunctionCall(this.type, this.id, this.functionName, args);
    }
  }

  copy() {
    const deepCopyArgs = [...this.args.map((a: Statement) => a.copy())];

    return new FunctionCall(
      this.type,
      this.id,
      this.functionName,
      deepCopyArgs
    );
  }

  hasChildren(): boolean {
    return !!this.args.length;
  }

  getChildren(): Statement[] {
    return [...this.args];
  }
}
