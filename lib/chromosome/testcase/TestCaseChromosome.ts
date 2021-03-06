import {prng} from '../../index'
import {ActionStatement} from "./statements/ActionStatement";
import {Sampler} from "../../index";
import {getLogger} from "../../index";
import {Stringifier} from "../../index";
import {Evaluation} from "../../search/objective/Evaluation";

/**
 * TestCaseChromosome class
 *
 * @author Dimitri Stallenberg
 */
export class TestCaseChromosome {
    get id(): string {
        return this._id;
    }
    get root(): ActionStatement {
        return this._root;
    }

    private _root: ActionStatement;

    private evaluation: Evaluation;
    private crowdingDistance: number;
    private rank: number;
    private _id: string;

    /**
     * Constructor
     * @param root the root of the tree chromosome of the individual
     * @param evaluation
     */
    constructor(root: ActionStatement) {
        this._root = root

        this.evaluation = new Evaluation()
        this.crowdingDistance = 0
        this.rank = 0
        this._id = prng.uniqueId(20)
        getLogger().debug(`Created individual: ${this._id}`)
    }

    mutate (sampler: Sampler) {
        getLogger().debug(`Mutating individual: ${this._id}`)
        return new TestCaseChromosome(this._root.mutate(sampler, 0))
    }

    hashCode (stringifier: Stringifier): number {
        let string = stringifier.stringifyIndividual(this, `${this.id}`)
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
