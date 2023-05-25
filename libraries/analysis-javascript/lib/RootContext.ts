/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
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

import { existsSync, lstatSync } from "node:fs";
import * as path from "node:path";

import * as t from "@babel/types";
import { RootContext as CoreRootContext } from "@syntest/analysis";

import { AbstractSyntaxTreeFactory } from "./ast/AbstractSyntaxTreeFactory";
import { ControlFlowGraphFactory } from "./cfg/ControlFlowGraphFactory";
import { DependencyFactory } from "./dependency/DependencyFactory";
import { Export } from "./target/export/Export";
import { TargetFactory } from "./target/TargetFactory";
import { TypeModelFactory } from "./type/resolving/TypeModelFactory";
import { readFile } from "./utils/fileSystem";
import { ExportFactory } from "./target/export/ExportFactory";
import { TypeExtractor } from "./type/discovery/TypeExtractor";
import { TypeModel } from "./type/resolving/TypeModel";
import { Element } from "./type/discovery/element/Element";
import { DiscoveredObjectType } from "./type/discovery/object/DiscoveredType";
import { Relation } from "./type/discovery/relation/Relation";

export class RootContext extends CoreRootContext<t.Node> {
  protected _exportFactory: ExportFactory;
  protected _typeExtractor: TypeExtractor;
  protected _typeResolver: TypeModelFactory;

  protected _elementMap: Map<string, Element>;
  protected _relationMap: Map<string, Relation>;
  protected _objectMap: Map<string, DiscoveredObjectType>;

  protected _typeModel: TypeModel;

  // Mapping: filepath -> target name -> Exports
  protected _exportMap: Map<string, Export[]>;

  constructor(
    rootPath: string,
    abstractSyntaxTreeFactory: AbstractSyntaxTreeFactory,
    controlFlowGraphFactory: ControlFlowGraphFactory,
    targetFactory: TargetFactory,
    dependencyFactory: DependencyFactory,
    exportFactory: ExportFactory,
    typeExtractor: TypeExtractor,
    typeResolver: TypeModelFactory
  ) {
    super(
      rootPath,
      undefined,
      abstractSyntaxTreeFactory,
      controlFlowGraphFactory,
      targetFactory,
      dependencyFactory
    );
    this._exportFactory = exportFactory;
    this._typeExtractor = typeExtractor;
    this._typeResolver = typeResolver;

    this._exportMap = new Map();
  }

  get rootPath(): string {
    return this._rootPath;
  }

  // TODO something with the types

  override getSource(filePath: string) {
    let absoluteTargetPath = path.resolve(filePath);

    if (!this._sources.has(absoluteTargetPath)) {
      if (!existsSync(absoluteTargetPath)) {
        if (existsSync(absoluteTargetPath + ".js")) {
          absoluteTargetPath += ".js";
        } else if (existsSync(absoluteTargetPath + ".ts")) {
          absoluteTargetPath += ".ts";
        } else {
          throw new Error("Cannot find source: " + absoluteTargetPath);
        }
      }

      const stats = lstatSync(absoluteTargetPath);

      if (stats.isDirectory()) {
        if (existsSync(absoluteTargetPath + "/index.js")) {
          absoluteTargetPath += "/index.js";
        } else if (existsSync(absoluteTargetPath + "/index.ts")) {
          absoluteTargetPath += "/index.ts";
        } else {
          throw new Error("Cannot find source: " + absoluteTargetPath);
        }
      }

      this._sources.set(absoluteTargetPath, readFile(absoluteTargetPath));
    }

    return this._sources.get(absoluteTargetPath);
  }

  getExports(filePath: string): Export[] {
    const absolutePath = this.resolvePath(filePath);

    if (!this._exportMap.has(absolutePath)) {
      this._exportMap.set(
        absolutePath,
        this._exportFactory.extract(
          absolutePath,
          this.getAbstractSyntaxTree(absolutePath)
        )
      );
    }

    return this._exportMap.get(absolutePath);
  }

  extractTypes(): void {
    if (!this._elementMap || !this._relationMap || !this._objectMap) {
      this._typeExtractor.extractAll(this);
      this._elementMap = this._typeExtractor.elementMap;
      this._relationMap = this._typeExtractor.relationMap;
      this._objectMap = this._typeExtractor.objectMap;
    }
  }

  resolveTypes(): void {
    if (!this._typeModel) {
      this.extractTypes();
      this._typeModel = this._typeResolver.resolveTypes(
        this._elementMap,
        this._relationMap
      ); //, this._objectMap);
    }
  }

  getTypeModel(): TypeModel {
    if (!this._typeModel) {
      this.extractTypes();
      this.resolveTypes();
      // or should this always be done beforehand?
    }

    return this._typeModel;
  }

