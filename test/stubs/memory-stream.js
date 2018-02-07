const { Readable } = require('stream');

module.exports = function MemoryStream(content) {
  return new Readable({
    read() {
      this.push(content);
      this.push(null);
    }
  });
};
