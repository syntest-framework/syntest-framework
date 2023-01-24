import {
  guessCWD,
  Launcher,
  loadConfig,
  processConfig,
  setupLogger,
  setupOptions,
  Encoding,
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
  async initialize(): Promise<void> {
    console.log();
  }
  async preprocess(): Promise<void> {
    console.log();
  }
  async process(): Promise<void> {
    console.log();
  }
  async postprocess(): Promise<void> {
    console.log();
  }
  async exit(): Promise<void> {
    console.log();
  }
}
