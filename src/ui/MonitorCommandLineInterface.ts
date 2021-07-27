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

    setInterval(this.render(this), 100)

  }

  render (self: MonitorCommandLineInterface) {
    return (): void => {
      clear()
      console.log(self.asciiArt('Syntest'))

      if (self.showProgressBar) {
        let bar = new cliProgress.SingleBar({
          format: "Budget used | {bar} | {percentage}%",
          barCompleteChar: "\u2588",
          barIncompleteChar: "\u2591",
          hideCursor: true,
        });

        bar.update(self.progressValue)

        bar.stop();
      }

      console.log('============ LOGS ============')
      console.log(self._logs.slice(Math.max(self._logs.length - 10, 0)).join('\n'))
    }
  }

  log(type: string, text: string) {
    this._logs.push(`${type} ${(new Date()).toLocaleTimeString()}: ${text}`)

    getLogger()[type](text)
  }


  get logs(): string[] {
    return this._logs;
  }

  set logs(value: string[]) {
    this._logs = value;
  }
}
