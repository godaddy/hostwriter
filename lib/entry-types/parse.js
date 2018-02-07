const ip = require('ip');
const HostEntry = require('./host-entry');
const CommentedHostEntry = require('./commented-host-entry');
const CommentLine = require('./comment-line');
const BlankLine = require('./blank-line');
const InvalidEntry = require('./invalid-entry');

const lineRegex = /^(.*?)(#.*)?$/;
const whitespaceRegex = /^\s*$/;

module.exports = function parseHostFileLine(text) {
  const [, content = '', comment = ''] = lineRegex.exec(text);

  const hasContent = !whitespaceRegex.test(content);
  const hasComment = !whitespaceRegex.test(comment);

  if (hasContent) {
    const [address, ...hosts] = content.split(/\s+/).filter(Boolean);
    if (address && hosts && hosts.length && (ip.isV4Format(address) || ip.isV6Format(address))) {
      return new HostEntry(address, hosts, comment);
    }
    return new InvalidEntry(text);

  }
  if (hasComment) {
    const commentedOutContent = comment.replace(/^#+/, '');
    const parsedContent = parseHostFileLine(commentedOutContent);
    if (parsedContent instanceof HostEntry) {
      return new CommentedHostEntry(parsedContent.address, parsedContent.hosts, parsedContent.comment);
    }
    return new CommentLine(text);

  }
  return new BlankLine(text);


};
