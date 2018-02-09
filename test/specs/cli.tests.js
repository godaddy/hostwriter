const proxyquire = require('proxyquire');
const { match, spy } = require('sinon');
const { expect } = require('chai');
const { Writable } = require('stream');
const FsStub = require('../stubs/fs');
const MemoryStream = require('../stubs/memory-stream');

describe('The command-line interface', () => {
  let fs, writtenFile;

  beforeEach(() => {
    spy(console, 'log');
    spy(console, 'error');

    fs = new FsStub();
    stubWriteStream();
  });

  afterEach(() => {
    console.log.restore();
    console.error.restore();
  });

  describe('help command', () => {
    it('prints a usage message', async () => {
      process.argv = ['/bin/node', 'hostfile', 'help'];

      await invokeCLI();

      expect(console.log).to.have.been.calledWithMatch(match(str => str.includes('Usage')));
    });
  });

  describe('query command with an invalid subject', () => {
    it('points the user to the help command', async () => {
      stubHostFile('');
      process.argv = ['/bin/node', 'hostfile', 'query', 'puppies'];

      await invokeCLI();

      expect(console.error).to.have.been.calledWithMatch(match(str => str.includes('hostfile help')));
    });
  });

  describe('query host command', () => {
    it('prints matching host entries', async () => {
      stubHostFile(`
        127.0.0.1 example.com
        127.0.0.1 other.com
      `);

      process.argv = ['/bin/node', 'hostfile', 'query', 'host', 'example.com'];
      await invokeCLI();

      expect(console.log).to.have.been.calledWith('127.0.0.1  example.com');
    });

    it('supports wildcards', async () => {
      stubHostFile(`
        62.6.62.3 example.com
        127.0.0.1 dev.example.com
        127.0.0.1 dev.other.com
      `);

      process.argv = ['/bin/node', 'hostfile', 'query', 'host', 'dev.*'];
      await invokeCLI();

      expect(console.log).to.have.been.calledWith('127.0.0.1  dev.example.com');
      expect(console.log).to.have.been.calledWith('127.0.0.1  dev.other.com');
    });
  });

  describe('query address command', () => {
    it('prints matching address entries', async () => {
      stubHostFile(`
        127.0.0.1   example.com
        127.0.0.1   other.com
        62.35.73.2  third.com
      `);

      process.argv = ['/bin/node', 'hostfile', 'query', 'address', '127.0.0.1'];
      await invokeCLI();

      expect(console.log).to.have.been.calledWith('127.0.0.1  example.com');
      expect(console.log).to.have.been.calledWith('127.0.0.1  other.com');
    });
  });

  describe('point command', () => {
    it('points the user to the help command if the command was invoked improperly', async () => {
      stubHostFile('');
      process.argv = ['/bin/node', 'hostfile', 'point', 'puppies'];

      await invokeCLI();

      expect(console.error).to.have.been.calledWithMatch(match(str => str.includes('hostfile help')));
    });

    it('adds entries if the host is not in the file', async () => {
      stubHostFile(`
127.0.0.1   example.com
127.0.0.1   other.com
62.35.73.2  third.com`);

      process.argv = ['/bin/node', 'hostfile', 'point', 'fourth.com', 'to', '127.0.0.1'];
      await invokeCLI();

      expect(writtenFile).to.equal(`
127.0.0.1   example.com
127.0.0.1   other.com
62.35.73.2  third.com
127.0.0.1   fourth.com`);
    });

    it('uncomments entries that match', async () => {
      stubHostFile(`
#127.0.0.1  example.com
127.0.0.1   other.com
62.35.73.2  third.com`);

      process.argv = ['/bin/node', 'hostfile', 'point', 'example.com', 'to', '127.0.0.1'];
      await invokeCLI();

      expect(writtenFile).to.equal(`
127.0.0.1   example.com
127.0.0.1   other.com
62.35.73.2  third.com`);
    });

    it('comments out entries that match and are referencing a different address', async () => {
      stubHostFile(`
127.0.0.1   example.com
127.0.0.1   other.com
62.35.73.2  third.com`);

      process.argv = ['/bin/node', 'hostfile', 'point', 'example.com', 'to', '68.23.67.72'];
      await invokeCLI();

      expect(writtenFile).to.equal(`
#127.0.0.1   example.com
68.23.67.72  example.com
127.0.0.1    other.com
62.35.73.2   third.com`);
    });
  });

  describe('reset command', () => {
    it('comments out matching hosts', async () => {
      stubHostFile(`
127.0.0.1   example.com
127.0.0.1   other.com
62.35.73.2  third.com`);

      process.argv = ['/bin/node', 'hostfile', 'reset', 'other.com'];
      await invokeCLI();

      expect(writtenFile).to.equal(`
127.0.0.1   example.com
#127.0.0.1  other.com
62.35.73.2  third.com`);
    });
  });

  function stubHostFile(contents) {
    fs.createReadStream.withArgs('/etc/hosts').returns(new MemoryStream(contents));
  }

  function invokeCLI() {
    return proxyquire.noPreserveCache().noCallThru()('../../lib/cli', {
      './host-writer': proxyquire.noCallThru()('../../lib/host-writer', { fs })
    });
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
