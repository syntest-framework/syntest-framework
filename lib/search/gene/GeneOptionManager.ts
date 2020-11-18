
/**
 * @author Dimitri Stallenberg
 */
export abstract class GeneOptionManager {
    get possibleActions(): ActionDescription[] {
        if (!this._possibleActions) {
            this._possibleActions = this.getPossibleActions()
        }

        return this._possibleActions;
    }
    private _possibleActions: ActionDescription[];
    /**
     * Constructor
     */
    constructor() {}

    abstract getConstructorName (): string

    /**
     * This function will find all the possible function calls and their argument types.
     *
     * @returns {[]} A list of function call descriptions
     */
    abstract getPossibleActions (): ActionDescription[]
}

export interface ActionDescription {
    name: string
    type: string
}

