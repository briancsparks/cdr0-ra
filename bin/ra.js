#!/usr/bin/env node

require('dotenv').config()
require('loud-rejection/register');
require('exit-on-epipe');

const ARGV  = require('minimist')(process.argv.slice(2));
// const sg    = require('../../sg');    // TODO: Fix
const sg    = require('@cdr0/sg');

const path = require('path');
const fs = require('fs');
const os = require('os');

const poison = sg.keyMirror('node_modules,.git');


if (require.main === module) {
  main();
}
function main() {

  // Get recursive list of .js files
  const start = process.cwd();
  const dir = fs.opendirSync(start);
  const files = scanDir(dir);
  dir.closeSync();

  const fnName = ARGV._[0];
  const filename = loadModFor(files, fnName);
  const mod = require(filename);
  const fn = mod[fnName];

  // console.log(`Running ${fnName} from ${filename}`);

  fn(ARGV, {}, function (err, result, ...rest) {
    if (err) {
      console.error(err);
      return 1;
    }

    console.log(sg.safeJSONStringify(result));
  });
}

function loadModFor(files, fnName) {
  return sg.reduce(files, null, function (m, filename) {
    const mod = require(filename);
    if (fnName in mod) {
      return filename;
    }
    return m;
  });
}

function scanDir(dir) {
  let files = [];

  for (let dirent = dir.readSync(); dirent; dirent = dir.readSync()) {

    if (dirent.isDirectory()) {
      // console.log(`dir: ${dirent.name} ${dir.path}`, {dirent, dir});

      if (!(dirent.name in poison)) {
        const dirname = path.normalize(path.join(dir.path, dirent.name));
        const subdir = fs.opendirSync(dirname);
        files = [...files, ...scanDir(subdir)];
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
