# @godaddy/hostfile

API and CLI for querying and manipulating host files.

![Build Status](https://travis-ci.org/godaddy/hostwriter.svg?branch=master)

> ⚠️ **DEPRECATED**: This package is no longer maintained and should not be used in new projects. Please consider using alternative solutions for host file management.

## Installation

First, an important note. By default, most operating systems protect your host file by restricting write permissions.
You'll need to change the permissions on that file before you can use the API or CLI to modify the file. For example:

```shell
sudo chown %USER: /etc/hosts
```


## API

To use the API, install as a dependency:

```shell
npm i --save @godaddy/hostfile
```

...then import:

```js
const hostfile = require('@godaddy/hostfile');
```

The following methods are supported:

### `.point(hostEntries: Dictionary<string, string>): Promise<void>`

Where `hostEntries` is an object mapping host names to IP addresses, `point` assigns each host to an address. If an
address is set to `null`, any existing host file overrides for the host are commented out instead.

### `.pointHost(host: string, address: string): Promise<void>`

Shortcut method for `.point({ [host]: address })`.

### `.pointLocal(host: string): Promise<void>`

Shortcut method for `.point({ [host]: '127.0.0.1' })`.

### `.reset(host: string): Promise<void>`

Shortcut method for `.point({ [host]: null })`.

### `.untilExit(hostEntries: Dictionary<string, string>): Promise<void>`

Same as `.point`, except `SIGTERM`, `SIGINT`, and `SIGHUP` handlers are installed for the process, and before exit,
each of the hosts are reset. This is useful if you're developing a local service, and you only want your host file
pointing locally while the service is running.

### `.isLocal(host: string): Promise<bool>`

Resolves to `true` if the host is pointing to `0.0.0.0`, `127.0.0.1`, `::1`, or `::0`.

### `.watch(): Observable<string>`

Returns an `Observable` that emits events when the host file changes. This is just a wrapper around
[fs.watch](https://nodejs.org/dist/latest-v8.x/docs/api/fs.html#fs_fs_watch_filename_options_listener); see the node
documentation for more information.


## CLI

To install the `hostfile` command-line:

```shell
npm i -g @godaddy/hostfile
```

The `hostfile` command can be used as follows:

```shell
hostfile query host <hosts>               # Lists active entries for one or most hosts. Supports * wildcards.
hostfile query address <addresses>        # Lists active entries pointing to one or more address
hostfile point <hosts> [to] <address>     # Assigns <address> to one or most hosts
hostfile reset <hosts>                    # Removes hostfile assignments for one or more hosts
```
 


## Operating System Support

`hostwriter` only knows how to find the host file on MacOS, Linux, and Windows at this time. If you have a need for
other OS's, let us know.
