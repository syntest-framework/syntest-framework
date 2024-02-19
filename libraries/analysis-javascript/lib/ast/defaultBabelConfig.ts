/*
 * Copyright 2020-2023 SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Javascript.
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

import { TransformOptions } from "@babel/core";

export const defaultBabelOptions: TransformOptions = {
  configFile: false,

  // "presets": ["@babel/preset-react"],
  babelrc: false,
  ast: true,
  sourceMaps: true,
  compact: false,
  comments: true,
  parserOpts: {
    allowReturnOutsideFunction: true,
    sourceType: "module",
    plugins: [
      "asyncGenerators",
      "classProperties",
      "dynamicImport",
      "objectRestSpread",
    ],
  },
  plugins: [],
};
