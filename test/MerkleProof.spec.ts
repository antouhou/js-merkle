import { MerkleTree, MerkleProof } from "../src";
import crypto from "crypto";
import { expect } from "chai";

function sha256(data: Uint8Array): Uint8Array {
    return crypto
        .createHash('sha256')
        .update(data)
        .digest();
}

class MerkleProofTestCase {
    leafHashes: Uint8Array[];
    leafIndicesToProve: number[];
    leafHashesToProve: Uint8Array[];
    expectedRoot: Uint8Array;
    title: string;

    constructor(leafHashes: Uint8Array[], leafIndicesToProve: number[], expectedRoot: Uint8Array) {
        this.leafHashes = leafHashes;
        this.leafIndicesToProve = leafIndicesToProve;
        this.leafHashesToProve = this.leafIndicesToProve.map((index) => this.leafHashes[index]);

        this.expectedRoot = expectedRoot;

        const isBalancedTree = leafHashes.length % 2 === 0;
        this.title = `from a ${isBalancedTree ? 'balanced' : 'unbalanced'} tree for ${leafIndicesToProve.length} elements at positions ${leafIndicesToProve}`;

    }

}

const caseVariants = {
    TREE_TYPES: {
        BALANCED: 'balanced',
        UNBALANCED: 'unbalanced'
    },
}

function createCombinations(arr: number[]) {
    function fn(active: number[], rest: number[], a: number[][]) {
        if (!active.length && !rest.length)
            return a;
        if (!rest.length) {
            a.push(active);
        } else {
            fn([...active, rest[0]], rest.slice(1), a);
            fn(active, rest.slice(1), a);
        }
        return a;
    }

    // Initial call
    return fn([], arr, []);

}

const balancedItems = ['a', 'b', 'c', 'd', 'e', 'f'];
const balancedItemsTreeRootHex = '1f7379539707bcaea00564168d1d4d626b09b73f8a2a365234c62d763f854da2';
const unbalancedItems = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

const balancedCombinatons = createCombinations([0,1,2,3,4,5]);
console.log('Total combinations:', balancedCombinatons?.length);
const unbalancedCombinatons = createCombinations([0,1,2,3,4,5,6]);
console.log('Total combinations:', unbalancedCombinatons?.length);

function createTestCases() {
    let balancedTestCases = balancedCombinatons.map((combination) => {
        return new MerkleProofTestCase(
            ['a', 'b', 'c', 'd', 'e', 'f'].map((x) => sha256(Buffer.from(x))),
            combination,
            Buffer.from('1f7379539707bcaea00564168d1d4d626b09b73f8a2a365234c62d763f854da2', 'hex')
        );
    });
    let unbalancedTestCases: MerkleProofTestCase[] = unbalancedCombinatons.map((combination) => {
        return new MerkleProofTestCase(
            ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((x) => sha256(Buffer.from(x))),
            combination,
            Buffer.from('e2a80e0e872a6c6eaed37b4c1f220e1935004805585b5f99617e48e9c8fe4034', 'hex')
        );
    });;

    return [...balancedTestCases, ...unbalancedTestCases]
}

const testCases = createTestCases();

describe("MerkleProof", () => {
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

            const leafIndicesToProve = [3, 4];
            const leafHashesToProve = leafIndicesToProve.map(leafIndex => leafHashes[leafIndex]);

            const merkleProof = merkleTree.getProof(leafIndicesToProve);
            const treeDepth = merkleTree.getTreeDepth();

            const binaryRoot = merkleProof.getRoot(leafIndicesToProve, leafHashesToProve, treeDepth);

            const hexRoot = Buffer
                .from(binaryRoot)
                .toString('hex');

            expect(hexRoot).to.be.equal(expectedRootHex);
        });
        describe('should get a correct root', () => {
            testCases.forEach(testCase => {
                it(testCase.title, () => {
                    const merkleTree = new MerkleTree(testCase.leafHashes, sha256);

                    const leafIndicesToProve = testCase.leafIndicesToProve;
                    const leafHashesToProve = testCase.leafHashesToProve;

                    const merkleProof = merkleTree.getProof(leafIndicesToProve);

                    if (leafIndicesToProve[0] === 1 && leafIndicesToProve[1] === 3 && leafIndicesToProve.length === 2) {
                        console.log('LOOK HERE!');
                        // Only 0 and 2 are present. This is correct, however we also need hash at index 1 from the top layer
                        console.log(merkleProof.getProofHashes());
                    }

                    const treeDepth = merkleTree.getTreeDepth();

                    const root = merkleProof.getRoot(leafIndicesToProve, leafHashesToProve, treeDepth);

                    expect(Buffer.from(root).toString('hex')).to.be.equal(Buffer.from(testCase.expectedRoot).toString('hex'));
                });
            });
        })
    });

    describe('#verify', () => {
        it('should return true the root matches the expected root', () => {
            const hexProofHashes = [
                '2e7d2c03a9507ae265ecf5b5356885a53393a2029d241394997265a1a25aefc6',
                '252f10c83610ebca1a059c0bae8255eba2f95be4d1d7bcfa89d7248a82d9f111',
                'e5a01fee14e0ed5c48714f22180f25ad8365b53f9779f79dc4a3d7e93963f94a'
            ];

            const binaryProofHashes = hexProofHashes.map((hash) => Buffer.from(hash, 'hex'));
            const binaryRoot = Buffer.from(expectedRootHex, 'hex');

            const leafIndicesToProve = [3, 4];
            const leafHashesToProve = leafIndicesToProve.map(leafIndex => leafHashes[leafIndex]);

            const merkleProof = new MerkleProof(binaryProofHashes, sha256);
            const treeDepth = 3;

            const verified = merkleProof.verify(binaryRoot, leafIndicesToProve, leafHashesToProve, treeDepth);

            expect(verified).to.be.true;
        });

        it('should return false if the root does not match the expected root', () => {
            const merkleTree = new MerkleTree(leafHashes, sha256);

            const leafIndicesToProve = [3, 4];

            const merkleProof = merkleTree.getProof(leafIndicesToProve);
            const treeDepth = merkleTree.getTreeDepth();
            const root = merkleTree.getRoot();

            const incorrectHashes = [leafHashes[1], leafHashes[4]];

            const verified = merkleProof.verify(root, leafIndicesToProve, incorrectHashes, treeDepth);

            expect(verified).to.be.false;
        })
    });

    describe('#getProofHashes', () => {
        it('should return correct proof hashes', () => {
            const expectedFlattenedProofHashes = [
                '2e7d2c03a9507ae265ecf5b5356885a53393a2029d241394997265a1a25aefc6',
                '252f10c83610ebca1a059c0bae8255eba2f95be4d1d7bcfa89d7248a82d9f111',
                'e5a01fee14e0ed5c48714f22180f25ad8365b53f9779f79dc4a3d7e93963f94a'
            ];
            const leafIndicesToProve = [3, 4];

            const merkleTree = new MerkleTree(leafHashes, sha256);
            const merkleProof = merkleTree.getProof(leafIndicesToProve);

            const hexHashes = merkleProof
                .getProofHashes()
                .map(node => Buffer.from(node).toString('hex'));

            expect(hexHashes).to.be.deep.equal(expectedFlattenedProofHashes);
        });
    });
});