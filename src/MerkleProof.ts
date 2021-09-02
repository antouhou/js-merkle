import { getProofIndices, getParentIndices } from "./utils/indices";
import { zip } from "./utils/array";

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

    calculateRootWithLeavesCount(leafIndices: number[], leafHashes: Uint8Array[], totalLeavesCount: number): Uint8Array {
        let leafTuples = zip(leafIndices, leafHashes).sort((tupleA, tupleB) => tupleA[0] - tupleB[0]);

        const proofIndices = getProofIndices(leafTuples.map(tuple => tuple[0]), totalLeavesCount);
        let proofsProcessed = 0;
        const proofTuplesByLayers = proofIndices.map((proofLayerIndices, i) => {
            const sliceStart = proofsProcessed;
            const sliceEnd = proofsProcessed + proofLayerIndices.length;
            proofsProcessed = sliceEnd;
            return zip(proofLayerIndices, this.proofHashes.slice(sliceStart, sliceEnd))
        });

        // Tree depth is the amount of layers we should have on top of the leaf layer
        for (let layerIndex = 0; layerIndex < proofTuplesByLayers.length; layerIndex++) {
            // Sorted by their position in the tree, so we can take pairs correctly
            const allNodesTuples = [...proofTuplesByLayers[layerIndex], ...leafTuples]
                .sort((a, b) => a[0] - b[0]);

            const parentIndices = getParentIndices(leafTuples.map(tuple => tuple[0]));
            leafTuples = parentIndices.map((parentNodeTreeIndex, i) => {
                const leftChild = allNodesTuples[i * 2];
                const rightChild = allNodesTuples[i * 2 + 1];

                // If there's a right child, hash left and right, otherwise return left
                return [
                    parentNodeTreeIndex,
                    rightChild ? this.hashFunction(new Uint8Array([...leftChild[1], ...rightChild[1]])) : leftChild[1]
                ];
            });
        }

        return leafTuples[0][1];
    }

    /**
     * Verifies the proof for a given root and leaves
     *
     * @param {Uint8Array} root - expected root
     * @param {number[]} leafIndices - positions of the leaves in the original tree
     * @param {Uint8Array[]} leafHashes - leaf hashes to verify
     * @param {number} leavesCount - amount of leaves in the original tree
     *
     * @return {boolean}
     */
    verify(root: Uint8Array, leafIndices: number[], leafHashes: Uint8Array[], leavesCount: number): boolean {
        const extractedRoot = this.calculateRootWithLeavesCount(leafIndices, leafHashes, leavesCount);
        const rootHaveSameLength = root.length === extractedRoot.length;
        return rootHaveSameLength && extractedRoot.every((byte, index) => { return byte === root[index] });
    }
}