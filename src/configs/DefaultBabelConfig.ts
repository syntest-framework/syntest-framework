import { TransformOptions } from "@babel/core";

export const defaultBabelOptions: TransformOptions = {
  configFile: false,
  babelrc: false,
  ast: true,
  sourceMaps: true,
  compact: true,
  comments: true,
  parserOpts: {
    allowReturnOutsideFunction: true,
    sourceType: 'module',
    plugins: [
      'asyncGenerators',
      'classProperties',
      'dynamicImport',
      'objectRestSpread',
    ]
  },
  plugins: []
};
