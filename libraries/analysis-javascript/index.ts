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
export * from "./lib/ast/AbstractSyntaxTreeFactory";
export * from "./lib/ast/defaultBabelConfig";

export * from "./lib/cfg/ControlFlowGraphFactory";
export * from "./lib/cfg/ControlFlowGraphVisitor";

export * from "./lib/constant/ConstantPool";
export * from "./lib/constant/ConstantPoolFactory";
export * from "./lib/constant/ConstantPoolManager";
export * from "./lib/constant/ConstantVisitor";

export * from "./lib/dependency/DependencyFactory";
export * from "./lib/dependency/DependencyVisitor";

export * from "./lib/target/export/Export";
export * from "./lib/target/export/ExportDefaultDeclaration";
export * from "./lib/target/export/ExportFactory";
export * from "./lib/target/export/ExportNamedDeclaration";
export * from "./lib/target/export/ExportVisitor";
export * from "./lib/target/export/ExpressionStatement";

export * from "./lib/target/Target";
export * from "./lib/target/TargetFactory";
export * from "./lib/target/TargetVisitor";
export * from "./lib/target/VisibilityType";

export * from "./lib/type/discovery/element/Element";
export * from "./lib/type/discovery/element/ElementVisitor";

export * from "./lib/type/discovery/object/DiscoveredType";
export * from "./lib/type/discovery/object/ObjectVisitor";

export * from "./lib/type/discovery/relation/Relation";
export * from "./lib/type/discovery/relation/RelationVisitor";

export * from "./lib/type/discovery/TypeExtractor";

export * from "./lib/type/resolving/Type";
export * from "./lib/type/resolving/TypeEnum";
export * from "./lib/type/resolving/TypeModel";
export * from "./lib/type/resolving/TypeModelFactory";
export * from "./lib/type/resolving/InferenceTypeModelFactory";

export * from "./lib/utils/fileSystem";

export * from "./lib/Events";
export * from "./lib/RootContext";
