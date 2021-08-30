import { MerkleProof } from "./MerkleProof";
import { isLeftIndex, getSiblingIndex, getParentIndex } from "./utils/indices";

export class MerkleTree {
    private readonly layeredTree: Uint8Array[][];
    hashFunction: (i: Uint8Array) => Uint8Array;

    /**
     * Creates layered tree from the leaf hashes
     *
     * @param {Uint8Array[]} leafHashes
     * @return {Uint8Array[][]}
     */
    private createTree(leafHashes: Uint8Array[]): Uint8Array[][] {
        // The bottom level is the leaf hashes itself
        const tree = [leafHashes];
        let nextLayer = [];
        let currentLayer = leafHashes;

        while (currentLayer.length !== 1) {
            // Ceil, so we also iterate over the last element that doesn't have sibling, if there's one
            const nextLayerNodesCount = Math.ceil(currentLayer.length / 2);

            // Filling the next layer with values
            for (let i = 0; i < nextLayerNodesCount; i++) {
                // For 0, it should be 0 and 1
                // For 1, it should be 2 and 3
                // For 2, it should be 4 and 2
                const leftNodeIndex = i * 2;
                const rightNodeIndex = leftNodeIndex + 1;

                const leftNode = currentLayer[leftNodeIndex];
                const rightNode = currentLayer[rightNodeIndex];

                let nextNodeHash;
                if (rightNode) {
                    const concatenatedBuffer = new Uint8Array([...leftNode, ...rightNode]);
                    nextNodeHash = this.hashFunction(concatenatedBuffer);
                } else {
                    nextNodeHash = leftNode;
                }

                nextLayer.push(nextNodeHash);
            }

            // Adding this layer to the tree
            tree.push(nextLayer);
            // Setting the next layer
            currentLayer = nextLayer;

            // Preparing the space for the next layer
            nextLayer = [];
        }

        return tree;
    }

    /**
     *
     * @param {Uint8Array[]} leafHashes
     * @param {function(data: Uint8Array): Uint8Array} hashFunction
     */
    constructor(leafHashes: Uint8Array[], hashFunction: (i: Uint8Array) => Uint8Array) {
        this.hashFunction = hashFunction;
        this.layeredTree = this.createTree(leafHashes);
    }

    // Public methods

    getRoot(): Uint8Array {
        return this.layeredTree[this.layeredTree.length - 1][0];
    }

    getTreeDepth(): number {
        return this.layeredTree.length;
    }
    /**
     *  Returns layered multi proof
     *
     * @param {number[]} indices
     * @return {Uint8Array[][]}
     */
    getProof(indices: number[]): MerkleProof {
        // 1. Get neighboring nodes to the ones we're trying to prove
        // 2. Figure out if we already have them among indices
        // 3. Add neighboring nodes to the proof
        // 4. Repeat until we got to the root

        const layeredProof = [];

        let currentLayerIndices = indices;
        for (let currentLayer of this.layeredTree) {
            let siblingIndices = currentLayerIndices.map(getSiblingIndex);

            // Filtering siblings that are amongst the requested indices already
            const filteredSiblings = siblingIndices.filter(siblingIndex => {
                return !currentLayerIndices.includes(siblingIndex);
            });

            // We need to filter out the node that doesn't have a sibling
            const parentIndices = filteredSiblings.map(getParentIndex);
            const currentLayerProofHashes = filteredSiblings
                .map(index => {
                    return  currentLayer[index];
                })
                .filter(proofHash => !!proofHash)

            if (currentLayerProofHashes.length > 0) {
                layeredProof.push(currentLayerProofHashes);
                currentLayerIndices = parentIndices;
            } else {
                // We have all necessary hashes to reconstruct the root in there's no indices left to prove
                // for the current layer
                break;
            }
        }

        return new MerkleProof(layeredProof, this.hashFunction);
    }
}