import { getSiblingIndex, getParentIndex } from "./utils/indices";

export class MerkleProof {
    hashFunction: (i: Uint8Array) => Uint8Array;
    layeredProofData: Uint8Array[][];

    constructor(layeredProofData: Uint8Array[][], hashFunction: (i: Uint8Array) => Uint8Array) {
        this.layeredProofData = layeredProofData;
        this.hashFunction = hashFunction;
    }

    getRoot(indices: number[], leafHashes: Uint8Array[], treeDepth: number): Uint8Array {
        let currentLayerNodes = leafHashes;
        let currentLayerIndices = indices;

        // The first one is the deepest layer
        for (let i = 0; i < treeDepth; i++) {
            // This is next layer nodes that will be hashed with nodes from the proof
            const currentProofLayerNodes = this.layeredProofData[i] ? this.layeredProofData[i] : [];
            const nextLayerNodes: Uint8Array[] = [];
            const nextLayerIndices: number[] = [];

            const currentLayerSiblingIndices = currentLayerIndices.map(getSiblingIndex);
            // Figuring out what are the indices of the nodes in the current layer
            const proofNodesIndices = currentLayerSiblingIndices.filter(siblingIndex => !currentLayerIndices.includes(siblingIndex));

            const combinedNodes: {
                [key: string]: Uint8Array;
            } = {};

            for (let i = 0; i < currentProofLayerNodes.length; i++) {
                combinedNodes[proofNodesIndices[i]] = currentProofLayerNodes[i];
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

    verify(indices: number[], leafHashes: Uint8Array[], treeDepth: number) {}
}