#!/usr/bin/env node
import { EventManager, PluginManager } from "@syntest/core";
import { JavaScriptLauncher } from "./JavaScriptLauncher";
import { JavaScriptTestCase } from "./testcase/JavaScriptTestCase";

const name = "syntest-javascript";
const state = {};
const eventManager = new EventManager<JavaScriptTestCase>(state);
const pluginManager = new PluginManager<JavaScriptTestCase>();

const launcher = new JavaScriptLauncher(name, eventManager, pluginManager);
launcher.run(process.argv);
