export function zip<T, U>(a: T[], b: U[]): [T, U][] {
  if (a.length !== b.length) {
    throw new Error('Can not zip, as arrays have different length');
  }

  return a.map((value, index) => [value, b[index]]);
}

export function flatten<T>(arrays: T[][]): T[] {
  return Array.prototype.concat(...arrays);
}

function combine<T>(active: T[], rest: T[], combinations: T[][]): T[][] {
  if (!active.length && !rest.length) { return combinations; }
  if (!rest.length) {
    combinations.push(active);
  } else {
    combine([...active, rest[0]], rest.slice(1), combinations);
    combine(active, rest.slice(1), combinations);
  }
  return combinations;
}

export function createCombinations<T>(arr: T[]): T[][] {
  // Initial call
  return combine([], arr, []);
}

export function range(start: number, end: number): number[] {
  return Array.from({ length: (end - start) }, (v, k) => k + start);
}

export function difference<T>(a: T[], b: T[]): T[] {
  return a.filter((siblingIndex) => !b.includes(siblingIndex));
}
