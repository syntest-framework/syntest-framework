/*
 * Copyright 2020-2022 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Javascript.
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
import * as path from "path";
import { getAllFiles, readFile } from "../../utils/fileSystem";
import { AbstractSyntaxTreeGenerator } from "./ast/AbstractSyntaxTreeGenerator";
import { CFG, Properties, TargetMetaData, TargetPool } from "@syntest/framework";
import { TargetMapGenerator } from "./map/TargetMapGenerator";
import { ControlFlowGraphGenerator } from "./cfg/ControlFlowGraphGenerator";
import { ImportGenerator } from "./dependency/ImportGenerator";
import { ExportGenerator } from "./dependency/ExportGenerator";
import { existsSync } from "fs";
import { Export, ExportType } from "./dependency/ExportVisitor";
import { SubjectType } from "../../search/JavaScriptSubject";
import { TypeResolver } from "./types/resolving/TypeResolver";
import { VariableGenerator } from "./types/discovery/VariableGenerator";
import { ObjectGenerator } from "./types/discovery/object/ObjectGenerator";
import { ComplexObject } from "./types/discovery/object/ComplexObject";
import { ActionDescription } from "./parsing/ActionDescription";
import { Scope } from "./types/discovery/Scope";
import { Relation } from "./types/discovery/Relation";
import { Element } from "./types/discovery/Element";
import { Typing, TypingType } from "./types/resolving/Typing";


export interface JavaScriptTargetMetaData extends TargetMetaData {
  type: SubjectType,
  export: Export
}

export class JavaScriptTargetPool extends TargetPool {
  protected abstractSyntaxTreeGenerator: AbstractSyntaxTreeGenerator;
  protected targetMapGenerator: TargetMapGenerator;
  protected controlFlowGraphGenerator: ControlFlowGraphGenerator;
  protected importGenerator: ImportGenerator;
  protected exportGenerator: ExportGenerator;
  private _typeResolver: TypeResolver;

  // Mapping: filepath -> source code
  protected _sources: Map<string, string>;

  // Mapping: filepath -> AST
  protected _abstractSyntaxTrees: Map<string, any>;

  // Mapping: filepath -> target name -> target meta data
  protected _targetMap: Map<string, Map<string, JavaScriptTargetMetaData>>;

  // Mapping: filepath -> target name -> function name -> function
  protected _functionMaps: Map<
    string,
    Map<string, Map<string, ActionDescription>>
  >;

  // Mapping: filepath -> target name -> (function name -> CFG)
  protected _controlFlowGraphs: Map<string, Map<string, CFG>>;

  // Mapping: filepath -> dependencies
  protected _dependencyMaps: Map<string, Export[]>;

  // Mapping: filepath -> target name -> Exports
  protected _exportMap: Map<string, Export[]>

  constructor(
    abstractSyntaxTreeGenerator: AbstractSyntaxTreeGenerator,
    targetMapGenerator: TargetMapGenerator,
    controlFlowGraphGenerator: ControlFlowGraphGenerator,
    importGenerator: ImportGenerator,
    exportGenerator: ExportGenerator,
    typeResolver: TypeResolver
  ) {
    super();
    this.abstractSyntaxTreeGenerator = abstractSyntaxTreeGenerator;
    this.targetMapGenerator = targetMapGenerator;
    this.controlFlowGraphGenerator = controlFlowGraphGenerator;
    this.importGenerator = importGenerator;
    this.exportGenerator = exportGenerator;
    this._typeResolver = typeResolver;

    this._sources = new Map<string, string>();
    this._abstractSyntaxTrees = new Map<string, string>();
    this._targetMap = new Map<string, Map<string, JavaScriptTargetMetaData>>();
    this._functionMaps = new Map<
      string,
      Map<string, Map<string, ActionDescription>>
    >();
    this._controlFlowGraphs = new Map<string, Map<string, CFG>>();

    this._dependencyMaps = new Map();

    this._exportMap = new Map()
  }

  getSource(targetPath: string) {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._sources.has(absoluteTargetPath)) {
      if (existsSync(absoluteTargetPath)) {
        this._sources.set(absoluteTargetPath, readFile(absoluteTargetPath));

      } else if (existsSync(absoluteTargetPath + '.js')) {
        this._sources.set(absoluteTargetPath, readFile(absoluteTargetPath + '.js'));

      } else if (existsSync(absoluteTargetPath + '.ts')) {
        this._sources.set(absoluteTargetPath, readFile(absoluteTargetPath + '.ts'));
      } else {
        throw new Error("Cannot find source: " + absoluteTargetPath)
      }
    }

    return this._sources.get(absoluteTargetPath);
  }

  getAST(targetPath: string) {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._abstractSyntaxTrees.has(absoluteTargetPath)) {
      this._abstractSyntaxTrees.set(
        absoluteTargetPath,
        this.abstractSyntaxTreeGenerator.generate(
          this.getSource(targetPath),
          absoluteTargetPath
        )
      );
    }

    return this._abstractSyntaxTrees.get(absoluteTargetPath);
  }

  getCFG(targetPath: string, targetName: string): CFG {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._controlFlowGraphs.has(absoluteTargetPath)) {
      this._controlFlowGraphs.set(absoluteTargetPath, new Map<string, CFG>())
    }

    if (!this._controlFlowGraphs.get(absoluteTargetPath).has(targetName)) {
      this._controlFlowGraphs.get(absoluteTargetPath).set(
        targetName,
        this.controlFlowGraphGenerator.convertAST(
          this.getAST(absoluteTargetPath)
        )
      );
    }

    return this._controlFlowGraphs.get(absoluteTargetPath).get(targetName);
  }

  getTargetMap(targetPath: string): Map<string, JavaScriptTargetMetaData> {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._targetMap.has(absoluteTargetPath)) {
      const targetAST = this.getAST(absoluteTargetPath);
      const { targetMap, functionMap } =
        this.targetMapGenerator.generate(targetAST);

      const exports = this.getExports(targetPath)

      const finalTargetMap = new Map<string, JavaScriptTargetMetaData>()

      for (const key of targetMap.keys()) {
        const name = targetMap.get(key).name
        const export_ = exports.find((e) => e.name === name)

        if (!export_) {
          // No export found so we cannot import it and thus not test it
          continue
        }

        if(export_.type === ExportType.const) {
          throw new Error("Target cannot be constant!")
        }

        finalTargetMap.set(key, {
          name: name,
          type: export_.type === ExportType.function ? SubjectType.function : SubjectType.class,
          export: export_
        })
      }

      this._targetMap.set(absoluteTargetPath, finalTargetMap);
      this._functionMaps.set(absoluteTargetPath, functionMap);
    }

    return this._targetMap.get(absoluteTargetPath);
  }

  getFunctionMap(
    targetPath: string,
    targetName: string
  ): Map<string, ActionDescription> {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._functionMaps.has(absoluteTargetPath)) {
      this.getTargetMap(absoluteTargetPath)
    }

    if (this._functionMaps.get(absoluteTargetPath).has(targetName)) {
      return this._functionMaps.get(absoluteTargetPath).get(targetName);
    } else {
      throw new Error(
        `Target ${targetName} could not be found at ${targetPath}`
      );
    }
  }

  getExports(targetPath: string): Export[] {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._exportMap.has(absoluteTargetPath)) {
      const exports = this.exportGenerator.generate(absoluteTargetPath, this.getAST(absoluteTargetPath))

      this._exportMap.set(absoluteTargetPath, exports);
    }

    return this._exportMap.get(absoluteTargetPath)
  }

  getDependencies(targetPath: string):  Export[] {
    const absoluteTargetPath = path.resolve(targetPath);

    if (!this._dependencyMaps.has(absoluteTargetPath)) {
      // Find all external imports in the file under test
      const imports = this.importGenerator.generate(this.getAST(targetPath))

      // For each external import scan the file for libraries with exported functions
      const libraries: Export[] = [];
      imports.forEach((importPath: string) => {
        // Full path to the imported file
        let pathLib = path.join(path.dirname(targetPath), importPath);

        // External libraries have a different path!
        try {
          this.getSource(pathLib)
        } catch (e) {
          if (e.message.includes('Cannot find source')) {
            // TODO would be nice if we could get the actual path! (node modules)
            return
            // pathLib = path.join
          } else {
            throw e
          }
        }


        // Scan for libraries with public or external functions
        const exports = this.getExports(pathLib)

        // Import the found libraries
        // TODO: check for duplicates in libraries
        libraries.push(...exports);
      });

      this._dependencyMaps
        .set(targetPath, libraries);
    }

    return this._dependencyMaps.get(absoluteTargetPath)
  }

  getInstrumentationTargets(targetPath: string, paths: Set<string> = null): Set<string> {
    const absoluteTargetPath = path.resolve(targetPath);

    if (paths === null) {
      paths = new Set<string>()
    }

    paths.add(absoluteTargetPath);

    const dependencies = this.getDependencies(absoluteTargetPath);

    for (const dependency of dependencies) {
      if (paths.has(dependency.filePath)) {
        continue
      }
      this.getInstrumentationTargets(dependency.filePath, paths).forEach((path) => {
        paths.add(path)
      })
    }

    return paths
  }

  scanTargetRootDirectory(): void {
    const absoluteRootPath = path.resolve(Properties.target_root_directory)

    // TODO remove the filters
    const files = getAllFiles(absoluteRootPath, ".js").filter((x) => !x.includes('/test/') && !x.includes('.test.js'))


    const objects: ComplexObject[] = []
    const objectGenerator = new ObjectGenerator()

    for (const file of files) {
      objects.push(...objectGenerator.generate(file, this.getAST(file)))
    }

    // standard stuff
    // function https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
    objects.push({
      import: "",
      name: "function",
      properties: new Set(['arguments', 'caller', 'displayName', 'length', 'name']),
      functions: new Set(['apply', 'bind', 'call', 'toString']),
      propertyType: new Map<string, Typing>([
        ['arguments', { type: TypingType.ARRAY }],
        ['caller', { type: TypingType.FUNCTION }],
        ['displayName', { type: TypingType.STRING }],
        ['length', { type: TypingType.NUMERIC }],
        ['name', { type: TypingType.STRING }]
      ])
    })

    // array https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
    objects.push({
      import: "",
      name: "array",
      properties: new Set(['length']),
      functions: new Set(['at', 'concat', 'copyWithin', 'entries', 'fill', 'filter', 'find', 'findIndex', 'flat', 'flatMap', 'includes', 'indexOf', 'join', 'keys', 'lastIndexOf', 'map', 'pop', 'push', 'reduce', 'reduceRight', 'reverse', 'shift', 'slice', 'toLocaleString', 'toString', 'unshift', 'values']),
      propertyType: new Map<string, Typing>([
        ['length', { type: TypingType.NUMERIC }]
      ])
    })

    // string
    objects.push({
      import: "",
      name: "string",
      properties: new Set(['length']),
      functions: new Set(['at', 'charAt', 'charCodeAt', 'codePointAt', 'concat', 'includes', 'endsWith', 'indexOf', 'lastIndexOf', 'localeCompare', 'match', 'matchAll', 'normalize', 'padEnd', 'padStart', 'repeat', 'replace', 'replaceAll', 'search', 'slice', 'split', 'startsWith', 'substring', 'toLocaleLowerCase', 'toLocaleUpperCase', 'toLowerCase', 'toString', 'toUpperCase', 'trim', 'trimStart', 'trimEnd', 'valueOf']),
      propertyType: new Map<string, Typing>([
        ['length', { type: TypingType.NUMERIC }]
      ])
    })

    // object
    // TODO
    // this._objects.push({
    //   import: "",
    //   name: "object",
    //   properties: new Set([]),
    //   functions: new Set([])
    // })

    // TODO npm dependencies
    // TODO get rid of duplicates

    const generator = new VariableGenerator()
    const scopes: Scope[] = []
    const elements: Element[] = []
    const relations: Relation[] = []
    const wrapperElementIsRelation: Map<string, Relation> = new Map()

    for (const file of files) {
      const [_scopes, _elements, _relations, _wrapperElementIsRelation] = generator.generate(file, this.getAST(file))

      scopes.push(..._scopes)
      elements.push(..._elements)
      relations.push(..._relations)

      for (const key of _wrapperElementIsRelation.keys()) {
        wrapperElementIsRelation.set(key, _wrapperElementIsRelation.get(key))
      }
    }

    this._typeResolver.resolveTypes(scopes, elements, relations, wrapperElementIsRelation, objects)
  }

  resolveTypes(targetPath: string): void {
    const absoluteTargetPath = path.resolve(targetPath);

    const ast = this.getAST(absoluteTargetPath)

    const dependencies = this.getDependencies(absoluteTargetPath);

    // TODO first look at dependencies to extract other variables?

    const objects: ComplexObject[] = []

    //TODO the entire project should be searched for complex object types instead of dependencies only
    const objectGenerator = new ObjectGenerator()
    objects.push(...objectGenerator.generate(absoluteTargetPath, ast))

    // standard stuff
    // function https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
    objects.push({
      import: "",
      name: "function",
      properties: new Set(['arguments', 'caller', 'displayName', 'length', 'name']),
      functions: new Set(['apply', 'bind', 'call', 'toString'])
    })

    // array https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
    objects.push({
      import: "",
      name: "array",
      properties: new Set(['length']),
      functions: new Set(['at', 'concat', 'copyWithin', 'entries', 'fill', 'filter', 'find', 'findIndex', 'flat', 'flatMap', 'includes', 'indexOf', 'join', 'keys', 'lastIndexOf', 'map', 'pop', 'push', 'reduce', 'reduceRight', 'reverse', 'shift', 'slice', 'toLocaleString', 'toString', 'unshift', 'values'])
    })

    // string
    objects.push({
      import: "",
      name: "string",
      properties: new Set(['length']),
      functions: new Set(['at', 'charAt', 'charCodeAt', 'codePointAt', 'concat', 'includes', 'endsWith', 'indexOf', 'lastIndexOf', 'localeCompare', 'match', 'matchAll', 'normalize', 'padEnd', 'padStart', 'repeat', 'replace', 'replaceAll', 'search', 'slice', 'split', 'startsWith', 'substring', 'toLocaleLowerCase', 'toLocaleUpperCase', 'toLowerCase', 'toString', 'toUpperCase', 'trim', 'trimStart', 'trimEnd', 'valueOf'])
    })

    // object
    // TODO
    // this._objects.push({
    //   import: "",
    //   name: "object",
    //   properties: new Set([]),
    //   functions: new Set([])
    // })

    // TODO best would be to do all files in the directory (instead of only the targets)



    for (const target of [
      '/home/dimitri/Documents/git/university/syntest/syntest-javascript/benchmark/top10npm/commanderjs/lib/argument.js',
      '/home/dimitri/Documents/git/university/syntest/syntest-javascript/benchmark/top10npm/commanderjs/lib/command.js',
      '/home/dimitri/Documents/git/university/syntest/syntest-javascript/benchmark/top10npm/commanderjs/lib/argument.js',
      '/home/dimitri/Documents/git/university/syntest/syntest-javascript/benchmark/top10npm/commanderjs/lib/error.js',
      '/home/dimitri/Documents/git/university/syntest/syntest-javascript/benchmark/top10npm/commanderjs/lib/help.js',
      '/home/dimitri/Documents/git/university/syntest/syntest-javascript/benchmark/top10npm/commanderjs/lib/option.js',
      '/home/dimitri/Documents/git/university/syntest/syntest-javascript/benchmark/top10npm/commanderjs/lib/suggestSimilar.js',

    ]) {
      const objectGenerator = new ObjectGenerator()
      objects.push(...objectGenerator.generate(target, this.getAST(target)))
    }

    // for (const target of this.targets) {
    //   const objectGenerator = new ObjectGenerator()
    //   objects.push(...objectGenerator.generate(target.canonicalPath, this.getAST(target.canonicalPath)))
    // }

    for (const dependency of dependencies) {
      const objectGenerator = new ObjectGenerator()
      objects.push(...objectGenerator.generate(dependency.filePath, this.getAST(dependency.filePath)))
    }

    // TODO get rid of duplicates

    const generator = new VariableGenerator()
    const [scopes, elements, relations, wrapperElementIsRelation] = generator.generate(targetPath, ast)

    this._typeResolver.resolveTypes(scopes, elements, relations, wrapperElementIsRelation, objects)
  }


  get typeResolver(): TypeResolver {
    return this._typeResolver;
  }
}
