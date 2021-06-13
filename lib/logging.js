
global = global || {};

global.ra = global.ra || { ...global.ra,
  logging : {
    console: { ...console }   // TODO: Put the RA version here
  }
};


module.exports.getConsole = function (options = null) {
  if (options === null) {
    return global.ra.logging.console;
  }

  const whichOne = options.whichOne || "ra";

  if (whichOne === "global") {
    return console;
  }

  return global.ra.logging.console;
};

