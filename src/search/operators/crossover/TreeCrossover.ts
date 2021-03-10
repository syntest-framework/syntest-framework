import { getProperty, prng, Statement, TestCase } from "../../..";

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
 * @author Dimitri Stallenberg
 */
export function TreeCrossover(parentA: TestCase, parentB: TestCase) {
  const rootA = parentA.root.copy();
  const rootB = parentB.root.copy();

  const queueA: any = [];

  for (let i = 0; i < rootA.getChildren().length; i++) {
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

    if (prng.nextBoolean(getProperty("crossover_probability"))) {
      // crossover
      const donorSubtrees = findSimilarSubtree(pair.child, rootB);

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

  return [new TestCase(rootA), new TestCase(rootB)];
}

/**
 * Finds a subtree in the given tree which matches the wanted gene.
 *
 * @param wanted the gene to match the subtree with
 * @param tree the tree to search in
 *
 * @author Dimitri Stallenberg
 */
function findSimilarSubtree(wanted: Statement, tree: Statement) {
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

    if (wanted.type === pair.child.type) {
      similar.push(pair);
    }
  }

  return similar;
}
