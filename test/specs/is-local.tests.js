const { expect } = require('chai');
const isLocal = require('../../lib/utils/is-local');

describe('is-local', () => {
  [
    '127.0.0.1', '::1', '::ffff:127.0.0.1',
    '0.0.0.0', '::', '::0', '0:0:0:0:0:0:0:0', '::ffff:0.0.0.0'
  ].forEach(address => {
    it(`returns true for ${address}`, () => {
      expect(isLocal(address)).to.equal(true);
    });
  });

  ['26.73.84.1', '2001:db8::1', '1::', 'garbage', '', null].forEach(address => {
    it(`returns false for ${address === '' ? 'an empty string' : address}`, () => {
      expect(isLocal(address)).to.equal(false);
    });
  });
});
