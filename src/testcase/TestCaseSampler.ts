import { Target, TestCase } from "../index";

/**
 * TestCaseSampler class
 *
 * @author Dimitri Stallenberg
 */
export abstract class TestCaseSampler {
  get target(): Target {
    return this._target;
  }

  set target(value: Target) {
    this._target = value;
  }

  private _target: Target;

  /**
   * Constructor
   * @param target     the target
   */
  protected constructor(target: Target) {
    this._target = target;
  }

  /**
   * Should sample an individual
   * @return  a sampled individual
   */
  abstract sampleIndividual(): TestCase;

  /**
   * Should sample any gene based on the type
   * @param depth     the current depth of the gene tree
   * @param type      the return type of the gene to sample
   * @param geneType  the type of the gene
   * @return          a sampled gene
   */
  abstract sampleGene(depth: number, type: string, geneType: string): any;
}
