const { transformSync } = require('@babel/core');

class AbstractSyntaxTreeGenerator {
  protected config
  constructor(config) {
    this.config = config
  }

  getAST(source, target, inputSourceMap) {
    const babelOpts = {
      configFile: false,
      babelrc: false,
      ast: true,
      filename: target || String(new Date().getTime()) + '.js',
      inputSourceMap,
      sourceMaps: this.config.produceSourceMap,
      compact: this.config.compact,
      comments: this.config.preserveComments,
      parserOpts: {
        allowReturnOutsideFunction: this.config.autoWrap,
        sourceType: this.config.esModules ? 'module' : 'script',
        plugins: this.config.parserPlugins
      },
      plugins: []
    };

    const codeMap = transformSync(source, babelOpts);

    return codeMap.ast
  }
}
