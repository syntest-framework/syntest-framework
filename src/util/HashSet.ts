import {TestCaseChromosome} from "..";
import {Stringifier} from "..";


export class HashSet<T extends TestCaseChromosome> extends Set<T> {

    private stringifier: Stringifier

    constructor(props: any, stringifier: Stringifier) {
        super(props);
        this.stringifier = stringifier
    }


    add(value: T): this {
        let found = false;
        this.forEach(item => {
            if (item.hashCode(this.stringifier) === value.hashCode(this.stringifier)) {
                found = true;
            }
        });

        if (!found) {
            super.add(value);
        }

        return this;
    }
}
