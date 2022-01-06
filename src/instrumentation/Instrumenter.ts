import { TransformOptions, transform } from "@babel/core";
import { Visitor } from "./Visitor";
import { defaultBabelOptions } from "../configs/DefaultBabelConfig";

export interface OutputObject {
  fileCoverage?: any;
  sourceMappingURL?: any;
}

export class Instrumenter {
  instrument(code: string, filename: string) {
    const options = JSON.parse(JSON.stringify(defaultBabelOptions)) ;

    let output: OutputObject = {};

    options.filename = filename;
    options.plugins.push([
      ({ types }) => {
        const ee = new Visitor(types, filename, {
          coverageVariable: "__coverage__",
          // reportLogic: opts.reportLogic,
          // coverageGlobalScope: opts.coverageGlobalScope,
          // coverageGlobalScopeFunc: opts.coverageGlobalScopeFunc,
          ignoreClassMethods: [],
          // inputSourceMap
        });

        return {
          visitor: {
            Program: {
              enter: (path) => ee.enter(path),
              exit(path) {
                output = ee.exit(path);
              },
            },
          },
        };
      },
    ]);

    const codeMap = transform(code, options);

    if (!output || !output.fileCoverage) {
      return code;
    }

    return codeMap.code;
  }
}
