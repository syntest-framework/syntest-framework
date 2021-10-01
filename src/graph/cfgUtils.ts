/**
 * @author Dimitri Stallenberg
 */
export function createLoops(cfg: any) {
  const nonFinals: any[] = [];
  const loopNode: any[] = [];
  for (const node of cfg.nodes) {
    if (node.loop) {
      loopNode.push(node);
      nonFinals.push([]);
      continue;
    }

    // end of entire loop
    if (node.endLoop) {
      if (!loopNode.length) {
        // Should not be possible!
        throw new Error();
      }
      const startOfLoop = loopNode.pop();
      const nonFinalNodes = nonFinals.pop();

      for (const nonFinalNode of nonFinalNodes) {
        cfg.edges.push({
          from: nonFinalNode.id,
          to: startOfLoop.id,
          type: "-",
        });
      }
    }

    if (!loopNode.length) {
      continue;
    }

    // is it a non final node
    if (!node.final) {
      // node should not have further paths
      if (cfg.edges.find((e: any) => e.from === node.id)) {
        continue;
      }

      nonFinals[nonFinals.length - 1].push(node);
    }
  }
}

export function connectNonFinalNodes(cfg: any) {
  const nonFinals = [];
  for (const node of cfg.nodes) {
    if (node.absoluteRoot) {
      // new function definition so break and make the loose nodes final
      for (const nonFinalNode of nonFinals) {
        nonFinalNode.final = true;
      }
      nonFinals.length = 0;
      nonFinals.push(node);
      continue;
    }

    if (node.type === "root") {
      // connect all nonFinals to this root
      for (const nonFinalNode of nonFinals) {
        cfg.edges.push({
          from: nonFinalNode.id,
          to: node.id,
          type: "-",
        });
      }

      nonFinals.length = 0;
      continue;
    }

    if (node.endLoop) {
      nonFinals.length = 0;
      continue;
    }

    // is it a non final node
    if (!node.final) {
      // node should not have further paths
      if (cfg.edges.find((e: any) => e.from === node.id)) {
        continue;
      }

      nonFinals.push(node);
    }

    // TODO somehow connect the nodes
  }

  cfg.nodes[cfg.nodes.length - 1].final = true;
}

export function finalizeCFG(cfg: any) {
  cfg.nodes.sort((a: any, b: any) => a.line - b.line);

  connectNonFinalNodes(cfg);
  createLoops(cfg);

  return cfg;
}
