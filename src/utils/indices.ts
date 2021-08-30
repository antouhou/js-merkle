export function isLeftIndex(index: number): boolean {
    return index % 2 === 0;
}

export function getSiblingIndex(index: number): number {
    if (isLeftIndex(index)) {
        // Right sibling index
        return index + 1;
    } else {
        // Left sibling index
        return index - 1;
    }
}

export function getParentIndex(index: number): number {
    if (isLeftIndex(index)) {
        return index / 2;
    } else {
        return getSiblingIndex(index) / 2
    }
}
