import { ApplicationInterface } from "@syntest/cli";
import { CommandModule } from "yargs";
import * as commandModule from "./commandModule";
export default class SetupApplication implements ApplicationInterface {
  name = "Setup";
  async getCommandModules(): Promise<CommandModule[]> {
    return [commandModule];
  }
}
