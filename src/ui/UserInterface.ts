

export abstract class UserInterface {
    get silent(): boolean {
        return this._silent;
    }

    set silent(value: boolean) {
        this._silent = value;
    }
    get verbose(): boolean {
        return this._verbose;
    }

    set verbose(value: boolean) {
        this._verbose = value;
    }
    private _silent: boolean;
    private _verbose: boolean;

    constructor(silent = false, verbose = false) {
        this._silent = silent;
        this._verbose = verbose;
    }

    abstract report(text: string, args: any[]): void

    abstract getProgressBar()

}

let userInterface: UserInterface

export function getUserInterface(): UserInterface {
    if (!userInterface) {
        throw new Error('The UserInterface has not been set yet!')
    }

    return userInterface
}

export function setUserInterface(ui: UserInterface) {
    userInterface = ui
}
