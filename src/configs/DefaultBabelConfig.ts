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
