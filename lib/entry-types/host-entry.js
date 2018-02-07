const HostEntryBase = require('./host-entry-base');

module.exports = class HostEntry extends HostEntryBase {
  commentOut() {
    const CommentedHostEntry = require('./commented-host-entry');
    return new CommentedHostEntry(this.address, this.hosts, this.comment);
  }

  format(addressWidth, hostsWidth) {
    return `${this.address.padEnd(addressWidth + 1)} ${this.hosts.join(' ').padEnd(hostsWidth)} ${this.comment || ''}`.trim();
  }
};
