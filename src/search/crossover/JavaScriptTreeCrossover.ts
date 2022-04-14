/*
 * Copyright 2020-2022 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest JavaScript.
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

import { prng, Crossover, Properties } from "@syntest/framework";

import { JavaScriptTestCase } from "../../testcase/JavaScriptTestCase";
import { RootStatement } from "../../testcase/statements/root/RootStatement";
import { Statement } from "../../testcase/statements/Statement";

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
export class JavaScriptTreeCrossover implements Crossover<JavaScriptTestCase> {
  public crossOver(
    parentA: JavaScriptTestCase,
    parentB: JavaScriptTestCase
  ): JavaScriptTestCase[] {
    const rootA: RootStatement = parentA.copy().root;
    const rootB: RootStatement = parentB.copy().root;

    const queueA: any = [];

    for (
      let i = 0;
      i < rootA.getChildren().length;
      i++
    ) {
      queueA.push({
        parent: rootA,
        childIndex: i,
        child: rootA.getChildren()[i],
      });
    }

    const crossoverOptions = [];

    while (queueA.length) {
      const pair = queueA.shift();

      if (pair.child.hasChildren()) {
        pair.child.getChildren().forEach((child: Statement, index: number) => {
          queueA.push({
            parent: pair.child,
            childIndex: index,
            child: child,
          });
        });
      }

      if (prng.nextBoolean(Properties.crossover_probability)) {
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

    if (crossoverOptions.length) {
      const crossoverChoice = prng.pickOne(crossoverOptions);
      const pair = crossoverChoice.p1;
      const donorTree = crossoverChoice.p2;

      pair.parent.setChild(pair.childIndex, donorTree.child.copy());
      donorTree.parent.setChild(donorTree.childIndex, pair.child.copy());
    }

    return [
      new JavaScriptTestCase(rootA),
      new JavaScriptTestCase(rootB),
    ];
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
    const queue: any = [];
    const similar = [];

    for (let i = 0; i < tree.getChildren().length; i++) {
      queue.push({
        parent: tree,
        childIndex: i,
        child: tree.getChildren()[i],
      });
    }

    while (queue.length) {
      const pair = queue.shift();

      if (pair.child.hasChildren()) {
        pair.child.getChildren().forEach((child: Statement, index: number) => {
          queue.push({
            parent: pair.child,
            childIndex: index,
            child: child,
          });
        });
      }

      if (!wanted.classType || !pair.child.classType) {
        throw new Error("All statements require a classType!")
      }

      if (wanted.identifierDescription === pair.child.type) { // && wanted.classType === pair.child.classType) { TODO this might be necessary
        similar.push(pair);
      }
    }

    return similar;
  }
}
