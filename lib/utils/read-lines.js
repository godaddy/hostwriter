const os = require('os');
const { Observable } = require('rxjs');
const readChunks = require('./read-chunks');

module.exports = function readLines(stream) {
  let buffer = '';

  return readChunks(stream)
    .materialize()
    .mergeMap(msg => {
      if (msg.hasValue) {
        buffer += msg.value;
        const lines = buffer.split(os.EOL);
        const linesToEmit = Observable.of(...lines.slice(0, lines.length - 1));
        buffer = lines[lines.length - 1] || '';
        return linesToEmit;
      } else if (msg.kind === 'C') {
        return buffer ? Observable.of(buffer) : Observable.empty();
      }
      return Observable.throw(msg.error);

    });
};
