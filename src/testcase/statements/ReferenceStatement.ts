import {Statement} from "./Statement";
import {Sampler} from "../../index";

/**
 * @author Dimitri Stallenberg
 */
export abstract class ReferenceStatement<T> extends Statement {
    get value(): T {
        return this._value;
    }
    private _value: any;

    constructor(type: string, uniqueId: string, value: T) {
        super(type, uniqueId)
        this._value = value
    }

    abstract mutate(sampler: Sampler, depth: number): ReferenceStatement<T>

    abstract copy (): ReferenceStatement<T>

    hasChildren (): boolean {
        return false
    }

    getChildren (): Statement[] {
        return []
    }

    static getRandom (): ReferenceStatement<any> {
        throw new Error('Unimplemented function!')
    }
}
