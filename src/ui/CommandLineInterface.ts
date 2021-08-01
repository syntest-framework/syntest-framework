import { UserInterface } from "./UserInterface";
import {getLogger} from "../util/logger";
import * as cliProgress from "cli-progress";

const chalk = require("chalk");
const figlet = require("figlet");


export abstract class CommandLineInterface extends UserInterface {
  private _showProgressBar: boolean;
  private _progressValue: number
  private _budgetValue: number
  private bar: any

  constructor(silent = false, verbose = false) {
    super(silent, verbose);
  }

  asciiArt (text: string): string {
    return chalk.yellow(
        figlet.textSync(text, { horizontalLayout: 'full' })
    )
  }

  startProgressBar() {
    this._showProgressBar = true

    this.bar = new cliProgress.SingleBar({
      format: "Coverage: {bar} {percentage}% | Remaining budget: {budget}%",
      barCompleteChar: "\u2588",
      barIncompleteChar: "\u2591",
      hideCursor: true,
      synchronousUpdate: false
    });

    this.bar.start(200, this.progressValue, {
      budget: '100'
    })
  }

  updateProgressBar(value: number, budget: number) {
    this._progressValue = value
    this._budgetValue = budget

    this.bar.update(value, {
      budget: `${budget}`
    })
  }

  stopProgressBar() {
    this._showProgressBar = false
    this.bar.stop();
  }

  log(type: string, text: string) {
    getLogger()[type](text)
  }

  debug(text: string) {
    this.log('debug', text)
  }

  info(text: string) {
    this.log('info', text)
  }

  error(text: string) {
    this.log('error', text)
  }

  get showProgressBar(): boolean {
    return this._showProgressBar;
  }

  set showProgressBar(value: boolean) {
    this._showProgressBar = value;
  }

  get progressValue(): number {
    return this._progressValue;
  }

  set progressValue(value: number) {
    this._progressValue = value;
  }


  get budgetValue(): number {
    return this._budgetValue;
  }

  set budgetValue(value: number) {
    this._budgetValue = value;
  }
}
