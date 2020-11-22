import {Gene} from "./Gene";
import {Sampler} from "../..";

/**
 * @author Dimitri Stallenberg
 */
export abstract class PrimitiveGene<T> extends Gene {
    get value(): T {
        return this._value;
    }
    private _value: any;

    constructor(name: string, type: string, uniqueId: string, value: T) {
        super(name, type, uniqueId)
        this._value = value
    }

    abstract mutate(sampler: Sampler, depth: number): PrimitiveGene<T>

    abstract copy (): PrimitiveGene<T>

    hasChildren (): boolean {
        return false
    }

    getChildren (): Gene[] {
        return []
    }

    static getRandom (): Gene {
        throw new Error('Unimplemented function!')
    }
}

