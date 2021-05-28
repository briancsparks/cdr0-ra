
const debug                 = require('./debug');
const sg                    = require('../../sg');    // TODO: Fix
const {_}                   = sg;
const {
  promisify,callbackify
}                           = require('util');


const Mod = module.exports.Mod = function (modjule) {
  const self = this;

  self.fns = {};

  self.fns.exports    = modjule.exports         = modjule.exports         || {};
  self.fns.async      = modjule.exports.async   = modjule.exports.async   || {};
  self.fns.rr         = modjule.exports.rr      = modjule.exports.rr      || {};

  // ==================================================================================================================
  // ------------------------------------------------------------------------------------------------------------------
  self.ra = function (arg0, ...args) {
    if (typeof arg0 === 'string') {
      return ra_(arg0, ...args);
    }

    return sg.reduce(arg0, null, function (m, fn, name) {
      return ra_(name, fn);
    });
  };

  // ------------------------------------------------------------------------------------------------------------------
  function ra_(name, cbFn) {
    const wrapped = modjule.exports[name] = function (argv, context, callback) {
      return cbFn(argv, context, function (err, result, ...rest) {

        if (debug.logit(modjule, [name])) {
          console.log(`RA:${name}`, {argv}, cleanResult({err, result, rest}));
        }

        return callback(err, result, ...rest);
      });
    };
    // modjule.exports[name]         = cbFn;
    modjule.exports.async[name]   = promisify(wrapped);

    return wrapped;
  }

  // ==================================================================================================================
  // ------------------------------------------------------------------------------------------------------------------
  self.async = function (arg0, ...args) {
    if (typeof arg0 === 'string') {
      return async_(arg0, ...args);
    }

    return sg.reduce(arg0, null, function (m, fn, name) {
      return async_(name, fn);
    });
  };

  // ------------------------------------------------------------------------------------------------------------------
  function async_(name, asFn) {
    modjule.exports.async[name]   = asFn;
    modjule.exports[name]         = callbackify(asFn);

    return modjule.exports.async[name];
  }

  // ==================================================================================================================
  // ------------------------------------------------------------------------------------------------------------------
  self.rr = function (arg0, ...args) {
    if (typeof arg0 === 'string') {
      return rr_(arg0, ...args);
    }

    return sg.reduce(arg0, null, function (m, fn, name) {
      return rr_(name, fn);
    });
  };

  // ------------------------------------------------------------------------------------------------------------------
  function rr_(name, rrFn) {
    return modjule.exports.rr[name] = function (req, res, match, ...rest) {
      if (debug.logRR(modjule, name, [name])) {
        console.log(`${name}`, sg.inspect(debug.whatRR(modjule, name, req, res, match)));
      }

      // TODO: Could mwify res.end to know when done

      return rrFn(req, res, match, ...rest);
    };
  }

  // ==================================================================================================================
  // ------------------------------------------------------------------------------------------------------------------
  self.wrapStdAws = function (awsModName, obj, ...names) {
    const wrapped = {};
    names.forEach((name) => {
      wrapped[name] = wrapAws(awsModName, obj, name);
    });
    return wrapped;
  }

  // ------------------------------------------------------------------------------------------------------------------
  function wrapAws(awsModName, obj, name) {
    return function (params, callback) {
      if (debug.logStartAwsApis(modjule, awsModName, name)) {
        console.log(`AWS:${awsModName}.${name} start:`, {params});
      }

      // if (true) {
      //   return callback(null, {});
      // }

      return obj[name](params, function (err, data, ...rest) {
        if (debug.logAwsApis(modjule, awsModName, name)) {
          console.log(`AWS:${awsModName}.${name} done:`, {params}, cleanResult({err, data, rest}));
        }

        return callback(err, data, ...rest);
      });
    };
  }
};

// --------------------------------------------------------------------------------------------------------------------
module.exports.mod = function (modjule) {
  return new Mod(modjule);
};

// --------------------------------------------------------------------------------------------------------------------
/**
 * Make obj better to be logged.
 *
 * @param obj
 * @returns {*}
 */
function cleanResult(obj) {
  return sg.reduce(obj, {}, function (m, v, k) {
    if (k === 'rest' && Array.isArray(v) && v.length === 0) { return m; }
    return {...m, [k]: v};
  });
}
