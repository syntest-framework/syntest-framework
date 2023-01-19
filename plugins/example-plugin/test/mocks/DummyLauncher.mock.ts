import {
  guessCWD,
  Launcher,
  loadConfig,
  processConfig,
  setupLogger,
  setupOptions,
  Encoding
} from "@syntest/core";

export class DummyLauncher<T extends Encoding> extends Launcher<T> {
  async configure(args: string[]): Promise<void> {
    await this.loadPlugin(args[1]);
    guessCWD();
    setupOptions(this.programName, <Record<string, unknown>[]>(<unknown>{}));
    const config = loadConfig(args);
    processConfig(config, args);
    setupLogger();
  }
  async initialize(): Promise<void> {}
  async preprocess(): Promise<void> {}
  async process(): Promise<void> {}
  async postprocess(): Promise<void> {}
  async exit(): Promise<void> {}
}
