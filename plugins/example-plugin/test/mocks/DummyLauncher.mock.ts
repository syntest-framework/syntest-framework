import { EventManager, Launcher } from "@syntest/core";

export class DummyLauncher extends Launcher {
  async processArguments(args: string[]): Promise<void> {
    const {plugin} = await import(args[1])
    console.log(plugin)
    EventManager.registerListener(new plugin.default());
  }
  async setup(): Promise<void> {}
  async preprocess(): Promise<void> {}
  async process(): Promise<void> {}
  async postprocess(): Promise<void> {}
  async exit(): Promise<void> {}
}
