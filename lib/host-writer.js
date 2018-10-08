const { createReadStream, createWriteStream, watch } = require('fs');
const { Readable } = require('stream');
const { EOL } = require('os');
const { Observable } = require('rxjs');
const mapObject = require('./utils/map-object');
const forEachKey = require('./utils/for-each-key');
const getHostFilePath = require('./utils/get-host-file-path');
const readLines = require('./utils/read-lines');
const isLocal = require('./utils/is-local');
const Mutex = require('./utils/mutex');
const parseHostFileLine = require('./entry-types/parse');
const HostEntryBase = require('./entry-types/host-entry-base');
const HostEntry = require('./entry-types/host-entry');
const CommentedHostEntry = require('./entry-types/commented-host-entry');

module.exports = class HostWriter {
  constructor({ hostFilePath } = {}) {
    this.hostFilePath = hostFilePath || getHostFilePath();
    this.mutex = new Mutex();
  }

  async isLocal(host) {
    host = host.toLowerCase();

    await this.mutex.acquire();

    try {
      return new Promise((resolve, reject) => {
        this
          .getHostEntries()
          .reduce((foundMatch, entry) => (
            foundMatch || (entry.referencesHost(host) && isLocal(entry.address))
          ), false)
          .subscribe(resolve, reject);
      });
    } finally {
      this.mutex.release();
    }
  }

  reset(host) {
    return this.pointHost(host, null);
  }

  pointLocal(host) {
    return this.pointHost(host, '127.0.0.1');
  }

  untilExit(hosts) {
    return this.point(hosts).then(() => {
      const resetAndExit = () => {
        return this.point(mapObject(hosts, () => null))
          .catch(err => {
            console.warn(
              'Could not automatically reset host file entry. Make sure the file is writable to enable this feature.',
              err.message);
          })
          .then(() => {
            process.exit(0); // eslint-disable-line no-process-exit
          });
      };

      process
        .on('SIGTERM', resetAndExit)
        .on('SIGINT', resetAndExit)
        .on('SIGHUP', resetAndExit);
    });
  }

  pointHost(host, address) {
    return this.point({ [host]: address });
  }

  async point(hostAddresses) {
    await this.mutex.acquire();

    hostAddresses = Object
      .keys(hostAddresses)
      .reduce((mapping, host) => Object.assign(mapping, { [host.toLowerCase()]: hostAddresses[host] }), {});

    let isDirty = false;
    const hostIsDone = mapObject(hostAddresses, address => !address);
    const insertionPoints = mapObject(hostAddresses, () => null);

    try {
      return new Promise((resolve, reject) => {
        this
          .getHostFileContent()
          .map((line, i) => {
            if (!(line instanceof HostEntryBase)) {
              return line;
            }

            let newLine = line;
            forEachKey(hostAddresses, (host, address) => {
              const referencesOnlyHost = line.referencesOnlyHost(host);
              const referencesHost = referencesOnlyHost || line.referencesHost(host);
              if (!referencesHost) {
                return;
              }

              insertionPoints[host] = i + 1;

              const matchesAddress = line.matchesAddress(address);
              if (line instanceof HostEntry) {
                if (matchesAddress) {
                  // Nothing to do; already pointing where it should be
                  hostIsDone[host] = true;
                } else {
                  newLine = line.commentOut();
                }
              } else if (line instanceof CommentedHostEntry && matchesAddress && referencesOnlyHost) {
                hostIsDone[host] = true;
                newLine = line.uncomment();
              }
            });

            if (newLine !== line) {
              isDirty = true;
            }

            return newLine;
          })
          .toArray()
          .map(content => {
            forEachKey(hostAddresses, (host, address) => {
              if (hostIsDone[host]) {
                return;
              }

              isDirty = true;
              const newEntry = new HostEntry(address, [host]);
              if (insertionPoints[host] === null) {
                content.push(newEntry);
              } else {
                content.splice(insertionPoints[host], 0, newEntry);
              }
            });

            if (isDirty) {
              return this.writeContent(content);
            }
          })
          .subscribe(resolve, reject);
      });
    } finally {
      this.mutex.release();
    }
  }

  getHostEntries() {
    return this
      .getHostFileContent()
      .filter(line => line instanceof HostEntry);
  }

  getHostFileContent() {
    return readLines(createReadStream(this.hostFilePath))
      .map(parseHostFileLine);
  }

  formatLines(lines) {
    let addressWidth = 0;
    let hostWidth = 0;

    lines.filter(line => line instanceof HostEntryBase).forEach(line => {
      addressWidth = Math.max(addressWidth, line.address.length);
      hostWidth = Math.max(hostWidth, line.hosts.join(' ').length);
    });

    return lines.map((line, i) => line.format(addressWidth, hostWidth) + (i < lines.length - 1 ? EOL : ''));
  }

  writeContent(lines) {
    const output = this.formatLines(lines);
    return new Promise((resolve, reject) => {
      const readStream = new Readable({
        read() {
          let line;
          while (line = output.shift()) { // eslint-disable-line no-cond-assign
            if (!this.push(line)) {
              return;
            }
          }

          this.push(null);
        }
      });

      readStream
        .pipe(createWriteStream(this.hostFilePath))
        .once('error', reject)
        .once('finish', resolve);
    });
  }

  watch() {
    return Observable.create(observer => {
      const watcher = watch(this.hostFilePath)
        .on('change', e => observer.next(e))
        .on('error', e => observer.error(e));

      return () => {
        watcher.close();
      };
    });
  }
};
