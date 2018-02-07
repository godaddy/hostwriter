const { stub } = require('sinon');

module.exports = function FsStub() {
  return {
    createReadStream: stub(),
    createWriteStream: stub()
  };
};
