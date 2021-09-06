# JS-MERKLE

<a href='https://www.npmjs.com/package/js-merkle' target='_blank'><img src='https://img.shields.io/npm/v/js-merkle' alt='NPM Version' /></a>
<a href='https://coveralls.io/github/antouhou/js-merkle?branch=refs/tags/v0.1.2'><img src='https://coveralls.io/repos/github/antouhou/js-merkle/badge.svg?branch=refs/tags/v0.1.2' alt='Coverage Status' /></a>
<img src='https://github.com/antouhou/js-merkle/workflows/Build%20and%20test/badge.svg' alt="Build status" />

This is a library for working with merkle trees. It supports building Merkle trees, creating Merkle proofs including multi proofs, and verifying Merkle proofs.

### The key advantages of this library:

- Zero dependencies - safer to use in the project, as it doesn't bring anything with it
- Tiny size
- Multi proof support
- Codebase is well-structured and easy to understand

## Usage

### Creating a Merkle proof:
```javascript
import { MerkleTree } from 'js-merkle';

const leafValues = ['a', 'b', 'c', 'd', 'e', 'f'];
const leafs = leafValues.map((x) => sha256(Buffer.from(x)));

const merkleTree = new MerkleTree(leafHashes, sha256);
// Getting a proof for a single element ('b' in leafValues):
const proof = merkleTree.getProof([1]);
// Getting a multiproof ('b' and 'd' in leafValues):
const multiProof = merkleTree.getProof([1,3]);
// Getting proof hashes to serialize the proof:
const proofHashes = multiProof.getProofHashes();
```

### Verifying the proof:
```javascript
import { MerkleTree, MerkleProof } from 'js-merkle';

const leafValues = ['a', 'b', 'c', 'd', 'e', 'f'];
const leafs = leafValues.map((x) => sha256(Buffer.from(x)));
const merkleTree = new MerkleTree(leafHashes, sha256);
const root = merkleTree.getRoot();

const proof = new MerkleProof(proofHashes, sha256);
const leavesCount = 6;
const leafsIndiciesToVerify = [1, 3];
const isVerified = proof.verify(root, leafsIndiciesToVerify, [leafs[1], leafs[3]], leavesCount);

console.log('Verification successfull:', isVerified);
```

### Alternatively to just verifying the proof, you can extract the root:
Change the .verify line in the verification example to:
```javascript
const extractedRoot = proof.calculateRoot(leafsIndiciesToVerify, [leafs[1], leafs[3]], leavesCount);
```

### Serializing the proof:
```javascript
import { MerkleTree, MerkleProof } from 'js-merkle';

const leafValues = ['a', 'b', 'c', 'd', 'e', 'f'];
const leafs = leafValues.map((x) => sha256(Buffer.from(x)));
const merkleTree = new MerkleTree(leafHashes, sha256);
const root = merkleTree.getRoot();

const proof = new MerkleProof(proofHashes, sha256);
// To buffer, for node.js or if you have a buffer polyfill in your app:
const proofBuffer = proof.toBuffer();
// To Uint8Array, if you plan to use the lib in the browser:
const proofArray = proof.toBytes();
```

### Parsing a serialized proof:
```javascript
import { MerkleTree, MerkleProof } from 'js-merkle';

const leafValues = ['a', 'b', 'c', 'd', 'e', 'f'];
const leafs = leafValues.map((x) => sha256(Buffer.from(x)));
const merkleTree = new MerkleTree(leafHashes, sha256);
const root = merkleTree.getRoot();

const proof = new MerkleProof(proofHashes, sha256);
const proofBuffer = proof.toBuffer();
const proofArray = proof.toBytes();

// From a proof serialized to buffer:
const restoredProofFromBuffer = MerkleProof.fromBuffer(proofBuffer, sha256);
// From a proof serialized to a Uint8Array:
const restoredProofFromBuffer = MerkleProof.fromBytes(proofArray, sha256);
```

## Contributing

Everyone is welcome to contribute in any way of form! For the further details, please read [CONTRIBUTING.md](./CONTRIBUTING.md)

## Authors
- [Anton Suprunchuk](https://github.com/antouhou) - [Website](https://antouhou.com)

See also the list of contributors who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](./LICENSE.md) file for details
