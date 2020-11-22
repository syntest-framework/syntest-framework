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

    abstract sampleArgument (depth: number, type: string): any
    abstract sampleConstructor (depth: number): any
    abstract sampleVariable (depth: number, type: string): any
    abstract sampleFunctionCall (depth: number, type: string): any
}
