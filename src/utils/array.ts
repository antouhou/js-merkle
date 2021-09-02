export function zip<T, U>(a: T[], b: U[]): [T, U][] {
    if (a.length != b.length) {
        throw new Error('Can not zip, as arrays have different length');
    }

    return a.map((value, index) => [value, b[index]]);
}