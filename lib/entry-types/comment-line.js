module.exports = class CommentLine {
  constructor(content) {
    this.content = content;
  }

  format() {
    return this.content;
  }
};
