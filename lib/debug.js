
const params = {};
// params.quiet = true;

// --------------------------------------------------------------------------------------------------------------------
module.exports.logit = function (mod, tags) {
  if (params.quiet)       { return false; }
  if (params.verbose)     { return true; }

  return false;
};

// --------------------------------------------------------------------------------------------------------------------
module.exports.logRR = function (mod, name, tags) {
  if (params.quiet)       { return false; }
  if (params.verbose)     { return true; }

  return false;
};

// --------------------------------------------------------------------------------------------------------------------
module.exports.whatRR = function (mod, name, req, res, match) {
  const {headers,url} = req;
  return {url, headers};
};

// --------------------------------------------------------------------------------------------------------------------
module.exports.logAwsApis = function (mod, awsModName, fnName) {
  if (params.quiet)       { return false; }
  if (params.verbose)     { return true; }

  return true;
};

// --------------------------------------------------------------------------------------------------------------------
module.exports.logStartAwsApis = function (mod, awsModName, fnName) {
  if (params.quiet)       { return false; }
  if (params.verbose)     { return true; }

  return false;
};

// --------------------------------------------------------------------------------------------------------------------
module.exports.setVerbose = function (v =true) {
  params.verbose = v;
};

// --------------------------------------------------------------------------------------------------------------------
module.exports.setQuiet = function (v =true) {
  params.quiet = v;
};

