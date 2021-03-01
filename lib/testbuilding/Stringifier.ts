import {Gene} from "..";
import {Individual} from "..";

/**
 * Stringifier interface
 *
 * @author Dimitri Stallenberg
 */
export interface Stringifier {

    /**
     * Creates a string version of an individual
     * @param individual            the individual to stringify
     * @param addLogs               whether to add log statements in the individual
     * @param additionalAssertions  a dictionary of additional assertions to put in the individual
     * @param targetName            the name of the target, used to create informative test cases
     * @return                      the stringified individual
     */
    // @ts-ignore
    stringifyIndividual(individual: Individual | Individual[], targetName: string, addLogs?: boolean, additionalAssertions?: Map<Individual, { [p: string]: string }>): string

    /**
     * Creates a string version of any type of gene
     * @param gene      the gene to stringify
     * @return          the stringified gene
     */
    stringifyGene(gene: Gene): string

}
