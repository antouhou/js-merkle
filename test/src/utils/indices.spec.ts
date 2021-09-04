import { expect } from 'chai';
import { maxLeavesCountAtDepth } from '../../../src/utils/indices';

describe('utils/indices', () => {
  describe('maxLeavesCountAtDepth', () => {
    it('should give max leaves count for a certain tree depth', () => {
      expect(maxLeavesCountAtDepth(2)).to.be.equal(4);
      expect(maxLeavesCountAtDepth(3)).to.be.equal(8);
      expect(maxLeavesCountAtDepth(4)).to.be.equal(16);
      expect(maxLeavesCountAtDepth(5)).to.be.equal(32);
      expect(maxLeavesCountAtDepth(6)).to.be.equal(64);
    });
  });
});
