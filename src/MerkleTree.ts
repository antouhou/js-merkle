import MerkleProof from './MerkleProof';
import { getSiblingIndex, getParentIndices, getTreeDepth } from './utils/indices';
import concatAndHash from './utils/concatenateAndHash';
import { range } from './utils/array';

interface ProofAccumulator {
  currentLayerIndices: number[],
  proofHashes: Uint8Array[]
}

export default class MerkleTree {
  private readonly layers: Uint8Array[][];

  private readonly hashFunction: (i: Uint8Array) => Uint8Array;

  private calculateParentLayer(nodes: Uint8Array[]): Uint8Array[] {
    const parentLayerNodesCount = Math.ceil(nodes.length / 2);
    return range(0, parentLayerNodesCount)
      .map((i) => concatAndHash(nodes[i * 2], nodes[i * 2 + 1], this.hashFunction));
  }

  /**
   * Creates layered tree from the leaf hashes
   *
   * @param {Uint8Array[]} leafHashes
   * @return {Uint8Array[][]}
   */
  private createTree(leafHashes: Uint8Array[]): Uint8Array[][] {
    return range(0, getTreeDepth(leafHashes.length))
      .reduce((tree, layerIndex) => [
        ...tree, this.calculateParentLayer(tree[layerIndex]),
      ], [leafHashes]);
  }

  /**
   *
   * @param {Uint8Array[]} leafHashes
   * @param {function(data: Uint8Array): Uint8Array} hashFunction
   */
  constructor(leafHashes: Uint8Array[], hashFunction: (i: Uint8Array) => Uint8Array) {
    this.hashFunction = hashFunction;
    this.layers = this.createTree(leafHashes);
  }

  // Public methods

  getRoot(): Uint8Array {
    return this.layers[this.layers.length - 1][0];
  }

  /**
   * Returns tree depth. Tree depth is needed for the proof verification
   *
   * @return {number}
   */
  getDepth(): number {
    return this.layers.length - 1;
  }

  /**
   *  Returns merkle proof for the given leaf indices
   *
   * @param {number[]} leafIndices
   * @return {MerkleProof}
   */
  getProof(leafIndices: number[]): MerkleProof {
    // Proof consists of all siblings hashes that aren't in the set we're trying to prove
    // 1. Get all sibling indices. Those are the indices we need to get to the root
    // 2. Filter all nodes that doesn't require an additional hash
    // 3. Get all hashes for indices from step 2
    // 4. Remove empty spaces (the leftmost nodes that do not have anything to the right)7
    const { proofHashes: proof } = this.layers.reduce((
      { currentLayerIndices, proofHashes }: ProofAccumulator, treeLayer,
    ) => ({
      currentLayerIndices: getParentIndices(currentLayerIndices),
      proofHashes: [
        ...proofHashes,
        ...currentLayerIndices
          .map(getSiblingIndex)
          .filter((siblingIndex) => !currentLayerIndices.includes(siblingIndex))
          .map((index) => treeLayer[index])
          .filter((proofHash) => !!proofHash)],
    }),
    {
      currentLayerIndices: leafIndices,
      proofHashes: [],
    });

    return new MerkleProof(proof, this.hashFunction);
  }

  getLayers(): Uint8Array[][] {
    return this.layers;
  }
}
