import { difference, range } from './array';

export interface LayerInfo {
  index: number;
  leavesCount: number;
}

export function isLeftIndex(index: number): boolean {
  return index % 2 === 0;
}

export function getSiblingIndex(index: number): number {
  if (isLeftIndex(index)) {
    // Right sibling index
    return index + 1;
  }
  // Left sibling index
  return index - 1;
}

export function getParentIndex(index: number): number {
  if (isLeftIndex(index)) {
    return index / 2;
  }
  return getSiblingIndex(index) / 2;
}

export function getParentIndices(indices: number[]): number[] {
  // new Set removed all duplicates if two nodes were siblings
  return [...new Set(indices.map(getParentIndex))];
}

export function getTreeDepth(leavesCount: number): number {
  return Math.ceil(Math.log2(leavesCount));
}

export function maxLeavesCountAtDepth(depth: number): number {
  return 2 ** depth;
}

export function getUnevenLayers(treeLeavesCount: number): LayerInfo[] {
  let leavesCount = treeLeavesCount;
  const depth = getTreeDepth(treeLeavesCount);

  const unevenLayers = [];

  for (let index = 0; index < depth; index++) {
    const unevenLayer = leavesCount % 2 !== 0;
    if (unevenLayer) {
      unevenLayers.push({ index, leavesCount });
    }

    leavesCount = Math.ceil(leavesCount / 2);
  }

  return unevenLayers;
}

export function getProofIndices(sortedLeafIndices: number[], leavesCount: number): number[][] {
  const depth = getTreeDepth(leavesCount);
  const unevenLayers = getUnevenLayers(leavesCount);
  const proofIndices: number[][] = [];

  range(0, depth).reduce((layerNodes, layerIndex) => {
    const siblingIndices = layerNodes.map(getSiblingIndex);
    // Figuring out indices that are already siblings and do not require additional hash
    // to calculate the parent
    let proofNodesIndices = difference(siblingIndices, layerNodes);

    // The last node of that layer doesn't have another hash to the right, so doesn't
    const unevenLayer = unevenLayers.find(({ index }) => index === layerIndex);
    if (unevenLayer && layerNodes.includes(unevenLayer.leavesCount - 1)) {
      proofNodesIndices = proofNodesIndices.slice(0, -1);
    }

    proofIndices.push(proofNodesIndices);
    // Passing parent nodes indices to the next iteration cycle
    return getParentIndices(layerNodes);
  }, sortedLeafIndices);

  return proofIndices;
}
