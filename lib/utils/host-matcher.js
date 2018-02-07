module.exports = function HostMatcher(pattern) {
  if (!pattern.includes('*')) {
    const lowered = pattern.toLowerCase();
    return { test: value => value.toLowerCase() === lowered };
  }

  pattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*');
  return new RegExp(`^${pattern}$`, 'i');
};
