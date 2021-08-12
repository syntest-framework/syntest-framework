import { UserInterface } from "./UserInterface";
import { getLogger } from "../util/logger";
import * as cliProgress from "cli-progress";

const chalk = require("chalk");
const figlet = require("figlet");

export class CommandLineInterface extends UserInterface {
  protected showProgressBar: boolean;
  protected progressValue: number;
  protected budgetValue: number;
  protected bar: any;

  constructor(silent = false, verbose = false) {
    super(silent, verbose);
  }

  asciiArt(text: string): string {
    return chalk.yellow(figlet.textSync(text, { horizontalLayout: "full" }));
  }

  startProgressBar() {
    this.showProgressBar = true;

    this.bar = new cliProgress.SingleBar({
      format: "Coverage: {bar} {percentage}% | Remaining budget: {budget}%",
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      hideCursor: true,
      synchronousUpdate: false,
    });

    this.bar.start(200, this.progressValue, {
      budget: "100",
    });
  }

  updateProgressBar(value: number, budget: number) {
    this.progressValue = value;
    this.budgetValue = budget;

    this.bar.update(value, {
      budget: `${budget}`,
    });
  }

  stopProgressBar() {
    this.showProgressBar = false;
    this.bar.stop();
  }

  log(type: string, text: string) {
    getLogger()[type](text);
  }

  debug(text: string) {
    this.log("debug", text);
  }

  info(text: string) {
    this.log("info", text);
  }

  error(text: string) {
    this.log("error", text);
  }

  report(text: string, args: any[]): void {
    this.info(`${text}: ${args.join(", ")}`);
  }
}
