
global = global || {};

global.ra = global.ra || { ...global.ra,
  logging : {
    console: { ...console }   // TODO: Put the RA version here
  }
};

const include                 = require('../lib/include') (module);
const {
  inspect
}                             = include('@cdr0/sg')               || require('@cdr0/sg');


// --------------------------------------------------------------------------------------------------------------------
module.exports.inspect  = inspect;

// --------------------------------------------------------------------------------------------------------------------
module.exports.getConsole = function (options = null) {
  if (options === null) {
    return global.ra.logging.console;
  }

  const whichOne = options.whichOne || "ra";

  if (whichOne === "global") {
    return console;
  }

  return global[whichOne].logging.console;
};

