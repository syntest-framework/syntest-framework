import { EncodingSampler } from "../../search/EncodingSampler";
import { AbstractTestCase } from "../AbstractTestCase";
import { Parameter } from "../../graph/parsing/Parameter";

/**
 * @author Dimitri Stallenberg
 */
export abstract class Statement {
  public get varNames(): string[] {
    return this._varNames;
  }
  public get id(): string {
    return this._uniqueId;
  }
  public get types(): Parameter[] {
    return this._types;
  }

  private _varNames: string[];
  private _types: Parameter[];
  private _uniqueId: string;

  /**
   * Constructor
   * @param types
   * @param uniqueId
   */
  protected constructor(types: Parameter[], uniqueId: string) {
    this._types = types;
    this._uniqueId = uniqueId;
    this._varNames = types.map(
      (x) => {
        return x.name + uniqueId
      }
    );
  }

  /**
   * Mutates the gene
   * @param sampler   the sampler object that is being used
   * @param depth     the depth of the gene in the gene tree
   * @return          the mutated copy of the gene
   */
  abstract mutate(
    sampler: EncodingSampler<AbstractTestCase>,
    depth: number
  ): Statement;

  /**
   * Creates an exact copy of the current gene
   * @return  the copy of the gene
   */
  abstract copy(): Statement;

  /**
   * Checks whether the gene has children
   * @return  whether the gene has children
   */
  abstract hasChildren(): boolean;

  /**
   * Gets all children of the gene
   * @return  The set of children of this gene
   */
  abstract getChildren(): Statement[];
}
