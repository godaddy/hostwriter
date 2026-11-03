const net = require('net');

function getFamily(address) {
  if (net.isIPv4(address)) {
    return 'ipv4';
  }
  if (net.isIPv6(address)) {
    return 'ipv6';
  }
  return null;
}

// BlockList compares addresses semantically, so it handles IPv6 notation differences
// as well as IPv4-mapped IPv6 addresses (e.g. 127.0.0.1 vs ::ffff:127.0.0.1).
module.exports = function isSameAddress(a, b) {
  const familyA = getFamily(a);
  const familyB = getFamily(b);
  if (!familyA || !familyB) {
    return false;
  }

  const list = new net.BlockList();
  list.addAddress(a, familyA);
  return list.check(b, familyB);
};
