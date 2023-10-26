/*
 * Copyright 2023-2023 SynTest contributors
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

export const shouldNeverHappen = (bugLocation: string) =>
  `This should never happen.\nThere is likely a bug in the ${bugLocation}.`;

export const tooManyIncoming = (node: string) =>
  `Edge Contraction error\nCannot merge nodes.\nNode ${node} has more than one incoming edge.`;
export const tooManyOutgoing = (node: string) =>
  `Edge Contraction error\nCannot merge nodes.\nNode ${node} has more than one outgoing edge.`;
export const notDirectlyConnected = (node1: string, node2: string) =>
  `Edge Contraction error\nCannot merge nodes.\nNodes ${node1} and ${node2} are not directly connected.`;
export const cannotMergeEntryAndExit = () =>
  `Edge Contraction error\nCannot merge entry and exit nodes.`;
export const exactlyOneEdgeShouldBeRemoved = (
  node1: string,
  node2: string,
  amount: number
) =>
  `Edge Contraction error\nExactly one edge should be removed when merging nodes ${node1} and ${node2}.\nRemoved: ${amount}.`;
export const exactlyOneNodeShouldBeRemoved = (
  node1: string,
  node2: string,
  amount: number
) =>
  `Edge Contraction error\nExactly one node should be removed when merging nodes ${node1} and ${node2}.\nRemoved: ${amount}.`;

export const duplicateNodeId = (id: string) =>
  `Control Flow Graph error\nDuplicate node id found.\nNode id: ${id}.`;
export const duplicateNodeInMappping = () =>
  `Control Flow Graph error\nDuplicate node found in mapping.`;
export const nodeNotFoundInMapping = (node: string) =>
  `Control Flow Graph error\nNode ${node} not found in mapping.`;
