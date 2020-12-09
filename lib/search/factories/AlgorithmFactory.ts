import {getProperty} from "../../config";
import {NSGA2} from "../..";
import {SimpleGA} from "../..";
import {MOSA} from "../optimizer/MOSA";
import {Fitness} from "../..";
import {GeneOptionManager} from "../..";
import {Sampler} from "../..";

/**
 *
 * @author Dimitri Stallenberg
 */
export function createAlgorithmFromConfig(FitnessObject: Fitness, GeneOptionsObject: GeneOptionManager, Sampler: Sampler) {
    const algorithm = getProperty("algorithm")

    if (algorithm === 'SimpleGA') {
        return new SimpleGA(FitnessObject, GeneOptionsObject, Sampler)
    } else if (algorithm === 'NSGA2') {
        return new NSGA2(FitnessObject, GeneOptionsObject, Sampler)
    } else if (algorithm === 'MOSA') {
        return new MOSA(FitnessObject, GeneOptionsObject, Sampler)
    }

    throw new Error(`${algorithm} is not a valid algorithm.`)
}