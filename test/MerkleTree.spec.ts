import { MerkleTree } from "../src";
import crypto from "crypto";
import { expect } from "chai";

function sha256(data: Uint8Array): Uint8Array {
    return crypto
        .createHash('sha256')
        .update(data)
        .digest();
}

describe("MerkleTree", () => {
    describe('#getRoot', () => {
        let leafValues: string[];
        let leafHashes: Uint8Array[];
        let expectedRootHex: string;

        beforeEach(() => {
            leafValues = ['a', 'b', 'c', 'd', 'e', 'f'];
            leafHashes = leafValues.map((x) => sha256(Buffer.from(x)));

            expectedRootHex = '1f7379539707bcaea00564168d1d4d626b09b73f8a2a365234c62d763f854da2';
        });

        it('should get a correct root', () => {
            const merkleTree = new MerkleTree(leafHashes, sha256);

            const hexRoot = Buffer.from(merkleTree.getRoot()).toString('hex');

            expect(hexRoot).to.be.equal(expectedRootHex);
        })
    })
});