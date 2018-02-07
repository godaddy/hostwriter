const os = require('os');
const path = require('path');

module.exports = function getHostFilePath() {
  return (os.type() === 'Windows_NT'
    ? path.join(process.env.SystemRoot, 'System32', 'drivers', 'etc', 'hosts')
    : '/etc/hosts');
};
