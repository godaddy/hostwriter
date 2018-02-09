#!/usr/bin/env node

const HostWriter = require('./host-writer');
const toHostMatcher = require('./utils/host-matcher');

const { argv } = process;
const hostfile = new HostWriter();

const usage = `Usage:
  hostfile query host <hosts>               # Lists active entries for one or most hosts. Supports * wildcards.
  hostfile query address <addresses>        # Lists active entries pointing to one or more address
  hostfile point <hosts> [to] <address>     # Assigns <address> to one or most hosts
  hostfile reset <hosts>                    # Removes hostfile assignments for one or more hosts
`;

const helpHint = 'Run "hostfile help" for usage information.';

function showHelp() {
  return console.log(usage);
}

function handleQueryCommand(subject, ...items) {
  const entries = hostfile.getHostEntries();
  let matchingEntries;
  switch (subject) {
    case 'host': {
      const hostMatchers = items.map(toHostMatcher);
      matchingEntries = entries.filter(e => hostMatchers.some(matcher => e.hosts.some(host => matcher.test(host))));
      break;
    }
    case 'address':
      matchingEntries = entries.filter(e => items.some(address => e.matchesAddress(address)));
      break;
    default:
      return console.error(`Unrecognized query option "${subject}". ${helpHint}`);
  }
  return hostfile.formatLines(matchingEntries).forEach(line => console.log(line.trim()));
}

function handlePointCommand(...args) {
  const toKeywordPos = args.indexOf('to') || args.length - 1;
  const hosts = args.slice(0, toKeywordPos);
  const address = args[args.length - 1];
  if (!hosts.length || !address) {
    return console.error(`Invalid command. ${helpHint}`);
  }
  return hostfile.point(hosts.reduce((mapping, host) => Object.assign(mapping, { [host]: address }), {}));
}

function handleResetCommand(...hosts) {
  return hostfile.point(hosts.reduce((mapping, host) => Object.assign(mapping, { [host]: null }), {}));
}

module.exports = Promise.resolve((function (args) {
  const command = args.shift();
  switch (command) {
    case 'help':
      return showHelp();

    case 'query':
      return handleQueryCommand(...args);

    case 'point':
      return handlePointCommand(...args);

    case 'reset':
      return handleResetCommand(...args);

    default:
      console.error(`Unrecognized command "${command}". Run "hostfile help" for usage information.`);
  }
}(argv.slice(2)))).catch(err => {
  console.error(err);
});
