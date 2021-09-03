import { getProofIndices, getParentIndices } from './utils/indices';
import { zip } from './utils/array';
import concatAndHash from './utils/concatenateAndHash';

export default class MerkleProof {
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
  getProofHashes(): Uint8Array[] {
    return this.proofHashes;
  }

  /**
  * Calculates the root based on provided leaf hashes
  *
  * @param {number[]} leafIndices
  * @param {Uint8Array[]} leafHashes
  * @param {number} totalLeavesCount
  * @return Uint8Array
  */
  calculateRoot(
    leafIndices: number[], leafHashes: Uint8Array[], totalLeavesCount: number,
  ): Uint8Array {
    const leafTuples = zip(leafIndices, leafHashes).sort(([indexA], [indexB]) => indexA - indexB);
    const proofIndices = getProofIndices(leafTuples.map(([index]) => index), totalLeavesCount);

    let nextSliceStart = 0;
    const proofTuplesByLayers = proofIndices.map((indices) => {
      const sliceStart = nextSliceStart;
      nextSliceStart += indices.length;
      return zip(indices, this.proofHashes.slice(sliceStart, nextSliceStart));
    });

    const tree = [leafTuples];

    for (let layerIndex = 0; layerIndex < proofTuplesByLayers.length; layerIndex++) {
      // Sorted by their position in the tree, so we can take pairs correctly
      const currentLayer = [...proofTuplesByLayers[layerIndex], ...tree[layerIndex]]
        .sort(([indexA], [indexB]) => indexA - indexB)
        .map(([, hash]) => hash);

      const parentIndices = getParentIndices(tree[layerIndex].map(([leafIndex]) => leafIndex));
      const parentLayer: [number, Uint8Array][] = parentIndices.map((parentNodeTreeIndex, i) => [
        parentNodeTreeIndex,
        concatAndHash(currentLayer[i * 2], currentLayer[i * 2 + 1], this.hashFunction),
      ]);

      tree.push(parentLayer);
    }

    return tree[tree.length - 1][0][1];
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
  verify(
    root: Uint8Array, leafIndices: number[], leafHashes: Uint8Array[], leavesCount: number,
  ): boolean {
    const extractedRoot = this.calculateRoot(leafIndices, leafHashes, leavesCount);
    const rootHaveSameLength = root.length === extractedRoot.length;
    return rootHaveSameLength && extractedRoot.every((byte, index) => byte === root[index]);
  }
}
