import {prng} from '../..'
import {ActionGene} from "./ActionGene";
import {Sampler} from "../sampling/Sampler";
import {logger} from "../..";
import {Stringifier} from "../..";
import {Objective} from "../..";
import {Evaluation} from "../objective/Evaluation";

/**
 * Individual class
 *
 * @author Dimitri Stallenberg
 */
export class Individual {
    get root(): ActionGene {
        return this._root;
    }

    private _root: ActionGene;

    private evaluation: Evaluation;
    private crowdingDistance: number;
    private rank: number;
    private id: string;

    /**
     * Constructor
     * @param root the root of the tree chromosome of the individual
     */
    constructor(root: ActionGene) {
        this._root = root

        this.evaluation = new Evaluation()
        this.crowdingDistance = 0
        this.rank = 0
        this.id = prng.uniqueId(20)
        logger.debug(`Created individual: ${this.id}`)
    }

    mutate (sampler: Sampler) {
        logger.debug(`Mutating individual: ${this.id}`)
        return new Individual(this._root.mutate(sampler, 0))
    }

    hashCode (stringifier: Stringifier): number {
        let string = stringifier.stringifyIndividual(this)
        let hash = 0;
        for (let i = 0; i < string.length; i++) {
            let character = string.charCodeAt(i);
            hash = ((hash<<5)-hash)+character;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    setEvaluation (evaluation: any) {
        this.evaluation = evaluation
    }

    getEvaluation (): Evaluation {
        return this.evaluation
    }

    getId (): string {
        return this.id
    }

    getCrowdingDistance(){
        return this.crowdingDistance
    }

    setCrowdingDistance(value: number){
        this.crowdingDistance = value
    }

    setRank(value: number){
        this.rank = value
    }

    getRank(){
        return this.rank
    }
}
