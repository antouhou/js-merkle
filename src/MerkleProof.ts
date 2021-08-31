import { getSiblingIndex, getParentIndex } from "./utils/indices";

export class MerkleProof {
    private readonly hashFunction: (i: Uint8Array) => Uint8Array;
    private readonly proofHashes: Uint8Array[];

    constructor(proofHashes: Uint8Array[], hashFunction: (i: Uint8Array) => Uint8Array) {
        this.proofHashes = proofHashes;
        this.hashFunction = hashFunction;
    }

    /**
     * Returns the hashes that make the proof
     *
     * @return {Uint8Array[]}
     */
    getProofHashes() {
        return this.proofHashes;
    }

    /**
     *
     *
     * @param {number[]} leafIndices
     * @param {Uint8Array[]} leafHashes
     * @param {number} treeDepth
     *
     * @return {Uint8Array}
     */
    getRoot(leafIndices: number[], leafHashes: Uint8Array[], treeDepth: number): Uint8Array {
        // Indices needs to be sorted so the logic with the unbalanced layer would work, for
        // the details look at notPreRootLayer and logic below it.
        let currentLayerIndices = leafIndices.slice().sort();
        let currentLayerNodes = leafHashes;

        let proofHashesRemaining = this.proofHashes.slice();

        // Tree depth is the amount of layers we should have on top of the leaf layer
        for (let layerNumber = 0; layerNumber < treeDepth; layerNumber++) {
            const nextLayerNodes: Uint8Array[] = [];
            const nextLayerIndices: number[] = [];

            const currentLayerSiblingIndices = currentLayerIndices.map(getSiblingIndex);
            // Figuring out what are the indices of the nodes in the current layer
            let proofNodesIndices = currentLayerSiblingIndices
                .filter(siblingIndex => !currentLayerIndices.includes(siblingIndex));

            // If there are only two hashes left and we haven't reached root level just yet,
            // that means that the hash that's left belongs to the top level, and we need to
            // propagate the highest index
            const notPreRootLayerYet = treeDepth - layerNumber > 1;
            const onlyOneHashLeftInTheProof = proofHashesRemaining.length === 1;
            const onlyOneHashAtTheCurrentLayer = currentLayerNodes.length === 1;
            const skipProofHash = notPreRootLayerYet && onlyOneHashLeftInTheProof && onlyOneHashAtTheCurrentLayer;

            // TODO: this is for the balanced tree, for an unbalanced tree works a bit differently
            if (skipProofHash) {
                // TODO: probably can just set it up to [], slicing by that point is kind of pointless
                proofNodesIndices = proofNodesIndices.slice(0, -1);
            }

            const proofNodesCount = proofNodesIndices.length;
            // Getting n elements from the beginning of the remaining proof hashes
            const proofNodesOnCurrentLayer = proofHashesRemaining.slice(0, proofNodesCount);
            // Slicing first n elements from the remaining hashes
            proofHashesRemaining = proofHashesRemaining.slice(proofNodesCount);

            const combinedNodes: {
                [key: string]: Uint8Array;
            } = {};

            for (let i = 0; i < proofNodesOnCurrentLayer.length; i++) {
                combinedNodes[proofNodesIndices[i]] = proofNodesOnCurrentLayer[i];
            }

            for (let i = 0; i < currentLayerNodes.length; i++) {
                combinedNodes[currentLayerIndices[i]] = currentLayerNodes[i];
            }

            const nextLayerNodesCount = Math.ceil(Object.keys(combinedNodes).length / 2);

            // Filling the next layer with values
            for (let i = 0; i < nextLayerNodesCount; i++) {
                const leftNodeKey = i * 2;
                const rightNodeKey = leftNodeKey + 1;

                const leftNodeIndex = Object.keys(combinedNodes)[leftNodeKey];
                const rightNodeIndex = Object.keys(combinedNodes)[rightNodeKey];

                const leftNode = combinedNodes[leftNodeIndex];
                const rightNode = combinedNodes[rightNodeIndex];

                let nextNodeHash: Uint8Array;
                if (rightNode) {
                    const concatenatedBuffer = new Uint8Array([...leftNode, ...rightNode]);
                    nextNodeHash = this.hashFunction(concatenatedBuffer);
                } else {
                    nextNodeHash = leftNode;
                }

                nextLayerNodes.push(nextNodeHash);
                nextLayerIndices.push(getParentIndex(Number(leftNodeIndex)));
            }

            currentLayerNodes = nextLayerNodes;
            currentLayerIndices = nextLayerIndices;
        }

        return currentLayerNodes[0];
    }

    /**
     * Verifies the proof for a given root and leaves
     *
     * @param {Uint8Array} root - expected root
     * @param {number[]} leafIndices - positions of the leaves in the original tree
     * @param {Uint8Array[]} leafHashes - leaf hashes to verify
     * @param {number} treeDepth - tree depth
     *
     * @return {boolean}
     */
    verify(root: Uint8Array, leafIndices: number[], leafHashes: Uint8Array[], treeDepth: number): boolean {
        const extractedRoot = this.getRoot(leafIndices, leafHashes, treeDepth);
        const rootHaveSameLength = root.length === extractedRoot.length;
        return rootHaveSameLength && extractedRoot.every((byte, index) => { return byte === root[index] });
    }
}