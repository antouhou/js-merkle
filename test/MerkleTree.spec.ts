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
// 1 element:
//  - First branch: left, and right
//  - Middle branch: left and right
//  - Last branch: left and right
// 2 elements:
//  - First and last branch, no siblings
//  - First branch, siblings
// 3 elements:
//  - 2 siblings from the first branch and 1 element from the last
//  - 3 elements from the first, middle and last branches
// All elements
// Tree has one element

function createHashesForBalancedTree() {
    return ['a', 'b', 'c', 'd', 'e', 'f'].map((x) => sha256(Buffer.from(x)));
}

class MerkleTreeTestCase {
    constructor(hashes: Buffer[]) {
    }
}

class MerkleProofTestCase {
    leafHashes: Uint8Array[];
    leafIndicesToProve: number[];
    leafHashesToProve: Uint8Array[];
    expectedRoot: Uint8Array;
    title: string;

    constructor(leafHashes: Uint8Array[], leafIndicesToProve: number[], expectedRoot: Uint8Array) {
        const titlePrefix = 'should get a correct root'

        this.leafHashes = leafHashes;
        this.leafIndicesToProve = leafIndicesToProve;
        this.leafHashesToProve = this.leafIndicesToProve.map((index) => this.leafHashes[index]);

        this.expectedRoot = expectedRoot;

        const isBalancedTree = leafHashes.length % 2 === 0;
        this.title = `${titlePrefix} from a ${isBalancedTree ? 'balanced' : 'unbalanced'} tree for ${leafIndicesToProve.length} elements`;

    }

}

const testCases = [
    new MerkleProofTestCase(
        ['a', 'b', 'c', 'd', 'e', 'f'].map((x) => sha256(Buffer.from(x))),
        [0],
        Buffer.from('1f7379539707bcaea00564168d1d4d626b09b73f8a2a365234c62d763f854da2')
    ),
];

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