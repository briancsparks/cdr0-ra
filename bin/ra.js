#!/usr/bin/env node

require('dotenv').config()
require('loud-rejection/register');
require('exit-on-epipe');

const include                 = require('../lib/include') (module);
const sg                      = include('@cdr0/sg')               || require('@cdr0/sg');

const path = require('path');
const fs = require('fs');
const os = require('os');

const poison = sg.keyMirror('node_modules,.git');


if (require.main === module) {
  main();
}
function main() {
  let ARGV  = require('minimist')(process.argv.slice(2));

  // What function was requested?
  const fnName = ARGV._[0];
  if (!fnName) {
    console.error(`Need function name.`);
    return 1;
  }

  // Get recursive list of .js files
  const files = scanDir(process.cwd());

  // Try to load the mod with our function
  let {filename, fn, mod} = loadModFor(files, fnName);

  // Check if it was found
  if (!filename) {
    console.error(`Cannot find JS file for ${fnName}.`);
    return 1;
  }

  if (!mod) {
    console.error(`Failed to require ${filename}.`);
    return 1;
  }
  const {meta}  = mod;

  if (!fn) {
    console.error(`Did not find ${fnName} in ${filename}. Found ${Object.keys(mod)}`);
    return 1;
  }

  // console.error(`Running ${fnName} from ${filename}`, sg.inspect(mod));

  // The callback for whatever way we invoke
  const callback = function(err, result, ...rest) {
    if (err) {
      console.error(`RA:Error:`, err);
      process.exit(1);
      return 1;
    }

    console.log(sg.safeJSONStringify(result));
  };

  // Does the function have helpers?
  let helpRun, helpArgs;
  if (meta) {

    // Is there a function that helps calling the function that we want?
    if ((helpRun = meta.helpRun && meta.helpRun[fnName])) {
      // console.error(`Using helpRun`);
      return helpRun(fn, ARGV, {}, callback);
    }

    // Is there a function to help with ARGV (providing def args, for example)?
    if ((helpArgs = meta.helpArgs && meta.helpArgs[fnName])) {
      ARGV = helpArgs(ARGV);
      // console.error(`Using helpArgs`, sg.inspect({ARGV}));
    }
  }

  // Invoke it directly
  return fn(ARGV, {}, callback);

}

// --------------------------------------------------------------------------------------------------------------------
function scanDir(start) {
  const dirent = fs.opendirSync(start);
  const files = scanDirent(dirent);
  dirent.closeSync();

  return files;
}

// --------------------------------------------------------------------------------------------------------------------
function scanDirent(dir) {
  let files = [];

  for (let dirent = dir.readSync(); dirent; dirent = dir.readSync()) {

    if (dirent.isDirectory()) {
      // console.log(`dir: ${dirent.name} ${dir.path}`, {dirent, dir});

      if (!(dirent.name in poison)) {
        const dirname = path.normalize(path.join(dir.path, dirent.name));
        const subdir = fs.opendirSync(dirname);
        files = [...files, ...scanDirent(subdir)];
        subdir.closeSync();
      }

    } else if (dirent.isFile()) {
      // console.log(`file: ${dirent.name}`);

      if (dirent.name.endsWith('.js') || dirent.name.endsWith('.jsx')) {
        files.push(path.normalize(path.join(dir.path, dirent.name)));
      }
    // } else {
    //   console.log(`???: ${dirent.name}`);
    }
  }

  return files;
}

// --------------------------------------------------------------------------------------------------------------------
function loadModFor(files, fnName) {
  let fn, mod_, mod;

  return sg.reduce(files, null, function (m, filename) {
    if (m && m.fn) { return m; }
    // console.error(`Looking in ${filename}`)

    mod_ = require(filename);

    if (mod_) {
      fn  = mod_[fnName];
      if (fn) {
        mod = mod_;
        return {filename, fnName, fn, mod};
      }
    }

    const fnNames = Object.keys(mod_);
    const foundFnName = sg.reduce(fnNames, null, function (m, key) {
      if (key.toLowerCase() === fnName.toLowerCase()) {
        return key;
      }
      return m;
    });

    if (foundFnName) {
      fn  = mod_[foundFnName];
      if (fn) {
        mod = mod_;
        return {filename, fnName: foundFnName, fn, mod};
      }
    }

    return {filename, fnName, fn, mod: mod_};
  });
}