  // getTargetMap(targetPath: string): Map<string, JavaScriptTargetMetaData> {
  //   const absoluteTargetPath = path.resolve(targetPath);

  //   if (!this._targetMap.has(absoluteTargetPath)) {
  //     const targetAST = this.getAST(absoluteTargetPath);
  //     const { targetMap, functionMap } = this.targetMapGenerator.generate(
  //       absoluteTargetPath,
  //       targetAST
  //     );

  //     const exports = this.getExports(targetPath);

  //     const finalTargetMap = new Map<string, JavaScriptTargetMetaData>();

  //     for (const key of targetMap.keys()) {
  //       const name = targetMap.get(key).name;
  //       const export_ = exports.find((export_) => export_.name === name);

  //       if (!export_) {
  //         // No export found so we cannot import it and thus not test it
  //         continue;
  //       }

  //       if (
  //         export_.type === ExportType.const &&
  //         functionMap.get(key).size === 0
  //       ) {
  //         throw new Error(
  //           `Target cannot be constant: ${name} -> ${JSON.stringify(export_)}`
  //         );
  //       }

  //       let isPrototypeClass = false;
  //       for (const function_ of functionMap.get(key).values()) {
  //         if (function_.isConstructor) {
  //           isPrototypeClass = true;
  //           break;
  //         }
  //       }

  //       // let isClass = false
  //       // if (functionMap.get(key).size > 1) {
  //       //   isClass = true
  //       // }

  //       // threat everything as a function if we don't know
  //       finalTargetMap.set(key, {
  //         name: name,
  //         type:
  //           export_.type === ExportType.class || isPrototypeClass
  //             ? SubjectType.class
  //             : export_.type === ExportType.const
  //             ? SubjectType.object
  //             : SubjectType.function,
  //         export: export_,
  //       });
  //     }

  //     this._targetMap.set(absoluteTargetPath, finalTargetMap);
  //     this._functionMaps.set(absoluteTargetPath, functionMap);
  //   }

  //   return this._targetMap.get(absoluteTargetPath);
  // }

  // getDependencies(targetPath: string): Export[] {
  //   const absoluteTargetPath = path.resolve(targetPath);

  //   if (!this._dependencyMaps.has(absoluteTargetPath)) {
  //     // Find all external imports in the file under test
  //     const imports = this.importGenerator.generate(
  //       absoluteTargetPath,
  //       this.getAST(targetPath)
  //     );

  //     // For each external import scan the file for libraries with exported functions
  //     const libraries: Export[] = [];
  //     for (const importPath of imports) {
  //       // Full path to the imported file
  //       const pathLibrary = path.join(path.dirname(targetPath), importPath);

  //       // External libraries have a different path!
  //       try {
  //         this.getSource(pathLibrary);
  //       } catch (error) {
  //         if (error.message.includes("Cannot find source")) {
  //           // TODO would be nice if we could get the actual path! (node modules)
  //           continue;

  //           // pathLib = path.join
  //         } else {
  //           throw error;
  //         }
  //       }

  //       // Scan for libraries with public or external functions
  //       const exports = this.getExports(pathLibrary);

  //       // Import the found libraries
  //       // TODO: check for duplicates in libraries
  //       libraries.push(...exports);
  //     }

  //     return libraries;

  //     // this._dependencyMaps.set(targetPath, libraries);
  //   }

  //   return this._dependencyMaps.get(absoluteTargetPath);
  // }

  // scanTargetRootDirectory(targetRootDirectory: string): void {
  //   const absoluteRootPath = path.resolve(targetRootDirectory);

  //   // TODO remove the filters
  //   const files = getAllFiles(absoluteRootPath, ".js").filter(
  //     (x) =>
  //       !x.includes("/test/") &&
  //       !x.includes(".test.js") &&
  //       !x.includes("node_modules")
  //   ); // maybe we should also take those into account

  //   const objects: ComplexType[] = [];
  //   const objectGenerator = new ObjectGenerator();

  //   for (const file of files) {
  //     const exports = this.getExports(file);
  //     objects.push(
  //       ...objectGenerator.generate(
  //         file,
  //         this.getAbstractSyntaxTree(file),
  //         exports
  //       )
  //     );
  //   }

  //   // standard stuff
  //   // function https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
  //   objects.push(
  //     {
  //       name: "function",
  //       properties: new Set([
  //         "arguments",
  //         "caller",
  //         "displayName",
  //         "length",
  //         "name",
  //       ]),
  //       functions: new Set(["apply", "bind", "call", "toString"]),
  //       propertyType: new Map<string, TypeProbability>([
  //         ["arguments", new TypeProbability([[TypeEnum.ARRAY, 1, undefined]])],
  //         ["caller", new TypeProbability([[TypeEnum.FUNCTION, 1, undefined]])],
  //         [
  //           "displayName",
  //           new TypeProbability([[TypeEnum.STRING, 1, undefined]]),
  //         ],
  //         ["length", new TypeProbability([[TypeEnum.NUMERIC, 1, undefined]])],
  //         ["name", new TypeProbability([[TypeEnum.STRING, 1, undefined]])],
  //       ]),
  //     },

