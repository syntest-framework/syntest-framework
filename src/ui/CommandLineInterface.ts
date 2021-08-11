import { UserInterface } from "./UserInterface";
import * as cliProgress from "cli-progress";

export abstract class CommandLineInterface extends UserInterface {
  private progressBar;

  constructor(silent = false, verbose = false) {
    super(silent, verbose);
  }

  getProgressBar() {
    if (!this.progressBar) {
      this.progressBar = new cliProgress.SingleBar({
        format: "Budget used | {bar} | {percentage}% || Elapsed: {duration}s",
        barCompleteChar: "\u2588",
        barIncompleteChar: "\u2591",
        hideCursor: true,
      });
    }

    return this.progressBar;
  }
}
