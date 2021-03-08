import {Sampler, Statement} from "../../../index";
import {ReferenceStatement} from "../ReferenceStatement";

/**
 * @author Dimitri Stallenberg
 */
export class ArrayGene extends ReferenceStatement<Statement[]> {

    constructor(type: string, uniqueId: string, value: Statement[]) {
        super(type, uniqueId, value)
    }

    mutate(sampler: Sampler, depth: number): ArrayGene {
        // TODO add child
        // TODO remove child
        // TODO replace child
        // TODO mutate child (highest probability)


        return this.copy()
    }

    copy (): ArrayGene {
        let deepCopyValues = [...this.value.map((a: Statement) => a.copy())]

        return new ArrayGene(this.type, this.id, deepCopyValues)
    }

    hasChildren (): boolean {
        return !!this.getChildren().length
    }

    getChildren (): Statement[] {
        return [...this.value]
    }

    static getRandom (): ReferenceStatement<any> {
        throw new Error('Unimplemented function!')
    }
}
