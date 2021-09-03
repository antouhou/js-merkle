import { difference, range } from './array';

export type layerInfo = {
  leavesCount: number;
  layerIndex: number;
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

export function getUnevenLayers(treeLeavesCount: number): layerInfo[] {
  let leavesCountOnTheLayer = treeLeavesCount;
  const depth = getTreeDepth(treeLeavesCount);

  const unevenLayers = [];

  for (let i = 0; i < depth; i++) {
    const unevenLayer = leavesCountOnTheLayer % 2 !== 0;
    if (unevenLayer) {
      unevenLayers.push({ leavesCount: leavesCountOnTheLayer, layerIndex: i });
    }

    leavesCountOnTheLayer = Math.ceil(leavesCountOnTheLayer / 2);
  }

  return unevenLayers;
}

export function getProofIndices(sortedLeafIndices: number[], leavesCount: number): number[][] {
  const depth = getTreeDepth(leavesCount);
  const unevenLayers = getUnevenLayers(leavesCount);
  const proofIndices: number[][] = [];

  range(0, depth).reduce((currentLayerIndices, layerIndex) => {
    const currentLayerSiblingIndices = currentLayerIndices.map(getSiblingIndex);
    // Figuring out indices that are already siblings and do not require additional hash
    // to calculate the parent
    let proofNodesIndices = difference(currentLayerSiblingIndices, currentLayerIndices);

    // The last node of that layer doesn't have another hash to the right, so doesn't
    const unevenLayer = unevenLayers.find((layer) => layer.layerIndex === layerIndex);
    if (unevenLayer && currentLayerIndices.includes(unevenLayer.leavesCount - 1)) {
      proofNodesIndices = proofNodesIndices.slice(0, -1);
    }

    proofIndices.push(proofNodesIndices);
    return getParentIndices(currentLayerIndices);
  }, sortedLeafIndices);

  return proofIndices;
}
