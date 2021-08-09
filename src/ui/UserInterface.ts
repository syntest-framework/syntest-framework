export abstract class UserInterface {
  protected silent: boolean;
  protected verbose: boolean;

  constructor(silent = false, verbose = false) {
    this.silent = silent;
    this.verbose = verbose;
  }

  abstract report(text: string, args: any[]): void;

  abstract log(type: string, text: string);

  abstract debug(text: string);

  abstract info(text: string);

  abstract error(text: string);

  abstract startProgressBar();

  abstract updateProgressBar(value: number, budget: number);

  abstract stopProgressBar();
}

let userInterface: UserInterface;

export function getUserInterface(): UserInterface {
  if (!userInterface) {
    throw new Error("The UserInterface has not been set yet!");
  }

  return userInterface;
}

export function setUserInterface(ui: UserInterface) {
  userInterface = ui;
}
