const ip = require('ip');
const isLoopback = require('./is-loopback');

module.exports = function isLocal(address) {
  return isLoopback(address) || ip.isEqual(address, '::0');
};
