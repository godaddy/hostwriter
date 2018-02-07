const ip = require('ip');

module.exports = function isLoopback(address) {
  return ip.isLoopback(address);
};
