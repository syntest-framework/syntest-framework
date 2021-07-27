import { UserInterface } from "./UserInterface";
import {getLogger} from "../util/logger";

const chalk = require("chalk");
const figlet = require("figlet");


export abstract class CommandLineInterface extends UserInterface {
  private _showProgressBar: boolean;
  private _progressValue: number

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
  }

  updateProgressBar(value: number) {
    this._progressValue = value
  }

  stopProgressBar() {
    this._showProgressBar = false
  }

  log(type: string, text: string) {
    getLogger()[type](text)
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
}
