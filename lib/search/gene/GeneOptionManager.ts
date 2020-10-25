
/**
 * @author Dimitri Stallenberg
 */
export abstract class GeneOptionManager {
    get possibleActions(): FunctionDescription[] {
        if (!this._possibleActions) {
            this._possibleActions = this.getPossibleActionsFromAPI()
        }

        return this._possibleActions;
    }
    private _possibleActions: FunctionDescription[];
    /**
     * Constructor
     */
    constructor() {
    }

    abstract getConstructorName (): string

    /**
     * This function will find all the possible function calls and their argument types.
     *
     * @returns {[]} A list of function call descriptions
     */
    abstract getPossibleActionsFromAPI (): FunctionDescription[]
}

export interface ArgumentDescription {
    type: string,
    bits?: number,
    decimals?: number
}

export interface FunctionDescription {
    name: string,
    type: string,
    args: ArgumentDescription[],
}