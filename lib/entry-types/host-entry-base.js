const ip = require('ip');

module.exports = class HostEntryBase {
  constructor(address, hosts, comment) {
    this.address = address;
    this.hosts = hosts;
    this.comment = comment;
  }

  referencesHost(host) {
    host = host.toLowerCase();
    return this.hosts.some(entryHost => entryHost.toLowerCase() === host);
  }

  referencesOnlyHost(host) {
    return this.hosts.length === 1 && this.referencesHost(host);
  }

  matchesAddress(address) {
    return address && ip.isEqual(address, this.address);
  }
};
