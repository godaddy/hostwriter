const isLoopback = require('./is-loopback');
const isSameAddress = require('./is-same-address');

const unspecifiedAddresses = ['0.0.0.0', '::'];

module.exports = function isLocal(address) {
  return isLoopback(address) || unspecifiedAddresses.some(unspecified => isSameAddress(address, unspecified));
};
