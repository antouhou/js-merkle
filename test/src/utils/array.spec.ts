import { expect } from 'chai';
import { flatten, zip } from '../../../src/utils/array';

describe('utils/array', () => {
  describe('flatten', () => {
    it('should flatten an array', () => {
      const arr = [[1, 2], [3, 4]];
      expect(flatten(arr)).to.be.deep.equal([1, 2, 3, 4]);
    });
  });

  describe('zip', () => {
    it('should throw an error if passed arrays length do not matach', () => {
      expect(() => zip([1, 2], [3, 4, 5])).to.throw('Can not zip, as arrays have different length');
    });
  });
});
