import { DummyLauncher } from "./mocks/DummyLauncher.mock";
import { CommandLineInterface, Encoding, EventManager } from "@syntest/core";

describe("", () => {
  it("Valid path", () => {
    const eventManager = new EventManager({});
    const cli = new CommandLineInterface();
    const launcher = new DummyLauncher<Encoding>("dummy", eventManager, cli);
    const args = [
      "--use_plugin",
      "../packages/plugin-core-example/lib",
      "--target_root_directory",
      ".",
    ];
    launcher.run(args);
  });
  it("Invalid path", () => {
    const eventManager = new EventManager({});
    const cli = new CommandLineInterface();
    const launcher = new DummyLauncher<Encoding>("dummy", eventManager, cli);
    const args = ["--use_plugin", "../plugins", "--target_root_directory", "."];
    launcher.run(args);
  });
});
