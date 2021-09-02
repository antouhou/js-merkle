import { MerkleProof } from "./MerkleProof";
import { getSiblingIndex, getParentIndices } from "./utils/indices";

export class MerkleTree {
    private readonly layeredTree: Uint8Array[][];
    private readonly hashFunction: (i: Uint8Array) => Uint8Array;

    /**
     * Creates layered tree from the leaf hashes
     *
     * @param {Uint8Array[]} leafHashes
     * @return {Uint8Array[][]}
     */
    private createTree(leafHashes: Uint8Array[]): Uint8Array[][] {
        // The bottom level is the leaf hashes itself
        const tree = [leafHashes];
        let parentLayer = [];
        let currentLayer = leafHashes;

        while (currentLayer.length !== 1) {
            // Ceil, so we also iterate over the last element that doesn't have sibling, if there's one
            const parentNodesCount = Math.ceil(currentLayer.length / 2);

            // Filling the parent layer with values
            for (let parentNodeIndex = 0; parentNodeIndex < parentNodesCount; parentNodeIndex++) {
                const leftChild = currentLayer[parentNodeIndex * 2];
                const rightChild = currentLayer[parentNodeIndex * 2 + 1];

                let nextNodeHash;
                if (rightChild) {
                    const concatenatedBuffer = new Uint8Array([...leftChild, ...rightChild]);
                    nextNodeHash = this.hashFunction(concatenatedBuffer);
                } else {
                    nextNodeHash = leftChild;
                }

                parentLayer.push(nextNodeHash);
            }

            // Adding this layer to the tree
            tree.push(parentLayer);
            // Setting the next layer
            currentLayer = parentLayer;

            // Preparing the space for the next layer
            parentLayer = [];
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

    /**
     * Returns tree depth. Tree depth is needed for the proof verification
     *
     * @return {number}
     */
    getDepth(): number {
        return this.layeredTree.length - 1;
    }
    /**
     *  Returns merkle proof for the given leaf indices
     *
     * @param {number[]} leafIndices
     * @return {MerkleProof}
     */
    getProof(leafIndices: number[]): MerkleProof {
        // 1. Get neighboring nodes to the ones we're trying to prove
        // 2. Figure out if we already have them among indices
        // 3. Add neighboring nodes to the proof
        // 4. Repeat until we got to the root

        const proofLayers = [];

        let currentLayerIndices = leafIndices;
        for (let treeLayer of this.layeredTree) {
            let siblingIndices = currentLayerIndices.map(getSiblingIndex);

            // Filtering siblings that are amongst the requested indices already
            const filteredSiblings = siblingIndices.filter(siblingIndex => {
                return !currentLayerIndices.includes(siblingIndex);
            });

            const parentIndices = getParentIndices(currentLayerIndices);
            // We need to filter out nodes that do not have a sibling
            const currentLayerProofHashes = filteredSiblings
                .map(index =>  treeLayer[index])
                .filter(proofHash => !!proofHash)

            proofLayers.push(currentLayerProofHashes);
            currentLayerIndices = parentIndices;
        }

        return new MerkleProof(Array.prototype.concat(...proofLayers), this.hashFunction);
    }

    getLayers() {
        return this.layeredTree;
    }
}