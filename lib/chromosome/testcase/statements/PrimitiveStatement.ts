import {Statement} from "./Statement";
import {Sampler} from "../../../index";

/**
 * @author Dimitri Stallenberg
 */
export abstract class PrimitiveStatement<T> extends Statement {
    get value(): T {
        return this._value;
    }
    private _value: any;

    constructor(name: string, type: string, uniqueId: string, value: T) {
        super(name, type, uniqueId)
        this._value = value
    }

    abstract mutate(sampler: Sampler, depth: number): PrimitiveStatement<T>

    abstract copy (): PrimitiveStatement<T>

    hasChildren (): boolean {
        return false
    }

    getChildren (): Statement[] {
        return []
    }

    static getRandom (): PrimitiveStatement<any> {
        throw new Error('Unimplemented function!')
    }
}
