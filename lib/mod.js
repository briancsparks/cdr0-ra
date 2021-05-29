
const include                 = require('../lib/include') (module);
const sg                      = include('@cdr0/sg')               || require('@cdr0/sg');

const debug                   = require('./debug');
const {_}                     = sg;
const {
  promisify,callbackify
}                             = require('util');

// --------------------------------------------------------------------------------------------------------------------
const Mod = module.exports.Mod = function (modjule) {
  const self = this;

  self.fns = {};

  self.fns.exports    = modjule.exports         = modjule.exports         || {};
  self.fns.async      = modjule.exports.async   = modjule.exports.async   || {};
  self.fns.rr         = modjule.exports.rr      = modjule.exports.rr      || {};
  self.meta           = modjule.exports.meta    = modjule.exports.meta    || {};

  self.meta.helpRun   = {};
  self.meta.helpArgs  = {};

  // ==================================================================================================================
  // ------------------------------------------------------------------------------------------------------------------
  self.ra = function (arg0, arg1, ...args) {
    let fn;
    // console.error(sg.inspect({arg0}))

    if (typeof arg0 === 'string') {
      if (typeof arg1 === 'function') {
        return self.ra({[arg0]: arg1}, ...args);
      }
      if (sg.isObject(arg1)) {
        fn = arg1[arg0];
        if (fn) {
          return self.ra({[arg0]: fn}, ...args);
        }
      }
      console.warn(`RA: Do not understand input ra(${arg0}, {${sg.keys(arg1).join(',')})`);
      return {};
    }

    if (sg.isObject(arg0)) {
      const [extra, fnObj] = sg.splitObject(arg0, 'meta');

      return sg.reduce(fnObj, null, function (m, fn, name) {
        return ra_(name, fn, extra);
      });
    }

  };

  // ------------------------------------------------------------------------------------------------------------------
  function ra_(name, cbFn, extra =null) {

    // console.error(sg.inspect({extra}))
    modjule.exports[name] = function (argv, context, callback) {
      return cbFn(argv, context, function (err, result, ...rest) {

        if (debug.logit(modjule, [name])) {
          console.log(`RA:${name}`, {argv}, cleanResult({err, result, rest}));
        }

        return callback(err, result, ...rest);
      });
    };

    const wrapped                 = modjule.exports[name];
    modjule.exports.async[name]   = promisify(wrapped);

    const {meta}  = extra;
    if (meta) {
      if (meta.helpArgs) {
        self.meta.helpArgs[name] = meta.helpArgs;
      }

      if (meta.helpRun) {
        // May want us to provide the helpRun function
        if (meta.helpRun === true && self.meta.helpArgs[name]) {
          self.meta.helpRun[name] = mkHelpRun(self.meta.helpArgs[name]);
        } else {
          self.meta.helpRun[name] = meta.helpRun;
        }
      }
    }

    return wrapped;

    // ================================================================================================================
    function mkHelpRun(helpArgs) {
      return function(fn,argv_,c,cb) {
        const argv = helpArgs(argv_);

        return fn(argv, {}, function (err, data, ...rest) {
          return cb(err, data, ...rest);
        });
      };
    }
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
  self.wrapStdAws = function (arg0, ...args) {
    if (typeof arg0 === 'string')   { return self.wrapStdAws({}, arg0, ...args); }

    let   [old, awsModName, obj, ...names] = [arg0, ...args];

    return sg.reduce(names, sg._extend(old), function (m, name) {
      return {...m, [name]: wrapAws(awsModName, obj, name)};
    });
  }

  // ------------------------------------------------------------------------------------------------------------------
  self.wrapStdErrOkAws = function(arg0, ...args) {
    if (typeof arg0 === 'string')   { return self.wrapStdErrOkAws({}, arg0, ...args); }

    let   [old, awsModName, obj, ...names] = [arg0, ...args];

    return sg.reduce(names, sg._extend(old), function (m, name) {
      return {...m, [name]: wrapAws(awsModName, obj, name, true)};
    });
  }

  // ------------------------------------------------------------------------------------------------------------------
  function wrapAws(awsModName, obj, name, errOk =false) {
    return function (params, callback) {
      if (debug.logStartAwsApis(modjule, awsModName, name)) {
        console.log(`AWS:${awsModName}.${name} start:`, {params});
      }

      // if (true) {
      //   return callback(null, {});
      // }

      return obj[name](params, function (err_, data, ...rest) {

        // If this API errors, that's OK. Like headObject where we want to know if the object is in S3, not being there is expected sometimes.
        if (debug.logAwsApis(modjule, awsModName, name)) {
          let {err} = okerr(err_, errOk);

          console.log(`AWS:${awsModName}.${name} done:`, {params}, cleanResult({err, data, rest}));
        }

        return callback(err_, data, ...rest);
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


// --------------------------------------------------------------------------------------------------------------------
function okerr(err, errOk) {
  if (!errOk) { return {err}; }
  if (!err)   { return {err:null}; }

  return {err: err.code || 'err'};
}
