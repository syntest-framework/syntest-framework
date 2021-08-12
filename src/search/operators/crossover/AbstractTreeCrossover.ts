import { AbstractTestCase } from "../../..";

/**
 * Creates 2 children swapping statements between the two parents
 * @param parentA the first parent individual
 * @param parentB the second parent individual
 *
 * @return a tuple of 2 children
 *
 * @author Annibale Panichella
 */
export abstract class AbstractTreeCrossover {

  public abstract crossOver(
    parentA: AbstractTestCase,
    parentB: AbstractTestCase
  ): AbstractTestCase[];

}


