
const logging                 = require('./logging');

const {getConsole}            = logging;

let   grumpy;   // Eventually is module.exports

let   g_grumpyCount   = 0;
let   g_fatal         = false;
let   g_exitCode      = 0;

const startTime = Date.now();

// ====================================================================================================================
// Basics

// --------------------------------------------------------------------------------------------------------------------
const if_ =  module.exports.if_ = function (cond, msg) {
  if (!cond) { return cond; }

  g_grumpyCount += 1;
  getConsole().warn(msg);

  return cond;
};

// --------------------------------------------------------------------------------------------------------------------
const die = module.exports.die = function (exitCode =8) {
  g_fatal       = true;
  g_exitCode    = exitCode;

  process.exit(exitCode);
  return true;
};

// --------------------------------------------------------------------------------------------------------------------
const fail = module.exports.fail = function (exitCode =8) {
  // TODO: Use startTime

  g_fatal       = true;
  g_exitCode    = exitCode;

  process.exit(exitCode);
  return true;
};



// ====================================================================================================================
// Composites

// --------------------------------------------------------------------------------------------------------------------
module.exports.unless = function (cond, msg) {
  return if_(!cond, msg);
}

// --------------------------------------------------------------------------------------------------------------------
module.exports.dieUnless = function (cond, msg) {
  let result;

  if ((result = grumpy.if_(cond, msg))) {
    die();
  }

  return result;
};

// --------------------------------------------------------------------------------------------------------------------
module.exports.failIf_ = function (cond, msg) {
  let result;

  if ((result = grumpy.if_(cond, msg))) {
    fail();
  }

  return result;
};

// --------------------------------------------------------------------------------------------------------------------
module.exports.because = function (msg) {
  return if_(true, msg);
};
module.exports.cuz = module.exports.because;

// --------------------------------------------------------------------------------------------------------------------


grumpy = module.exports;
