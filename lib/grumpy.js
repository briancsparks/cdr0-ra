
/**
 * @file
 *
 * grumpy.if_(cond, msg)                -- These all grump on the `cond`
 * grumpy.unless(cond, msg)
 * grumpy.failIf(cond, msg)                   -- Also fast-fails
 * grumpy.failUnless(cond, msg)               -- Also fast-fails
 * grumpy.dieIf(cond, msg)                    -- also dies
 * grumpy.dieUnless(cond, msg)                -- also dies
 *
 * grumpy.because(msg)                  -- Always grump
 *
 * grumpy.fail(code =9, msg =null)      -- Fast fail - only dies during startup period.
 *
 * grumpy.die(code =8)                  -- Force die()
 *
 * grumpy.apiErr(err)
 *
 */

const logging                 = require('./logging');

const {
  getConsole,inspect
}                             = logging;

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
  getConsole().warn(msg || `grumpy.if_(), no msg`);

  return cond;
};

// --------------------------------------------------------------------------------------------------------------------
module.exports.unless = function (cond, msg) {
  return if_(!cond, msg);
}

// --------------------------------------------------------------------------------------------------------------------
const die = module.exports.die = function (exitCode =8, msg =null) {
  g_fatal       = true;
  g_exitCode    = exitCode;

  getConsole().error(msg || `grumpy.die(${exitCode}), no msg`);

  process.exit(exitCode);
  return true;
};

// --------------------------------------------------------------------------------------------------------------------
const fail = module.exports.fail = function (exitCode =9, msg =null) {
  // Are we fast
  if (Date.now() - startTime > 10000) {
    getConsole().warn(msg || `grumpy fast-fail after startup, no msg`);
    return false;
  }

  g_fatal       = true;
  g_exitCode    = exitCode;

  process.exit(exitCode);
  return true;
};

// --------------------------------------------------------------------------------------------------------------------
module.exports.apiErr = function (apiName, err) {
  if (!err) { return; }
  // TODO: better filtering

  getConsole().error(`${apiName} ERROR`, inspect(err));
};



// ====================================================================================================================
// Composites

// --------------------------------------------------------------------------------------------------------------------
module.exports.dieIf = function (cond, msg) {
  let result;

  if ((result = grumpy.if_(cond, msg))) {
    die();
  }

  return result;
};

// --------------------------------------------------------------------------------------------------------------------
module.exports.dieUnless = function (cond, msg) {
  let result;

  if ((result = grumpy.unless(cond, msg))) {
    die();
  }

  return result;
};

// --------------------------------------------------------------------------------------------------------------------
module.exports.failIf = module.exports.failIf_ = function (cond, msg) {
  let result;

  if ((result = grumpy.if_(cond, msg))) {
    fail(9, msg);
  }

  return result;
};

// --------------------------------------------------------------------------------------------------------------------
module.exports.failUnless = function (cond, msg) {
  let result;

  if ((result = grumpy.unless(cond, msg))) {
    fail(9, msg);
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
