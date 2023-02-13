/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core.
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
import { mkdirSync, writeFileSync } from "fs";
import * as path from "path";

function camelCased(text: string): string {
  return text
    .split("-")
    .map((x: string) => {
      if (x.length === 0) {
        return x;
      }
      const head = x[0];
      const tail = x.slice(1);
      return head.toUpperCase() + tail;
    })
    .join("");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CreatePluginTemplate(args: any) {
  const name = args.pluginName;
  if (name.includes(" ")) {
    throw new Error(`Plugin name cannot contain spaces.`);
  }

  const camelName = camelCased(name);
  const absolutePath = path.normalize(name);
  const libPath = path.join(absolutePath, "lib");

  const pluginType = args.pluginType;

  mkdirSync(absolutePath);
  writeFileSync(path.join(absolutePath, `README.md`), createReadme(camelName));
  writeFileSync(
    path.join(absolutePath, `package.json`),
    createPackageJson(name)
  );

  mkdirSync(libPath);
  writeFileSync(
    path.join(libPath, `${name}Plugin.ts`),
    createPluginFile(camelName, pluginType)
  );
  writeFileSync(
    path.join(libPath, `index.ts`),
    createIndexFile(`./${name}Plugin.ts`)
  );

  process.exit(0);
}

function createReadme(name: string): string {
  return `
    # ${name} plugin
    A plugin for the SynTest Core
    `.trim();
}

function createPackageJson(name: string): string {
  return JSON.stringify({
    name: name,
    version: "0.1.0",
    description: "A plugin for the SynTest Core",
    keywords: ["syntest"],
    main: "dist/index.js",
    types: "dist/index.d.ts",
    files: ["/dist"],
    scripts: {
      "build:compile": "tsc --build",
      "build:watch": "tsc --build --watch",
      clean: "rm -rf .nyc_output dist node_modules",
      "clean:dist": "rm -rf dist",
      format:
        "prettier --config ../../.prettierrc.json --ignore-path ../../.prettierignore --write .",
      "format:check":
        "prettier --config ../../.prettierrc.json --ignore-path ../../.prettierignore --check .",
      lint: "eslint --config ../../.eslintrc.json --ignore-path ../../.eslintignore .",
      "lint:fix":
        "eslint --config ../../.eslintrc.json --ignore-path ../../.eslintignore . --fix",
      test: "mocha --config ../../.mocharc.json",
      "test:coverage": "nyc mocha --config ../../.mocharc.json",
      "test:watch": "mocha --config ../../.mocharc.json --watch",
    },
    dependencies: {
      "@syntest/core": "*",
      yargs: "17.6.2",
    },
    devDependencies: {
      "@commitlint/cli": "17.4.2",
      "@commitlint/config-conventional": "17.4.2",
      "@types/chai": "4.3.4",
      "@types/cli-progress": "3.11.0",
      "@types/mocha": "10.0.1",
      "@types/node": "18.11.18",
      "@types/sinon": "10.0.13",
      "@types/yargs": "17.0.20",
      "@typescript-eslint/eslint-plugin": "5.45.1",
      "@typescript-eslint/parser": "5.45.1",
      chai: "4.3.7",
      commitlint: "17.4.2",
      eslint: "8.29.0",
      "eslint-config-prettier": "8.5.0",
      husky: "8.0.3",
      lerna: "6.4.1",
      "lint-staged": "13.1.0",
      mocha: "10.2.0",
      nyc: "15.1.0",
      prettier: "2.8.1",
      sinon: "15.0.1",
      "ts-node": "10.9.1",
      typescript: "4.9.4",
    },
  });
}

function createPluginFile(name: string, pluginType: string): string {
  return `
    import {
        Encoding
        ${pluginType}Plugin
        PluginManager
    } from "@syntest/core";
    import Yargs = require("yargs");

    export default class ${name}Plugin<T extends Encoding> implements ${pluginType}Plugin<T> {
        name = "${name}";

        register(pluginManager: PluginManager<T>): void {
            pluginManager.register${pluginType}(this);
        }

        async getConfig(): Promise<Map<string, Yargs.Options>> {
            const map = new Map<string, Yargs.Options>();
            // TODO add options required for your plugin in the map.
            return map
        }

        async prepare(): Promise<void> {
            // TODO make preparations required for your plugin
            // e.g. creating an output directory
        }

        async create${pluginType}(options: ${pluginType}Options<T>): ${pluginType}<T> {
            // TODO return your ${pluginType}
            return null
        }

        async cleanup(): Promise<void> {
            // TODO cleanup after the program is finished
            // e.g. deleting a temporary plugin directory
        }
    }
    `.trim();
}

function createIndexFile(path: string) {
  return `
    export * as plugin from "${path}";
    `.trim();
}
