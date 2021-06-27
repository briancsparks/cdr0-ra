
/**
 *
 * @file
 *
 * const ra       = require('ra');
 * const CONFIG   = ra.mkCONFIG('PROGNAME');      // like: ra.mkCONFIG('cdr0')
 *
 * const CONFIG   = ra.mkCONFIG('cdr0');
 * const token    = CONFIG('upload_token');
 * ->   token is process.env.CDR0_UPLOAD_TOKEN
 *
 */

// NOTE! Do not require anything globally. See requireify(), and its usages.

const top = {};

// --------------------------------------------------------------------------------------------------------------------
module.exports.ENV = function (name =null) {
  if (name === null) { return process.env; }

  require('dotenv').config()

  const { grumpy, sg, ...restLibs}  = requireify();
  const {_}                         = sg;

  const result = process.env[name];

  if (!result) {
    grumpy.failIf_(!result, `RA:config - Cannot find ${name}`);
  }

  return result;
};


// --------------------------------------------------------------------------------------------------------------------
module.exports.mkCONFIG = function (progName, dirName, {libName = null, prjName = null} ={}) {
  require('dotenv').config()

  const { grumpy, sg, compact, ...restLibs }  = requireify();
  const {_}                                   = sg;


  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  return function (paramName) {

    // Make list of potential names to lookup
    const names     = generateNames(paramName);

    // Is it in the environment-variables?
    let   value = sg.reduce(names, null, function(m, name) {
      if (m) { return m; }
      return process.env[name];
    });

    // TODO: Look in JSON files
    //  * in CWD
    //  * in dirName?
    //  * in ~

    // TODO: Look in DB
    //  * Mongo
    //  * DynamoDB

    // TODO: Look in etcd.

    // TODO: Look in Vault

    return value;
  };
  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++



  // ===========================================================
  function generateNames(paramName) {
    const PARAMNAME      = safeUpperCase(paramName);

    // Generate permutations of the name
    let   namesList = [
      paramName,
      compact([progName, paramName]).join('_'),
      compact([progName, libName,  paramName]).join('_'),
      compact([progName, prjName,  paramName]).join('_'),
      compact([libName,  progName, paramName]).join('_'),
      compact([prjName,  progName, paramName]).join('_'),
    ];

    // Add UPPER_CASE versions
    namesList = namesList.flatMap((name) => [name, name.toUpperCase()]);

    // Make them unique
    namesList = sg.keyMirror(namesList);
    namesList = _.values(namesList);

    return namesList;
  }
};

// --------------------------------------------------------------------------------------------------------------------
function safeUpperCase(name) {
  if (name === null || name === undefined)  { return name; }

  return name.toUpperCase();
}

// --------------------------------------------------------------------------------------------------------------------
function requireify() {
  top.include   = top.include   || require('./include')(module);
  top.grumpy    = top.grumpy    || require('./grumpy');
  top.sg        = top.sg        || top.include('@cdr0/sg')     || require('@cdr0/sg');
  top.compact   = top.compact   || top.sg.compact;

  return top;
}


