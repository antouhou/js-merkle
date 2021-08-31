import { MerkleTree } from "../src";
import crypto from "crypto";
import { expect } from "chai";

function sha256(data: Uint8Array): Uint8Array {
    return crypto
        .createHash('sha256')
        .update(data)
        .digest();
}

// TODO: Test cases:
// Balanced/unbalanced
// 1 element
// 2 elements no sibling
// 2 elements siblings
// 3 elements 2 siblings and 1 not
// All elements
// Tree has one element

describe("MerkleTree", () => {
    let leafValues: string[];
    let leafHashes: Uint8Array[];
    let expectedRootHex: string;

    beforeEach(() => {
        leafValues = ['a', 'b', 'c', 'd', 'e', 'f'];
        leafHashes = leafValues.map((x) => sha256(Buffer.from(x)));

        expectedRootHex = '1f7379539707bcaea00564168d1d4d626b09b73f8a2a365234c62d763f854da2';
    });

    describe('#getRoot', () => {
        it('should get a correct root', () => {
            const merkleTree = new MerkleTree(leafHashes, sha256);

            const hexRoot = Buffer.from(merkleTree.getRoot()).toString('hex');

            expect(hexRoot).to.be.equal(expectedRootHex);
        })
    });

    describe('#getProof', () => {
        it('should get a correct proof', () => {
            // The first layer should be siblings of leaves 3 and 4, which are leaves 2 and 5
            // Since there are 6 leaves, the second layer consists of 3 nodes, 2 of which we
            // can now figure out from the first layer:
            // (node1 = hash(leaf2 + leaf3), node2 = hash(leaf4 + leaf 5)). So from the
            // second layer we need node0, and nothing from the top layer - 2 hashes from
            // there we will be able to calculate from the information we have.
            const expectedProofHashes = [
                '2e7d2c03a9507ae265ecf5b5356885a53393a2029d241394997265a1a25aefc6',
                '252f10c83610ebca1a059c0bae8255eba2f95be4d1d7bcfa89d7248a82d9f111',
                'e5a01fee14e0ed5c48714f22180f25ad8365b53f9779f79dc4a3d7e93963f94a'
            ];

            const leafIndicesToProve = [3, 4];
            // const leafHashesToProve = leafIndicesToProve.map(leafIndex => leafHashes[leafIndex]);

            const merkleTree = new MerkleTree(leafHashes, sha256);
            const merkleProof = merkleTree.getProof(leafIndicesToProve);

            const hexLayers = merkleProof
                .getProofHashes()
                .map(node => Buffer.from(node).toString('hex'));

            expect(hexLayers).to.be.deep.equal(expectedProofHashes);
        });
    });

    describe('#getTreeDepth', () => {
        it('should return a correct tree depth', () => {
            // 6 leaves - 3 layers deep tree. Tree depth generally can be figure out
            const merkleTree = new MerkleTree(leafHashes, sha256);

            expect(merkleTree.getTreeDepth()).to.be.equal(3);
        });
    });
});