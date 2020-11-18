import {GeneOptionManager} from "../..";
import {Individual} from "../..";

/**
 * Sampler class
 *
 * @author Dimitri Stallenberg
 */
export abstract class Sampler {
    protected geneOptionsObject: GeneOptionManager;
    /**
     * Constructor
     */
    protected constructor(geneOptionsObject: GeneOptionManager) {
        this.geneOptionsObject = geneOptionsObject
    }

    abstract sampleIndividual (): Individual

    /**
     * Should sample any gene based on the type
     * @param depth
     * @param type
     * @param geneType
     */
    abstract sampleGene (depth: number, type: string, geneType='primitive'): any
}
