const { expect } = require('chai');
const isSameAddress = require('../../lib/utils/is-same-address');

describe('is-same-address', () => {
  [
    ['identical IPv4 addresses', '127.0.0.1', '127.0.0.1'],
    ['identical IPv6 addresses', '2001:db8::1', '2001:db8::1'],
    ['compressed and expanded IPv6 addresses', '::1', '0:0:0:0:0:0:0:1'],
    ['IPv6 addresses differing only in case', '2001:DB8::1', '2001:db8::1'],
    ['IPv6 addresses with and without leading zeros', '2001:0db8::0001', '2001:db8::1'],
    ['an IPv4 address and its IPv4-mapped IPv6 form', '127.0.0.1', '::ffff:127.0.0.1'],
    ['an IPv4 address and its hex IPv4-mapped IPv6 form', '127.0.0.1', '::ffff:7f00:1'],
    ['the IPv4 and IPv6 unspecified addresses written differently', '::', '::0']
  ].forEach(([description, a, b]) => {
    it(`treats ${description} as the same (${a}, ${b})`, () => {
      expect(isSameAddress(a, b)).to.equal(true);
    });

    it(`gives the same answer with the arguments reversed (${b}, ${a})`, () => {
      expect(isSameAddress(b, a)).to.equal(true);
    });
  });

  [
    ['different IPv4 addresses', '1.2.3.4', '1.2.3.5'],
    ['different IPv6 addresses', '2001:db8::1', '2001:db8::2'],
    ['an IPv4 address and an unrelated IPv6 address', '127.0.0.1', '::1'],
    ['an IPv4 address and a different IPv4-mapped IPv6 address', '127.0.0.1', '::ffff:127.0.0.2']
  ].forEach(([description, a, b]) => {
    it(`treats ${description} as different (${a}, ${b})`, () => {
      expect(isSameAddress(a, b)).to.equal(false);
      expect(isSameAddress(b, a)).to.equal(false);
    });
  });

  [
    ['garbage', 'not-an-ip'],
    ['an empty string', ''],
    ['null', null],
    ['an IPv4 address with an out-of-range octet', '256.0.0.1']
  ].forEach(([description, invalid]) => {
    it(`returns false instead of throwing for ${description}`, () => {
      expect(isSameAddress(invalid, '127.0.0.1')).to.equal(false);
      expect(isSameAddress('127.0.0.1', invalid)).to.equal(false);
      expect(isSameAddress(invalid, invalid)).to.equal(false);
    });
  });
});
