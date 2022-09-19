import { Decoder, Properties } from "@syntest/framework";
import { JavaScriptTestCase } from "../testcase/JavaScriptTestCase";
import * as path from "path";
import { ConstructorCall } from "../testcase/statements/root/ConstructorCall";
import { Decoding } from "../testcase/statements/Statement";
import { Export } from "../analysis/static/dependency/ExportVisitor";
import { FunctionCall } from "../testcase/statements/root/FunctionCall";
import { RootStatement } from "../testcase/statements/root/RootStatement";
import { JavaScriptTargetPool } from "../analysis/static/JavaScriptTargetPool";


export class JavaScriptDecoder implements Decoder<JavaScriptTestCase, string> {
  private targetPool: JavaScriptTargetPool
  private dependencies: Map<string, Export[]>;
  private exports: Export[]

  constructor(
    targetPool: JavaScriptTargetPool,
    dependencies: Map<string, Export[]>,
    exports: Export[],
  ) {
    this.targetPool = targetPool
    this.dependencies = dependencies;
    this.exports = exports
  }

  decode(testCases: JavaScriptTestCase | JavaScriptTestCase[], targetName: string, addLogs = false, sourceDir = '../instrumented'): string {
    if (testCases instanceof JavaScriptTestCase) {
      testCases = [testCases];
    }

    const tests: string[] = []
    const imports: string[] = []

    for (const testCase of testCases) {
      const root = testCase.root;

      const importableGenes: RootStatement[] = [];
      let statements: Decoding[] = root.decode(testCase.id, { addLogs, exception: false })


      const testString: string[] = [];
      if (addLogs) {
        testString.push(
          `\t\tawait fs.mkdirSync('${path.join(
            Properties.temp_log_directory,
            testCase.id
          )}', { recursive: true })\n
          \t\tlet count = 0;
          \t\ttry {\n`
        );
      }

      if (testCase.assertions.size !== 0 && testCase.assertions.has("error")) {
        const index = parseInt(testCase.assertions.get('error'))
        // TODO does not work
        //  the .to.throw stuff does not work somehow
        // const decoded = statements[index].reference instanceof MethodCall
        //   ? (<MethodCall>statements[index].reference).decodeWithObject(testCase.id, { addLogs, exception: true }, statements[index].objectVariable)
        //   : statements[index].reference.decode(testCase.id, { addLogs, exception: true })
        // statements[index] = decoded.find((x) => x.reference === statements[index].reference)

        // delete statements after
        statements = statements.slice(0, index + 1)
      }

      statements.forEach((value, i) => {
        if (value.reference instanceof RootStatement) {
          importableGenes.push(value.reference)
        }
        if (addLogs) {
          // add log per statement
          testString.push(
            '\t\t' + `count = ${i};`
          )
        }

        testString.push(
          '\t\t' + value.decoded.replace('\n', '\n\t\t')
        )
      })

      if (addLogs) {
        testString.push(`} catch (e) {`);
        testString.push(
          `await fs.writeFileSync('${path.join(
            Properties.temp_log_directory,
            testCase.id,
            "error"
          )}', '' + count)`
        );
        testString.push("}");
      }

      const importsOfTest = this.gatherImports(sourceDir, testString, importableGenes);
      imports.push(...importsOfTest);

      if (addLogs) {
        imports.push(`import * as fs from 'fs'`)
      }

      if (testCase.assertions.size) {
        imports.push(`import chai from 'chai'`);
        imports.push(`import chaiAsPromised from 'chai-as-promised'`)

        imports.push(`const expect = chai.expect;`);
        imports.push(`chai.use(chaiAsPromised);`);
      }

      const assertions: string[] = this.generateAssertions(testCase)

      const body = [];

      if (testString.length) {
        let errorStatement: string
        if (assertions.length && testCase.assertions.size !== 0 && testCase.assertions.has("error")) {
          errorStatement = testString.pop()
        }

        body.push(`${testString.join("\n")}`)
        body.push(`${assertions.join("\n")}`);

        if (errorStatement) {
          body.push(`\t\ttry {\n\t${errorStatement}\n\t\t} catch (e) {\n\t\t\texpect(e).to.be.an('error')\n\t\t}`)
        }
      }

      // TODO instead of using the targetName use the function call or a better description of the test
      tests.push(
        `\tit('test for ${targetName}', async () => {\n` +
        `${body.join("\n\n")}` +
        `\n\t});`
      );
    }

    if (imports.find((x) => x.includes('import') && !x.includes('require'))) {
      const importsString = imports
          // remove duplicates
          .filter((value, index, self) => self.indexOf(value) === index)
          .join("\n") +
        `\n\n`

      return importsString +
        `describe('${targetName}', () => {\n` +
        tests.join("\n\n") +
        `\n})`;
    } else {
      const importsString = imports
          // remove duplicates
          .filter((value, index, self) => self.indexOf(value) === index)
          .join("\n\t") +
        `\n\n`

      return `describe('${targetName}', () => {\n\t` +
        importsString +
        tests.join("\n\n") +
        `\n})`;
    }
  }

