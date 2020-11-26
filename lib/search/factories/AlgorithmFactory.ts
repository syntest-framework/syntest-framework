import {getSetting} from "../../Config";
import {NSGA2} from "../optimizer/NSGA2";
import {SimpleGA} from "../optimizer/SimpleGA";
import {MOSA} from "../optimizer/MOSA";
import {Fitness} from "../objective/Fitness";
import {GeneOptionManager} from "../gene/GeneOptionManager";
import {Sampler} from "../sampling/Sampler";


export function createAlgorithmFromConfig(FitnessObject: Fitness, GeneOptionsObject: GeneOptionManager, Sampler: Sampler) {
    const algorithm = getSetting("algorithm")

    if (algorithm === 'SimpleGA') {
        return new SimpleGA(FitnessObject, GeneOptionsObject, Sampler)
    } else if (algorithm === 'NSGA2') {
        return new NSGA2(FitnessObject, GeneOptionsObject, Sampler)
    } else if (algorithm === 'MOSA') {
        return new MOSA(FitnessObject, GeneOptionsObject, Sampler)
    }

    throw new Error(`${algorithm} is not a valid algorithm.`)
}