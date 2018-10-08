class Mutex {
  constructor() {
    this.queue = [];
    this.locked = false;
  }

  acquire() {
    return this.locked
      ? new Promise(resolve => this.queue.push(resolve))
      : Promise.resolve();
  }

  release() {
    const next = this.queue.shift();
    next && next();
  }
}

module.exports = Mutex;
