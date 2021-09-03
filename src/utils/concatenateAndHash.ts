export default function concatAndHash(
  leftNode: Uint8Array,
  rightNode: Uint8Array,
  hashFunction: (data: Uint8Array) => Uint8Array,
): Uint8Array {
  return rightNode ? hashFunction(new Uint8Array([...leftNode, ...rightNode])) : leftNode;
}
