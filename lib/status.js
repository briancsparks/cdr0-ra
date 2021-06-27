
const include                 = require('../lib/include') (module);
const sg                      = include('@cdr0/sg')               || require('@cdr0/sg');


module.exports.setStatus = function (key, value) {
  console.log(`RA:Status(${key}): ${stringify(value)}`);
};

function stringify(value) {
  if (sg.isObject(value) || Array.isArray(value)) {
    return sg.safeJSONStringify(value);
  }

  return ''+value;
}
