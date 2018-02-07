const path = require('path');
const proxyquire = require('proxyquire');
const { expect } = require('chai');
const OsStub = require('../stubs/os');

describe('get-host-file-path', () => {
  let getHostFilePath;
  let os;

  beforeEach(() => {
    os = new OsStub();

    getHostFilePath = proxyquire('../../lib/utils/get-host-file-path', { os });
  });

  it('returns /etc/hosts for Linux', () => {
    os.type.returns('Linux');

    expect(getHostFilePath()).to.equal('/etc/hosts');
  });

  it('returns /etc/hosts for MacOS', () => {
    os.type.returns('Darwin');

    expect(getHostFilePath()).to.equal('/etc/hosts');
  });

  it('returns /etc/hosts for MacOS', () => {
    os.type.returns('Darwin');

    expect(getHostFilePath()).to.equal('/etc/hosts');
  });

  it('returns C:\\Windows\\System32\\drivers\\etc\\hosts for Windows', () => {
    os.type.returns('Windows_NT');
    process.env.SystemRoot = 'C:\\Windows';

    expect(getHostFilePath()).to.equal(path.join('C:\\Windows', 'System32', 'drivers', 'etc', 'hosts'));
  });
});
