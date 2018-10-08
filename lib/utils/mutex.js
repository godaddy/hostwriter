class Mutex {
  constructor() {
    this.queue = [];
    this.locked = false;
  }

  acquire() {
    const result = this.locked
      ? new Promise(resolve => this.queue.push(resolve))
      : Promise.resolve();
    this.locked = true;
    return result;
  }

  release() {
    const next = this.queue.shift();
    this.locked = !!next;
    if (next) {
      return void next();
    }
  }
}

module.exports = Mutex;
