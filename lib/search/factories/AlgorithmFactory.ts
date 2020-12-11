import {getProperty} from "../../config";
import {GA, NSGA2} from "../..";
import {SimpleGA} from "../..";
import {MOSA} from "../..";
import {Fitness} from "../..";
import {GeneOptionManager} from "../..";
import {Sampler} from "../..";
import {MultiGA} from "../..";
import {COMIX} from "../..";

/**
 *
 * @author Dimitri Stallenberg
 */
export function createAlgorithmFromConfig(fitnessObject: Fitness, geneOptionsObject: GeneOptionManager, sampler: Sampler) {
    const singleAlgoritms: {[key: string]: { new(...args: any[]): GA }} = {
        SimpleGA: SimpleGA,
        NSGA2: NSGA2,
        MOSA: MOSA
    }

    const multiAlgorithms: {[key: string]: { new(...args: any[]): MultiGA<any> }} = {
        COMIX: COMIX
    }

    const algorithm = getProperty("algorithm")

    if (algorithm in singleAlgoritms) {
        return new singleAlgoritms[algorithm](fitnessObject, geneOptionsObject, sampler)
    } else if (algorithm in multiAlgorithms){
        const subAlgorithm = getProperty("subAlgorithm")
        if (!(subAlgorithm in singleAlgoritms)) {
            throw new Error(`${subAlgorithm} is not a valid sub-algorithm. (Multi-algorithms cannot use other multi-algorithms as sub-algorithms)`)
        }

        return new multiAlgorithms[algorithm](fitnessObject, geneOptionsObject, sampler, singleAlgoritms[subAlgorithm])
    } else {
        throw new Error(`${algorithm} is not a valid algorithm.`)

    }
}