  //     // array https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
  //     {
  //       name: "array",
  //       properties: new Set(["length"]),
  //       functions: new Set([
  //         "at",
  //         "concat",
  //         "copyWithin",
  //         "entries",
  //         "fill",
  //         "filter",
  //         "find",
  //         "findIndex",
  //         "flat",
  //         "flatMap",
  //         "includes",
  //         "indexOf",
  //         "join",
  //         "keys",
  //         "lastIndexOf",
  //         "map",
  //         "pop",
  //         "push",
  //         "reduce",
  //         "reduceRight",
  //         "reverse",
  //         "shift",
  //         "slice",
  //         "toLocaleString",
  //         "toString",
  //         "unshift",
  //         "values",
  //       ]),
  //       propertyType: new Map<string, TypeProbability>([
  //         ["length", new TypeProbability([[TypeEnum.NUMERIC, 1, undefined]])],
  //       ]),
  //     },

  //     // string
  //     {
  //       name: "string",
  //       properties: new Set(["length"]),
  //       functions: new Set([
  //         "at",
  //         "charAt",
  //         "charCodeAt",
  //         "codePointAt",
  //         "concat",
  //         "includes",
  //         "endsWith",
  //         "indexOf",
  //         "lastIndexOf",
  //         "localeCompare",
  //         "match",
  //         "matchAll",
  //         "normalize",
  //         "padEnd",
  //         "padStart",
  //         "repeat",
  //         "replace",
  //         "replaceAll",
  //         "search",
  //         "slice",
  //         "split",
  //         "startsWith",
  //         "substring",
  //         "toLocaleLowerCase",
  //         "toLocaleUpperCase",
  //         "toLowerCase",
  //         "toString",
  //         "toUpperCase",
  //         "trim",
  //         "trimStart",
  //         "trimEnd",
  //         "valueOf",
  //       ]),
  //       propertyType: new Map<string, TypeProbability>([
  //         ["length", new TypeProbability([[TypeEnum.NUMERIC, 1, undefined]])],
  //       ]),
  //     }
  //   );

  //   // TODO npm dependencies
  //   // TODO get rid of duplicates

  //   const finalObjects: ComplexType[] = [];

  //   // eslint-disable-next-line unicorn/consistent-function-scoping
  //   function eqSet(as: Set<unknown>, bs: Set<unknown>) {
  //     if (as.size !== bs.size) return false;
  //     for (const a of as) if (!bs.has(a)) return false;
  //     return true;
  //   }

  //   for (const o of objects) {
  //     if (o.properties.size === 0 && o.functions.size === 0) {
  //       continue;
  //     }

  //     const found = finalObjects.find((o2) => {
  //       return (
  //         o.export === o2.export && // TODO not sure if you can compare exports like this
  //         o.name === o2.name &&
  //         eqSet(o.properties, o2.properties) &&
  //         eqSet(o.functions, o2.functions)
  //       );
  //     });

  //     if (!found) {
  //       finalObjects.push(o);
  //     }
  //   }

  //   const generator = new VariableGenerator();
  //   const elements: Element[] = [];
  //   const relations: Relation[] = [];
  //   const wrapperElementIsRelation: Map<string, Relation> = new Map();

  //   for (const file of files) {
  //     const [_elements, _relations, _wrapperElementIsRelation] =
  //       generator.generate(file, this.getAbstractSyntaxTree(file));

  //     elements.push(..._elements);
  //     relations.push(..._relations);

  //     for (const key of _wrapperElementIsRelation.keys()) {
  //       wrapperElementIsRelation.set(key, _wrapperElementIsRelation.get(key));
  //     }
  //   }

  //   this._typeResolver.resolveTypes(
  //     elements,
  //     relations,
  //     wrapperElementIsRelation,
  //     finalObjects
  //   );

  // }

  getElement(id: string): Element {
    if (!this._elementMap || !this._elementMap.has(id)) {
      this.extractTypes();
    }
    return this._elementMap.get(id);
  }

  getRelation(id: string): Relation {
    if (!this._relationMap || !this._relationMap.has(id)) {
      this.extractTypes();
    }
    return this._relationMap.get(id);
  }

  getObject(id: string): DiscoveredObjectType {
    if (!this._objectMap || !this._objectMap.has(id)) {
      this.extractTypes();
    }
    return this._objectMap.get(id);
  }
}
