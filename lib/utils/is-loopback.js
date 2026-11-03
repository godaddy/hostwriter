const net = require('net');

const loopbacks = new net.BlockList();
loopbacks.addSubnet('127.0.0.0', 8, 'ipv4');
loopbacks.addAddress('::1', 'ipv6');

module.exports = function isLoopback(address) {
  if (net.isIPv4(address)) {
    return loopbacks.check(address, 'ipv4');
  }
  if (net.isIPv6(address)) {
    return loopbacks.check(address, 'ipv6');
  }
  return false;
};
