const { Observable } = require('rxjs');

module.exports = function readChunks(stream) {
  stream.pause();

  return new Observable((observer) => {
    function dataHandler(data) {
      observer.next(data);
    }

    function errorHandler(err) {
      observer.error(err);
    }

    function endHandler() {
      observer.complete();
    }

    stream.addListener('data', dataHandler);
    stream.addListener('error', errorHandler);
    stream.addListener('end', endHandler);

    stream.resume();

    return () => {
      stream.removeListener('data', dataHandler);
      stream.removeListener('error', errorHandler);
      stream.removeListener('end', endHandler);
    };
  }).share();
};
