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
        let currentLayerIndices = leafIndices;
        let currentLayerNodes = leafHashes;

        let proofHashesRemaining = this.proofHashes.slice();

        for (let i = 0; i < treeDepth; i++) {
            const nextLayerNodes: Uint8Array[] = [];
            const nextLayerIndices: number[] = [];

            const currentLayerSiblingIndices = currentLayerIndices.map(getSiblingIndex);
            // Figuring out what are the indices of the nodes in the current layer
            const proofNodesIndices = currentLayerSiblingIndices.filter(siblingIndex => !currentLayerIndices.includes(siblingIndex));
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