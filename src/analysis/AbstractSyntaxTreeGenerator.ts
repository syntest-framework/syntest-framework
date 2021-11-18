import { InstrumenterOptions } from "../instrumentation/CustomInstrumenter";
import { defaults } from "@istanbuljs/schema"
const { transformSync } = require('@babel/core');

export class AbstractSyntaxTreeGenerator {
  private opts: any;
  constructor(opts: InstrumenterOptions = {}) {
    this.opts = {
      ...defaults.instrumenter,
      ...opts
    };
  }

  getAST(source, target, inputSourceMap) {
    const babelOpts = {
      configFile: false,
      babelrc: false,
      ast: true,
      filename: target || String(new Date().getTime()) + '.js',
      inputSourceMap,
      sourceMaps: this.opts.produceSourceMap,
      compact: this.opts.compact,
      comments: this.opts.preserveComments,
      parserOpts: {
        allowReturnOutsideFunction: this.opts.autoWrap,
        sourceType: this.opts.esModules ? 'module' : 'script',
        plugins: this.opts.parserPlugins
      },
      plugins: []
    };

    const codeMap = transformSync(source, babelOpts);

    return codeMap.ast
  }
}
