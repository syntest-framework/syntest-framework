import { ApplicationInterface } from "@syntest/cli";
import { CommandModule } from "yargs";
import * as commandModule from "./commandModule";
export class SetupApplication implements ApplicationInterface {
  name = "Setup";
  async getCommandModules(): Promise<CommandModule[]> {
    return [commandModule];
  }
}
