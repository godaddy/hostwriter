module.exports = class InvalidEntry {
  constructor(content) {
    this.content = content;
  }

  format() {
    return this.content;
  }
};
