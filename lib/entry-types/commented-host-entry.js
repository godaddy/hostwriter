const HostEntryBase = require('./host-entry-base');

module.exports = class CommentedHostEntry extends HostEntryBase {
  uncomment() {
    const HostEntry = require('./host-entry');
    return new HostEntry(this.address, this.hosts, this.comment);
  }

  format(addressWidth, hostsWidth) {
    return `#${this.address.padEnd(addressWidth)} ${this.hosts.join(' ').padEnd(hostsWidth)} ${this.comment || ''}`.trim();
  }
};
