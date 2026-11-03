const { expect } = require('chai');
const isLoopback = require('../../lib/utils/is-loopback');

describe('is-loopback', () => {
  ['127.0.0.1', '127.255.255.254', '::1', '0:0:0:0:0:0:0:1', '::ffff:127.0.0.1'].forEach(address => {
    it(`returns true for ${address}`, () => {
      expect(isLoopback(address)).to.equal(true);
    });
  });

  ['0.0.0.0', '128.0.0.1', '26.73.84.1', '::', 'fe80::1', '2001:db8::1', 'garbage', '', null].forEach(address => {
    it(`returns false for ${address === '' ? 'an empty string' : address}`, () => {
      expect(isLoopback(address)).to.equal(false);
    });
  });
});
