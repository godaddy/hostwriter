const { stub } = require('sinon');
const proxyquire = require('proxyquire');
const { expect } = require('chai');
const { Writable } = require('stream');
const { EOL } = require('os');
const MemoryStream = require('../stubs/memory-stream');
const FsStub = require('../stubs/fs');

describe('host-writer', () => {
  let HostWriter;
  let fs;
  let writtenFile;

  beforeEach(() => {
    fs = new FsStub();
    stubWriteStream();

    HostWriter = proxyquire('../../lib/host-writer', { fs });
  });

  describe('isLocal method', () => {
    [
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '::0'
    ].forEach(address => {
      it(`resolves to true if a host is pointed to ${address}`, () => {
        return expectIsLocalFor(address);
      });
    });

    it('resolves to false if the host is pointing to a non-local address', () => {
      return expectIsNotLocalFor('26.73.84.1');
    });

    it('resolves to false if the host is not pointing to anything', () => {
      return expectIsLocalResultForHostFile('', 'example.com', false);
    });

    function expectIsLocalFor(address) {
      return expectIsLocalResult(address, true);
    }

    function expectIsNotLocalFor(address) {
      return expectIsLocalResult(address, false);
    }

    function expectIsLocalResult(address, result) {
      const host = 'example.com';
      const content = `${address}   ${host}`;
      return expectIsLocalResultForHostFile(content, host, result);
    }

    async function expectIsLocalResultForHostFile(content, host, result) {
      stubHostFile(content);

      const isLocal = await new HostWriter({ hostFilePath: '/etc/hosts' }).isLocal(host);

      expect(isLocal).to.equal(result);
    }
  });

  describe('pointLocal method', () => {
    it('does nothing if the host is already pointing to 127.0.0.1', async () => {
      stubHostFile('127.0.0.1 example.com');

      await new HostWriter().pointLocal('example.com');

      expect(fs.createWriteStream).to.have.not.been.called;
    });

    it('adds a new line to the file if the host has never been listed in the file before', async () => {
      stubHostFile('');

      await new HostWriter().pointLocal('example.com');

      expect(writtenFile).to.equal('127.0.0.1  example.com');
    });

    it('un-comments any previous line matching the request', async () => {
      stubHostFile('#127.0.0.1 example.com');

      await new HostWriter().pointLocal('example.com');

      expect(writtenFile).to.equal('127.0.0.1  example.com');
    });

    it('comments out any active host entries matching the request', async () => {
      stubHostFile(`
62.62.87.234 example.com  # Production`);

      await new HostWriter().pointLocal('example.com');

      expect(writtenFile).to.equal(`
#62.62.87.234 example.com # Production
127.0.0.1     example.com`);
    });

    it('inserts new lines next to adjacent lines pertaining to the host', async () => {
      stubHostFile(`
#62.62.87.234 example.com # Production
#62.62.87.234 another.com # Production`);

      await new HostWriter().pointLocal('example.com');

      expect(writtenFile).to.equal(`
#62.62.87.234 example.com # Production
127.0.0.1     example.com
#62.62.87.234 another.com # Production`);
    });
  });

  describe('point method', () => {
    it('preserves comments and blank lines', async () => {
      stubHostFile(`
## Production systems
#62.62.87.234 example.com
#62.62.87.234 another.com

## Development`);

      await new HostWriter().point({ 'dev.example.com': '127.0.0.1' });

      expect(writtenFile).to.equal(`
## Production systems
#62.62.87.234 example.com
#62.62.87.234 another.com

## Development
127.0.0.1     dev.example.com`);
    });

    it('preserves invalid lines', async () => {
      stubHostFile(`
## Production systems
#62.62.87.234 example.com
#62.62.87.234 another.com
62.75.23.62

## Development`);

      await new HostWriter().point({ 'dev.example.com': '127.0.0.1' });

      expect(writtenFile).to.equal(`
## Production systems
#62.62.87.234 example.com
#62.62.87.234 another.com
62.75.23.62

## Development
127.0.0.1     dev.example.com`);
    });
  });

  describe('reset method', () => {
    it('does nothing if no matching entry is present', async () => {
      stubHostFile('#127.0.0.1 example.com');

      await new HostWriter().reset('example.com');

      expect(fs.createWriteStream).to.have.not.been.called;
    });

    it('comments out matching entries', async () => {
      stubHostFile('127.0.0.1 example.com');

      await new HostWriter().reset('example.com');

      expect(writtenFile).to.equal('#127.0.0.1 example.com');
    });
  });

  describe('untilExit method', () => {
    it('assigns the given host addresses, then resets on exit signals', async () => {
      try {
        stub(process, 'once').returnsThis();
        stub(process, 'exit');
        stubHostFile('#127.0.0.1 example.com');

        await new HostWriter().untilExit({
          'example.com': '127.0.0.1',
          'beta.example.com': '127.0.0.2'
        });

        expect(writtenFile).to.equal(['127.0.0.1  example.com', '127.0.0.2  beta.example.com'].join(EOL));
        stubHostFile(writtenFile);
        stubWriteStream();

        const sigtermHandler = process.once.args.find(([handler]) => handler === 'SIGTERM')[1];
        await sigtermHandler();

        expect(writtenFile).to.equal(['#127.0.0.1 example.com', '#127.0.0.2 beta.example.com'].join(EOL));
      } finally {
        process.once.restore();
        process.exit.restore();
      }
    });
  });

  function stubHostFile(contents) {
    fs.createReadStream.withArgs('/etc/hosts').returns(new MemoryStream(contents));
  }

  function stubWriteStream() {
    writtenFile = '';
    fs.createWriteStream.withArgs('/etc/hosts').returns(new Writable({
      write(chunk, encoding, cb) {
        writtenFile += chunk;
        cb(null);
      }
    }));
  }
});
