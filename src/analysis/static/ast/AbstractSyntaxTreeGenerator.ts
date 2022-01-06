import { defaultBabelOptions } from "../../../configs/DefaultBabelConfig";
const { transformSync } = require("@babel/core");

export class AbstractSyntaxTreeGenerator {
  generate(source, target) {
    const options = JSON.parse(JSON.stringify(defaultBabelOptions)) ;

    options.filename = target || String(new Date().getTime()) + ".js";

    const codeMap = transformSync(source, options);

    return codeMap.ast;
  }
}
