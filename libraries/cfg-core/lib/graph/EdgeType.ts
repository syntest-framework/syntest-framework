/*
 * Copyright 2020-2023 Delft University of Technology and SynTest contributors
 *
 * This file is part of SynTest Framework - SynTest Core.
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

export enum EdgeType {
  NORMAL,
  EXCEPTION,
  TRUE,
  FALSE,

  /**
   * A back edge is an edge that points to a block that has already been met during a depth-first (DFS) traversal of the graph. Back edges are typical of loops.
   * https://en.wikipedia.org/wiki/Control-flow_graph
   */
  BACK_EDGE,
  /**
   * A critical edge is an edge which is neither the only edge leaving its source block, nor the only edge entering its destination block. These edges must be split: a new block must be created in the middle of the edge, in order to insert computations on the edge without affecting any other edges.
   * https://en.wikipedia.org/wiki/Control-flow_graph
   */
  CRITICAL_EDGE,
  /**
   * An abnormal edge is an edge whose destination is unknown. Exception handling constructs can produce them. These edges tend to inhibit optimization.
   * https://en.wikipedia.org/wiki/Control-flow_graph
   */
  ABNORMAL_EDGE,
  /**
   * An impossible edge (also known as a fake edge) is an edge which has been added to the graph solely to preserve the property that the exit block postdominates all blocks. It cannot ever be traversed.
   * https://en.wikipedia.org/wiki/Control-flow_graph
   */
  IMPOSSIBLE_EDGE,
}
