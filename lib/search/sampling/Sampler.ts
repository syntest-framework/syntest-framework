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
     * @param geneOptionsObject     the gene option manager
     */
    protected constructor(geneOptionsObject: GeneOptionManager) {
        this.geneOptionsObject = geneOptionsObject
    }

    /**
     * Should sample an individual
     * @return  a sampled individual
     */
    abstract sampleIndividual (): Individual

    /**
     * Should sample any gene based on the type
     * @param depth     the current depth of the gene tree
     * @param type      the return type of the gene to sample
     * @param geneType  the type of the gene
     * @return          a sampled gene
     */
    abstract sampleGene (depth: number, type: string, geneType='primitive'): any
}
