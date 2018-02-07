module.exports = function forEachKey(obj, cb) {
  return Object.keys(obj).forEach(key => cb(key, obj[key]));
};
