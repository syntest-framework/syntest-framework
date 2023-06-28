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

import { Crossover } from "@syntest/search";
import { prng } from "@syntest/prng";

import { JavaScriptTestCase } from "../../testcase/JavaScriptTestCase";
import { RootStatement } from "../../testcase/statements/root/RootStatement";
import { Statement } from "../../testcase/statements/Statement";
import { ActionStatement } from "../../testcase/statements/action/ActionStatement";

interface QueueEntry {
  parent: Statement;
  childIndex: number;
  child: Statement;
}

/**
 * Creates 2 children which are each other's complement with respect to their parents.
 * i.e. given parents 000000 and 111111 a possible pair of children would be 001111 and 110000.
 * However, it is not as simple because the actual mutation works with trees.
 *
 * @param parentA the first parent individual
 * @param parentB the second parent individual
 *
 * @return a tuple of 2 children
 *
 * @author Annibale Panichella
 * @author Dimitri Stallenberg
 */
// TODO check if this still works
export class TreeCrossover extends Crossover<JavaScriptTestCase> {
  public crossOver(parents: JavaScriptTestCase[]): JavaScriptTestCase[] {
    if (parents.length !== 2) {
      throw new Error("Expected exactly 2 parents, got: " + parents.length);
    }

    const rootA: RootStatement = (<JavaScriptTestCase>parents[0].copy()).root;
    const rootB: RootStatement = (<JavaScriptTestCase>parents[1].copy()).root;

    const queueA: QueueEntry[] = [];

    for (let index = 0; index < rootA.getChildren().length; index++) {
      queueA.push({
        parent: rootA,
        childIndex: index,
        child: rootA.getChildren()[index],
      });
    }

    const crossoverOptions = [];

    while (queueA.length > 0) {
      const pair = queueA.shift();

      if (pair.child.hasChildren()) {
        for (let index = 0; index < pair.child.getChildren().length; index++) {
          queueA.push({
            parent: pair.child,
            childIndex: index,
            child: pair.child.getChildren()[index],
          });
        }
      }

      if (prng.nextBoolean(this.crossoverStatementProbability)) {
        // crossover
        const donorSubtrees = this.findSimilarSubtree(pair.child, rootB);

        for (const donorTree of donorSubtrees) {
          crossoverOptions.push({
            p1: pair,
            p2: donorTree,
          });
        }
      }
    }

    if (crossoverOptions.length > 0) {
      const crossoverChoice = prng.pickOne(crossoverOptions);
      const pair = crossoverChoice.p1;
      const donorTree = crossoverChoice.p2;

      (<ActionStatement>pair.parent).setChild(
        pair.childIndex,
        donorTree.child.copy()
      );
      (<ActionStatement>donorTree.parent).setChild(
        donorTree.childIndex,
        pair.child.copy()
      );
    }

    return [new JavaScriptTestCase(rootA), new JavaScriptTestCase(rootB)];
  }

  /**
   * Finds a subtree in the given tree which matches the wanted gene.
   *
   * @param wanted the gene to match the subtree with
   * @param tree the tree to search in
   *
   * @author Dimitri Stallenberg
   */
  protected findSimilarSubtree(wanted: Statement, tree: Statement) {
    const queue: QueueEntry[] = [];
    const similar = [];

    for (let index = 0; index < tree.getChildren().length; index++) {
      queue.push({
        parent: tree,
        childIndex: index,
        child: tree.getChildren()[index],
      });
    }

    while (queue.length > 0) {
      const pair = queue.shift();

      if (pair.child.hasChildren()) {
        for (let index = 0; index < pair.child.getChildren().length; index++) {
          queue.push({
            parent: pair.child,
            childIndex: index,
            child: pair.child.getChildren()[index],
          });
        }
      }

      if (!wanted.classType || !pair.child.classType) {
        throw new Error("All statements require a classType!");
      }

      // TODO not sure about the ids
      if (wanted.id === pair.child.id) {
        // && wanted.classType === pair.child.classType) { TODO this might be necessary
        similar.push(pair);
      }
    }

    return similar;
  }
}
