import * as cliProgress from "cli-progress";
import {CommandLineInterface} from "./CommandLineInterface";
import {getLogger} from "../util/logger";

const chalk = require("chalk");
const clear = require("clear");

export abstract class MonitorCommandLineInterface extends CommandLineInterface {
  private _logs: string[];

  constructor(silent = false, verbose = false) {
    super(silent, verbose);
    this._logs = []
    this.showProgressBar = false
    this.progressValue = 0
  }

  render () {
      clear()
      console.log(this.asciiArt('Syntest'))
      console.log((new Date()).toLocaleTimeString())

      if (this.showProgressBar) {
        const bar = new cliProgress.SingleBar({
          format: "Budget used | {bar} | {percentage}%",
          barCompleteChar: "\u2588",
          barIncompleteChar: "\u2591",
          hideCursor: true,
          synchronousUpdate: false
        });

        bar.start(200, this.progressValue)

        bar.render()
        // bar.update(self.progressValue)

        bar.stop();
      }

      console.log('====================== LOGS ======================')
      console.log(this._logs.slice(Math.max(this._logs.length - 10, 0)).join('\n'))
  }

  log(type: string, text: string) {
    let color = chalk.red
    switch (type) {
      case 'error':
        color = chalk.red
        break;
      case 'info':
        color = chalk.blue
        break;
      case 'debug':
        color = chalk.magenta
        break;
    }
    this._logs.push(`${(new Date()).toLocaleTimeString()} ${color(type)}: ${text}`)

    this.render()

    getLogger()[type](text)
  }

  startProgressBar() {
    this.showProgressBar = true
    this.render()
  }

  updateProgressBar(value: number) {
    this.progressValue = value
    this.render()
  }

  stopProgressBar() {
    this.showProgressBar = false
    this.render()
  }


  get logs(): string[] {
    return this._logs;
  }

  set logs(value: string[]) {
    this._logs = value;
  }
}
