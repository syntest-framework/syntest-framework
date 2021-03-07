import {getProperty} from "../../config";
import {COMIX, Fitness, GeneticAlgorithm, MOSA, MultiGA, NSGA2, Sampler, SimpleGA, Target} from "../..";

/**
 *
 * @author Dimitri Stallenberg
 */
export function createAlgorithmFromConfig(target: Target | Target[], fitnessObject: Fitness, sampler: Sampler) {
    const singleAlgoritms: { [key: string]: { new(...args: any[]): GeneticAlgorithm } } = {
        SimpleGA: SimpleGA,
        NSGA2: NSGA2,
        MOSA: MOSA
    }

    const multiAlgorithms: { [key: string]: { new(...args: any[]): MultiGA<any> } } = {
        COMIX: COMIX
    }

    const algorithm = getProperty("algorithm")

    if (algorithm in singleAlgoritms) {
        if (target instanceof Array) {
            throw new Error(`Cannot use multiple target for the single target algorithms.`)
        }

        return new singleAlgoritms[algorithm](target, fitnessObject, sampler)
    } else if (algorithm in multiAlgorithms) {
        if (target instanceof Target) {
            throw new Error(`Cannot use single target for the multi target algorithms.`)
        }

        const subAlgorithm = getProperty("subAlgorithm")
        if (!(subAlgorithm in singleAlgoritms)) {
            throw new Error(`${subAlgorithm} is not a valid sub-algorithm. (Multi-algorithms cannot use other multi-algorithms as sub-algorithms)`)
        }

        return new multiAlgorithms[algorithm](target, fitnessObject, sampler, singleAlgoritms[subAlgorithm])
    } else {
        throw new Error(`${algorithm} is not a valid algorithm.`)

    }
}
