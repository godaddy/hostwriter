const { stub } = require('sinon');

module.exports = function OsStub() {
  return {
    type: stub()
  };
};