  gatherImports(sourceDir: string, testStrings: string[], importableGenes: RootStatement[]): string[] {
    const imports: string[] = [];
    const importedDependencies: Set<string> = new Set<string>()

    for (const gene of importableGenes) {
      const importName = gene instanceof FunctionCall ? gene.functionName : (gene instanceof ConstructorCall ? gene.constructorName : gene.type);
      const complexObject = gene.identifierDescription.typeProbabilityMap.getObjectDescription(importName)
      const export_: Export = complexObject?.export || this.exports.find((x) => x.name === importName)
      if (!export_) {
        throw new Error('Cannot find an export corresponding to the importable gene: ' + importName)
      }

      // no duplicates
      if (importedDependencies.has(export_.name)) {
        continue
      }
      importedDependencies.add(export_.name)

      // skip non-used imports
      if (!testStrings.find((s) => s.includes(export_.name))) {
        continue
      }

      const importString: string = this.getImport(sourceDir, export_)

      if (imports.includes(importString) || importString.length === 0) {
        continue;
      }

      imports.push(importString);

      // let count = 0;
      // for (const dependency of this.dependencies.get(importName)) {
      //   // no duplicates
      //   if (importedDependencies.has(dependency.name)) {
      //     continue
      //   }
      //   importedDependencies.add(dependency.name)
      //
      //   // skip non-used imports
      //   if (!testStrings.find((s) => s.includes(dependency.name))) {
      //     continue
      //   }
      //
      //   const importString: string = this.getImport(dependency);
      //
      //   if (imports.includes(importString) || importString.length === 0) {
      //     continue;
      //   }
      //
      //   imports.push(importString);
      //
      //   count += 1;
      // }
    }

    return imports;
  }

  getImport(sourceDir: string, dependency: Export): string {
    const _path = dependency.filePath.replace(path.resolve(Properties.target_root_directory), path.join(sourceDir, path.basename(Properties.target_root_directory)))

    if (dependency.module) {
      if (dependency.default) {
        return `import * as ${dependency.name} from "${_path}";`;
      } else {
        return `import {${dependency.name}} from "${_path}";`;
      }
    }
    if (dependency.default) {
      return `import ${dependency.name} from "${_path}";`;
    } else {
      return `import {${dependency.name}} from "${_path}";`;
    }
  }

  generateAssertions(testCase: JavaScriptTestCase): string[] {
    const assertions: string[] = [];
    if (testCase.assertions.size !== 0) {
      for (const variableName of testCase.assertions.keys()) {
        if (variableName === "error") {
          continue;
        }

        const assertion = testCase.assertions.get(variableName).split(';sep;')
        const original = assertion[0]
        let stringified = assertion[1]

        if (original === 'undefined') {
          assertions.push(
            `\t\texpect(${variableName}).to.equal(${original})`
          );
          continue
        } else if (original === 'NaN') {
          assertions.push(
            `\t\texpect(${variableName}).to.be.NaN`
          );
          continue
        }

        // TODO dirty hack because json.parse does not allow undefined/NaN
        // TODO undefined/NaN can happen in arrays
        stringified = stringified.replace('undefined', 'null')
        stringified = stringified.replace('NaN', 'null')

        const value = JSON.parse(stringified)

        if (typeof value === 'object' || typeof value === 'function') {
          assertions.push(
            `\t\texpect(JSON.parse(JSON.stringify(${variableName}))).to.deep.equal(${stringified})`
          );
        } else {
          assertions.push(
            `\t\texpect(${variableName}).to.equal(${stringified})`
          );
        }
      }
    }

    return assertions;
  }
}
