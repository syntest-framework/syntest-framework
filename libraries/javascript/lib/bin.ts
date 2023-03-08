#!/usr/bin/env node
/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest JavaScript.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { EventManager, PluginManager } from "@syntest/core";
import { JavaScriptLauncher } from "./JavaScriptLauncher";
import { JavaScriptTestCase } from "./testcase/JavaScriptTestCase";

const name = "syntest-javascript";
const state = {};
const eventManager = new EventManager<JavaScriptTestCase>(state);
const pluginManager = new PluginManager<JavaScriptTestCase>();

const launcher = new JavaScriptLauncher(name, eventManager, pluginManager);
launcher.run(process.argv);
