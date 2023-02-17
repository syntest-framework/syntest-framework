import { JavaScriptLauncher } from "../../lib/JavaScriptLauncher";
import { JavaScriptTestCase } from "../../lib/testcase/JavaScriptTestCase";
import { EventManager } from "@syntest/core";
import { PluginManager } from "@syntest/core";

describe("Temp", () => {
  it("temp", () => {
    const eventManager = new EventManager<JavaScriptTestCase>({});
    const pluginManager = new PluginManager<JavaScriptTestCase>();
    new JavaScriptLauncher("test", eventManager, pluginManager);
    console.log("succes");
  });
});
