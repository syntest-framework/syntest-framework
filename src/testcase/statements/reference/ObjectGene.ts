import {Sampler, Statement, StringGene} from "../../../index";
import {ReferenceStatement} from "../ReferenceStatement";

/**
 * @author Dimitri Stallenberg
 */
export class ObjectGene extends ReferenceStatement<{ [key: string]: Statement }> {

    constructor(type: string, uniqueId: string, value: { [key: string]: Statement }) {
        super(type, uniqueId, value)
    }

    mutate(sampler: Sampler, depth: number): ObjectGene {
        // TODO add child
        // TODO remove child
        // TODO replace child
        // TODO mutate child (highest probability)


        return this.copy()
    }

    copy (): ObjectGene {
        let deepCopyValues: { [key: string]: Statement } = {}

        Object.keys(this.value).forEach((key) => {
            deepCopyValues[key] = this.value[key].copy()
        })

        return new ObjectGene(this.type, this.id, deepCopyValues)
    }

    hasChildren (): boolean {
        return !!this.getChildren().length
    }

    getChildren (): Statement[] {
        return [...Object.values(this.value)]
    }

    static getRandom (): ReferenceStatement<any> {
        throw new Error('Unimplemented function!')
    }
}
