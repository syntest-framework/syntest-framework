import {Gene} from "./Gene";
import {Sampler} from "../sampling/Sampler";

/**
 * @author Dimitri Stallenberg
 */
export abstract class PrimitiveGene extends Gene {
    set value(value: any) {
        this._value = value;
    }
    get value(): any {
        return this._value;
    }
    private _value: any;

    protected constructor(name: string, type: string, uniqueId: string, value: any) {
        super(name, type, uniqueId)
        this._value = value
    }

    abstract mutate(sampler: Sampler, depth: number): PrimitiveGene

    abstract copy (): PrimitiveGene

    hasChildren (): boolean {
        return false
    }

    getChildren (): Gene[] {
        return []
    }

    static getRandom (): PrimitiveGene {
        throw new Error('Unimplemented function!')
    }

    getValue () {
        return this._value
    }
}

