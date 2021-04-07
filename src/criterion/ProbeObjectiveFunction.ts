import {Encoding} from "../search/Encoding";
import {BranchObjectiveFunction} from "./BranchObjectiveFunction";
import {SearchSubject} from "../search/SearchSubject";

/**
 *
 */
export abstract class ProbeObjectiveFunction<T extends Encoding> extends BranchObjectiveFunction<T> {
    protected _probeType: string;

    protected constructor(subject: SearchSubject<T>,
                          id: string,
                          line: number,
                          locationIdx: number,
                          type: boolean) {

        super(subject, id, line, locationIdx, type);
    }

    get probeType(): string {
        return this._probeType;
    }

    abstract calculateDistance(encoding: T): number;

}
