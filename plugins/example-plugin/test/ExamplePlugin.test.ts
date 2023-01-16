import { DummyLauncher } from "./mocks/DummyLauncher.mock";

describe("", () => {
  it("", () => {
    const launcher = new DummyLauncher("dummy");
    const args = ["--use", "../../src"];
    launcher.run(args);
  });
});
