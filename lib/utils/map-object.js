module.exports = function mapObject(obj, valueMapper) {
  return Object
    .keys(obj)
    .reduce((mapping, key) => Object.assign(mapping, { [key]: valueMapper(obj[key]) }), {});
};
