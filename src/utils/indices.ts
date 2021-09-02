export function isLeftIndex(index: number): boolean {
    return index % 2 === 0;
}

export function getSiblingIndex(index: number): number {
    if (isLeftIndex(index)) {
        // Right sibling index
        return index + 1;
    } else {
        // Left sibling index
        return index - 1;
    }
}

export function getParentIndex(index: number): number {
    if (isLeftIndex(index)) {
        return index / 2;
    } else {
        return getSiblingIndex(index) / 2
    }
}

export function getTreeDepthFromLeavesCount(leavesCount: number): number {
    return Math.ceil(Math.log2(leavesCount));
}

export function maxLeavesCountAtDepth(depth: number): number {
    return 2 ** depth;
}

export function getUnevenLayers(treeLeavesCount: number): { leavesCount: number, layerIndex: number }[] {
    let layerElements = treeLeavesCount;
    const unevenLayers = [];
    const depth = getTreeDepthFromLeavesCount(treeLeavesCount);

    for (let i = 0; i < depth; i++) {
        const unevenLayer = layerElements % 2 !== 0;
        if (unevenLayer) {
            unevenLayers.push({ leavesCount: layerElements, layerIndex: i });
        }

        layerElements = Math.ceil(layerElements / 2);
    }

    return unevenLayers;
}

export function getProofIndices(sortedLeafIndices: number[], leavesCount: number): number[][] {
    // layer, indices
    const depth = getTreeDepthFromLeavesCount(leavesCount);
    const unevenLayers = getUnevenLayers(leavesCount);
    const proofIndices: number[][] = [];

    let currentLayerIndices = sortedLeafIndices.slice();
    for (let layerNumber = 0; layerNumber < depth; layerNumber++) {

        const currentLayerSiblingIndices = currentLayerIndices.map(getSiblingIndex);
        // Figuring out indices that are already siblings and do not require additional hash
        // to calculate the parent
        let proofNodesIndices = currentLayerSiblingIndices
            .filter(siblingIndex => !currentLayerIndices.includes(siblingIndex));

        // The last node of that layer doesn't have another hash to the right, so doesn't
        const unevenLayer = unevenLayers.find(layer => { return layer.layerIndex === layerNumber });
        if (unevenLayer && currentLayerIndices.includes(unevenLayer.leavesCount - 1)) {
            proofNodesIndices = proofNodesIndices.slice(0, -1);
        }

        // To iterate over current layer parent on the next layer
        currentLayerIndices = getParentIndices(currentLayerIndices);
        proofIndices.push(proofNodesIndices);
    }

    return proofIndices;
}

export function getParentIndices(indices: number[]) {
    // new Set removed all duplicates if two nodes were siblings
    return [...new Set(indices.map(getParentIndex))];
}
